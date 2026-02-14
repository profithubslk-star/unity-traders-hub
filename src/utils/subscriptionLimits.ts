export interface SubscriptionLimits {
  maxSignalsPerDay: number | null;
  maxSignalsTotal: number | null;
  allowedMethods: string[];
  allowedTimeframes: string[];
  canAccessMarketIntelligence: boolean;
  hasChartIntegration: boolean;
  maxConfidenceLevel: number;
  price: number;
}

export const SUBSCRIPTION_LIMITS: Record<string, SubscriptionLimits> = {
  demo: {
    maxSignalsPerDay: null,
    maxSignalsTotal: 3,
    allowedMethods: ['ict', 'smc', 'elliott_wave'],
    allowedTimeframes: ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1'],
    canAccessMarketIntelligence: false,
    hasChartIntegration: false,
    maxConfidenceLevel: 60,
    price: 0,
  },
  '1_month': {
    maxSignalsPerDay: 5,
    maxSignalsTotal: null,
    allowedMethods: ['ict'],
    allowedTimeframes: ['M1', 'M5', 'M15'],
    canAccessMarketIntelligence: false,
    hasChartIntegration: false,
    maxConfidenceLevel: 100,
    price: 25,
  },
  '3_months': {
    maxSignalsPerDay: 12,
    maxSignalsTotal: null,
    allowedMethods: ['ict', 'smc'],
    allowedTimeframes: ['M1', 'M5', 'M15', 'M30', 'H1'],
    canAccessMarketIntelligence: false,
    hasChartIntegration: false,
    maxConfidenceLevel: 100,
    price: 69,
  },
  '6_months': {
    maxSignalsPerDay: 25,
    maxSignalsTotal: null,
    allowedMethods: ['ict', 'smc', 'elliott_wave'],
    allowedTimeframes: ['M1', 'M5', 'M15', 'M30', 'H1', 'D1'],
    canAccessMarketIntelligence: false,
    hasChartIntegration: true,
    maxConfidenceLevel: 100,
    price: 139,
  },
  '12_months': {
    maxSignalsPerDay: null,
    maxSignalsTotal: null,
    allowedMethods: ['ict', 'smc', 'elliott_wave'],
    allowedTimeframes: ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1'],
    canAccessMarketIntelligence: true,
    hasChartIntegration: true,
    maxConfidenceLevel: 100,
    price: 279,
  },
};

export function getSubscriptionLimits(planType: string): SubscriptionLimits {
  return SUBSCRIPTION_LIMITS[planType] || SUBSCRIPTION_LIMITS.demo;
}

export function canAccessTimeframe(planType: string, timeframe: string): boolean {
  const limits = getSubscriptionLimits(planType);
  return limits.allowedTimeframes.includes(timeframe);
}

export function canUseMethod(planType: string, method: string): boolean {
  const limits = getSubscriptionLimits(planType);
  return limits.allowedMethods.includes(method.toLowerCase());
}

export function getAvailableMethods(planType: string): string[] {
  const limits = getSubscriptionLimits(planType);
  return limits.allowedMethods;
}

export function getAvailableTimeframes(planType: string): string[] {
  const limits = getSubscriptionLimits(planType);
  return limits.allowedTimeframes;
}

export function getMethodDisplayName(method: string): string {
  const methodNames: Record<string, string> = {
    basic: 'Basic Analysis',
    ict: 'ICT (Inner Circle Trader)',
    smc: 'SMC (Smart Money Concepts)',
    elliott_wave: 'Elliott Wave',
  };
  return methodNames[method.toLowerCase()] || method;
}

export interface SignalLimitStatus {
  canGenerate: boolean;
  reason: string;
  signalsRemaining: number;
  isUnlimited: boolean;
}

export function canAccessChartIntegration(planType: string): boolean {
  const limits = getSubscriptionLimits(planType);
  return limits.hasChartIntegration;
}

export function checkSignalLimitStatus(
  planType: string,
  signalsViewedCount: number,
  totalSignalsGenerated?: number
): SignalLimitStatus {
  const limits = getSubscriptionLimits(planType);

  if (limits.maxSignalsTotal !== null) {
    const totalUsed = totalSignalsGenerated || 0;
    const remaining = limits.maxSignalsTotal - totalUsed;

    if (remaining <= 0) {
      return {
        canGenerate: false,
        reason: 'You have reached your maximum signal limit. Please upgrade to continue.',
        signalsRemaining: 0,
        isUnlimited: false,
      };
    }

    return {
      canGenerate: true,
      reason: 'OK',
      signalsRemaining: remaining,
      isUnlimited: false,
    };
  }

  if (limits.maxSignalsPerDay !== null) {
    const remaining = limits.maxSignalsPerDay - signalsViewedCount;

    if (remaining <= 0) {
      return {
        canGenerate: false,
        reason: 'Daily signal limit reached. Resets in 24 hours from your first signal today.',
        signalsRemaining: 0,
        isUnlimited: false,
      };
    }

    return {
      canGenerate: true,
      reason: 'OK',
      signalsRemaining: remaining,
      isUnlimited: false,
    };
  }

  return {
    canGenerate: true,
    reason: 'OK',
    signalsRemaining: -1,
    isUnlimited: true,
  };
}
