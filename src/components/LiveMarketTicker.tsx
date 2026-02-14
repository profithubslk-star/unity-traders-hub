import { useEffect, useState, useRef } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface TickerData {
  symbol: string;
  price: string;
  change: number;
  changePercent: number;
}

interface DailyStats {
  openPrice: number;
  changePercent: number;
}

const TRADING_PAIRS = [
  { symbol: 'BTCUSDT', label: 'BTC/USD' },
  { symbol: 'PAXGUSDT', label: 'XAU/USD' },
  { symbol: 'EURUSDT', label: 'EUR/USD' },
  { symbol: 'ETHUSDT', label: 'ETH/USD' },
  { symbol: 'LTCUSDT', label: 'XAG/USD' },
  { symbol: 'GBPUSDT', label: 'GBP/USD' },
];

const getPriceDecimals = (symbol: string): number => {
  if (symbol.includes('BTC')) return 2;
  if (symbol.includes('ETH')) return 2;
  if (symbol.includes('PAX')) return 2;
  if (symbol.includes('LTC')) return 2;
  if (symbol.includes('EUR')) return 4;
  if (symbol.includes('GBP')) return 4;
  return 2;
};

export function LiveMarketTicker() {
  const [tickers, setTickers] = useState<Record<string, TickerData>>({});
  const [flashingSymbols, setFlashingSymbols] = useState<Record<string, boolean>>({});
  const wsRef = useRef<WebSocket | null>(null);
  const dailyStatsRef = useRef<Record<string, DailyStats>>({});
  const flashTimeouts = useRef<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    fetchDailyStats();
    connectWebSocket();

    const statsInterval = setInterval(fetchDailyStats, 60000);

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      clearInterval(statsInterval);
      Object.values(flashTimeouts.current).forEach(clearTimeout);
    };
  }, []);

  const fetchDailyStats = async () => {
    try {
      const response = await fetch('https://api.binance.com/api/v3/ticker/24hr');
      const data = await response.json();

      const stats: Record<string, DailyStats> = {};
      const pairSymbols = TRADING_PAIRS.map(p => p.symbol);
      data.forEach((ticker: any) => {
        if (pairSymbols.includes(ticker.symbol)) {
          stats[ticker.symbol] = {
            openPrice: parseFloat(ticker.openPrice),
            changePercent: parseFloat(ticker.priceChangePercent),
          };
        }
      });

      dailyStatsRef.current = stats;
    } catch (error) {
      console.error('Failed to fetch 24h stats:', error);
    }
  };

  const connectWebSocket = () => {
    const streams = TRADING_PAIRS.map(
      (pair) => `${pair.symbol.toLowerCase()}@bookTicker`
    ).join('/');

    const ws = new WebSocket(
      `wss://stream.binance.com:9443/stream?streams=${streams}`
    );

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      const data = message.data;

      if (data && data.b) {
        const symbol = data.s;
        const bestBidPrice = parseFloat(data.b);
        const decimals = getPriceDecimals(symbol);
        const stats = dailyStatsRef.current[symbol];

        if (stats) {
          const change = bestBidPrice - stats.openPrice;

          setTickers((prev) => ({
            ...prev,
            [symbol]: {
              symbol: symbol,
              price: bestBidPrice.toFixed(decimals),
              change: change,
              changePercent: stats.changePercent,
            },
          }));

          if (flashTimeouts.current[symbol]) {
            clearTimeout(flashTimeouts.current[symbol]);
          }

          setFlashingSymbols((prev) => ({
            ...prev,
            [symbol]: true,
          }));

          flashTimeouts.current[symbol] = setTimeout(() => {
            setFlashingSymbols((prev) => ({
              ...prev,
              [symbol]: false,
            }));
          }, 150);
        }
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket closed, reconnecting...');
      setTimeout(() => connectWebSocket(), 3000);
    };

    wsRef.current = ws;
  };

  return (
    <div className="bg-[#1E293B] rounded-xl p-6 border border-[#D4AF37]/20">
      <h2 className="text-xl font-bold text-white mb-4">Live Market Prices</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {TRADING_PAIRS.map((pair) => {
          const ticker = tickers[pair.symbol];
          if (!ticker) {
            return (
              <div
                key={pair.symbol}
                className="bg-[#0F172A] rounded-lg p-4 border border-gray-800"
              >
                <div className="text-gray-400 text-sm font-semibold mb-2">
                  {pair.label}
                </div>
                <div className="text-white text-xl font-bold">Loading...</div>
              </div>
            );
          }

          const isPositive = ticker.changePercent >= 0;

          const isFlashing = flashingSymbols[pair.symbol];

          return (
            <div
              key={pair.symbol}
              className={`bg-[#0F172A] rounded-lg p-4 border transition-colors duration-150 ${
                isFlashing ? 'border-[#D4AF37] shadow-lg shadow-[#D4AF37]/20' : 'border-gray-800 hover:border-[#D4AF37]/30'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-gray-400 text-sm font-semibold">
                  {pair.label}
                </div>
                {isPositive ? (
                  <TrendingUp className="w-4 h-4 text-[#10B981]" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-[#EF4444]" />
                )}
              </div>
              <div className={`text-white text-2xl font-bold mb-1 transition-transform duration-150 ${
                isFlashing ? 'scale-105' : ''
              }`}>
                ${ticker.price}
              </div>
              <div
                className={`text-sm font-semibold ${
                  isPositive ? 'text-[#10B981]' : 'text-[#EF4444]'
                }`}
              >
                {isPositive ? '+' : ''}
                {ticker.changePercent.toFixed(2)}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
