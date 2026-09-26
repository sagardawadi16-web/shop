/**
 * Cloudflare Pages Function: /api/health
 */
export const onRequestGet: PagesFunction = async (context) => {
  return new Response(
    JSON.stringify({
      status: 'ok',
      store: 'DAWOSTI Boutique Kathmandu',
      officialPhone: '+977 9808251494',
      whatsapp: 'https://wa.me/9779808251494',
      edgeRegion: context.request.headers.get('cf-ipcountry') || 'NP',
      cfRay: context.request.headers.get('cf-ray') || 'edge-direct',
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
};
