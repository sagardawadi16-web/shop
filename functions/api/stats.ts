/**
 * Cloudflare Pages Function: /api/stats
 * Public & Edge telemetry endpoint
 */

export const onRequestGet: PagesFunction = async (context) => {
  return new Response(
    JSON.stringify({
      store: 'DAWOSTI Boutique',
      domain: 'dawosti.com',
      edgeRegion: context.request.headers.get('cf-ipcountry') || 'NP',
      cfRay: context.request.headers.get('cf-ray') || 'edge-direct',
      status: 'operational',
      syncEngine: 'Cloudflare Pages GitOps',
      botProtection: {
        status: 'shield_active',
        agentBypassSupported: true,
      },
      merchantContact: {
        phone: '+977 9708251494',
        whatsapp: 'https://wa.me/9779708251494',
      },
      time: new Date().toISOString(),
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=60',
      },
    }
  );
};
