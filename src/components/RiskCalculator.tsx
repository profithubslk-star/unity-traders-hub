import { useState, useEffect } from 'react';
import { Shield, Calculator, DollarSign, TrendingDown, AlertTriangle, Info, RotateCcw } from 'lucide-react';

const STORAGE_KEY = 'unity-traders-risk-calculator';

interface RiskCalculatorState {
  accountBalance: string;
  riskPercentage: string;
  entryPrice: string;
  stopLossPrice: string;
  signalType: 'buy' | 'sell';
  takeProfitPrice: string;
}

export function RiskCalculator() {
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [accountBalance, setAccountBalance] = useState<string>('10000');
  const [riskPercentage, setRiskPercentage] = useState<string>('2');
  const [entryPrice, setEntryPrice] = useState<string>('');
  const [stopLossPrice, setStopLossPrice] = useState<string>('');
  const [signalType, setSignalType] = useState<'buy' | 'sell'>('buy');
  const [takeProfitPrice, setTakeProfitPrice] = useState<string>('');

  const [riskAmount, setRiskAmount] = useState<number>(0);
  const [stopLossDistance, setStopLossDistance] = useState<number>(0);
  const [stopLossPercentage, setStopLossPercentage] = useState<number>(0);
  const [positionSize, setPositionSize] = useState<number>(0);
  const [units, setUnits] = useState<number>(0);
  const [riskRewardRatio, setRiskRewardRatio] = useState<number>(0);
  const [potentialProfit, setPotentialProfit] = useState<number>(0);

  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      try {
        const parsed: RiskCalculatorState = JSON.parse(savedState);
        setAccountBalance(parsed.accountBalance);
        setRiskPercentage(parsed.riskPercentage);
        setEntryPrice(parsed.entryPrice);
        setStopLossPrice(parsed.stopLossPrice);
        setSignalType(parsed.signalType);
        setTakeProfitPrice(parsed.takeProfitPrice);
      } catch (error) {
        console.error('Failed to load calculator state:', error);
      }
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

    const state: RiskCalculatorState = {
      accountBalance,
      riskPercentage,
      entryPrice,
      stopLossPrice,
      signalType,
      takeProfitPrice,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [accountBalance, riskPercentage, entryPrice, stopLossPrice, signalType, takeProfitPrice, isInitialized]);

  useEffect(() => {
    calculateRisk();
  }, [accountBalance, riskPercentage, entryPrice, stopLossPrice, signalType, takeProfitPrice]);

  const calculateRisk = () => {
    const balance = parseFloat(accountBalance) || 0;
    const risk = parseFloat(riskPercentage) || 0;
    const entry = parseFloat(entryPrice) || 0;
    const stopLoss = parseFloat(stopLossPrice) || 0;
    const takeProfit = parseFloat(takeProfitPrice) || 0;

    if (balance <= 0 || risk <= 0 || entry <= 0 || stopLoss <= 0) {
      setRiskAmount(0);
      setStopLossDistance(0);
      setStopLossPercentage(0);
      setPositionSize(0);
      setUnits(0);
      setRiskRewardRatio(0);
      setPotentialProfit(0);
      return;
    }

    const riskAmountCalc = (balance * risk) / 100;
    setRiskAmount(riskAmountCalc);

    let slDistance = 0;
    let slPercentage = 0;

    if (signalType === 'buy') {
      if (stopLoss >= entry) {
        setStopLossDistance(0);
        setStopLossPercentage(0);
        setPositionSize(0);
        setUnits(0);
        return;
      }
      slDistance = entry - stopLoss;
      slPercentage = (slDistance / entry) * 100;
    } else {
      if (stopLoss <= entry) {
        setStopLossDistance(0);
        setStopLossPercentage(0);
        setPositionSize(0);
        setUnits(0);
        return;
      }
      slDistance = stopLoss - entry;
      slPercentage = (slDistance / entry) * 100;
    }

    setStopLossDistance(slDistance);
    setStopLossPercentage(slPercentage);

    const positionSizeCalc = riskAmountCalc / slDistance;
    setPositionSize(positionSizeCalc * entry);
    setUnits(positionSizeCalc);

    if (takeProfit > 0) {
      let tpDistance = 0;
      if (signalType === 'buy') {
        if (takeProfit > entry) {
          tpDistance = takeProfit - entry;
        }
      } else {
        if (takeProfit < entry) {
          tpDistance = entry - takeProfit;
        }
      }

      if (tpDistance > 0 && slDistance > 0) {
        const rrRatio = tpDistance / slDistance;
        setRiskRewardRatio(rrRatio);
        setPotentialProfit(positionSizeCalc * tpDistance);
      } else {
        setRiskRewardRatio(0);
        setPotentialProfit(0);
      }
    } else {
      setRiskRewardRatio(0);
      setPotentialProfit(0);
    }
  };

  const handleReset = () => {
    setAccountBalance('10000');
    setRiskPercentage('2');
    setEntryPrice('');
    setStopLossPrice('');
    setSignalType('buy');
    setTakeProfitPrice('');
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div className="bg-[#1E293B] rounded-xl border border-[#D4AF37]/20 overflow-hidden">
      <div className="bg-gradient-to-r from-[#D4AF37]/10 to-transparent p-6 border-b border-[#D4AF37]/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/20 flex items-center justify-center">
              <Calculator className="w-6 h-6 text-[#D4AF37]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Risk Management Calculator</h2>
              <p className="text-gray-400 text-sm">Calculate position sizes and protect your capital</p>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="flex items-center space-x-2 px-4 py-2 bg-[#0F172A] border border-gray-700 rounded-lg text-gray-300 hover:border-[#D4AF37] hover:text-white transition"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="font-medium">Reset</span>
          </button>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Account Balance ($)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="number"
                value={accountBalance}
                onChange={(e) => setAccountBalance(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#0F172A] border border-gray-700 rounded-lg text-white focus:border-[#D4AF37] focus:outline-none transition"
                placeholder="10000"
                step="100"
                min="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Risk Per Trade (%)
            </label>
            <div className="relative">
              <TrendingDown className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="number"
                value={riskPercentage}
                onChange={(e) => setRiskPercentage(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#0F172A] border border-gray-700 rounded-lg text-white focus:border-[#D4AF37] focus:outline-none transition"
                placeholder="2"
                step="0.1"
                min="0"
                max="100"
              />
            </div>
            <div className="flex items-start space-x-2 mt-2">
              <Info className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-500">
                Recommended: 1-2% for conservative, 3-5% for aggressive trading
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Signal Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSignalType('buy')}
                className={`py-3 rounded-lg font-semibold transition ${
                  signalType === 'buy'
                    ? 'bg-[#10B981] text-white'
                    : 'bg-[#0F172A] text-gray-400 border border-gray-700 hover:border-[#10B981]'
                }`}
              >
                BUY / LONG
              </button>
              <button
                onClick={() => setSignalType('sell')}
                className={`py-3 rounded-lg font-semibold transition ${
                  signalType === 'sell'
                    ? 'bg-[#EF4444] text-white'
                    : 'bg-[#0F172A] text-gray-400 border border-gray-700 hover:border-[#EF4444]'
                }`}
              >
                SELL / SHORT
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Entry Price
            </label>
            <input
              type="number"
              value={entryPrice}
              onChange={(e) => setEntryPrice(e.target.value)}
              className="w-full px-4 py-3 bg-[#0F172A] border border-gray-700 rounded-lg text-white focus:border-[#D4AF37] focus:outline-none transition"
              placeholder="1.2500"
              step="0.00001"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Stop Loss Price
            </label>
            <input
              type="number"
              value={stopLossPrice}
              onChange={(e) => setStopLossPrice(e.target.value)}
              className="w-full px-4 py-3 bg-[#0F172A] border border-gray-700 rounded-lg text-white focus:border-[#D4AF37] focus:outline-none transition"
              placeholder="1.2450"
              step="0.00001"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Take Profit Price (Optional)
            </label>
            <input
              type="number"
              value={takeProfitPrice}
              onChange={(e) => setTakeProfitPrice(e.target.value)}
              className="w-full px-4 py-3 bg-[#0F172A] border border-gray-700 rounded-lg text-white focus:border-[#D4AF37] focus:outline-none transition"
              placeholder="1.2600"
              step="0.00001"
              min="0"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-[#0F172A] rounded-xl p-6 border border-[#D4AF37]/30">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
              <Shield className="w-5 h-5 text-[#D4AF37]" />
              <span>Calculation Results</span>
            </h3>

            <div className="space-y-4">
              <div className="bg-[#1E293B] rounded-lg p-4 border border-gray-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-400">Risk Amount</span>
                  <div className="flex items-center space-x-1">
                    <AlertTriangle className="w-4 h-4 text-[#EF4444]" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-[#EF4444]">
                  ${riskAmount.toFixed(2)}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Maximum loss per trade
                </p>
              </div>

              <div className="bg-[#1E293B] rounded-lg p-4 border border-gray-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-400">Stop Loss Distance</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {stopLossDistance.toFixed(5)}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {stopLossPercentage.toFixed(2)}% from entry
                </p>
              </div>

              <div className="bg-[#1E293B] rounded-lg p-4 border border-gray-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-400">Position Size</span>
                </div>
                <div className="text-2xl font-bold text-[#D4AF37]">
                  ${positionSize.toFixed(2)}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {units.toFixed(2)} units/lots
                </p>
              </div>

              {riskRewardRatio > 0 && (
                <>
                  <div className="bg-[#1E293B] rounded-lg p-4 border border-gray-800">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-400">Risk:Reward Ratio</span>
                    </div>
                    <div className={`text-2xl font-bold ${
                      riskRewardRatio >= 2 ? 'text-[#10B981]' :
                      riskRewardRatio >= 1 ? 'text-[#F59E0B]' :
                      'text-[#EF4444]'
                    }`}>
                      1:{riskRewardRatio.toFixed(2)}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {riskRewardRatio >= 2 ? 'Excellent ratio' :
                       riskRewardRatio >= 1 ? 'Good ratio' :
                       'Poor ratio - Consider adjustment'}
                    </p>
                  </div>

                  <div className="bg-[#1E293B] rounded-lg p-4 border border-gray-800">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-400">Potential Profit</span>
                    </div>
                    <div className="text-2xl font-bold text-[#10B981]">
                      ${potentialProfit.toFixed(2)}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      If take profit is hit
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#EF4444]/10 to-transparent rounded-xl p-4 border border-[#EF4444]/30">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-[#EF4444] flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-white mb-1">Risk Management Tips</h4>
                <ul className="text-xs text-gray-400 space-y-1">
                  <li>• Never risk more than 1-2% per trade</li>
                  <li>• Always use stop losses</li>
                  <li>• Aim for minimum 1:2 risk-reward ratio</li>
                  <li>• Don't risk more than 10% total capital at once</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
