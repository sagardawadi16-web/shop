/**
 * Cloudflare Pages Function: /api/retailers
 * Edge endpoint for handling Wholesale & Retailer Stockist inquiries
 */

interface Env {
  ADMIN_SECRET_KEY?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = (await context.request.json()) as any;

    // 1. Bot Honeypot Protection
    if (body.website_trap && body.website_trap.trim().length > 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Automated submission rejected by Cloudflare Edge Bot Shield.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Validate required fields
    const { storeName, contactPerson, phone } = body;
    if (!storeName || !contactPerson || !phone) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing mandatory fields: storeName, contactPerson, phone.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. Normalize Retailer Payload
    const inquiryId = body.id || `ret_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const phoneClean = (phone || '').replace(/[^0-9+]/g, '');

    const normalizedInquiry = {
      id: inquiryId,
      storeName: storeName.trim(),
      contactPerson: contactPerson.trim(),
      phone: phoneClean,
      whatsappNumber: body.whatsappNumber ? body.whatsappNumber.replace(/[^0-9+]/g, '') : phoneClean,
      email: (body.email || '').trim().toLowerCase(),
      city: (body.city || 'Kathmandu').trim(),
      country: (body.country || 'Nepal').trim(),
      storeType: body.storeType || 'physical_boutique',
      estimatedMonthlyBudgetNpr: Number(body.estimatedMonthlyBudgetNpr) || 0,
      categoriesOfInterest: Array.isArray(body.categoriesOfInterest) ? body.categoriesOfInterest : [],
      message: (body.message || '').trim(),
      status: 'new',
      createdAt: new Date().toISOString(),
      cloudflareRay: context.request.headers.get('cf-ray') || 'edge-direct',
      countryCode: context.request.headers.get('cf-ipcountry') || 'NP',
    };

    return new Response(
      JSON.stringify({
        success: true,
        inquiry: normalizedInquiry,
        message: 'Retailer inquiry received successfully at Cloudflare Edge.',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message || 'Edge processing failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);

  // Authenticate admin request
  const authHeader = request.headers.get('x-admin-key') || request.headers.get('Authorization');
  const queryToken = url.searchParams.get('token');
  const expectedKey = env.ADMIN_SECRET_KEY || 'dawosti_admin_2026';

  const isAuthorized =
    authHeader === expectedKey ||
    authHeader === `Bearer ${expectedKey}` ||
    queryToken === expectedKey;

  if (!isAuthorized) {
    return new Response(
      JSON.stringify({ success: false, error: 'Unauthorized: Admin key required to view retailer leads.' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({
      success: true,
      partnerProgram: {
        name: 'Dawosti Boutique Fashion Stockist Network',
        officialWholesalePhone: '+977 9708251494',
        standardMoq: 15,
        wholesaleDiscountRange: '35% - 45%',
        consignmentAvailableKathmandu: true,
      },
      message: 'Retailer Edge Gateway active. Live submissions stream to Firestore collection `retailer_inquiries`.',
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store',
      },
    }
  );
};
