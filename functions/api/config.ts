/**
 * Cloudflare Pages Function: /api/config
 */
export const onRequestGet: PagesFunction = async () => {
  return new Response(
    JSON.stringify({
      storeName: 'DAWOSTI',
      officialPhone: '+977 9808251494',
      helplinePhone: '9808251494',
      whatsappNumber: '9779808251494',
      email: 'contact.dawosti@gmail.com',
      location: 'New Road (Opposite Bishal Bazar), Kathmandu, Nepal',
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300',
      },
    }
  );
};
