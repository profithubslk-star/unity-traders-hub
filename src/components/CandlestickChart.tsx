import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, CandlestickSeries, type IChartApi, type ISeriesApi, type CandlestickData, type ISeriesApi as LineSeries } from 'lightweight-charts';
import { ZoomIn, ZoomOut, Maximize2, ChevronDown } from 'lucide-react';

interface SignalLevels {
  signalId: string;
  market: string;
  entryPrice: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  takeProfit3: number;
  signalType: 'buy' | 'sell';
}

interface CandlestickChartProps {
  symbol?: string;
  signalLevels?: SignalLevels | null;
}

const timeframeMap: Record<string, string> = {
  '1m': '1m',
  '5m': '5m',
  '15m': '15m',
  '30m': '30m',
  '1h': '1h',
  '4h': '4h',
  '1D': '1d',
  '1W': '1w',
};

interface MarketPair {
  symbol: string;
  name: string;
}

interface MarketCategory {
  name: string;
  pairs: MarketPair[];
}

const marketCategories: Record<string, MarketCategory> = {
  crypto: {
    name: 'Cryptocurrencies',
    pairs: [
      { symbol: 'BTCUSDT', name: 'BTC/USD' },
      { symbol: 'ETHUSDT', name: 'ETH/USD' },
      { symbol: 'SOLUSDT', name: 'SOL/USD' },
      { symbol: 'BNBUSDT', name: 'BNB/USD' },
      { symbol: 'XRPUSDT', name: 'XRP/USD' },
    ],
  },
  forex: {
    name: 'Forex',
    pairs: [
      { symbol: 'EURUSDT', name: 'EUR/USD' },
      { symbol: 'GBPUSDT', name: 'GBP/USD' },
      { symbol: 'AUDUSDT', name: 'AUD/USD' },
      { symbol: 'USDCUSDT', name: 'USD/JPY' },
      { symbol: 'TUSDUSDT', name: 'USD/CHF' },
    ],
  },
  stocks: {
    name: 'Stocks',
    pairs: [
      { symbol: 'AAVEUSDT', name: 'AAPL' },
      { symbol: 'SOLUSDT', name: 'TSLA' },
      { symbol: 'MATICUSDT', name: 'MSFT' },
      { symbol: 'AVAXUSDT', name: 'NVDA' },
      { symbol: 'UNIUSDT', name: 'AMZN' },
    ],
  },
  commodities: {
    name: 'Commodities',
    pairs: [
      { symbol: 'PAXGUSDT', name: 'XAU/USD (Gold)' },
      { symbol: 'ETHUSDT', name: 'WTI (Crude Oil)' },
      { symbol: 'LTCUSDT', name: 'XAG/USD (Silver)' },
      { symbol: 'BNBUSDT', name: 'Natural Gas' },
      { symbol: 'ADAUSDT', name: 'Brent Oil' },
    ],
  },
};

export function CandlestickChart({ symbol = 'BTCUSDT', signalLevels }: CandlestickChartProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('crypto');
  const [selectedSymbol, setSelectedSymbol] = useState<string>(symbol);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const priceLineRefsRef = useRef<any[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const tickerWsRef = useRef<WebSocket | null>(null);
  const firstPriceRef = useRef<number>(0);
  const currentCandleRef = useRef<{ time: number; open: number; high: number; low: number } | null>(null);
  const [currentPrice, setCurrentPrice] = useState<string>('');
  const [priceChange, setPriceChange] = useState<number>(0);
  const [timeframe, setTimeframe] = useState<string>('15m');

  const getSymbolCategory = (symbolToCheck: string): string => {
    const cryptoSymbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT'];
    const forexSymbols = ['EURUSDT', 'GBPUSDT', 'AUDUSDT', 'USDCUSDT', 'TUSDUSDT'];
    const stockSymbols = ['AAVEUSDT', 'MATICUSDT', 'AVAXUSDT', 'UNIUSDT'];
    const commoditySymbols = ['PAXGUSDT', 'LTCUSDT', 'ADAUSDT'];

    if (cryptoSymbols.includes(symbolToCheck)) return 'crypto';
    if (forexSymbols.includes(symbolToCheck)) return 'forex';
    if (stockSymbols.includes(symbolToCheck)) return 'stocks';
    if (commoditySymbols.includes(symbolToCheck)) return 'commodities';
    return 'crypto';
  };

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0F172A' },
        textColor: '#9CA3AF',
      },
      grid: {
        vertLines: { color: '#1E293B' },
        horzLines: { color: '#1E293B' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 500,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: '#1E293B',
      },
      rightPriceScale: {
        borderColor: '#1E293B',
        visible: true,
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      leftPriceScale: {
        visible: false,
      },
      watermark: {
        visible: false,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    });

    const currentCategory = getSymbolCategory(selectedSymbol);
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10B981',
      downColor: '#EF4444',
      borderUpColor: '#10B981',
      borderDownColor: '#EF4444',
      wickUpColor: '#10B981',
      wickDownColor: '#EF4444',
      priceFormat: {
        type: 'price',
        precision: currentCategory === 'forex' ? 5 : 2,
        minMove: currentCategory === 'forex' ? 0.00001 : 0.01,
      },
    });

    chartRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    fetchHistoricalData(selectedSymbol, timeframe, candlestickSeries);

    const category = getSymbolCategory(selectedSymbol);
    if (category === 'crypto') {
      connectTickerWebSocket(selectedSymbol);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (tickerWsRef.current) {
        tickerWsRef.current.close();
      }
    };
  }, [selectedSymbol, timeframe]);

  useEffect(() => {
    if (!candlestickSeriesRef.current) return;

    priceLineRefsRef.current.forEach((line) => {
      if (line && candlestickSeriesRef.current) {
        candlestickSeriesRef.current.removePriceLine(line);
      }
    });
    priceLineRefsRef.current = [];

    if (signalLevels && signalLevels.market === selectedSymbol) {
      const entryLine = candlestickSeriesRef.current.createPriceLine({
        price: signalLevels.entryPrice,
        color: '#06B6D4',
        lineWidth: 2,
        lineStyle: 2,
        axisLabelVisible: true,
        title: 'Entry',
      });
      priceLineRefsRef.current.push(entryLine);

      const slLine = candlestickSeriesRef.current.createPriceLine({
        price: signalLevels.stopLoss,
        color: '#EF4444',
        lineWidth: 2,
        lineStyle: 0,
        axisLabelVisible: true,
        title: 'SL',
      });
      priceLineRefsRef.current.push(slLine);

      const tp1Line = candlestickSeriesRef.current.createPriceLine({
        price: signalLevels.takeProfit1,
        color: '#10B981',
        lineWidth: 2,
        lineStyle: 2,
        axisLabelVisible: true,
        title: 'TP1',
      });
      priceLineRefsRef.current.push(tp1Line);

      const tp2Line = candlestickSeriesRef.current.createPriceLine({
        price: signalLevels.takeProfit2,
        color: '#10B981',
        lineWidth: 2,
        lineStyle: 2,
        axisLabelVisible: true,
        title: 'TP2',
      });
      priceLineRefsRef.current.push(tp2Line);

      const tp3Line = candlestickSeriesRef.current.createPriceLine({
        price: signalLevels.takeProfit3,
        color: '#F59E0B',
        lineWidth: 2,
        lineStyle: 2,
        axisLabelVisible: true,
        title: 'TP3',
      });
      priceLineRefsRef.current.push(tp3Line);
    }
  }, [signalLevels, selectedSymbol, timeframe]);

  const fetchHistoricalData = async (
    symbol: string,
    timeframe: string,
    candlestickSeries: ISeriesApi<'Candlestick'>
  ) => {
    try {
      setCurrentPrice('Loading...');
      setPriceChange(0);
      firstPriceRef.current = 0;
      currentCandleRef.current = null;

      const category = getSymbolCategory(symbol);
      let formattedData: CandlestickData[] = [];

      if (category === 'crypto') {
        const interval = timeframeMap[timeframe];
        const response = await fetch(
          `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=500`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch data for ${symbol}`);
        }

        const data = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
          throw new Error(`No data available for ${symbol}`);
        }

        formattedData = data.map((d: any) => ({
          time: Math.floor(d[0] / 1000) as any,
          open: parseFloat(d[1]),
          high: parseFloat(d[2]),
          low: parseFloat(d[3]),
          close: parseFloat(d[4]),
        }));
      } else {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        let edgeFunctionUrl = '';

        if (category === 'stocks') {
          edgeFunctionUrl = `${supabaseUrl}/functions/v1/fetch-stock-prices?symbol=${symbol}&interval=${timeframe}`;
        } else if (category === 'forex') {
          edgeFunctionUrl = `${supabaseUrl}/functions/v1/fetch-forex-prices?symbol=${symbol}`;
        } else if (category === 'commodities') {
          edgeFunctionUrl = `${supabaseUrl}/functions/v1/fetch-commodity-prices?symbol=${symbol}`;
        }

        const response = await fetch(edgeFunctionUrl, {
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Edge function error for ${category}:`, errorText);
          throw new Error(`Failed to fetch ${category} data: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success || !data.candles) {
          console.error(`Invalid data from ${category} API:`, data);
          throw new Error(`Failed to fetch ${category} data for ${symbol}`);
        }

        formattedData = data.candles.map((d: any) => ({
          time: d.time as any,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
        }));
      }

      candlestickSeries.setData(formattedData);

      if (formattedData.length > 0) {
        const lastCandle = formattedData[formattedData.length - 1];
        const firstCandle = formattedData[0];
        firstPriceRef.current = firstCandle.open;
        const decimals = lastCandle.close < 10 ? 4 : lastCandle.close < 100 ? 3 : 2;

        candlestickSeries.applyOptions({
          priceFormat: {
            type: 'price',
            precision: decimals,
            minMove: 1 / Math.pow(10, decimals),
          },
        });

        setCurrentPrice(lastCandle.close.toFixed(decimals));
        const change = ((lastCandle.close - firstCandle.open) / firstCandle.open) * 100;
        setPriceChange(change);

        if (chartRef.current) {
          chartRef.current.timeScale().fitContent();
        }
      }

      if (category === 'crypto') {
        connectWebSocket(symbol, timeframe, candlestickSeries);
      }
    } catch (error) {
      console.error('Error fetching historical data:', error);
      setCurrentPrice('Error');
      setPriceChange(0);
    }
  };

  const connectWebSocket = (
    symbol: string,
    timeframe: string,
    candlestickSeries: ISeriesApi<'Candlestick'>
  ) => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    try {
      const interval = timeframeMap[timeframe];
      const ws = new WebSocket(
        `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${interval}`
      );

      ws.onopen = () => {
        console.log(`WebSocket connected for ${symbol}`);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          const candle = message.k;

          const candleData: CandlestickData = {
            time: Math.floor(candle.t / 1000) as any,
            open: parseFloat(candle.o),
            high: parseFloat(candle.h),
            low: parseFloat(candle.l),
            close: parseFloat(candle.c),
          };

          currentCandleRef.current = {
            time: Math.floor(candle.t / 1000),
            open: parseFloat(candle.o),
            high: parseFloat(candle.h),
            low: parseFloat(candle.l),
          };

          candlestickSeries.update(candleData);
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error(`WebSocket error for ${symbol}:`, error);
      };

      ws.onclose = () => {
        console.log(`WebSocket closed for ${symbol}`);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
    }
  };

  const connectTickerWebSocket = (symbol: string) => {
    if (tickerWsRef.current) {
      tickerWsRef.current.close();
      tickerWsRef.current = null;
    }

    try {
      const ws = new WebSocket(
        `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@aggTrade`
      );

      ws.onopen = () => {
        console.log(`Ticker WebSocket connected for ${symbol}`);
      };

      ws.onmessage = (event) => {
        try {
          const trade = JSON.parse(event.data);
          const price = parseFloat(trade.p);

          const decimals = price < 10 ? 4 : price < 100 ? 3 : 2;
          setCurrentPrice(price.toFixed(decimals));

          if (firstPriceRef.current > 0) {
            const change = ((price - firstPriceRef.current) / firstPriceRef.current) * 100;
            setPriceChange(change);
          }

          if (candlestickSeriesRef.current && currentCandleRef.current) {
            const newHigh = Math.max(currentCandleRef.current.high, price);
            const newLow = Math.min(currentCandleRef.current.low, price);

            candlestickSeriesRef.current.update({
              time: currentCandleRef.current.time as any,
              open: currentCandleRef.current.open,
              high: newHigh,
              low: newLow,
              close: price,
            });

            currentCandleRef.current.high = newHigh;
            currentCandleRef.current.low = newLow;
          }
        } catch (error) {
          console.error('Error processing ticker message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error(`Ticker WebSocket error for ${symbol}:`, error);
      };

      ws.onclose = () => {
        console.log(`Ticker WebSocket closed for ${symbol}`);
      };

      tickerWsRef.current = ws;
    } catch (error) {
      console.error('Error creating ticker WebSocket connection:', error);
    }
  };

  const handleZoomIn = () => {
    if (chartRef.current) {
      const timeScale = chartRef.current.timeScale();
      const visibleRange = timeScale.getVisibleRange();
      if (visibleRange) {
        const middle = (visibleRange.from + visibleRange.to) / 2;
        const newRange = (visibleRange.to - visibleRange.from) * 0.7;
        timeScale.setVisibleRange({
          from: (middle - newRange / 2) as any,
          to: (middle + newRange / 2) as any,
        });
      }
    }
  };

  const handleZoomOut = () => {
    if (chartRef.current) {
      const timeScale = chartRef.current.timeScale();
      const visibleRange = timeScale.getVisibleRange();
      if (visibleRange) {
        const middle = (visibleRange.from + visibleRange.to) / 2;
        const newRange = (visibleRange.to - visibleRange.from) * 1.3;
        timeScale.setVisibleRange({
          from: (middle - newRange / 2) as any,
          to: (middle + newRange / 2) as any,
        });
      }
    }
  };

  const handleResetZoom = () => {
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  };

  const timeframes = ['1m', '5m', '15m', '30m', '1h', '4h', '1D', '1W'];

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    const firstPair = marketCategories[category].pairs[0];
    setSelectedSymbol(firstPair.symbol);
  };

  const handleSymbolChange = (symbol: string) => {
    setSelectedSymbol(symbol);
  };

  const currentPair = marketCategories[selectedCategory].pairs.find(
    (p) => p.symbol === selectedSymbol
  ) || marketCategories[selectedCategory].pairs[0];

  return (
    <div className="bg-[#1a2332] rounded-2xl border border-slate-700/50 overflow-hidden shadow-2xl">
      <div className="p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-2xl font-bold text-white mb-1">{currentPair.name}</h3>
            <p className="text-sm text-slate-400">Live Market Chart</p>
          </div>
          {currentPrice && (
            <div className="text-right">
              <div className="text-3xl font-bold text-white mb-0.5">${currentPrice}</div>
              <div
                className={`text-sm font-semibold ${
                  priceChange >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {priceChange >= 0 ? '+' : ''}
                {priceChange.toFixed(2)}%
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <span className="text-sm text-slate-400 font-medium">Category:</span>
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="appearance-none bg-[#0f1419] text-white text-sm px-4 py-2.5 pr-10 rounded-lg border border-slate-600/40 hover:border-slate-500/60 focus:border-[#D4AF37]/50 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 cursor-pointer transition-all duration-200"
                >
                  {Object.entries(marketCategories).map(([key, category]) => (
                    <option key={key} value={key}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="text-sm text-slate-400 font-medium">Pair:</span>
              <div className="relative">
                <select
                  value={selectedSymbol}
                  onChange={(e) => handleSymbolChange(e.target.value)}
                  className="appearance-none bg-[#0f1419] text-white text-sm px-4 py-2.5 pr-10 rounded-lg border border-slate-600/40 hover:border-slate-500/60 focus:border-[#D4AF37]/50 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 cursor-pointer transition-all duration-200"
                >
                  {marketCategories[selectedCategory].pairs.map((pair) => (
                    <option key={pair.symbol} value={pair.symbol}>
                      {pair.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {timeframes.map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  timeframe === tf
                    ? 'bg-[#D4AF37] text-slate-900 shadow-lg shadow-[#D4AF37]/20'
                    : 'bg-[#0f1419] text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleZoomOut}
              className="p-2.5 rounded-lg bg-[#0f1419] text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-200"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomIn}
              className="p-2.5 rounded-lg bg-[#0f1419] text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-200"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-2.5 rounded-lg bg-[#0f1419] text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-200"
              title="Reset Zoom"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      <div className="relative">
        <div
          ref={chartContainerRef}
          className="relative"
          style={{
            overflow: 'hidden'
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="text-center">
            <h2 className="text-5xl font-bold text-white/20 mb-2 tracking-wider" style={{ textShadow: '0 0 20px rgba(0,0,0,0.5)' }}>
              UNITY TRADERS
            </h2>
            <p className="text-lg text-white/15 tracking-wide" style={{ textShadow: '0 0 10px rgba(0,0,0,0.5)' }}>
              Powered by Profithub Academy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
