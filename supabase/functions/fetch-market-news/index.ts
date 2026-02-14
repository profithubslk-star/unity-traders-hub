import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface NewsItem {
  id: string;
  title: string;
  body: string;
  url: string;
  source: string;
  published_on: number;
  imageurl: string;
  tags: string;
  categories: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const newsResponse = await fetch(
      'https://min-api.cryptocompare.com/data/v2/news/?lang=EN&sortOrder=latest',
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!newsResponse.ok) {
      throw new Error(`Failed to fetch news: ${newsResponse.statusText}`);
    }

    const newsData = await newsResponse.json();

    const relevantNews = newsData.Data.filter((item: NewsItem) => isRelevantNews(item));

    const formattedNews = relevantNews.slice(0, 20).map((item: NewsItem) => ({
      id: item.id,
      title: item.title,
      description: item.body.substring(0, 200) + '...',
      url: item.url,
      source: item.source,
      published_at: new Date(item.published_on * 1000).toISOString(),
      impact_level: determineImpact(item.title, item.tags, item.categories),
    }));

    return new Response(JSON.stringify({ news: formattedNews }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
      status: 200,
    });
  } catch (error) {
    console.error('Error fetching market news:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to fetch market news',
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

function isRelevantNews(item: NewsItem): boolean {
  const titleLower = item.title.toLowerCase();
  const bodyLower = item.body.toLowerCase();
  const tagsLower = item.tags.toLowerCase();
  const categoriesLower = item.categories.toLowerCase();

  const tradingKeywords = [
    'bitcoin', 'btc', 'btcusd', 'ethereum', 'eth', 'crypto', 'cryptocurrency',
    'forex', 'trading', 'price', 'market', 'exchange', 'coin',
    'usd', 'eur', 'gbp', 'jpy', 'aud', 'cad', 'chf', 'nzd',
    'usdt', 'bnb', 'sol', 'xrp', 'ada', 'doge', 'dot', 'matic',
    'gold', 'xau', 'xauusd', 'silver', 'xag', 'xagusd',
    'oil', 'crude', 'wti', 'brent',
    'indices', 'index', 'dxy', 'dollar index',
    'sp500', 's&p 500', 'nasdaq', 'dow jones', 'ftse', 'dax', 'nikkei',
    'technical analysis', 'chart', 'support', 'resistance',
    'bull', 'bear', 'trend', 'volatility', 'volume',
    'fed', 'central bank', 'interest rate', 'inflation',
    'regulation', 'sec', 'cftc', 'financial',
    'binance', 'coinbase', 'kraken', 'ftx', 'okx',
    'defi', 'blockchain', 'altcoin', 'token',
    'pair', 'currency', 'fiat', 'asset', 'commodity'
  ];

  const combinedText = `${titleLower} ${bodyLower} ${tagsLower} ${categoriesLower}`;

  return tradingKeywords.some(keyword => combinedText.includes(keyword));
}

function determineImpact(title: string, tags: string, categories: string): string {
  const titleLower = title.toLowerCase();
  const tagsLower = tags.toLowerCase();
  const categoriesLower = categories.toLowerCase();

  const highImpactKeywords = [
    'regulation', 'sec', 'ban', 'hack', 'crash', 'surge',
    'bitcoin', 'ethereum', 'federal', 'government', 'law',
    'interest rate', 'fed', 'central bank', 'inflation'
  ];

  const mediumImpactKeywords = [
    'partnership', 'adoption', 'upgrade', 'integration',
    'announcement', 'launch', 'update', 'listing'
  ];

  for (const keyword of highImpactKeywords) {
    if (titleLower.includes(keyword) || tagsLower.includes(keyword) || categoriesLower.includes(keyword)) {
      return 'high';
    }
  }

  for (const keyword of mediumImpactKeywords) {
    if (titleLower.includes(keyword) || tagsLower.includes(keyword) || categoriesLower.includes(keyword)) {
      return 'medium';
    }
  }

  return 'low';
}
