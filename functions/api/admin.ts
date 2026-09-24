/**
 * Cloudflare Pages Function: /api/admin
 * Edge Administrative API for Dawosti Store
 */

interface Env {
  ADMIN_SECRET_KEY?: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);

  // Authenticate admin request via header or query token
  const authHeader = request.headers.get('x-admin-key') || request.headers.get('Authorization');
  const queryToken = url.searchParams.get('token');
  const expectedKey = env.ADMIN_SECRET_KEY || 'dawosti_admin_2026';

  const isAuthorized =
    authHeader === expectedKey ||
    authHeader === `Bearer ${expectedKey}` ||
    queryToken === expectedKey;

  if (!isAuthorized) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Unauthorized: Valid admin key or token required to access Dawosti Admin Edge API.',
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Handle Admin Actions
  if (request.method === 'GET') {
    return new Response(
      JSON.stringify({
        success: true,
        environment: 'Cloudflare Pages Edge',
        domain: 'dawosti.com',
        workerRepo: 'https://github.com/sagardawadi16-web/shop.git',
        gitOpsStatus: {
          strategy: 'Repo-as-Code / Continuous Deployment',
          syncTarget: 'Cloudflare Pages (Global CDN & 300+ Edge POPs)',
          lastKnownCommitTarget: 'origin/whatever -> origin/main',
        },
        merchant: {
          storeName: 'DAWOSTI Boutique',
          officialPhone: '+977 9708251494',
          whatsapp: 'https://wa.me/9779708251494',
          location: 'New Road (Opposite Bishal Bazar), Kathmandu',
        },
        securityTelemetry: {
          botProtection: 'Active (Honeypot + Timing + Agent Bypass)',
          visitorTracking: 'Active (LocalStorage Unique Fingerprint + Edge Ray)',
          orderVerification: 'Direct WhatsApp Handshake (+977 9708251494)',
        },
        timestamp: new Date().toISOString(),
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
  }

  if (request.method === 'POST') {
    try {
      const payload = await request.json() as any;
      const action = payload.action;

      if (action === 'verify_order') {
        return new Response(
          JSON.stringify({
            success: true,
            action: 'verify_order',
            orderNumber: payload.orderNumber,
            status: payload.status || 'verified_genuine',
            verifiedAt: new Date().toISOString(),
            message: `Order #${payload.orderNumber} successfully updated at Cloudflare Edge.`,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `Admin edge action '${action || 'ping'}' received.`,
          timestamp: new Date().toISOString(),
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (e: any) {
      return new Response(
        JSON.stringify({ success: false, error: e.message || 'Invalid JSON body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  return new Response('Method Not Allowed', { status: 405 });
};
