import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface EconomicEvent {
  id: string;
  title: string;
  country: string;
  currency: string;
  date: string;
  impact: 'high' | 'medium' | 'low';
  actual?: string;
  forecast?: string;
  previous?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const events: EconomicEvent[] = [];
    const today = new Date();

    const majorEvents = [
      {
        title: 'Federal Reserve Interest Rate Decision',
        country: 'United States',
        currency: 'USD',
        daysFromNow: 2,
        impact: 'high' as const,
        forecast: '4.50%',
        previous: '4.50%',
      },
      {
        title: 'Non-Farm Payrolls',
        country: 'United States',
        currency: 'USD',
        daysFromNow: 5,
        impact: 'high' as const,
        forecast: '180K',
        previous: '216K',
      },
      {
        title: 'European Central Bank Interest Rate Decision',
        country: 'European Union',
        currency: 'EUR',
        daysFromNow: 7,
        impact: 'high' as const,
        forecast: '4.00%',
        previous: '4.00%',
      },
      {
        title: 'Consumer Price Index (CPI)',
        country: 'United States',
        currency: 'USD',
        daysFromNow: 3,
        impact: 'high' as const,
        forecast: '3.2%',
        previous: '3.1%',
      },
      {
        title: 'GDP Growth Rate',
        country: 'United Kingdom',
        currency: 'GBP',
        daysFromNow: 10,
        impact: 'high' as const,
        forecast: '0.2%',
        previous: '0.3%',
      },
      {
        title: 'Unemployment Rate',
        country: 'United States',
        currency: 'USD',
        daysFromNow: 4,
        impact: 'medium' as const,
        forecast: '3.7%',
        previous: '3.7%',
      },
      {
        title: 'Retail Sales',
        country: 'United States',
        currency: 'USD',
        daysFromNow: 6,
        impact: 'medium' as const,
        forecast: '0.4%',
        previous: '0.3%',
      },
      {
        title: 'Manufacturing PMI',
        country: 'European Union',
        currency: 'EUR',
        daysFromNow: 1,
        impact: 'medium' as const,
        forecast: '47.5',
        previous: '47.1',
      },
      {
        title: 'Consumer Confidence Index',
        country: 'United States',
        currency: 'USD',
        daysFromNow: 8,
        impact: 'low' as const,
        forecast: '102.5',
        previous: '102.0',
      },
      {
        title: 'Trade Balance',
        country: 'China',
        currency: 'CNY',
        daysFromNow: 9,
        impact: 'medium' as const,
        forecast: '$78.5B',
        previous: '$75.3B',
      },
      {
        title: 'Bank of Japan Interest Rate Decision',
        country: 'Japan',
        currency: 'JPY',
        daysFromNow: 12,
        impact: 'high' as const,
        forecast: '-0.10%',
        previous: '-0.10%',
      },
      {
        title: 'Bitcoin ETF Approval Hearing',
        country: 'United States',
        currency: 'BTC',
        daysFromNow: 0,
        impact: 'high' as const,
        forecast: 'Pending',
        previous: 'Delayed',
      },
    ];

    majorEvents.forEach((event, index) => {
      const eventDate = new Date(today);
      eventDate.setDate(today.getDate() + event.daysFromNow);
      eventDate.setHours(14, 30, 0, 0);

      events.push({
        id: `event-${index}`,
        title: event.title,
        country: event.country,
        currency: event.currency,
        date: eventDate.toISOString(),
        impact: event.impact,
        forecast: event.forecast,
        previous: event.previous,
        actual: event.daysFromNow === 0 ? undefined : undefined,
      });
    });

    events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return new Response(JSON.stringify({ events }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
      status: 200,
    });
  } catch (error) {
    console.error('Error fetching economic calendar:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to fetch economic calendar',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 500,
      }
    );
  }
});
