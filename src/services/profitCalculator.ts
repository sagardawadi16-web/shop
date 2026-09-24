import { ProfitFormulaParams, ProfitFormulaResult } from '../types';

/**
 * Dawosti Boutique — Real-time Profit Formula Engine
 * Formula: Net Profit = Selling Price - Buying Price (Cost) - Discount - Shipping Charge - Referral Fee
 */
export const calculateProfit = (params: ProfitFormulaParams): ProfitFormulaResult => {
  const selling = Math.max(0, params.sellingPrice || 0);
  const buying = Math.max(0, params.buyingPrice || 0);
  const discount = Math.max(0, params.discount || 0);
  const shipping = Math.max(0, params.shippingCharge || 0);
  const referral = Math.max(0, params.referralFee || 0);

  // Net Profit formula
  const netProfit = selling - buying - discount - shipping - referral;

  // Margin %
  const marginPercent = selling > 0 ? Math.round((netProfit / selling) * 1000) / 10 : 0;

  return {
    sellingPrice: selling,
    buyingPrice: buying,
    discount,
    shippingCharge: shipping,
    referralFee: referral,
    netProfit,
    marginPercent,
    isViable: netProfit > 0,
  };
};

/** Default shipping estimate for Nepal */
export const DEFAULT_SHIPPING_ESTIMATE = {
  insideValley: 150,
  outsideValley: 250,
};
