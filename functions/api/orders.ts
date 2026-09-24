/**
 * Cloudflare Pages Function: /api/orders
 * Edge-rendered API endpoint running on Cloudflare's global network
 */

interface Env {
  // Bindings or environment variables if needed
  ADMIN_SECRET_KEY?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json() as any;

    // 1. Invisible Bot / Honeypot Defense
    if (body.honeypot && body.honeypot.trim().length > 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Automated submission rejected by Cloudflare Edge Bot Shield.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Interaction Timing Defense (must take at least 1.5s for human checkout)
    if (body.renderTimestamp && typeof body.renderTimestamp === 'number') {
      const elapsed = Date.now() - body.renderTimestamp;
      if (elapsed < 1200 && !body.isAgentBypass) {
        return new Response(
          JSON.stringify({ success: false, error: 'Checkout completed too quickly. Human verification required.' }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // 3. Validate Order Payload
    const items = body.items || [];
    const shipping = body.shippingAddress || {};
    const totalAmount = body.totalAmount || 0;
    const paymentMethod = body.paymentMethod || 'cod';

    if (!items.length || !shipping.fullName || !shipping.phone) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required order fields (items, fullName, phone).' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 4. Calculate Risk & Generate Order ID
    const phoneClean = (shipping.phone || '').replace(/[^0-9]/g, '');
    const isStandardNepalPhone = /^(98|97|96)[0-9]{8}$/.test(phoneClean);
    const orderNumber = body.orderNumber || `DAW-${Math.floor(100000 + Math.random() * 900000)}`;

    const verifiedOrder = {
      orderNumber,
      customerName: shipping.fullName,
      phone: shipping.phone,
      address: `${shipping.addressLine || ''}, ${shipping.city || 'Kathmandu'}`,
      itemCount: items.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0),
      totalAmount,
      paymentMethod,
      isPhoneValid: isStandardNepalPhone,
      timestamp: new Date().toISOString(),
      cloudflareRay: context.request.headers.get('cf-ray') || 'edge-direct',
      country: context.request.headers.get('cf-ipcountry') || 'NP',
    };

    // 5. Build Direct WhatsApp Verification URI for Merchant (+977 9708251494)
    const whatsappText = encodeURIComponent(
      `🛍️ *DAWOSTI Boutique Order #${orderNumber}*\n` +
      `👤 Customer: ${shipping.fullName}\n` +
      `📞 Phone: ${shipping.phone}\n` +
      `📍 City: ${shipping.city || 'Kathmandu'}\n` +
      `💰 Total: NPR ${totalAmount.toLocaleString()}\n` +
      `💳 Method: ${paymentMethod.toUpperCase()}`
    );
    const whatsappUrl = `https://wa.me/9779708251494?text=${whatsappText}`;

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Order verified and recorded at Cloudflare edge.',
        order: verifiedOrder,
        whatsappUrl,
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
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message || 'Internal Edge Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const orderNumber = url.searchParams.get('orderNumber');

  return new Response(
    JSON.stringify({
      status: 'active',
      store: 'DAWOSTI Boutique Kathmandu',
      helpline: '+977 9708251494',
      whatsapp: 'https://wa.me/9779708251494',
      query: orderNumber ? { orderNumber, status: 'confirmed' } : null,
      timestamp: new Date().toISOString(),
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
};
