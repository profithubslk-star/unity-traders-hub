export type PlanType = 'demo' | '1_month' | '3_months' | '6_months' | '12_months';
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled';
export type SignalType = 'buy' | 'sell';
export type EntryType = 'market' | 'limit';
export type SignalStatus = 'active' | 'tp1_hit' | 'tp2_hit' | 'tp3_hit' | 'completed' | 'sl_hit' | 'expired' | 'cancelled';
export type UpdateType = 'pre_alert' | 'signal_sent' | 'tp1_hit' | 'tp2_hit' | 'tp3_hit' | 'sl_hit' | 'break_even' | 'expired' | 'cancelled';
export type ImpactLevel = 'low' | 'medium' | 'high';

export interface Subscription {
  id: string;
  user_id: string;
  plan_type: PlanType;
  status: SubscriptionStatus;
  start_date: string;
  end_date: string | null;
  payment_id: string | null;
  payment_amount: number | null;
  payment_currency: string;
  price: number;
  signals_viewed_count: number;
  last_signal_viewed_at: string | null;
  max_signals_per_day: number | null;
  max_signals_total: number | null;
  allowed_methods: string[];
  allowed_timeframes: string[];
  can_access_market_intelligence: boolean;
  can_access_advanced_analysis: boolean;
  has_chart_integration: boolean;
  auto_renew: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  telegram_username: string | null;
  preferred_markets: string[];
  notification_preferences: {
    email: boolean;
    push: boolean;
    telegram: boolean;
  };
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface AnalysisData {
  ict?: {
    order_blocks?: string[];
    fair_value_gaps?: string[];
    liquidity_zones?: string[];
  };
  smc?: {
    market_structure?: string;
    break_of_structure?: boolean;
    change_of_character?: boolean;
  };
  elliott_wave?: {
    current_wave?: string;
    wave_pattern?: string;
  };
  indicators?: {
    rsi?: number;
    macd?: { value: number; signal: number; histogram: number };
    ema_20?: number;
    ema_50?: number;
    ema_200?: number;
    bollinger_bands?: { upper: number; middle: number; lower: number };
    volume?: number;
  };
  timeframes?: string[];
  session?: string;
  confluence_count?: number;
}

export interface Signal {
  id: string;
  user_id: string;
  market: string;
  timeframe: string;
  methods: string[];
  signal_type: SignalType;
  entry_type: EntryType;
  entry_price: number;
  stop_loss: number;
  take_profit_1: number;
  take_profit_2: number;
  take_profit_3: number;
  tp1_percentage: number;
  tp2_percentage: number;
  tp3_percentage: number;
  confidence_score: number;
  risk_reward_ratio: number;
  analysis_data: AnalysisData;
  status: SignalStatus;
  is_demo: boolean;
  expires_at: string | null;
  user_action: 'taken' | 'not_taken' | 'pending';
  entry_hit_at: string | null;
  current_price: number | null;
  pnl_percentage: number;
  break_even_moved: boolean;
  tp1_hit_at: string | null;
  tp2_hit_at: string | null;
  tp3_hit_at: string | null;
  sl_hit_at: string | null;
  methodology: string | null;
  created_at: string;
  updated_at: string;
}

export interface SignalUpdate {
  id: string;
  signal_id: string;
  update_type: UpdateType;
  message: string;
  price_at_update: number | null;
  created_at: string;
}

export interface UserSignal {
  id: string;
  user_id: string;
  signal_id: string;
  seen_at: string;
}

export interface MarketNews {
  id: string;
  title: string;
  description: string | null;
  source: string;
  url: string | null;
  impact_level: ImpactLevel | null;
  published_at: string;
  created_at: string;
}

export interface AnalysisLog {
  id: string;
  market: string;
  timeframe: string;
  session: string | null;
  indicators_data: Record<string, any>;
  ict_data: Record<string, any>;
  smc_data: Record<string, any>;
  elliott_wave_data: Record<string, any>;
  recommendation: string | null;
  confidence_score: number | null;
  created_at: string;
}
