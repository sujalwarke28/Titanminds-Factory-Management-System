/**
 * Multi-Currency Conversion Utility
 * Converts platform financial metrics between INR, USD, EUR, GBP, JPY, and CNY
 * using real exchange rates relative to base INR.
 */

export const EXCHANGE_RATES = {
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', rate: 1, scaleLabel: '₹ LAKHS SCALE', divisor: 100000, unit: 'Lk' },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', rate: 1 / 83.5, scaleLabel: '$ THOUSANDS SCALE', divisor: 1000, unit: 'k' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', rate: 1 / 90.5, scaleLabel: '€ THOUSANDS SCALE', divisor: 1000, unit: 'k' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', rate: 1 / 107.0, scaleLabel: '£ THOUSANDS SCALE', divisor: 1000, unit: 'k' },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rate: 1 / 0.56, scaleLabel: '¥ MILLIONS SCALE', divisor: 1000000, unit: 'M' },
  CNY: { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', rate: 1 / 11.5, scaleLabel: '¥ THOUSANDS SCALE', divisor: 1000, unit: 'k' },
};

/**
 * Normalizes input currency string to key ('INR', 'USD', 'EUR', 'GBP', 'JPY', 'CNY')
 */
export const normalizeCurrencyCode = (currencyStr) => {
  if (!currencyStr) return 'INR';
  const str = String(currencyStr).toUpperCase();
  if (str.includes('JPY') || str.includes('YEN') || str.includes('JAPAN')) return 'JPY';
  if (str.includes('CNY') || str.includes('YUAN') || str.includes('RMB') || str.includes('CHINA')) return 'CNY';
  if (str.includes('USD') || str.includes('$') || str.includes('DOLLAR')) return 'USD';
  if (str.includes('EUR') || str.includes('€') || str.includes('EURO')) return 'EUR';
  if (str.includes('GBP') || str.includes('£') || str.includes('POUND')) return 'GBP';
  return 'INR';
};

/**
 * Converts an amount given in base INR into target currency details.
 */
export const convertFromINR = (amountInINR, currencyCode) => {
  const code = normalizeCurrencyCode(currencyCode);
  const info = EXCHANGE_RATES[code];
  const converted = Math.round(amountInINR * info.rate);
  
  const formattedFull = `${info.symbol}${converted.toLocaleString('en-US')}`;
  
  let formattedShort = '';
  if (code === 'INR') {
    formattedShort = `₹${(amountInINR / 100000).toFixed(1)} Lk`;
  } else if (code === 'JPY') {
    formattedShort = `¥${(converted / 1000000).toFixed(1)}M`;
  } else {
    formattedShort = `${info.symbol}${(converted / 1000).toFixed(1)}k`;
  }

  return {
    value: converted,
    code: info.code,
    symbol: info.symbol,
    formatted: formattedFull,
    formattedShort: formattedShort,
    scaleLabel: info.scaleLabel,
  };
};

/**
 * Returns dynamic 100-machine model metrics converted to selected currency
 */
export const getDynamicFinancialModel = (currencyCode) => {
  const code = normalizeCurrencyCode(currencyCode);
  const info = EXCHANGE_RATES[code];

  // Base values in INR
  const baseSavings = 3050000;
  const baseDeployment = 1200000;
  const basePreventedLoss = 2250000;
  const baseMaintSavings = 600000;
  const baseEnergySavings = 200000;
  const baseNetBenefit = 1850000;
  const baseHourlyRate = 25000;

  const savings = convertFromINR(baseSavings, code);
  const deployment = convertFromINR(baseDeployment, code);
  const prevented = convertFromINR(basePreventedLoss, code);
  const maint = convertFromINR(baseMaintSavings, code);
  const energy = convertFromINR(baseEnergySavings, code);
  const netBenefit = convertFromINR(baseNetBenefit, code);
  const hourlyRate = convertFromINR(baseHourlyRate, code);

  const getChartVal = (cObj) => {
    if (code === 'INR') return Number((cObj.value / 100000).toFixed(1));
    if (code === 'JPY') return Number((cObj.value / 1000000).toFixed(2));
    return Number((cObj.value / 1000).toFixed(1));
  };

  return {
    code: info.code,
    symbol: info.symbol,
    scaleLabel: info.scaleLabel,

    // Hero KPI 1: Maintenance ROI
    roiValue: '154%',
    roiSubtext: 'Return on Investment in Year 1',
    roiFormula: `(${savings.formatted} - ${deployment.formatted}) ÷ ${deployment.formatted} ×100 = 154%`,
    roiExpandedFormula: 'Maintenance ROI (%) = (Total Projected Savings - Platform Deployment Cost) ÷ Platform Deployment Cost ×100',
    roiFactors: [
      `Total Projected Annual Savings: ${savings.formatted} / year (${savings.formattedShort})`,
      `Platform Deployment Cost: ${deployment.formatted} (One-Time)`,
      `Net First-Year Benefit: ${netBenefit.formatted}`
    ],

    // Hero KPI 2: Total Projected Annual Savings
    totalSavingsValue: `${savings.formatted} / yr`,
    totalSavingsSubtext: `${savings.formattedShort} / year Total Enterprise Impact`,
    totalSavingsFormula: `${prevented.formatted} (Downtime Saved) + ${maint.formatted} (Maint) + ${energy.formatted} (Energy) = ${savings.formatted} / yr`,
    totalSavingsFactors: [
      `Downtime Cost Prevented: ${prevented.formatted} / yr (30 Failures × 3h × ${hourlyRate.formatted}/hr)`,
      `Maintenance Cost Reduction: ${maint.formatted} / yr`,
      `Energy Savings: ${energy.formatted} / yr`
    ],

    // Hero KPI 3: Downtime Cost Prevented
    downtimePreventedValue: `${prevented.formatted} / yr`,
    downtimePreventedSubtext: `${prevented.formattedShort} / year Avoided Outage Loss`,
    downtimePreventedFormula: `30 Prevented Failures × 3 Hours × ${hourlyRate.formatted}/hr = ${prevented.formatted} / yr`,

    // Grid Variables
    hourlyRateText: `${hourlyRate.formatted} / hour`,
    maintSavingsText: `${maint.formatted} / yr`,
    energySavingsText: `${energy.formatted} / yr`,
    totalSavingsText: `${savings.formatted} / yr`,
    netBenefitText: netBenefit.formatted,

    // Recharts Data
    chartData: [
      { name: 'Prevented Loss', value: getChartVal(prevented), color: 'var(--color-green-text)', displayVal: `${prevented.formattedShort}` },
      { name: 'Maint. Savings', value: getChartVal(maint), color: 'var(--color-purple-text)', displayVal: `${maint.formattedShort}` },
      { name: 'Energy Savings', value: getChartVal(energy), color: 'var(--color-amber-text)', displayVal: `${energy.formattedShort}` },
      { name: 'Net Savings', value: getChartVal(savings), color: 'var(--color-cyan-text)', displayVal: `${savings.formattedShort}` },
    ]
  };
};
