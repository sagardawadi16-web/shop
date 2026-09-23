import React from 'react';
import {
  CheckCircle,
  Package,
  MapPin,
  Phone,
  Calendar,
  MessageCircle,
  ArrowLeft,
  Printer,
  ShieldCheck,
  Truck,
  CreditCard,
  Heart,
  Sparkles,
} from 'lucide-react';
import { Order, Language } from '../../types';
import { useShopStore } from '../../store/shopStore';

interface OrderConfirmationViewProps {
  order: Order;
  language: Language;
}

export const OrderConfirmationView: React.FC<OrderConfirmationViewProps> = ({ order, language }) => {
  const { setPageView, formatPrice, googleUser, setIsOrderTrackingOpen } = useShopStore();

  const customerDisplayName =
    googleUser?.name || order.customerLoginName || order.shippingAddress.fullName || (language === 'np' ? 'ग्राहक' : 'Valued Customer');

  const firstItem = order.items && order.items.length > 0 ? order.items[0] : null;
  const firstItemImage =
    firstItem?.product?.images?.[0] ||
    'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=600&q=80';

  const getPaymentMethodLabel = () => {
    switch (order.paymentMethod) {
      case 'esewa':
        return {
          title: language === 'np' ? 'eSewa वालेट (सम्पन्न)' : 'Paid via eSewa Gateway',
          sub: order.paymentDetails?.transactionId || 'Tx ID: Verified',
          color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
        };
      case 'khalti':
        return {
          title: language === 'np' ? 'Khalti वालेट (सम्पन्न)' : 'Paid via Khalti Wallet',
          sub: order.paymentDetails?.khaltiToken || 'Token: Approved',
          color: 'text-purple-700 bg-purple-50 border-purple-200',
        };
      case 'fonepay':
        return {
          title: language === 'np' ? 'Fonepay QR (प्रमाण पेश गरिएको)' : 'Fonepay QR (Proof Attached)',
          sub: `Ref: ${order.paymentDetails?.fonepayProof?.referenceId || 'Verified'}`,
          color: 'text-red-700 bg-red-50 border-red-200',
        };
      case 'cod':
      default:
        return {
          title: language === 'np' ? 'क्यास अन डेलिभरी (Cash on Delivery)' : 'Cash on Delivery (COD)',
          sub: language === 'np' ? 'सामान आएपछि मात्र पैसा बुझाउनुहोस्' : 'Pay in cash/QR to delivery rider upon arrival',
          color: 'text-amber-800 bg-amber-50 border-amber-200',
        };
    }
  };

  const paymentInfo = getPaymentMethodLabel();

  const handlePrint = () => {
    window.print();
  };

  const itemsSummary = (order.items || [])
    .map(
      (item, i) =>
        `${i + 1}. ${item.product.title.en} (${item.selectedSize}) x${item.quantity} = NPR ${(
          item.product.price * item.quantity
        ).toLocaleString()}`
    )
    .join('\n');

  const paymentMethodText =
    order.paymentMethod === 'cod'
      ? 'Cash on Delivery (COD)'
      : order.paymentMethod === 'fonepay'
      ? `Fonepay QR (Ref: ${
          order.paymentDetails?.transactionId ||
          order.paymentDetails?.fonepayProof?.referenceId ||
          'Verified'
        })`
      : order.paymentMethod === 'esewa'
      ? `eSewa (Tx: ${order.paymentDetails?.transactionId || 'Verified'})`
      : `Khalti (Tx: ${order.paymentDetails?.transactionId || 'Verified'})`;

  const whatsappMessage = `🛍️ *DAWOSTI BOUTIQUE - NEW ORDER CONFIRMATION*
━━━━━━━━━━━━━━━━━━━━━━━━
*Order Number:* #${order.orderNumber}
*Date:* ${new Date(order.createdAt).toLocaleDateString()}

👤 *CUSTOMER & DELIVERY ADDRESS:*
• Name: ${order.shippingAddress.fullName}
• Phone: +977 ${order.shippingAddress.phone}
${order.shippingAddress.alternatePhone ? `• Alt Phone: +977 ${order.shippingAddress.alternatePhone}\n` : ''}• City/District: ${order.shippingAddress.city}, ${order.shippingAddress.province}
• Street / Landmark: ${order.shippingAddress.addressLine}
${order.notes ? `• Special Notes: "${order.notes}"\n` : ''}
👗 *ORDERED ITEMS:*
${itemsSummary}

💳 *PAYMENT & BILLING:*
• Payment Method: ${paymentMethodText}
• Subtotal: NPR ${order.subtotalAmount.toLocaleString()}
• Delivery: ${order.deliveryFee === 0 ? 'FREE' : `NPR ${order.deliveryFee}`}
${order.discountAmount > 0 ? `• Discount: -NPR ${order.discountAmount.toLocaleString()}\n` : ''}• *Total Payable:* NPR ${order.totalAmount.toLocaleString()}
━━━━━━━━━━━━━━━━━━━━━━━━
🙏 Namaste Dawosti Boutique Team! I have placed this order on dawosti.com. Please confirm my order and share the dispatch update.`;

  const whatsappSupportUrl = `https://wa.me/9779708251494?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div id="order-confirmation-container" className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Celebration & Personalized Welcome Header */}
      <div className="text-center space-y-3 pb-6">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-xs animate-in zoom-in-75">
          <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12" />
        </div>
        <span className="inline-block px-3 py-1 bg-[#D4AF37]/15 text-[#8B3A3A] font-bold text-xs uppercase tracking-widest rounded-full">
          {language === 'np' ? 'अर्डर सफलतापूर्वक सम्पन्न भयो' : 'Order Confirmed & Received'}
        </span>

        {/* Personalized customer name greeting */}
        <h1 className="font-serif-luxury text-2xl sm:text-3xl lg:text-4xl font-bold text-[#2B1810]">
          {language === 'np'
            ? `${customerDisplayName}, तपाईंको अर्डरको लागि धेरै धेरै धन्यवाद!`
            : `${customerDisplayName}, thank you for your order!`}
        </h1>

        {/* 3-Sentence Warm Boutique Welcome Loop */}
        <div className="max-w-xl mx-auto mt-4 p-4 sm:p-5 bg-white/80 backdrop-blur-xs rounded-2xl border border-[#EADCCE] shadow-xs text-center space-y-2">
          <p className="text-xs sm:text-sm font-serif-luxury italic text-[#8B3A3A] flex items-center justify-center gap-1.5">
            <Heart className="w-3.5 h-3.5 fill-[#8B3A3A] text-[#8B3A3A]" />
            <span>
              {language === 'np'
                ? 'हामीसँग जोडिनुभएकोमा हामीलाई अत्यन्तै खुसी लागेको छ।'
                : 'Thank you for your order — it is an absolute pleasure to have you with us.'}
            </span>
          </p>
          <p className="text-xs sm:text-sm text-[#2B1810] font-medium">
            {language === 'np'
              ? 'हामी आशा गर्दछौँ तपाईंले आफ्नो रोजाइको यो सुन्दर मौलिक पहिरन धेरै मन पराउनुहुनेछ।'
              : 'We hope you enjoy your selection and make wonderful memories wearing it.'}
          </p>
          <p className="text-[11px] sm:text-xs text-[#6B564C]">
            {language === 'np'
              ? 'हाम्रो काठमाडौँ बुटिक टोलीले अर्डर नम्बर ' +
                order.orderNumber +
                ' लाई विशेष उपहार प्याकेजिङमा तयार गर्दैछ।'
              : `Our Kathmandu atelier team is preparing order #${order.orderNumber} with bespoke heritage care.`}
          </p>
        </div>
      </div>

      {/* Spotlight: Order Item First Image & Order Price Card */}
      <div className="mb-8 bg-linear-to-br from-[#FAF2E9] to-[#FFF8F0] p-5 sm:p-6 rounded-3xl border-2 border-[#D4AF37]/40 shadow-md">
        <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-6">
          {/* First Item Image */}
          <div className="relative shrink-0">
            <img
              src={firstItemImage}
              alt={firstItem?.product?.title?.en || 'Order Item Preview'}
              className="w-28 h-36 sm:w-32 sm:h-40 object-cover rounded-2xl border-2 border-white shadow-md"
              referrerPolicy="no-referrer"
            />
            <span className="absolute -bottom-2 -right-2 px-2.5 py-0.5 bg-[#8B3A3A] text-white text-[11px] font-bold rounded-full shadow-xs">
              {firstItem?.selectedSize || 'Standard'}
            </span>
          </div>

          {/* Details & Order Price */}
          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B564C] bg-white px-2.5 py-1 rounded-md border border-[#EADCCE]">
                {language === 'np' ? 'प्रमुख सामग्री' : 'Primary Item'}
              </span>
              <span className="font-mono text-xs text-[#8B3A3A] font-bold">
                {order.orderNumber}
              </span>
            </div>

            <h3 className="font-serif-luxury text-base sm:text-lg font-bold text-[#2B1810]">
              {firstItem
                ? language === 'np'
                  ? firstItem.product.title.np
                  : firstItem.product.title.en
                : 'Dawosti Luxury Collection'}
            </h3>

            {firstItem && (
              <p className="text-xs text-[#6B564C]">
                {language === 'np' ? 'परिमाण' : 'Quantity'}: {firstItem.quantity} •{' '}
                {language === 'np' ? 'साइज' : 'Size'}: {firstItem.selectedSize}
              </p>
            )}

            {/* Prominent Order Price */}
            <div className="pt-2 border-t border-[#EADCCE]/60 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
              <span className="text-xs font-semibold text-[#6B564C] uppercase tracking-wider">
                {language === 'np' ? 'जम्मा अर्डर रकम' : 'Total Order Price'}:
              </span>
              <span className="font-serif-luxury text-2xl sm:text-3xl font-extrabold text-[#8B3A3A]">
                {formatPrice(order.totalAmount)}
              </span>
            </div>
          </div>

          {/* Quick Tracking CTA */}
          <div className="shrink-0">
            <button
              onClick={() => setIsOrderTrackingOpen(true)}
              className="px-4 py-2.5 bg-[#8B3A3A] hover:bg-[#6e2c2c] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all active:scale-[0.98]"
            >
              <Truck className="w-4 h-4" />
              <span>{language === 'np' ? 'अर्डर ट्र्याक गर्नुहोस्' : 'Track Order Live'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Receipt Card */}
      <div className="bg-white rounded-3xl border border-[#EADCCE] shadow-lg overflow-hidden">
        
        {/* Receipt Header Strip */}
        <div className="bg-[#FAF2E9] px-6 py-4 border-b border-[#EADCCE] flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B564C]">
              {language === 'np' ? 'अर्डर नम्बर' : 'Order Reference'}
            </span>
            <p className="font-mono text-base font-extrabold text-[#8B3A3A]">{order.orderNumber}</p>
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B564C]">
              {language === 'np' ? 'मिति' : 'Date'}
            </span>
            <p className="text-xs font-semibold text-[#2B1810] flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#8B3A3A]" />
              <span>{new Date(order.createdAt).toLocaleDateString()}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-white border border-[#EADCCE] text-[#2B1810] rounded-xl text-xs font-bold hover:bg-[#FAF2E9] flex items-center gap-1.5 shadow-2xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-[#6B564C]" />
              <span>{language === 'np' ? 'रसिद प्रिन्ट' : 'Print Receipt'}</span>
            </button>
          </div>
        </div>

        {/* Payment & Delivery Status Banners */}
        <div className="p-6 border-b border-[#EADCCE] grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Payment Status */}
          <div className={`p-4 rounded-2xl border ${paymentInfo.color}`}>
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">
                {language === 'np' ? 'भुक्तानी अवस्था' : 'Payment Status'}
              </span>
            </div>
            <p className="font-bold text-sm">{paymentInfo.title}</p>
            <p className="text-xs font-mono opacity-80 mt-0.5">{paymentInfo.sub}</p>
          </div>

          {/* Delivery Dispatch Info */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-amber-900">
            <div className="flex items-center gap-2 mb-1">
              <Truck className="w-4 h-4 text-amber-700" />
              <span className="text-xs font-bold uppercase tracking-wider">
                {language === 'np' ? 'डेलिभरी समय' : 'Estimated Delivery'}
              </span>
            </div>
            <p className="font-bold text-sm">
              {order.shippingAddress.city.toLowerCase().includes('kathmandu') ||
              order.shippingAddress.city.toLowerCase().includes('lalitpur') ||
              order.shippingAddress.city.toLowerCase().includes('bhaktapur')
                ? (language === 'np' ? 'काठमाडौँ उपत्यका: २४ घण्टा भित्र' : 'Kathmandu Valley: Within 24 Hours')
                : (language === 'np' ? 'उपत्यका बाहिर: २ देखि ४ कार्यदिन' : 'Outside Valley: 2 to 4 Business Days')}
            </p>
            <p className="text-xs text-amber-800/80 mt-0.5">
              {language === 'np' ? 'प्याकिङ र गुणस्तर जाँच सुरु भयो' : 'Hand-packaged with heritage care'}
            </p>
          </div>
        </div>

        {/* Customer & Shipping Details */}
        <div className="p-6 border-b border-[#EADCCE] grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          <div>
            <h4 className="font-bold uppercase tracking-wider text-[#6B564C] mb-2 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#8B3A3A]" />
              <span>{language === 'np' ? 'डेलिभरी ठेगाना' : 'Delivery Address'}</span>
            </h4>
            <p className="font-bold text-sm text-[#2B1810]">{order.shippingAddress.fullName}</p>
            <p className="text-[#4A3B32] mt-0.5">{order.shippingAddress.addressLine}</p>
            <p className="text-[#4A3B32]">
              {order.shippingAddress.city}, {order.shippingAddress.province}
            </p>
          </div>

          <div>
            <h4 className="font-bold uppercase tracking-wider text-[#6B564C] mb-2 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#8B3A3A]" />
              <span>{language === 'np' ? 'सम्पर्क जानकारी' : 'Contact Phone'}</span>
            </h4>
            <p className="font-bold font-mono text-sm text-[#2B1810]">+977 {order.shippingAddress.phone}</p>
            {order.shippingAddress.alternatePhone && (
              <p className="text-[#6B564C] font-mono mt-0.5">
                Alt: +977 {order.shippingAddress.alternatePhone}
              </p>
            )}
            {order.notes && (
              <p className="text-[#6B564C] italic mt-1 bg-[#FAF2E9] p-2 rounded-lg">
                "{order.notes}"
              </p>
            )}
          </div>
        </div>

        {/* Order Items Table */}
        <div className="p-6">
          <h4 className="font-bold uppercase tracking-wider text-[#6B564C] mb-4 flex items-center gap-1.5 text-xs">
            <Package className="w-3.5 h-3.5 text-[#8B3A3A]" />
            <span>{language === 'np' ? 'अर्डर गरिएका सामानहरू' : 'Ordered Items'}</span>
          </h4>

          <div className="divide-y divide-[#FAF2E9] space-y-3">
            {order.items.map((item, idx) => (
              <div key={idx} className="pt-3 first:pt-0 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={item.product.images[0]}
                    alt={item.product.title[language]}
                    className="w-14 h-14 object-cover rounded-xl border border-[#EADCCE]"
                  />
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-[#2B1810]">
                      {item.product.title[language]}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] font-bold text-[#8B3A3A] bg-[#8B3A3A]/10 px-2 py-0.5 rounded-md">
                        {item.selectedSize}
                      </span>
                      <span className="text-xs text-[#6B564C]">× {item.quantity}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-serif-luxury font-bold text-sm sm:text-base text-[#2B1810]">
                    {formatPrice(item.product.price * item.quantity)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Pricing Breakdown */}
          <div className="mt-6 pt-4 border-t border-[#EADCCE] space-y-2 text-xs">
            <div className="flex justify-between text-[#6B564C]">
              <span>{language === 'np' ? 'सामानको रकम' : 'Subtotal'}</span>
              <span className="font-bold font-mono text-[#2B1810]">
                {formatPrice(order.subtotalAmount)}
              </span>
            </div>

            {order.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>{language === 'np' ? 'छुट (Discount)' : 'Promotional Discount'}</span>
                <span className="font-bold font-mono">-{formatPrice(order.discountAmount)}</span>
              </div>
            )}

            <div className="flex justify-between text-[#6B564C]">
              <span>{language === 'np' ? 'डेलिभरी शुल्क' : 'Delivery Fee'}</span>
              <span>
                {order.deliveryFee === 0 ? (
                  <span className="text-emerald-700 font-bold">
                    {language === 'np' ? 'निःशुल्क (FREE)' : 'FREE'}
                  </span>
                ) : (
                  <span className="font-mono">{formatPrice(order.deliveryFee)}</span>
                )}
              </span>
            </div>

            <div className="flex justify-between text-base font-bold text-[#2B1810] pt-2 border-t border-[#EADCCE]">
              <span>{language === 'np' ? 'कुल जम्मा' : 'Grand Total'}</span>
              <span className="text-lg font-serif-luxury text-[#8B3A3A]">
                {formatPrice(order.totalAmount)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          onClick={() => {
            setPageView('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="w-full sm:w-auto px-6 py-3.5 bg-[#8B3A3A] hover:bg-[#722E2E] text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-98"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{language === 'np' ? 'थप फेसन किनमेल गर्नुहोस्' : 'Continue Shopping'}</span>
        </button>

        <a
          href={whatsappSupportUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto px-7 py-3.5 bg-[#25D366] hover:bg-[#1EBE5B] text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-lg transition-all active:scale-98"
        >
          <MessageCircle className="w-5 h-5 fill-white shrink-0" />
          <span>
            {language === 'np'
              ? 'ह्वाट्सएपमा अर्डर पठाउनुहोस् (+९७७ ९७०८२५१४९४)'
              : 'Confirm on WhatsApp Hotline (+977 9708251494)'}
          </span>
        </a>
      </div>

      {/* Security Footer Guarantee */}
      <div className="text-center pt-8 text-[11px] text-[#6B564C] flex items-center justify-center gap-2">
        <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
        <span>
          {language === 'np'
            ? 'Dawosti बुटिक • न्यूरोड काठमाडौँ • १००% मौलिक नेपाली परिधान'
            : 'Dawosti Boutique Kathmandu • 100% Authentic Nepali Craftsmanship'}
        </span>
      </div>
    </div>
  );
};

