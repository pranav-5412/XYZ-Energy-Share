import React, { useState } from 'react';
import {
  Network,
  Activity,
  Zap,
  Sun,
  Play,
  RotateCcw,
  ArrowRight,
  TrendingUp,
  Cpu,
  Layers,
  CheckCircle2,
  Sliders,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import {
  TariffZone,
  MatchingRun,
  EnergyTransaction,
  SimulationState,
  GridMetrics,
  MatchingMethod
} from '../types/index.ts';
import { api } from '../services/api.ts';

interface DispatcherViewProps {
  zones: TariffZone[];
  matchingRuns: MatchingRun[];
  transactions: EnergyTransaction[];
  zonePools: any[];
  simState: SimulationState;
  gridMetrics: GridMetrics;
  onRefreshData: () => void;
}

export const DispatcherView: React.FC<DispatcherViewProps> = ({
  zones,
  matchingRuns,
  transactions,
  zonePools,
  simState,
  gridMetrics,
  onRefreshData
}) => {
  const [selectedMethod, setSelectedMethod] = useState<MatchingMethod>('FIFO');
  const [isExecutingMatching, setIsExecutingMatching] = useState(false);
  const [matchingStatusMsg, setMatchingStatusMsg] = useState<string | null>(null);

  const handleTriggerMatching = async () => {
    setIsExecutingMatching(true);
    setMatchingStatusMsg(null);
    try {
      const res = await api.executeMatching(selectedMethod);
      setMatchingStatusMsg(`Successfully executed ${selectedMethod} matching across ${res.matchingRuns.length} microgrid zones!`);
      onRefreshData();
    } catch (err) {
      alert('Matching execution failed');
    } finally {
      setIsExecutingMatching(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner: Dispatcher Operations Command */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-950/70 via-slate-900 to-teal-950/70 border border-cyan-500/30 p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-inner">
              <Network className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-100">Microgrid Dispatch &amp; Virtual Routing</h1>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                  REAL-TIME SYNCHRONIZED
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Aggregating distributed rooftop solar surplus and executing algorithmic redistribution to local consumer pools
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-3 text-xs">
                <span className="bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800 text-slate-300 font-mono">
                  Grid Frequency: <strong className="text-cyan-300">60.01 Hz</strong> (Nominal ±0.03)
                </span>
                <span className="bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800 text-slate-300 font-mono">
                  AC Voltage: <strong className="text-emerald-300">240.4 V</strong>
                </span>
                <span className="bg-cyan-950/80 px-2.5 py-1 rounded-lg border border-cyan-500/30 text-cyan-300 font-semibold">
                  Reliability Score: 99.8%
                </span>
              </div>
            </div>
          </div>

          {/* Allocation Action Controls */}
          <div className="bg-slate-950/90 p-4 rounded-xl border border-slate-800 flex flex-col gap-3 min-w-[280px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Matching Algorithm</span>
              <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-xs">
                <button
                  onClick={() => setSelectedMethod('FIFO')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition ${
                    selectedMethod === 'FIFO' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  FIFO
                </button>
                <button
                  onClick={() => setSelectedMethod('PRO_RATA')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition ${
                    selectedMethod === 'PRO_RATA' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Pro-Rata
                </button>
              </div>
            </div>

            <button
              id="execute-matching-btn"
              onClick={handleTriggerMatching}
              disabled={isExecutingMatching}
              className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-xs rounded-lg shadow-lg shadow-cyan-500/20 transition flex items-center justify-center gap-2"
            >
              <Cpu className="w-4 h-4" />
              <span>{isExecutingMatching ? 'Allocating Power...' : 'Execute Redistribution'}</span>
            </button>

            {matchingStatusMsg && (
              <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {matchingStatusMsg}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Live Distribution Topology Canvas Section */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-2xl backdrop-blur-sm">
        <div className="absolute inset-0 opacity-10 pointer-events-none grid-pattern-bg"></div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6 relative z-10">
          <div>
            <h3 className="font-bold text-base tracking-tight text-slate-100 flex items-center gap-2">
              <Network className="w-5 h-5 text-emerald-400" /> Live Distribution Topology
            </h3>
            <p className="text-[10px] text-slate-400 uppercase font-mono mt-0.5">Visualizing P2P Matching (District Grid 01)</p>
          </div>
          <div className="flex gap-2 text-[10px] font-mono">
            <div className="px-2.5 py-1 bg-slate-800/90 rounded text-emerald-400 border border-emerald-400/20 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> STABLE 60.01Hz
            </div>
            <div className="px-2.5 py-1 bg-slate-800/90 rounded text-slate-300 border border-slate-700">
              AUTO-MATCH: {simState.autoMatchEnabled ? 'ACTIVE' : 'MANUAL'}
            </div>
          </div>
        </div>

        <div className="h-64 w-full border border-slate-800/80 rounded-xl relative overflow-hidden bg-[#0a0f1e] shadow-inner flex items-center justify-center">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-emerald-400 rounded-full shadow-[0_0_20px_#10b981] z-20"></div>

          {/* Microgrid Nodes */}
          <div className="absolute top-1/4 left-1/4 w-16 h-16 border border-sky-500/40 rounded-xl bg-sky-900/30 backdrop-blur-sm flex flex-col items-center justify-center shadow-[0_0_15px_rgba(56,189,248,0.2)] z-10">
            <span className="text-[9px] font-mono text-sky-400 uppercase font-bold">North Pool</span>
            <span className="text-xs font-bold font-mono text-slate-100">{gridMetrics.totalSurplusAvailableKwh.toFixed(1)}kW</span>
          </div>

          <div className="absolute bottom-1/4 right-1/4 w-16 h-16 border border-amber-500/40 rounded-xl bg-amber-900/30 backdrop-blur-sm flex flex-col items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.2)] z-10">
            <span className="text-[9px] font-mono text-amber-400 uppercase font-bold">South Pool</span>
            <span className="text-xs font-bold font-mono text-slate-100">{gridMetrics.totalDemandWaitingKwh.toFixed(1)}kW</span>
          </div>

          <div className="absolute top-1/4 right-1/4 w-16 h-16 border border-purple-500/40 rounded-xl bg-purple-900/30 backdrop-blur-sm flex flex-col items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.2)] z-10">
            <span className="text-[9px] font-mono text-purple-400 uppercase font-bold">Central</span>
            <span className="text-xs font-bold font-mono text-slate-100">32.4kW</span>
          </div>

          <div className="absolute bottom-1/4 left-1/4 w-16 h-16 border border-emerald-500/40 rounded-xl bg-emerald-900/30 backdrop-blur-sm flex flex-col items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.2)] z-10">
            <span className="text-[9px] font-mono text-emerald-400 uppercase font-bold">West Pool</span>
            <span className="text-xs font-bold font-mono text-slate-100">18.0kW</span>
          </div>

          <svg className="absolute inset-0 w-full h-full opacity-30 pointer-events-none">
            <line x1="25%" y1="25%" x2="50%" y2="50%" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="4" />
            <line x1="75%" y1="75%" x2="50%" y2="50%" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="4" />
            <line x1="75%" y1="25%" x2="50%" y2="50%" stroke="#c084fc" strokeWidth="1.5" strokeDasharray="4" />
            <line x1="25%" y1="75%" x2="50%" y2="50%" stroke="#34d399" strokeWidth="1.5" strokeDasharray="4" />
            <circle cx="50%" cy="50%" r="80" fill="none" stroke="#334155" strokeWidth="1" />
            <circle cx="50%" cy="50%" r="140" fill="none" stroke="#1e293b" strokeWidth="1" />
          </svg>

          <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center text-[10px] font-mono text-slate-500 bg-slate-900/80 p-2 rounded-lg border border-slate-800">
            <span>Lat: 37.3861° N, Long: 122.0839° W (Silicon Valley Corridor)</span>
            <span className="text-emerald-400 font-bold">● LIVE_SYNCING_CORE_04</span>
          </div>
        </div>
      </div>

      {/* Real-Time Zone Balances & Supply-Demand Pools */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-400" />
              Regional Microgrid Pools (Live Real-Time Balance)
            </h2>
            <p className="text-xs text-slate-400">
              Surplus solar generation vs. active consumer load per localized transformer zone
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {zonePools.map(pool => {
            const isSurplus = pool.balanceKwh >= 0;
            return (
              <div
                key={pool.zoneId}
                className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between hover:border-slate-700 transition"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-slate-100">{pool.zoneName}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isSurplus
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-950 text-amber-400 border border-amber-500/30'
                    }`}>
                      {isSurplus ? 'NET SURPLUS' : 'NET DEFICIT'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mb-4">{pool.region}</div>

                  {/* Supply vs Demand Bars */}
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Sun className="w-3.5 h-3.5 text-amber-400" /> Solar Surplus
                        </span>
                        <span className="font-mono font-bold text-amber-400">{pool.surplusKwh} kWh</span>
                      </div>
                      <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-amber-400 h-full rounded-full transition-all"
                          style={{ width: `${Math.min(100, (pool.surplusKwh / (pool.surplusKwh + pool.demandKwh || 1)) * 100)}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5 text-emerald-400" /> Consumer Demand
                        </span>
                        <span className="font-mono font-bold text-emerald-400">{pool.demandKwh} kWh</span>
                      </div>
                      <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-400 h-full rounded-full transition-all"
                          style={{ width: `${Math.min(100, (pool.demandKwh / (pool.surplusKwh + pool.demandKwh || 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Net Flow:</span>
                  <span className={`font-bold ${isSurplus ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {isSurplus ? '+' : ''}{pool.balanceKwh} kWh
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid: Matching Runs History & Live Settled Micro-Trades */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Redistribution Runs */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-400" />
                Redistribution Matching Runs
              </h3>
              <p className="text-xs text-slate-400">Algorithmic supply-to-demand clearing history</p>
            </div>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {matchingRuns.slice(0, 10).map(run => (
              <div key={run.id} className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200">{run.zoneName}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                      {run.method}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(run.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-800/60 my-2 font-mono text-[11px]">
                  <div>
                    <span className="text-slate-500 block">Matched</span>
                    <span className="font-bold text-emerald-400">{run.matchedKwh} kWh</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Prosumer Payout</span>
                    <span className="text-slate-300">${run.totalProsumerPayout.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">XYZ Margin</span>
                    <span className="font-bold text-teal-300">+${run.platformMarginEarned.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-400">
                  <span>Settled Transactions: <strong className="text-slate-200">{run.transactionCount}</strong></span>
                  <span className="text-emerald-400">CO₂ Avoided: {run.co2OffsetKg} kg</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Settled Micro-Trades Stream */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Zap className="w-5 h-5 text-emerald-400" />
                Live Energy Micro-Transactions Stream
              </h3>
              <p className="text-xs text-slate-400">Real-time peer-to-peer electricity contracts settled</p>
            </div>
            <span className="flex items-center gap-1.5 text-xs text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Streaming
            </span>
          </div>

          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {transactions.slice(0, 15).map(tx => (
              <div key={tx.id} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 font-medium">
                    <span className="text-amber-300 font-semibold">{tx.prosumerName}</span>
                    <ArrowRight className="w-3 h-3 text-slate-500" />
                    <span className="text-emerald-300 font-semibold">{tx.consumerName}</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-400 text-xs">
                    {tx.unitsKwh} kWh
                  </span>
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono mt-1 pt-1 border-t border-slate-800/50">
                  <span>Seller: ${tx.prosumerRatePerKwh}/kWh • Buyer: ${tx.consumerRatePerKwh}/kWh</span>
                  <span className="text-teal-300 font-semibold">XYZ Margin: +${tx.platformMarginAmount.toFixed(3)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
