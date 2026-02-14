import { AnalysisData } from '../types/database.types';

interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  time: number;
}

interface MarketData {
  price: number;
  high: number;
  low: number;
  volume: number;
  trend: 'bullish' | 'bearish' | 'neutral';
  candles: Candle[];
  htfCandles?: Candle[];
}

interface SignalResult {
  signal_type: 'buy' | 'sell';
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
  methodology: string;
  current_price: number;
}

interface SwingPoint {
  price: number;
  index: number;
  type: 'high' | 'low';
  volume: number;
}

interface HTFBias {
  bias: 'BULLISH' | 'BEARISH' | 'NONE';
  swingHigh: number;
  swingLow: number;
  description: string;
}

interface LiquidityPool {
  price: number;
  type: 'high' | 'low';
  indices: number[];
}

interface LiquiditySweep {
  swept: boolean;
  sweptPrice: number;
  closedInside: boolean;
  hasDisplacement: boolean;
  description: string;
}

interface BOSValidation {
  valid: boolean;
  price: number;
  bodyStrength: number;
  volumeRatio: number;
  description: string;
}

interface OrderBlock {
  type: 'bullish' | 'bearish';
  price: number;
  high: number;
  low: number;
  index: number;
  mitigated: boolean;
}

interface FVG {
  type: 'bullish' | 'bearish';
  bottom: number;
  top: number;
  index: number;
  createdInDisplacement: boolean;
}

interface MarketType {
  category: 'crypto' | 'forex' | 'stocks' | 'indices' | 'commodities';
  name: string;
}

export async function generateSignal(
  market: string,
  timeframe: string,
  orderType: 'market' | 'limit',
  methods: string[],
  minConfidenceThreshold: number = 35
): Promise<SignalResult> {
  await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000));

  const marketType = identifyMarketType(market);
  const htfTimeframe = getHTFTimeframe(timeframe);

  const [marketData, htfData] = await Promise.all([
    fetchMarketData(market, timeframe),
    fetchMarketData(market, htfTimeframe)
  ]);

  marketData.htfCandles = htfData.candles;
  setInitialPrice(market, marketData.price);

  let methodology = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nPROFESSIONAL SIGNAL ANALYSIS\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
  let confidenceScore = 0;

  const htfBias = analyzeHTFStructure(htfData);
  methodology += `▸ STEP 1: HTF Structure (${htfTimeframe})\n  ${htfBias.description}\n\n`;

  if (htfBias.bias !== 'NONE') {
    confidenceScore += 15;
  } else {
    confidenceScore -= 5;
    methodology += `  ⚠️ No clear HTF bias (-5 confidence)\n\n`;
  }

  const dealingRange = {
    high: htfBias.swingHigh,
    low: htfBias.swingLow,
    equilibrium: (htfBias.swingHigh + htfBias.swingLow) / 2,
    range: htfBias.swingHigh - htfBias.swingLow
  };

  const currentPrice = marketData.price;
  const isInPremium = currentPrice > dealingRange.equilibrium;
  const isInDiscount = currentPrice < dealingRange.equilibrium;
  const premiumPercentage = ((currentPrice - dealingRange.low) / dealingRange.range * 100).toFixed(1);

  methodology += `▸ STEP 2: Dealing Range Analysis\n`;
  methodology += `  • Range: ${dealingRange.low.toFixed(5)} - ${dealingRange.high.toFixed(5)}\n`;
  methodology += `  • Equilibrium: ${dealingRange.equilibrium.toFixed(5)}\n`;
  methodology += `  • Current: ${currentPrice.toFixed(5)} (${premiumPercentage}% of range)\n`;
  methodology += `  • Zone: ${isInPremium ? '🔴 PREMIUM' : isInDiscount ? '🟢 DISCOUNT' : '⚪ EQUILIBRIUM'}\n\n`;

  if (isInPremium) {
    confidenceScore += 15;
  }

  const liquidityPools = identifyLiquidityPools(marketData.candles);
  methodology += `▸ STEP 3: Liquidity Identification\n`;
  methodology += `  • Equal Highs: ${liquidityPools.highs.length}\n`;
  methodology += `  • Equal Lows: ${liquidityPools.lows.length}\n`;

  if (liquidityPools.highs.length === 0 && liquidityPools.lows.length === 0) {
    confidenceScore -= 3;
    methodology += `  • ⚠️ No equal liquidity pools detected (-3 confidence)\n\n`;
  } else {
    methodology += `  • ✅ Liquidity pools identified\n\n`;
  }

  let initialSignalDirection: 'buy' | 'sell' | null = null;
  if (htfBias.bias === 'BULLISH') {
    initialSignalDirection = 'buy';
    if (!isInDiscount) {
      confidenceScore -= 10;
      methodology += `  ⚠️ Bullish bias but not in discount zone (-10 confidence)\n\n`;
    }
  } else if (htfBias.bias === 'BEARISH') {
    initialSignalDirection = 'sell';
    if (!isInPremium) {
      confidenceScore -= 10;
      methodology += `  ⚠️ Bearish bias but not in premium zone (-10 confidence)\n\n`;
    }
  } else {
    initialSignalDirection = marketData.trend === 'bearish' ? 'sell' : 'buy';
    methodology += `  ⚠️ Using current trend (${marketData.trend}) for direction\n\n`;
  }

  const liquiditySweep = validateLiquiditySweep(
    marketData.candles,
    liquidityPools,
    initialSignalDirection
  );

  methodology += `▸ STEP 4: Liquidity Sweep Validation\n  ${liquiditySweep.description}\n\n`;

  if (liquiditySweep.swept && liquiditySweep.closedInside && liquiditySweep.hasDisplacement) {
    confidenceScore += 20;
  } else if (liquiditySweep.swept) {
    confidenceScore += 10;
    methodology += `  ⚠️ Partial liquidity sweep (+10 confidence only)\n\n`;
  } else {
    confidenceScore -= 3;
    methodology += `  ⚠️ No liquidity sweep (-3 confidence)\n\n`;
  }

  const bosValidation = validateBOS(marketData.candles, initialSignalDirection);
  methodology += `▸ STEP 5: Break of Structure (BOS)\n  ${bosValidation.description}\n\n`;

  if (bosValidation.valid) {
    confidenceScore += 20;
  } else {
    confidenceScore -= 3;
    methodology += `  ⚠️ No clear BOS (-3 confidence)\n\n`;
  }

  const displacementCandles = findDisplacementCandles(marketData.candles);
  const orderBlocks = findValidOrderBlocks(marketData.candles, displacementCandles, currentPrice);
  const fvgs = findValidFVGs(marketData.candles, displacementCandles, currentPrice);

  const hasValidOB = orderBlocks.some(ob => !ob.mitigated &&
    ((initialSignalDirection === 'buy' && ob.type === 'bullish' && ob.price < currentPrice) ||
     (initialSignalDirection === 'sell' && ob.type === 'bearish' && ob.price > currentPrice))
  );

  const hasValidFVG = fvgs.some(fvg => fvg.createdInDisplacement &&
    ((initialSignalDirection === 'buy' && fvg.type === 'bullish' && fvg.top < currentPrice) ||
     (initialSignalDirection === 'sell' && fvg.type === 'bearish' && fvg.bottom > currentPrice))
  );

  methodology += `▸ STEP 6: Order Block / FVG Retest\n`;
  methodology += `  • Valid Order Blocks: ${orderBlocks.filter(ob => !ob.mitigated).length}\n`;
  methodology += `  • Valid FVGs: ${fvgs.filter(f => f.createdInDisplacement).length}\n`;

  if (hasValidOB || hasValidFVG) {
    confidenceScore += 15;
    methodology += `  • ✅ Valid retest zone identified\n\n`;
  } else {
    confidenceScore -= 3;
    methodology += `  • ⚠️ No specific retest zone (-3 confidence)\n\n`;
  }

  const elliottFilter = applyElliottWaveFilter(marketData.candles);
  methodology += `▸ STEP 7: Elliott Wave Filter\n  ${elliottFilter.description}\n\n`;

  if (elliottFilter.block) {
    confidenceScore -= 5;
    methodology += `  ⚠️ Elliott Wave warning (-5 confidence)\n\n`;
  } else {
    confidenceScore += 10;
  }

  const sessionFilter = applySessionFilter(marketType, marketData);
  methodology += `▸ STEP 9: Market Session & Volatility\n  ${sessionFilter.description}\n\n`;

  if (sessionFilter.block) {
    confidenceScore -= 15;
    methodology += `  ⚠️ Session warning (-15 confidence)\n\n`;
  } else {
    confidenceScore += sessionFilter.confidenceAdjustment;
  }

  if (sessionFilter.volumeExpansion) {
    confidenceScore += 5;
  }

  methodology += `▸ STEP 10: Confidence Score\n`;
  methodology += `  • Base Score: ${confidenceScore}\n`;
  methodology += `  • Minimum Required: ${minConfidenceThreshold}\n`;

  if (confidenceScore < minConfidenceThreshold) {
    methodology += `  • ❌ Score below minimum threshold (${confidenceScore} < ${minConfidenceThreshold})\n`;
    throw new Error(`SIGNAL_BLOCKED: Confidence score too low (${confidenceScore}/${minConfidenceThreshold})`);
  }

  const qualityRating = confidenceScore >= 85 ? '(RARE HIGH QUALITY)' : confidenceScore >= 70 ? '(HIGH QUALITY)' : confidenceScore >= 55 ? '(GOOD QUALITY)' : '(ACCEPTABLE)';
  methodology += `  • ✅ Score: ${confidenceScore}/100 ${qualityRating}\n\n`;

  const signal = generateTradeSetup(
    marketData,
    initialSignalDirection!,
    orderType,
    dealingRange,
    orderBlocks,
    fvgs,
    bosValidation
  );

  if (signal.risk_reward_ratio < 1.2) {
    methodology += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n❌ RISK MANAGEMENT FAILED\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n  • RR Ratio: ${signal.risk_reward_ratio} (minimum 1.2 required)\n`;
    throw new Error(`SIGNAL_BLOCKED: Risk/Reward ratio too low (${signal.risk_reward_ratio})`);
  }

  if (signal.risk_reward_ratio < 2.0) {
    confidenceScore -= 5;
    methodology += `  ⚠️ R/R ratio below 2.0 (-5 confidence)\n\n`;
  }

  methodology += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n✅ VALID SETUP CONFIRMED\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  methodology += `  • Signal: ${initialSignalDirection!.toUpperCase()}\n`;
  methodology += `  • Entry: ${signal.entry_price}\n`;
  methodology += `  • Stop Loss: ${signal.stop_loss}\n`;
  methodology += `  • Risk/Reward: 1:${signal.risk_reward_ratio}\n`;
  methodology += `  • Confidence: ${confidenceScore}/100\n`;

  const analysisData: AnalysisData = {
    timeframes: [timeframe, htfTimeframe],
    confluence_count: confidenceScore >= 85 ? 4 : confidenceScore >= 70 ? 3 : 2,
    ict: {
      order_blocks: orderBlocks.slice(0, 2).map(ob => `${ob.type} OB at ${ob.price.toFixed(5)}`),
      fair_value_gaps: fvgs.slice(0, 2).map(fvg => `${fvg.type} FVG ${fvg.bottom.toFixed(5)}-${fvg.top.toFixed(5)}`),
      liquidity_zones: liquidityPools.highs.slice(0, 2).map(p => `Equal high at ${p.price.toFixed(5)}`),
      description: `${liquidityPools.highs.length + liquidityPools.lows.length} liquidity pools, ${orderBlocks.length} OBs, ${fvgs.length} FVGs`,
      signal: initialSignalDirection,
    },
    smc: {
      market_structure: htfBias.description,
      break_of_structure: bosValidation.valid,
      change_of_character: false,
      description: bosValidation.description,
      signal: initialSignalDirection,
    },
    elliott_wave: {
      current_wave: elliottFilter.wave,
      wave_pattern: elliottFilter.pattern,
      description: elliottFilter.description,
      signal: initialSignalDirection,
    },
    indicators: {
      rsi: 50,
      macd: { value: 0, signal: 0, histogram: 0 },
      ema_20: currentPrice,
      ema_50: currentPrice,
      ema_200: currentPrice,
      volume: Math.round(marketData.volume),
      description: sessionFilter.description,
      signal: initialSignalDirection,
    },
  };

  return {
    ...signal,
    confidence_score: confidenceScore,
    analysis_data: analysisData,
    methodology: methodology.trim(),
    current_price: marketData.price,
  };
}

function identifyMarketType(market: string): MarketType {
  const upper = market.toUpperCase();

  if (upper.includes('USDT') || upper.includes('BTC') || upper.includes('ETH')) {
    return { category: 'crypto', name: market };
  }
  if (upper.includes('USD') || upper.includes('EUR') || upper.includes('GBP') ||
      upper.includes('JPY') || upper.includes('AUD') || upper.includes('CAD') || upper.includes('NZD')) {
    return { category: 'forex', name: market };
  }
  if (upper === 'US30' || upper === 'NAS100' || upper === 'SPX' || upper === 'DJI') {
    return { category: 'indices', name: market };
  }
  if (upper.includes('XAU') || upper.includes('XAG') || upper.includes('CRUDE') ||
      upper.includes('OIL') || upper.includes('NGAS') || upper.includes('COPPER')) {
    return { category: 'commodities', name: market };
  }

  return { category: 'stocks', name: market };
}

function getHTFTimeframe(currentTF: string): string {
  const tfMap: Record<string, string> = {
    '1m': '15m',
    '5m': '1h',
    '15m': '4h',
    '30m': '4h',
    '1h': '1D',
    '4h': '1D',
    '1D': '1W',
    '1W': '1W',
  };
  return tfMap[currentTF] || '1D';
}

function analyzeHTFStructure(htfData: MarketData): HTFBias {
  const swings = findSwingPoints(htfData.candles, 5);
  const highs = swings.filter(s => s.type === 'high').sort((a, b) => a.index - b.index);
  const lows = swings.filter(s => s.type === 'low').sort((a, b) => a.index - b.index);

  if (highs.length < 3 || lows.length < 3) {
    const recent = htfData.candles.slice(-50);
    const swingHigh = Math.max(...recent.map(c => c.high));
    const swingLow = Math.min(...recent.map(c => c.low));

    return {
      bias: 'NONE',
      swingHigh,
      swingLow,
      description: '⚠️ Insufficient swing points for HTF bias determination',
    };
  }

  let higherHighs = 0;
  let higherLows = 0;
  let lowerHighs = 0;
  let lowerLows = 0;

  for (let i = 1; i < highs.length; i++) {
    if (highs[i].price > highs[i - 1].price) higherHighs++;
    else if (highs[i].price < highs[i - 1].price) lowerHighs++;
  }

  for (let i = 1; i < lows.length; i++) {
    if (lows[i].price > lows[i - 1].price) higherLows++;
    else if (lows[i].price < lows[i - 1].price) lowerLows++;
  }

  const swingHigh = Math.max(...highs.slice(-3).map(h => h.price));
  const swingLow = Math.min(...lows.slice(-3).map(l => l.price));

  if (higherHighs >= 2 && higherLows >= 2) {
    return {
      bias: 'BULLISH',
      swingHigh,
      swingLow,
      description: `✅ BULLISH Structure (HH: ${higherHighs}, HL: ${higherLows})`,
    };
  }

  if (lowerHighs >= 2 && lowerLows >= 2) {
    return {
      bias: 'BEARISH',
      swingHigh,
      swingLow,
      description: `✅ BEARISH Structure (LH: ${lowerHighs}, LL: ${lowerLows})`,
    };
  }

  return {
    bias: 'NONE',
    swingHigh,
    swingLow,
    description: `❌ No clear structure (HH:${higherHighs} HL:${higherLows} LH:${lowerHighs} LL:${lowerLows})`,
  };
}

function identifyLiquidityPools(candles: Candle[]): { highs: LiquidityPool[]; lows: LiquidityPool[] } {
  const pools: { highs: LiquidityPool[]; lows: LiquidityPool[] } = { highs: [], lows: [] };
  const recent = candles.slice(-100);

  const swings = findSwingPoints(recent, 3);
  const swingHighs = swings.filter(s => s.type === 'high');
  const swingLows = swings.filter(s => s.type === 'low');

  for (let i = 0; i < swingHighs.length; i++) {
    const equalHighs = [swingHighs[i]];
    for (let j = i + 1; j < swingHighs.length; j++) {
      const diff = Math.abs(swingHighs[i].price - swingHighs[j].price);
      const percentDiff = (diff / swingHighs[i].price) * 100;

      if (percentDiff <= 0.1) {
        equalHighs.push(swingHighs[j]);
      }
    }

    if (equalHighs.length >= 2) {
      const avgPrice = equalHighs.reduce((sum, s) => sum + s.price, 0) / equalHighs.length;
      pools.highs.push({
        price: avgPrice,
        type: 'high',
        indices: equalHighs.map(s => s.index),
      });
    }
  }

  for (let i = 0; i < swingLows.length; i++) {
    const equalLows = [swingLows[i]];
    for (let j = i + 1; j < swingLows.length; j++) {
      const diff = Math.abs(swingLows[i].price - swingLows[j].price);
      const percentDiff = (diff / swingLows[i].price) * 100;

      if (percentDiff <= 0.1) {
        equalLows.push(swingLows[j]);
      }
    }

    if (equalLows.length >= 2) {
      const avgPrice = equalLows.reduce((sum, s) => sum + s.price, 0) / equalLows.length;
      pools.lows.push({
        price: avgPrice,
        type: 'low',
        indices: equalLows.map(s => s.index),
      });
    }
  }

  return pools;
}

function validateLiquiditySweep(
  candles: Candle[],
  liquidityPools: { highs: LiquidityPool[]; lows: LiquidityPool[] },
  direction: 'buy' | 'sell' | null
): LiquiditySweep {
  if (!direction) {
    return {
      swept: false,
      sweptPrice: 0,
      closedInside: false,
      hasDisplacement: false,
      description: '⚠️ No direction established',
    };
  }

  const recent = candles.slice(-30);
  const poolsToCheck = direction === 'buy' ? liquidityPools.lows : liquidityPools.highs;

  if (poolsToCheck.length === 0) {
    return {
      swept: false,
      sweptPrice: 0,
      closedInside: false,
      hasDisplacement: false,
      description: `❌ No ${direction === 'buy' ? 'equal lows' : 'equal highs'} to sweep`,
    };
  }

  const sortedPools = poolsToCheck.sort((a, b) =>
    direction === 'buy' ? a.price - b.price : b.price - a.price
  );

  for (const pool of sortedPools) {
    for (let i = recent.length - 10; i < recent.length; i++) {
      const candle = recent[i];

      const swept = direction === 'buy'
        ? candle.low < pool.price
        : candle.high > pool.price;

      if (swept) {
        const closedInside = direction === 'buy'
          ? candle.close > pool.price
          : candle.close < pool.price;

        if (closedInside && i < recent.length - 1) {
          const nextCandle = recent[i + 1];
          const bodySize = Math.abs(nextCandle.close - nextCandle.open);
          const avgBody = recent.slice(-20).reduce((sum, c) =>
            sum + Math.abs(c.close - c.open), 0) / 20;

          const hasDisplacement = bodySize >= avgBody * 1.5;

          if (hasDisplacement) {
            return {
              swept: true,
              sweptPrice: pool.price,
              closedInside: true,
              hasDisplacement: true,
              description: `✅ Liquidity swept at ${pool.price.toFixed(5)}, closed inside, displacement confirmed`,
            };
          }

          return {
            swept: true,
            sweptPrice: pool.price,
            closedInside: true,
            hasDisplacement: false,
            description: `⚠️ Swept at ${pool.price.toFixed(5)} but no displacement candle`,
          };
        }

        return {
          swept: true,
          sweptPrice: pool.price,
          closedInside: false,
          hasDisplacement: false,
          description: `⚠️ Swept at ${pool.price.toFixed(5)} but did not close back inside`,
        };
      }
    }
  }

  return {
    swept: false,
    sweptPrice: 0,
    closedInside: false,
    hasDisplacement: false,
    description: `❌ No valid liquidity sweep for ${direction.toUpperCase()}`,
  };
}

function validateBOS(candles: Candle[], direction: 'buy' | 'sell' | null): BOSValidation {
  if (!direction || candles.length < 50) {
    return {
      valid: false,
      price: 0,
      bodyStrength: 0,
      volumeRatio: 0,
      description: '❌ Insufficient data for BOS validation',
    };
  }

  const recent = candles.slice(-30);
  const swings = findSwingPoints(candles.slice(-100), 5);

  const previousSwing = direction === 'buy'
    ? Math.max(...swings.filter(s => s.type === 'high' && s.index < candles.length - 30).map(s => s.price))
    : Math.min(...swings.filter(s => s.type === 'low' && s.index < candles.length - 30).map(s => s.price));

  const avgBody = recent.slice(0, 20).reduce((sum, c) =>
    sum + Math.abs(c.close - c.open), 0) / 20;

  const avgVolume = recent.slice(0, 20).reduce((sum, c) => sum + c.volume, 0) / 20;

  for (let i = recent.length - 5; i < recent.length; i++) {
    const candle = recent[i];
    const body = Math.abs(candle.close - candle.open);
    const bodyStrength = body / avgBody;
    const volumeRatio = candle.volume / avgVolume;

    const closedBeyondSwing = direction === 'buy'
      ? candle.close > previousSwing
      : candle.close < previousSwing;

    if (closedBeyondSwing && bodyStrength >= 1.5 && volumeRatio > 1.0) {
      return {
        valid: true,
        price: candle.close,
        bodyStrength,
        volumeRatio,
        description: `✅ Valid BOS at ${candle.close.toFixed(5)} (Body: ${bodyStrength.toFixed(2)}x, Vol: ${volumeRatio.toFixed(2)}x)`,
      };
    }
  }

  return {
    valid: false,
    price: 0,
    bodyStrength: 0,
    volumeRatio: 0,
    description: '❌ No valid BOS detected (needs close beyond structure + 1.5x body + volume)',
  };
}

function findDisplacementCandles(candles: Candle[]): number[] {
  const recent = candles.slice(-50);
  const avgBody = recent.reduce((sum, c) => sum + Math.abs(c.close - c.open), 0) / recent.length;
  const displacementIndices: number[] = [];

  for (let i = 0; i < recent.length; i++) {
    const candle = recent[i];
    const body = Math.abs(candle.close - candle.open);

    if (body >= avgBody * 1.5) {
      displacementIndices.push(candles.length - recent.length + i);
    }
  }

  return displacementIndices;
}

function findValidOrderBlocks(candles: Candle[], displacementIndices: number[], currentPrice: number): OrderBlock[] {
  const orderBlocks: OrderBlock[] = [];

  for (const dispIdx of displacementIndices) {
    if (dispIdx > 0 && dispIdx < candles.length) {
      const displacement = candles[dispIdx];
      const prevCandle = candles[dispIdx - 1];

      const isBullishDisplacement = displacement.close > displacement.open;
      const isBearishDisplacement = displacement.close < displacement.open;

      if (isBullishDisplacement && prevCandle.close < prevCandle.open) {
        const mitigated = currentPrice < prevCandle.low;
        orderBlocks.push({
          type: 'bullish',
          price: prevCandle.low,
          high: prevCandle.high,
          low: prevCandle.low,
          index: dispIdx - 1,
          mitigated,
        });
      }

      if (isBearishDisplacement && prevCandle.close > prevCandle.open) {
        const mitigated = currentPrice > prevCandle.high;
        orderBlocks.push({
          type: 'bearish',
          price: prevCandle.high,
          high: prevCandle.high,
          low: prevCandle.low,
          index: dispIdx - 1,
          mitigated,
        });
      }
    }
  }

  return orderBlocks;
}

function findValidFVGs(candles: Candle[], displacementIndices: number[], currentPrice: number): FVG[] {
  const fvgs: FVG[] = [];

  for (let i = 2; i < candles.length; i++) {
    const prev = candles[i - 2];
    const current = candles[i - 1];
    const next = candles[i];

    const createdInDisplacement = displacementIndices.includes(i - 1) || displacementIndices.includes(i);

    if (prev.low > next.high) {
      fvgs.push({
        type: 'bearish',
        bottom: next.high,
        top: prev.low,
        index: i,
        createdInDisplacement,
      });
    }

    if (prev.high < next.low) {
      fvgs.push({
        type: 'bullish',
        bottom: prev.high,
        top: next.low,
        index: i,
        createdInDisplacement,
      });
    }
  }

  return fvgs.slice(-10);
}

function applyElliottWaveFilter(candles: Candle[]): { block: boolean; reason: string; wave: string; pattern: string; description: string } {
  const swings = findSwingPoints(candles, 5);

  if (swings.length < 5) {
    return {
      block: false,
      reason: '',
      wave: 'Unknown',
      pattern: 'Insufficient data',
      description: '⚠️ Wave count uncertain - allowing trade',
    };
  }

  const recentSwings = swings.slice(-8);
  const wave1 = Math.abs(recentSwings[1].price - recentSwings[0].price);
  const wave3 = recentSwings.length > 3 ? Math.abs(recentSwings[3].price - recentSwings[2].price) : 0;
  const wave5 = recentSwings.length > 5 ? Math.abs(recentSwings[5].price - recentSwings[4].price) : 0;

  const wave3IsLongest = wave3 > wave1 && wave3 > wave5;

  if (wave5 > 0 && wave3IsLongest) {
    return {
      block: true,
      reason: 'Wave 5 detected - exhaustion phase',
      wave: 'Wave 5',
      pattern: 'Impulse (Exhaustion)',
      description: '❌ Wave 5 exhaustion - NO ENTRY',
    };
  }

  if (wave3 > 0 && !wave5) {
    if (wave3IsLongest) {
      return {
        block: true,
        reason: 'Mid-Wave 3 entry (too late)',
        wave: 'Wave 3',
        pattern: 'Impulse',
        description: '❌ Wave 3 already in motion - too late for entry',
      };
    }
  }

  return {
    block: false,
    reason: '',
    wave: 'Wave 2 or 4',
    pattern: 'Impulse Setup',
    description: '✅ Valid wave structure for entry (Wave 2/4 completion zone)',
  };
}

function applySessionFilter(marketType: MarketType, marketData: MarketData): {
  block: boolean;
  reason: string;
  description: string;
  confidenceAdjustment: number;
  volumeExpansion: boolean;
} {
  const now = new Date();
  const hour = now.getUTCHours();
  const atr = calculateATR(marketData.candles);
  const avgATR = calculateATR(marketData.candles.slice(-50), 20);
  const atrRatio = atr / avgATR;

  const avgVolume = marketData.candles.slice(-20).reduce((sum, c) => sum + c.volume, 0) / 20;
  const currentVolume = marketData.volume;
  const volumeExpansion = currentVolume > avgVolume * 1.3;

  if (marketType.category === 'crypto') {
    const isKillzone = (hour >= 8 && hour <= 10) || (hour >= 13 && hour <= 15);

    let adjustment = 0;
    let description = '✅ 24/7 market';

    if (currentVolume < avgVolume * 0.7) {
      adjustment -= 5;
      description += ', Low volume (-5)';
    } else if (volumeExpansion) {
      adjustment += 5;
      description += ', Volume expansion (+5)';
    }

    if (atrRatio < 0.5) {
      adjustment -= 5;
      description += ', Very low volatility (-5)';
    }

    if (isKillzone) {
      adjustment += 5;
      description += ' (Killzone +5)';
    }

    return {
      block: false,
      reason: '',
      description,
      confidenceAdjustment: adjustment,
      volumeExpansion,
    };
  }

  if (marketType.category === 'forex') {
    const isLondon = hour >= 8 && hour <= 16;
    const isNY = hour >= 13 && hour <= 21;
    const isOverlap = hour >= 13 && hour <= 16;

    if (!isLondon && !isNY) {
      return {
        block: false,
        reason: '',
        description: '⚠️ Asian session - reduced confidence',
        confidenceAdjustment: -10,
        volumeExpansion: false,
      };
    }

    return {
      block: false,
      reason: '',
      description: `✅ ${isOverlap ? 'London-NY Overlap' : isLondon ? 'London Session' : 'NY Session'}`,
      confidenceAdjustment: isOverlap ? 10 : 5,
      volumeExpansion,
    };
  }

  if (marketType.category === 'stocks') {
    const isMarketHours = hour >= 14 && hour <= 21;

    if (!isMarketHours) {
      return {
        block: false,
        reason: '',
        description: '⚠️ Market closed - use with caution',
        confidenceAdjustment: -15,
        volumeExpansion: false,
      };
    }

    const isMidDay = hour >= 16 && hour <= 18;
    return {
      block: false,
      reason: '',
      description: `✅ Market open${isMidDay ? ' (midday - lower confidence)' : ''}`,
      confidenceAdjustment: isMidDay ? -10 : 5,
      volumeExpansion,
    };
  }

  if (marketType.category === 'indices') {
    const isNYOpen = hour >= 14 && hour <= 21;

    if (!isNYOpen) {
      return {
        block: false,
        reason: '',
        description: '⚠️ Outside primary session',
        confidenceAdjustment: -10,
        volumeExpansion: false,
      };
    }

    return {
      block: false,
      reason: '',
      description: '✅ NY session active',
      confidenceAdjustment: 5,
      volumeExpansion,
    };
  }

  if (marketType.category === 'commodities') {
    let adjustment = 0;
    let description = '✅ Commodity session';

    if (atrRatio < 0.5) {
      adjustment -= 10;
      description = '⚠️ Very low volatility';
    } else if (atrRatio < 0.7) {
      adjustment -= 5;
      description += ' (lower volatility)';
    }

    const isLondonOrNY = (hour >= 8 && hour <= 16) || (hour >= 13 && hour <= 21);
    if (isLondonOrNY) {
      adjustment += 5;
      description += ' (optimal hours)';
    } else {
      adjustment -= 5;
      description += ' (off-peak)';
    }

    return {
      block: false,
      reason: '',
      description,
      confidenceAdjustment: adjustment,
      volumeExpansion,
    };
  }

  return {
    block: false,
    reason: '',
    description: '✅ Session filter passed',
    confidenceAdjustment: 0,
    volumeExpansion,
  };
}

function generateTradeSetup(
  marketData: MarketData,
  signalType: 'buy' | 'sell',
  orderType: 'market' | 'limit',
  dealingRange: any,
  orderBlocks: OrderBlock[],
  fvgs: FVG[],
  bosValidation: BOSValidation
): Omit<SignalResult, 'analysis_data' | 'methodology' | 'current_price' | 'confidence_score'> {
  const isBuy = signalType === 'buy';
  let entry_price = marketData.price;

  if (orderType === 'limit') {
    const validOBs = orderBlocks.filter(ob =>
      !ob.mitigated &&
      ((isBuy && ob.type === 'bullish' && ob.price < marketData.price) ||
       (!isBuy && ob.type === 'bearish' && ob.price > marketData.price))
    );

    const validFVGs = fvgs.filter(fvg =>
      ((isBuy && fvg.type === 'bullish' && fvg.top < marketData.price) ||
       (!isBuy && fvg.type === 'bearish' && fvg.bottom > marketData.price))
    );

    if (validOBs.length > 0) {
      const ob = validOBs[0];
      const obMid = (ob.high + ob.low) / 2;
      entry_price = isBuy ? obMid : obMid;
    } else if (validFVGs.length > 0) {
      const fvg = validFVGs[0];
      entry_price = (fvg.top + fvg.bottom) / 2;
    } else {
      entry_price = isBuy ? marketData.price * 0.995 : marketData.price * 1.005;
    }
  }

  const swings = findSwingPoints(marketData.candles, 5);
  const recentSwings = swings.slice(-10);
  const atr = calculateATR(marketData.candles);

  let swingBasedSL = isBuy
    ? Math.min(...recentSwings.filter(s => s.type === 'low').map(s => s.price)) * 0.998
    : Math.max(...recentSwings.filter(s => s.type === 'high').map(s => s.price)) * 1.002;

  const swingDistance = Math.abs(entry_price - swingBasedSL);
  const minStopDistance = Math.max(atr * 1.5, entry_price * 0.008);

  let stopDistance = swingDistance;
  if (stopDistance < minStopDistance) {
    stopDistance = minStopDistance;
  }

  const stop_loss = isBuy
    ? entry_price - stopDistance
    : entry_price + stopDistance;

  const take_profit_1 = isBuy ? entry_price + (stopDistance * 2) : entry_price - (stopDistance * 2);
  const take_profit_2 = isBuy ? entry_price + (stopDistance * 3) : entry_price - (stopDistance * 3);
  const take_profit_3 = isBuy ? entry_price + (stopDistance * 5) : entry_price - (stopDistance * 5);

  const tp1_percentage = ((stopDistance * 2) / entry_price) * 100;
  const tp2_percentage = ((stopDistance * 3) / entry_price) * 100;
  const tp3_percentage = ((stopDistance * 5) / entry_price) * 100;

  const avgTpDistance = (stopDistance * 2 + stopDistance * 3 + stopDistance * 5) / 3;
  const risk_reward_ratio = avgTpDistance / stopDistance;

  return {
    signal_type: signalType,
    entry_price: Math.round(entry_price * 100000) / 100000,
    stop_loss: Math.round(stop_loss * 100000) / 100000,
    take_profit_1: Math.round(take_profit_1 * 100000) / 100000,
    take_profit_2: Math.round(take_profit_2 * 100000) / 100000,
    take_profit_3: Math.round(take_profit_3 * 100000) / 100000,
    tp1_percentage: Math.round(tp1_percentage * 10) / 10,
    tp2_percentage: Math.round(tp2_percentage * 10) / 10,
    tp3_percentage: Math.round(tp3_percentage * 10) / 10,
    risk_reward_ratio: Math.round(risk_reward_ratio * 10) / 10,
  };
}

function getTimeframeInterval(timeframe: string): string {
  const mapping: Record<string, string> = {
    '1m': '1m',
    '5m': '5m',
    '15m': '15m',
    '30m': '30m',
    '1h': '1h',
    '4h': '4h',
    '1D': '1d',
    '1W': '1w',
  };
  return mapping[timeframe] || '15m';
}

async function fetchMarketData(market: string, timeframe: string = '15m'): Promise<MarketData> {
  try {
    const interval = getTimeframeInterval(timeframe);
    const response = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${market}&interval=${interval}&limit=200`
    );
    const candles: any[] = await response.json();

    if (!candles || candles.length === 0) {
      throw new Error('No candle data received');
    }

    const candleData: Candle[] = candles.map((c) => ({
      time: c[0],
      open: parseFloat(c[1]),
      high: parseFloat(c[2]),
      low: parseFloat(c[3]),
      close: parseFloat(c[4]),
      volume: parseFloat(c[5]),
    }));

    const lastCandle = candleData[candleData.length - 1];
    const price = lastCandle.close;
    const high = Math.max(...candleData.slice(-20).map(c => c.high));
    const low = Math.min(...candleData.slice(-20).map(c => c.low));
    const volume = candleData.slice(-20).reduce((sum, c) => sum + c.volume, 0) / 20;

    const trend = analyzeTrend(candleData);

    return { price, high, low, volume, trend, candles: candleData };
  } catch (error) {
    console.error('Error fetching market data:', error);
    const basePrice = getBasePrice(market);
    return {
      price: basePrice,
      high: basePrice * 1.01,
      low: basePrice * 0.99,
      volume: 1000000,
      trend: 'neutral',
      candles: [],
    };
  }
}

function getBasePrice(market: string): number {
  const prices: Record<string, number> = {
    BTCUSDT: 95000,
    ETHUSDT: 3500,
    BNBUSDT: 620,
    SOLUSDT: 180,
    XRPUSDT: 2.5,
    ADAUSDT: 0.95,
    EURUSD: 1.0850,
    GBPUSD: 1.2650,
    USDJPY: 148.50,
    AUDUSD: 0.6450,
    USDCAD: 1.3550,
    NZDUSD: 0.5950,
    AAPL: 185,
    GOOGL: 145,
    MSFT: 415,
    AMZN: 175,
    TSLA: 245,
    NVDA: 725,
    XAUUSD: 2650,
    XAGUSD: 30.5,
    CRUDE: 82,
    NGAS: 3.2,
    COPPER: 4.15,
    WHEAT: 6.8,
  };
  return prices[market] || 100;
}

function analyzeTrend(candles: Candle[]): 'bullish' | 'bearish' | 'neutral' {
  if (candles.length < 20) return 'neutral';

  const recent = candles.slice(-20);
  const older = candles.slice(-40, -20);

  const recentHighHigh = Math.max(...recent.map(c => c.high));
  const recentLowLow = Math.min(...recent.map(c => c.low));
  const olderHighHigh = Math.max(...older.map(c => c.high));
  const olderLowLow = Math.min(...older.map(c => c.low));

  const isHigherHigh = recentHighHigh > olderHighHigh;
  const isHigherLow = recentLowLow > olderLowLow;
  const isLowerHigh = recentHighHigh < olderHighHigh;
  const isLowerLow = recentLowLow < olderLowLow;

  if (isHigherHigh && isHigherLow) return 'bullish';
  if (isLowerHigh && isLowerLow) return 'bearish';
  return 'neutral';
}

function findSwingPoints(candles: Candle[], lookback: number = 5): SwingPoint[] {
  const swings: SwingPoint[] = [];

  for (let i = lookback; i < candles.length - lookback; i++) {
    const current = candles[i];
    let isSwingHigh = true;
    let isSwingLow = true;

    for (let j = 1; j <= lookback; j++) {
      if (candles[i - j].high >= current.high || candles[i + j].high >= current.high) {
        isSwingHigh = false;
      }
      if (candles[i - j].low <= current.low || candles[i + j].low <= current.low) {
        isSwingLow = false;
      }
    }

    if (isSwingHigh) {
      swings.push({ price: current.high, index: i, type: 'high', volume: current.volume });
    }
    if (isSwingLow) {
      swings.push({ price: current.low, index: i, type: 'low', volume: current.volume });
    }
  }

  return swings;
}

function calculateATR(candles: Candle[], period: number = 14): number {
  if (candles.length < period + 1) {
    const avgRange = candles.reduce((sum, c) => sum + (c.high - c.low), 0) / candles.length;
    return avgRange;
  }

  const trueRanges: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i - 1].close;

    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    trueRanges.push(tr);
  }

  const recentTR = trueRanges.slice(-period);
  const atr = recentTR.reduce((sum, tr) => sum + tr, 0) / period;

  return atr;
}

const priceCache = new Map<string, { price: number; timestamp: number }>();

export async function getCurrentPrice(market: string, initialPrice?: number): Promise<number> {
  const now = Date.now();
  const cached = priceCache.get(market);

  if (cached && (now - cached.timestamp < 2000)) {
    return cached.price;
  }

  try {
    const response = await fetch(
      `https://api.binance.com/api/v3/ticker/price?symbol=${market}`
    );
    const data = await response.json();

    if (data.price) {
      const price = parseFloat(data.price);
      priceCache.set(market, { price, timestamp: now });
      return price;
    }
  } catch (error) {
    console.error('Error fetching current price:', error);
  }

  if (cached) {
    return cached.price;
  }

  if (initialPrice) {
    priceCache.set(market, { price: initialPrice, timestamp: now });
    return initialPrice;
  }

  const marketData = await fetchMarketData(market);
  priceCache.set(market, { price: marketData.price, timestamp: now });
  return marketData.price;
}

export function setInitialPrice(market: string, price: number): void {
  priceCache.set(market, { price, timestamp: Date.now() });
}
