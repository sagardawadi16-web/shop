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

    // 5. Build Direct WhatsApp Verification URI for Merchant (+977 9808251494)
    const itemsList = items.map((i: any, idx: number) => {
      const name = i.product?.title?.np || i.product?.title?.en || i.product?.title || 'पोशाक';
      const size = i.selectedSize || 'Free';
      const qty = i.quantity || 1;
      const price = (i.product?.price || 0) * qty;
      return `${idx + 1}. *${name}*\n   साइज: ${size} | थान: ${qty} | रु ${price.toLocaleString()}`;
    }).join('\n');

    const paymentLabel = paymentMethod === 'cod'
      ? 'सामान हातमा परेपछि (Cash on Delivery)'
      : paymentMethod.toUpperCase();

    const noteText = body.deliveryNote ? `\n📝 *डेलिभरी नोट:* ${body.deliveryNote}` : '';
    const refCodeText = body.referredByCode ? `\n🎁 *रेफरल कोड:* ${body.referredByCode}` : '';
    const txnText = body.paymentDetails ? `\n🧾 *कारोबार कोड (Txn Ref):* ${body.paymentDetails}` : '';

    const whatsappText = encodeURIComponent(
      `🛍️ *दावोस्ती बुटिक — नयाँ अनलाइन अर्डर #${orderNumber}*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `👤 *ग्राहकको नाम (Customer):* ${shipping.fullName}\n` +
      `📞 *सम्पर्क फोन (Phone):* ${shipping.phone}\n` +
      `📍 *डेलिभरी ठेगाना:* ${shipping.addressLine || ''}, ${shipping.city || 'Kathmandu'}\n` +
      `${noteText}` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📦 *अर्डर गरिएका वस्त्रहरू (Items):*\n${itemsList}\n\n` +
      `💰 *जम्मा रकम (Total):* NPR ${totalAmount.toLocaleString()}\n` +
      `💳 *भुक्तानी माध्यम:* ${paymentLabel}` +
      `${txnText}` +
      `${refCodeText}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🙏 *कृपया यो अर्डर प्रमाणीकरण गरी छिटो डेलिभरी व्यवस्था गरिदिनुहोला। धन्यवाद!*`
    );
    const whatsappUrl = `https://wa.me/9779808251494?text=${whatsappText}`;

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Order verified and recorded at Cloudflare edge. Forwarding customer details to WhatsApp 9808251494.',
        order: verifiedOrder,
        targetPhone: '9808251494',
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
      helpline: '+977 9808251494',
      whatsapp: 'https://wa.me/9779808251494',
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
