import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Clock, Target, CheckCircle, XCircle, Activity, Trash2, ChevronDown, ChevronUp, LineChart } from 'lucide-react';
import { Signal } from '../types/database.types';
import { supabase } from '../lib/supabase';
import { getCurrentPrice } from '../utils/signalGenerator';

interface SignalCardProps {
  signal: Signal;
  onUpdate: () => void;
  onToggleChart?: (signalId: string) => void;
  isDisplayedOnChart?: boolean;
}

export function SignalCard({ signal, onUpdate, onToggleChart, isDisplayedOnChart = false }: SignalCardProps) {
  const [processing, setProcessing] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number>(signal.current_price || signal.entry_price);
  const [pnl, setPnl] = useState(signal.pnl_percentage);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    const initPrice = async () => {
      const price = await getCurrentPrice(signal.market, signal.current_price || signal.entry_price);
      setCurrentPrice(price);
    };
    initPrice();
  }, [signal.market, signal.current_price, signal.entry_price]);

  useEffect(() => {
    if (signal.user_action !== 'taken') return;

    const interval = setInterval(async () => {
      try {
        const price = await getCurrentPrice(signal.market, signal.current_price || signal.entry_price);
        setCurrentPrice(price);

        const entryPrice = signal.entry_type === 'limit' && !signal.entry_hit_at
          ? signal.entry_price
          : signal.entry_price;

        let calculatedPnl = 0;
        if (signal.entry_hit_at || signal.entry_type === 'market') {
          if (signal.signal_type === 'buy') {
            calculatedPnl = ((price - entryPrice) / entryPrice) * 100;
          } else {
            calculatedPnl = ((entryPrice - price) / entryPrice) * 100;
          }
        }

        setPnl(calculatedPnl);

        const updates: any = {
          current_price: price,
          pnl_percentage: calculatedPnl,
        };

        if (signal.entry_type === 'limit' && !signal.entry_hit_at) {
          const entryHit = signal.signal_type === 'buy'
            ? price <= signal.entry_price
            : price >= signal.entry_price;

          if (entryHit) {
            updates.entry_hit_at = new Date().toISOString();
          }
        }

        if (signal.signal_type === 'buy') {
          if (!signal.sl_hit_at && price <= signal.stop_loss) {
            updates.sl_hit_at = new Date().toISOString();
            updates.status = 'completed';
          } else if (!signal.tp3_hit_at && price >= signal.take_profit_3) {
            updates.tp3_hit_at = new Date().toISOString();
            updates.status = 'completed';
          } else if (!signal.tp2_hit_at && price >= signal.take_profit_2) {
            updates.tp2_hit_at = new Date().toISOString();
          } else if (!signal.tp1_hit_at && price >= signal.take_profit_1) {
            updates.tp1_hit_at = new Date().toISOString();

            if (!signal.break_even_moved) {
              updates.break_even_moved = true;
            }
          }
        } else {
          if (!signal.sl_hit_at && price >= signal.stop_loss) {
            updates.sl_hit_at = new Date().toISOString();
            updates.status = 'completed';
          } else if (!signal.tp3_hit_at && price <= signal.take_profit_3) {
            updates.tp3_hit_at = new Date().toISOString();
            updates.status = 'completed';
          } else if (!signal.tp2_hit_at && price <= signal.take_profit_2) {
            updates.tp2_hit_at = new Date().toISOString();
          } else if (!signal.tp1_hit_at && price <= signal.take_profit_1) {
            updates.tp1_hit_at = new Date().toISOString();

            if (!signal.break_even_moved) {
              updates.break_even_moved = true;
            }
          }
        }

        await supabase
          .from('signals')
          .update(updates)
          .eq('id', signal.id);

        if (Object.keys(updates).length > 2) {
          onUpdate();
        }
      } catch (error) {
        console.error('Error updating signal:', error);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [signal, onUpdate]);

  const handleTaken = async () => {
    setProcessing(true);
    try {
      const updates: any = {
        user_action: 'taken',
      };

      if (signal.entry_type === 'market') {
        updates.entry_hit_at = new Date().toISOString();
      }

      await supabase
        .from('signals')
        .update(updates)
        .eq('id', signal.id);

      onUpdate();
    } catch (error) {
      console.error('Error marking signal as taken:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleNotTaken = async () => {
    setProcessing(true);
    try {
      await supabase
        .from('signals')
        .update({ user_action: 'not_taken' })
        .eq('id', signal.id);

      onUpdate();
    } catch (error) {
      console.error('Error marking signal as not taken:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteSignal = async () => {
    if (!window.confirm('Are you sure you want to delete this signal? This action cannot be undone.')) {
      return;
    }

    setProcessing(true);
    try {
      await supabase
        .from('signals')
        .delete()
        .eq('id', signal.id);

      onUpdate();
    } catch (error) {
      console.error('Error deleting signal:', error);
    } finally {
      setProcessing(false);
    }
  };

  const formatMethodology = (text: string) => {
    return text.split('\n').map((line, idx) => (
      <div key={idx} className="text-xs leading-relaxed font-mono">
        {line.startsWith('━') ? (
          <div className="text-cyan-400 my-1.5">{line}</div>
        ) : line.startsWith('▸') ? (
          <div className="text-white font-semibold mt-2 mb-1">{line}</div>
        ) : line.trim().startsWith('•') ? (
          <div className="text-gray-300 pl-2">{line}</div>
        ) : line.trim().startsWith('✅') || line.trim().startsWith('❌') || line.trim().startsWith('⚠️') ? (
          <div className="text-gray-400 pl-2">{line}</div>
        ) : (
          <div className="text-gray-400">{line}</div>
        )}
      </div>
    ));
  };

  const isTaken = signal.user_action === 'taken';
  const isEntryHit = signal.entry_hit_at !== null || signal.entry_type === 'market';

  const getStopLossMessage = () => {
    if (!isTaken || signal.sl_hit_at || signal.tp3_hit_at) return null;

    if (signal.tp2_hit_at) {
      return 'B.E. to TP1';
    } else if (signal.tp1_hit_at) {
      return 'Moved to B.E.';
    }

    return null;
  };

  const stopLossMessage = getStopLossMessage();

  return (
    <div className="bg-[#1E293B] rounded-xl border-2 border-cyan-500/30 overflow-hidden shadow-2xl">
      <div
        className="p-5 cursor-pointer hover:bg-[#1E293B]/80 transition-all"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              signal.signal_type === 'buy'
                ? 'bg-emerald-500/20'
                : 'bg-rose-500/20'
            }`}>
              {signal.signal_type === 'buy' ? (
                <TrendingUp className="w-6 h-6 text-emerald-400" strokeWidth={2.5} />
              ) : (
                <TrendingDown className="w-6 h-6 text-rose-400" strokeWidth={2.5} />
              )}
            </div>

            <div>
              <div className="flex items-center space-x-3 mb-1">
                <h3 className="text-2xl font-bold text-white">{signal.market}</h3>
                <span className={`px-3 py-1 rounded-md text-xs font-bold ${
                  signal.signal_type === 'buy'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-rose-500/20 text-rose-400'
                }`}>
                  {signal.signal_type === 'buy' ? 'BUY NOW' : 'SELL NOW'}
                </span>
                <span className="px-3 py-1 rounded-md text-xs font-bold bg-cyan-500/20 text-cyan-400 uppercase">
                  {signal.signal_type === 'buy' ? 'LONG' : 'SHORT'}
                </span>
              </div>
              <div className="flex items-center space-x-4 text-sm">
                <span className="text-gray-400">Entry: <span className="text-white font-semibold">{signal.entry_price.toFixed(5)}</span></span>
                {isTaken && (
                  <>
                    <span className="text-gray-400">Live: <span className={`font-semibold ${pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{currentPrice.toFixed(5)}</span></span>
                    <span className={`font-bold ${pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}%
                    </span>
                  </>
                )}
                <span className="text-gray-400">Confidence: <span className="text-cyan-400 font-bold">{signal.confidence_score}%</span></span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <span className={`px-4 py-2 rounded-lg text-xs font-bold uppercase ${
              signal.status === 'active' && !signal.tp1_hit_at && !signal.sl_hit_at ? 'bg-cyan-500/20 text-cyan-400' :
              signal.status === 'completed' && signal.tp3_hit_at ? 'bg-emerald-500/20 text-emerald-400' :
              signal.status === 'completed' && signal.sl_hit_at ? 'bg-rose-500/20 text-rose-400' :
              'bg-gray-500/20 text-gray-400'
            }`}>
              {signal.status === 'completed' && signal.tp3_hit_at ? 'COMPLETED' :
               signal.status === 'completed' && signal.sl_hit_at ? 'STOPPED' :
               'ACTIVE'}
            </span>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-cyan-500/20">
          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Trade Setup</h4>
                <span className={`px-3 py-1 rounded-md text-xs font-bold uppercase ${
                  signal.signal_type === 'buy'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-rose-500/20 text-rose-400'
                }`}>
                  {signal.signal_type === 'buy' ? 'LONG' : 'SHORT'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#0F172A]/60 rounded-lg p-4 border border-slate-700/50">
                  <div className="text-xs text-gray-400 mb-1 uppercase font-medium">Entry</div>
                  <div className="text-lg font-bold text-white">{signal.entry_price.toFixed(5)}</div>
                  {isTaken && isEntryHit && (
                    <div className="mt-1 text-xs text-emerald-400 flex items-center space-x-1">
                      <CheckCircle className="w-3 h-3" />
                      <span>Hit</span>
                    </div>
                  )}
                </div>

                <div className="bg-[#0F172A]/60 rounded-lg p-4 border border-rose-500/30">
                  <div className="text-xs text-rose-400 mb-1 uppercase font-medium">Stop Loss</div>
                  <div className="text-lg font-bold text-rose-400">{signal.stop_loss.toFixed(5)}</div>
                  {isTaken && signal.sl_hit_at && (
                    <div className="mt-1 text-xs text-rose-400 flex items-center space-x-1">
                      <XCircle className="w-3 h-3" />
                      <span>Hit</span>
                    </div>
                  )}
                  {stopLossMessage && (
                    <div className="mt-1 text-xs text-cyan-400 flex items-center space-x-1">
                      <CheckCircle className="w-3 h-3" />
                      <span>{stopLossMessage}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#0F172A]/60 rounded-lg p-4 border border-emerald-500/30">
                  <div className="text-xs text-emerald-400 mb-1 uppercase font-medium flex items-center justify-between">
                    <span>TP1 (1:1)</span>
                    {isTaken && signal.tp1_hit_at && <CheckCircle className="w-3 h-3" />}
                  </div>
                  <div className="text-lg font-bold text-emerald-400">{signal.take_profit_1.toFixed(5)}</div>
                  <div className="text-xs text-gray-400 mt-0.5">+{signal.tp1_percentage}%</div>
                </div>

                <div className="bg-[#0F172A]/60 rounded-lg p-4 border border-emerald-500/30">
                  <div className="text-xs text-emerald-400 mb-1 uppercase font-medium flex items-center justify-between">
                    <span>TP2 (1:2)</span>
                    {isTaken && signal.tp2_hit_at && <CheckCircle className="w-3 h-3" />}
                  </div>
                  <div className="text-lg font-bold text-emerald-400">{signal.take_profit_2.toFixed(5)}</div>
                  <div className="text-xs text-gray-400 mt-0.5">+{signal.tp2_percentage}%</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#0F172A]/60 rounded-lg p-4 border border-cyan-500/40">
                  <div className="text-xs text-cyan-400 mb-1 uppercase font-medium flex items-center justify-between">
                    <span>TP3 (1:3)</span>
                    {isTaken && signal.tp3_hit_at && <CheckCircle className="w-3 h-3" />}
                  </div>
                  <div className="text-lg font-bold text-cyan-400">{signal.take_profit_3.toFixed(5)}</div>
                  <div className="text-xs text-gray-400 mt-0.5">+{signal.tp3_percentage}%</div>
                </div>

                <div className="bg-[#0F172A]/60 rounded-lg p-4 border border-slate-700/50">
                  <div className="text-xs text-gray-400 mb-1 uppercase font-medium">R:R Ratio</div>
                  <div className="text-lg font-bold text-white">1:{signal.risk_reward_ratio}</div>
                </div>
              </div>

              <div className="bg-[#0F172A]/60 rounded-lg p-4 border border-slate-700/50">
                <div className="text-xs text-gray-400 mb-2 uppercase font-medium">Methodology</div>
                <div className="flex flex-wrap gap-2">
                  {signal.methods.includes('ict') && (
                    <span className="px-3 py-1.5 rounded-md text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      ICT
                    </span>
                  )}
                  {signal.methods.includes('smc') && (
                    <span className="px-3 py-1.5 rounded-md text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      SMC
                    </span>
                  )}
                  {signal.methods.includes('elliott') && (
                    <span className="px-3 py-1.5 rounded-md text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      Elliott Wave
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Analysis</h4>

                <div className="space-y-3">
                  <div className="bg-[#0F172A]/60 rounded-lg p-4 border border-slate-700/50">
                    <div className="text-xs text-gray-400 mb-1 uppercase font-medium">Direction</div>
                    <div className={`text-lg font-bold ${signal.signal_type === 'buy' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {signal.signal_type === 'buy' ? 'BULLISH' : 'BEARISH'}
                    </div>
                  </div>

                  <div className="bg-[#0F172A]/60 rounded-lg p-4 border border-slate-700/50">
                    <div className="text-xs text-gray-400 mb-1 uppercase font-medium">Timeframe</div>
                    <div className="text-lg font-bold text-white">{signal.timeframe.toUpperCase()}</div>
                  </div>

                  <div className="bg-[#0F172A]/60 rounded-lg p-4 border border-cyan-500/40">
                    <div className="text-xs text-gray-400 mb-1 uppercase font-medium">Confidence</div>
                    <div className="text-lg font-bold text-cyan-400">{signal.confidence_score}%</div>
                  </div>

                  {isTaken && (
                    <>
                      <div className="bg-[#0F172A]/60 rounded-lg p-4 border border-slate-700/50">
                        <div className="text-xs text-gray-400 mb-1 uppercase font-medium flex items-center space-x-2">
                          <Activity className="w-3 h-3 animate-pulse text-cyan-400" />
                          <span>Live Price</span>
                        </div>
                        <div className="text-lg font-bold text-white">{currentPrice.toFixed(5)}</div>
                      </div>

                      <div className="bg-[#0F172A]/60 rounded-lg p-4 border border-slate-700/50">
                        <div className="text-xs text-gray-400 mb-1 uppercase font-medium">P&L</div>
                        <div className={`text-lg font-bold ${pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}%
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Trade Tracking</h4>

                {signal.user_action === 'pending' ? (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTaken();
                      }}
                      disabled={processing}
                      className="px-4 py-3 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-400 font-bold text-sm rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processing ? 'Processing...' : 'Taken'}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNotTaken();
                      }}
                      disabled={processing}
                      className="px-4 py-3 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/50 text-rose-400 font-bold text-sm rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processing ? 'Processing...' : 'Not Taken'}
                    </button>
                  </div>
                ) : signal.user_action === 'taken' ? (
                  <div className="space-y-3">
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                      <div className="flex items-center justify-center space-x-2 text-emerald-400">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-bold text-sm">TRADE TAKEN</span>
                      </div>
                    </div>
                    {onToggleChart && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleChart(signal.id);
                        }}
                        className={`w-full px-4 py-3 border-2 font-bold text-sm rounded-lg transition-all flex items-center justify-center space-x-2 ${
                          isDisplayedOnChart
                            ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/30'
                            : 'bg-slate-700/20 border-slate-600/50 text-slate-300 hover:bg-slate-700/30'
                        }`}
                      >
                        <LineChart className="w-4 h-4" />
                        <span>{isDisplayedOnChart ? 'Hide from Chart' : 'Show on Chart'}</span>
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSignal();
                      }}
                      disabled={processing}
                      className="w-full px-4 py-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold text-sm rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Signal</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-gray-500/10 border border-gray-500/30 rounded-lg p-4">
                      <div className="flex items-center justify-center space-x-2 text-gray-400">
                        <XCircle className="w-5 h-5" />
                        <span className="font-bold text-sm">NOT TAKEN</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSignal();
                      }}
                      disabled={processing}
                      className="w-full px-4 py-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold text-sm rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Signal</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {signal.methodology && (
            <div className="px-6 pb-6">
              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer list-none bg-[#0F172A]/60 rounded-lg p-4 border border-slate-700/50 hover:border-cyan-500/40 transition-all">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                      <Target className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider">Detailed Analysis</h4>
                      <p className="text-xs text-gray-400 mt-0.5">View complete methodology breakdown</p>
                    </div>
                  </div>
                  <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="mt-3 bg-[#0F172A]/60 rounded-lg p-5 border border-slate-700/50">
                  <div className="bg-[#0a0f1a]/80 rounded-lg p-5 border border-gray-700/30 max-h-96 overflow-y-auto custom-scrollbar">
                    {formatMethodology(signal.methodology)}
                  </div>
                </div>
              </details>
            </div>
          )}

          <div className="px-6 pb-4 flex items-center justify-between border-t border-cyan-500/20 pt-4">
            <div className="flex items-center space-x-2 text-xs text-gray-400">
              <Clock className="w-4 h-4" />
              <span>{new Date(signal.created_at).toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
