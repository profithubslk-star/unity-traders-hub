import { supabase } from '../lib/supabase';

export interface PaymentStatus {
  isActive: boolean;
  isSuspended: boolean;
  showWarning: boolean;
  daysUntilDue: number;
  paymentDueDate: Date | null;
  suspensionReason: string | null;
  walletAddress: string | null;
  amount: number;
  planType: string;
}

export async function checkPaymentStatus(userId: string): Promise<PaymentStatus | null> {
  try {
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*, crypto_payments(*)')
      .eq('user_id', userId)
      .or('status.eq.active,status.eq.suspended')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !subscription) {
      return null;
    }

    const now = new Date();
    const paymentDueDate = subscription.payment_due_date ? new Date(subscription.payment_due_date) : null;
    const daysUntilDue = paymentDueDate
      ? Math.floor((paymentDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    const planPrices: Record<string, number> = {
      one_month: 39,
      three_months: 99,
      twelve_months: 279,
    };

    const latestPayment = subscription.crypto_payments?.[0];
    const walletAddress = latestPayment?.wallet_address || null;

    return {
      isActive: subscription.status === 'active',
      isSuspended: subscription.status === 'suspended',
      showWarning: daysUntilDue <= 2 && daysUntilDue >= 0,
      daysUntilDue,
      paymentDueDate,
      suspensionReason: subscription.suspension_reason,
      walletAddress,
      amount: planPrices[subscription.plan_type] || 0,
      planType: subscription.plan_type,
    };
  } catch (err) {
    console.error('Error checking payment status:', err);
    return null;
  }
}

export async function refreshPaymentStatus(): Promise<{ success: boolean; message: string }> {
  try {
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-subscription-payments`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return {
        success: false,
        message: 'Failed to check payment status. Please try again.',
      };
    }

    const result = await response.json();

    if (result.success) {
      return {
        success: true,
        message: 'Payment status updated successfully.',
      };
    }

    return {
      success: false,
      message: result.error || 'Failed to update payment status.',
    };
  } catch (error) {
    console.error('Error refreshing payment status:', error);
    return {
      success: false,
      message: 'Network error. Please check your connection and try again.',
    };
  }
}

export function formatDaysUntilDue(days: number): string {
  if (days < 0) {
    const overdueDays = Math.abs(days);
    return `${overdueDays} day${overdueDays !== 1 ? 's' : ''} overdue`;
  }
  if (days === 0) {
    return 'Due today';
  }
  if (days === 1) {
    return 'Due tomorrow';
  }
  return `Due in ${days} days`;
}
