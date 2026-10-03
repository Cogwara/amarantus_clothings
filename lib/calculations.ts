/**
 * Amarantus Clothings Manager - Business Logic & Calculations
 * Explicit formulas for Nigerian Retail Thrift Shop
 */

/**
 * Format any number into Nigerian Naira (NGN) format with ₦ symbol
 * e.g. 15500 -> "₦15,500" or "₦15,500.00"
 */
export function formatNaira(amount: number, showDecimals: boolean = false): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '₦0';
  }
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(amount).replace('NGN', '₦').trim();
}

/**
 * Format compact Naira for badges and charts (e.g. ₦1.2M, ₦450K)
 */
export function formatCompactNaira(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) {
    return `₦${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(amount) >= 1_000) {
    return `₦${(amount / 1_000).toFixed(1)}k`;
  }
  return formatNaira(amount);
}

/**
 * Gross profit for a single sale item
 * Formula: totalAmount - (unitCostPrice * quantity)
 */
export function calculateItemGrossProfit(
  totalAmount: number,
  unitCostPrice: number,
  quantity: number
): number {
  return totalAmount - unitCostPrice * quantity;
}

/**
 * Net profit calculation
 * Formula: totalSales - costOfGoodsSold - operatingExpenses
 * IMPORTANT: Never calculate profit as sales minus purchasing spend for the day!
 */
export function calculateNetProfit(
  totalSales: number,
  costOfGoodsSold: number,
  operatingExpenses: number
): number {
  return totalSales - costOfGoodsSold - operatingExpenses;
}

/**
 * Profit margin percentage
 * Formula: (profit / totalSales) * 100
 */
export function calculateMarginPercentage(profit: number, revenue: number): number {
  if (revenue <= 0) return 0;
  return Math.round((profit / revenue) * 100 * 10) / 10;
}

/**
 * Thursday Purchasing Recommendation Engine
 * - Sales window: Last 30 days
 * - Average weekly sales: units sold in window / 4.28
 * - Target coverage: typically 2 to 3 weeks of stock
 * - Recommended purchase: max(0, ceil(averageWeeklySales * targetCoverageWeeks - currentStock))
 */
export function calculateThursdayPurchaseRecommendation(
  currentStock: number,
  unitsSold30Days: number,
  targetCoverageWeeks: number = 2.5
): {
  averageWeeklySales: number;
  recommendedStock: number;
  recommendedQuantity: number;
} {
  const weeks = 30 / 7; // ~4.285 weeks
  const averageWeeklySales = Math.round((unitsSold30Days / weeks) * 10) / 10;
  const recommendedStock = Math.ceil(averageWeeklySales * targetCoverageWeeks);
  const recommendedQuantity = Math.max(0, recommendedStock - currentStock);

  return {
    averageWeeklySales,
    recommendedStock,
    recommendedQuantity,
  };
}

/**
 * Clearance suggestions
 * 45 days default threshold
 * Suggested discount tiers: 10%, 15%, 20%, 30%
 */
export const CLEARANCE_DEFAULT_DAYS = 45;

export const CLEARANCE_DISCOUNT_TIERS = [
  { label: '10% Off', percent: 10 },
  { label: '15% Off', percent: 15 },
  { label: '20% Off', percent: 20 },
  { label: '30% Off', percent: 30 },
];

export function calculateDiscountedPrice(originalPrice: number, percent: number): number {
  const discounted = originalPrice * (1 - percent / 100);
  // Round to nearest 100 Naira for clean Nigerian retail pricing (e.g. 4,950 -> 5,000 or 4,900)
  return Math.round(discounted / 100) * 100;
}

/**
 * Social Selling caption generator
 * Generates engaging WhatsApp and Instagram captions formatted with emojis and call to action
 */
export function generateSocialCaptions(params: {
  productName: string;
  category: string;
  size: string;
  condition: string;
  price: number;
  brand?: string | null;
  shopName: string;
  shopPhone: string;
  shopAddress: string;
  imageUrl?: string | null;
  itemUrl?: string | null;
  includeLink?: boolean;
}) {
  const conditionLabel =
    params.condition === 'EXCELLENT'
      ? 'Grade A (First Selection - Like New)'
      : params.condition === 'VERY_GOOD'
      ? 'Grade A- (Very Clean)'
      : params.condition === 'GOOD'
      ? 'Good Condition'
      : 'Fair Condition';

  const brandText = params.brand ? `🏷️ Brand: ${params.brand}\n` : '';
  const formattedPrice = formatNaira(params.price);

  let linkText = '';
  if (params.includeLink !== false) {
    if (params.imageUrl) {
      linkText += `📸 *Photo:* ${params.imageUrl}\n`;
    }
    if (params.itemUrl) {
      linkText += `🛒 *Order/View:* ${params.itemUrl}\n`;
    }
    if (linkText) {
      linkText = `${linkText}\n`;
    }
  }

  const whatsappCaption = `✨ *NEW ARRIVAL AT ${params.shopName.toUpperCase()}* ✨\n\n` +
    `👗 *Item:* ${params.productName}\n` +
    brandText +
    `📏 *Size:* ${params.size}\n` +
    `⭐ *Condition:* ${conditionLabel}\n` +
    `💰 *Price:* ${formattedPrice}\n\n` +
    linkText +
    `📍 *Shop Location:* ${params.shopAddress}\n` +
    `🚚 Fast delivery available across FCT & nationwide!\n\n` +
    `📲 *To order or claim:* Reply to this status or WhatsApp ${params.shopPhone}\n` +
    `⚡ Only 1 piece available! Fastest finger wins.`;

  const igLinkText =
    params.includeLink !== false && params.itemUrl
      ? `\n🔗 Direct Link: ${params.itemUrl}\n`
      : '';

  const instagramCaption = `✨ Fresh Thrift Pick! ✨\n\n` +
    `${params.productName} in stunning condition.\n\n` +
    `DETAILS:\n` +
    `• Size: ${params.size}\n` +
    (params.brand ? `• Brand: ${params.brand}\n` : '') +
    `• Quality: ${conditionLabel}\n` +
    `• Price: ${formattedPrice}\n\n` +
    `📍 Visit us: ${params.shopAddress}\n` +
    `📦 We deliver doorstep nationwide!\n` +
    igLinkText +
    `\nHOW TO ORDER:\n` +
    `1. Send a DM with screenshot\n` +
    `2. Or WhatsApp us via link in bio (${params.shopPhone})\n\n` +
    `#fctthrift #thriftfct #okrikaonline #amarantusclothings #abujathrift #nigerianfashion #sustainablefashionng #${params.category.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

  return {
    whatsapp: whatsappCaption,
    instagram: instagramCaption,
  };
}
