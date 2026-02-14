import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const symbol = url.searchParams.get("symbol") || "EURUSDT";

    const forexNameMap: Record<string, string> = {
      'EURUSDT': 'EUR/USD',
      'GBPUSDT': 'GBP/USD',
      'AUDUSDT': 'AUD/USD',
      'USDCUSDT': 'USD/JPY',
      'TUSDUSDT': 'USD/CHF',
    };

    const displayName = forexNameMap[symbol] || symbol;

    const binanceKlineUrl = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1d&limit=30`;

    const response = await fetch(binanceKlineUrl);

    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("No forex data available");
    }

    const candles: CandleData[] = data.map((kline: any) => ({
      time: Math.floor(kline[0] / 1000),
      open: parseFloat(kline[1]),
      high: parseFloat(kline[2]),
      low: parseFloat(kline[3]),
      close: parseFloat(kline[4]),
    }));

    const currentPrice = candles[candles.length - 1]?.close || 0;

    return new Response(
      JSON.stringify({
        success: true,
        symbol: displayName,
        currentPrice,
        candles,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching forex data:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
