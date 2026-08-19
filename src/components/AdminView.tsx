import React, { useState } from 'react';
import {
  ShieldCheck,
  DollarSign,
  TrendingUp,
  Sliders,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Zap,
  Leaf,
  FileCheck,
  Edit2,
  Save,
  MessageSquare,
  AlertTriangle,
  RotateCcw,
  Sun,
  Activity,
  Play,
  ArrowRight,
  Layers,
  Cpu,
  Radio,
  RefreshCw,
  BarChart2,
  TrendingDown,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import {
  TariffZone,
  NegotiationBid,
  TelemetryLog,
  GridMetrics,
  User,
  SolarInstallation,
  SimulationState
} from '../types/index.ts';
import { api } from '../services/api.ts';

interface AdminViewProps {
  zones: TariffZone[];
  bids: NegotiationBid[];
  telemetryLogs: TelemetryLog[];
  gridMetrics: GridMetrics;
  users: User[];
  installations: SolarInstallation[];
  zonePools?: any[];
  simState?: SimulationState;
  onRefreshData: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  zones,
  bids,
  telemetryLogs,
  gridMetrics,
  users,
  installations,
  zonePools = [],
  simState = {
    isRunning: true,
    currentSimHour: 12.5,
    weatherCondition: 'SUNNY',
    solarIrradiancePct: 85,
    speedMultiplier: 1,
    autoMatchEnabled: true,
    lastTickTimestamp: new Date().toISOString()
  },
  onRefreshData
}) => {
  // Editing tariffs state
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
  const [tariffForm, setTariffForm] = useState<Partial<TariffZone>>({});

  // Counter-offer modal state
  const [activeCounterBid, setActiveCounterBid] = useState<NegotiationBid | null>(null);
  const [counterRate, setCounterRate] = useState<number>(0.155);
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [isSubmittingCounter, setIsSubmittingCounter] = useState<boolean>(false);

  // AI Advisor state
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState<boolean>(false);

  // Quick Action execution state
  const [isStepping, setIsStepping] = useState<boolean>(false);
  const [isMatching, setIsMatching] = useState<boolean>(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const pendingBids = bids.filter(b => b.status === 'PENDING');
  const manualSubmissions = telemetryLogs.filter(l => l.source === 'MANUAL_SUBMISSION' && !l.verified);

  // Quick actions handlers
  const handleQuickStep = async () => {
    setIsStepping(true);
    setActionFeedback(null);
    try {
      await api.stepSimulation(0.25);
      setActionFeedback('Telemetry tick updated (+15 mins)!');
      onRefreshData();
    } catch (err) {
      alert('Telemetry step failed');
    } finally {
      setIsStepping(false);
    }
  };

  const handleQuickMatch = async () => {
    setIsMatching(true);
    setActionFeedback(null);
    try {
      const res = await api.executeMatching('FIFO');
      setActionFeedback(`P2P Matching cleared ${res.matchingRuns.length} microgrid zones!`);
      onRefreshData();
    } catch (err) {
      alert('Matching failed');
    } finally {
      setIsMatching(false);
    }
  };

  const handleStartEditTariff = (zone: TariffZone) => {
    setEditingZoneId(zone.zoneId);
    setTariffForm({
      govtGridRetailRate: zone.govtGridRetailRate,
      govtBuybackRate: zone.govtBuybackRate,
      xyzDefaultBuyRate: zone.xyzDefaultBuyRate,
      xyzDefaultSellRate: zone.xyzDefaultSellRate,
      xyzPlatformMarginRate: zone.xyzPlatformMarginRate
    });
  };

  const handleSaveTariff = async (zoneId: string) => {
    try {
      await api.updateTariff(zoneId, tariffForm);
      setEditingZoneId(null);
      onRefreshData();
    } catch (err) {
      alert('Failed to update regional tariff');
    }
  };

  const handleBidDecision = async (
    bidId: string,
    decision: 'ACCEPTED' | 'REJECTED'
  ) => {
    try {
      await api.respondToBid(bidId, { decision });
      onRefreshData();
    } catch (err) {
      alert('Failed to update bid status');
    }
  };

  const handleOpenCounterOffer = (bid: NegotiationBid) => {
    setActiveCounterBid(bid);
    setCounterRate(parseFloat(((bid.currentAgreedRate + bid.proposedRatePerKwh) / 2).toFixed(3)));
    setAdminNotes(`Counter-offering based on regional demand pool elasticity in ${bid.zoneId}.`);
  };

  const handleSubmitCounterOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCounterBid) return;
    setIsSubmittingCounter(true);
    try {
      await api.respondToBid(activeCounterBid.id, {
        decision: 'COUNTER_OFFER',
        counterRatePerKwh: Number(counterRate),
        adminNotes
      });
      setActiveCounterBid(null);
      onRefreshData();
    } catch (err) {
      alert('Failed to submit counter-offer');
    } finally {
      setIsSubmittingCounter(false);
    }
  };

  const handleVerifyTelemetry = async (id: string, verified: boolean) => {
    try {
      await api.verifyTelemetry(id, verified, verified ? 'Verified by Admin' : 'Rejected - insufficient proof');
      onRefreshData();
    } catch (err) {
      alert('Failed to verify reading');
    }
  };

  const handleFetchAiAdvice = async () => {
    setIsLoadingAi(true);
    try {
      const res = await api.getAiGridAdvice('Dynamic Arbitrage & Regional Tariff Spreads');
      setAiAnalysis(res.analysis);
    } catch (err) {
      alert('Failed to fetch AI advisory');
    } finally {
      setIsLoadingAi(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner: XYZ Org Admin Command Center */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-950/70 via-slate-900 to-indigo-950/70 border border-purple-500/30 p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-inner">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-100">XYZ Org Executive Command Center</h1>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-950 text-purple-400 border border-purple-500/30">
                  PLATFORM AGGREGATOR
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Regional tariff matrix, margin arbitrage governance, rate negotiation approvals, and smart grid intelligence
              </p>
            </div>
          </div>

          {/* AI Advisor Trigger Button */}
          <button
            id="fetch-ai-grid-advisor-btn"
            onClick={handleFetchAiAdvice}
            disabled={isLoadingAi}
            className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-500/20 transition flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{isLoadingAi ? 'Consulting Gemini AI...' : 'AI Grid & Tariff Advisor'}</span>
          </button>
        </div>
      </div>

      {/* Macro Analytics Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Platform Margin Earned */}
        <div className="bg-slate-900/40 border border-white/5 rounded-xl p-4 shadow-2xl backdrop-blur-sm">
          <div className="text-[11px] text-slate-500 font-bold tracking-widest uppercase mb-1">XYZ Margin Profit</div>
          <div className="text-2xl font-black font-mono text-purple-300">
            +${gridMetrics.totalPlatformMarginEarned24h.toFixed(2)}
          </div>
          <div className="text-[11px] text-purple-400 mt-1 font-mono">$0.04/kWh arbitrage spread</div>
        </div>

        {/* Volume Traded */}
        <div className="bg-slate-900/40 border border-white/5 rounded-xl p-4 shadow-2xl backdrop-blur-sm">
          <div className="text-[11px] text-slate-500 font-bold tracking-widest uppercase mb-1">Volume Traded</div>
          <div className="text-2xl font-black font-mono text-sky-400">
            {gridMetrics.totalVolumeTraded24hKwh.toFixed(1)} <span className="text-xs font-normal text-slate-400 uppercase font-mono">kWh</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">{gridMetrics.activeSolarPlantsCount} Plants • {gridMetrics.activeConsumersCount} Buyers</div>
        </div>

        {/* Prosumer Payouts */}
        <div className="bg-slate-900/40 border border-white/5 rounded-xl p-4 shadow-2xl backdrop-blur-sm">
          <div className="text-[11px] text-slate-500 font-bold tracking-widest uppercase mb-1">Prosumer Disbursals</div>
          <div className="text-2xl font-black font-mono text-amber-400">
            ${gridMetrics.totalProsumerEarnings24h.toFixed(2)}
          </div>
          <div className="text-[11px] text-amber-300/80 mt-1 font-mono">Avg buyback: $0.142/kWh</div>
        </div>

        {/* Consumer Savings */}
        <div className="bg-slate-900/40 border border-white/5 rounded-xl p-4 shadow-2xl backdrop-blur-sm">
          <div className="text-[11px] text-slate-500 font-bold tracking-widest uppercase mb-1">Consumer Savings</div>
          <div className="text-2xl font-black font-mono text-emerald-400">
            +${gridMetrics.totalConsumerSavings24h.toFixed(2)}
          </div>
          <div className="text-[11px] text-emerald-400/80 mt-1 font-mono">vs standard public retail</div>
        </div>

        {/* Carbon Offset */}
        <div className="bg-slate-900/40 border border-white/5 rounded-xl p-4 shadow-2xl backdrop-blur-sm">
          <div className="text-[11px] text-slate-500 font-bold tracking-widest uppercase mb-1">CO₂ Abated</div>
          <div className="text-2xl font-black font-mono text-white">
            {gridMetrics.totalCo2Offset24hKg} <span className="text-xs font-normal text-slate-400 uppercase font-mono">kg</span>
          </div>
          <div className="text-[11px] text-teal-400 mt-1 font-mono">0.85 kg/kWh clean factor</div>
        </div>
      </div>

      {/* AI Smart Grid Advisor Result Box (if generated) */}
      {aiAnalysis && (
        <div className="bg-gradient-to-r from-purple-950/90 via-slate-900 to-indigo-950/90 border border-purple-500/50 rounded-2xl p-6 shadow-2xl relative animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-slate-100">
                Gemini AI Algorithmic Grid Advisor &amp; Tariff Insights
              </h3>
            </div>
            <button
              onClick={() => setAiAnalysis(null)}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              Dismiss
            </button>
          </div>
          <div className="text-xs text-slate-300 whitespace-pre-line leading-relaxed font-sans bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            {aiAnalysis}
          </div>
        </div>
      )}

      {/* AI Smart Grid Advisor Result Box (if generated) */}
      {aiAnalysis && (
        <div className="bg-gradient-to-r from-purple-950/90 via-slate-900 to-indigo-950/90 border border-purple-500/50 rounded-2xl p-6 shadow-2xl relative animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-slate-100">
                Gemini AI Algorithmic Grid Advisor &amp; Tariff Insights
              </h3>
            </div>
            <button
              onClick={() => setAiAnalysis(null)}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              Dismiss
            </button>
          </div>
          <div className="text-xs text-slate-300 whitespace-pre-line leading-relaxed font-sans bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            {aiAnalysis}
          </div>
        </div>
      )}

      {/* REAL-TIME GRID STATUS MONITORING FEATURE */}
      {(() => {
        const supplyKwh = gridMetrics.totalSurplusAvailableKwh;
        const demandKwh = gridMetrics.totalDemandWaitingKwh;
        const netBalance = gridMetrics.netGridBalanceKwh;
        const isSurplus = netBalance > 2.0;
        const isDeficit = netBalance < -2.0;
        const isBalanced = !isSurplus && !isDeficit;

        const totalVol = Math.max(1, supplyKwh + demandKwh);
        const supplyPct = Math.round((supplyKwh / totalVol) * 100);
        const demandPct = 100 - supplyPct;

        // 24-hour Chart Data
        const grid24hData = Array.from({ length: 24 }).map((_, h) => {
          let irradiance = 0;
          if (h >= 6 && h <= 18) {
            const angle = ((h - 6) / 12) * Math.PI;
            irradiance = Math.sin(angle);
          }
          const weatherMult = simState.weatherCondition === 'SUNNY' ? 1.0 : simState.weatherCondition === 'PARTLY_CLOUDY' ? 0.75 : 0.45;
          const solarSupply = parseFloat((irradiance * 220 * weatherMult).toFixed(1));
          
          let baseLoad = 50;
          if ((h >= 7 && h <= 9) || (h >= 17 && h <= 21)) {
            baseLoad = 120;
          } else if (h >= 10 && h <= 16) {
            baseLoad = 75;
          }
          const consumerDemand = parseFloat((baseLoad + Math.sin(h * 0.5) * 8).toFixed(1));
          return {
            time: `${h.toString().padStart(2, '0')}:00`,
            solarSupply,
            consumerDemand,
            netBalance: parseFloat((solarSupply - consumerDemand).toFixed(1))
          };
        });

        const currentHourLabel = `${Math.floor(simState.currentSimHour).toString().padStart(2, '0')}:00`;

        return (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-sm space-y-6">
            <div className="absolute inset-0 opacity-10 pointer-events-none grid-pattern-bg"></div>

            {/* Header Title & Streaming Pulse Badge */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
              <div>
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-lg font-bold text-slate-100">
                    Real-Time Grid Status Monitor (Aggregated Supply vs. Demand)
                  </h2>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Synchronized live telemetric analysis across all regional microgrid transformer zones
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-slate-300">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  LIVE TELEMETRY
                </span>

                <button
                  onClick={handleQuickStep}
                  disabled={isStepping}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 transition flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isStepping ? 'animate-spin text-emerald-400' : ''}`} />
                  <span>Step (+15m)</span>
                </button>

                <button
                  onClick={handleQuickMatch}
                  disabled={isMatching}
                  className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs rounded-lg shadow-lg shadow-emerald-500/20 transition flex items-center gap-1.5"
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Clear P2P Pool</span>
                </button>
              </div>
            </div>

            {actionFeedback && (
              <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                {actionFeedback}
              </div>
            )}

            {/* Dynamic System State Indicator Banner */}
            <div className={`p-5 rounded-2xl border backdrop-blur-md relative overflow-hidden transition-all shadow-xl ${
              isSurplus
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200 shadow-emerald-500/10'
                : isDeficit
                ? 'bg-amber-950/40 border-amber-500/40 text-amber-200 shadow-amber-500/10'
                : 'bg-cyan-950/40 border-cyan-500/40 text-cyan-200 shadow-cyan-500/10'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold shadow-inner ${
                    isSurplus
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : isDeficit
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                  }`}>
                    {isSurplus ? <Sun className="w-7 h-7" /> : isDeficit ? <AlertTriangle className="w-7 h-7" /> : <BarChart2 className="w-7 h-7" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-slate-950/80 border border-slate-800">
                        SYSTEM GRID STATE
                      </span>
                      <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                        isSurplus
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : isDeficit
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      }`}>
                        {isSurplus ? '🟢 SURPLUS STATE' : isDeficit ? '🟡 DEFICIT STATE' : '🔵 BALANCED EQUILIBRIUM'}
                      </span>
                    </div>

                    <h3 className="text-xl font-black font-mono mt-1 text-slate-100 flex items-center gap-2">
                      Net Balance: {netBalance >= 0 ? '+' : ''}{netBalance.toFixed(2)} kWh
                      <span className="text-xs font-normal text-slate-400 font-sans">
                        ({supplyKwh.toFixed(1)} kWh Generation vs {demandKwh.toFixed(1)} kWh Demand)
                      </span>
                    </h3>
                  </div>
                </div>

                <div className="text-xs text-slate-300 sm:text-right font-mono space-y-1">
                  <div>Irradiance: <strong className="text-amber-300">{simState.solarIrradiancePct}%</strong> ({simState.weatherCondition})</div>
                  <div>Frequency: <strong className="text-emerald-300">60.01 Hz</strong> ±0.02</div>
                  <div>Sim Clock: <strong className="text-cyan-300">{simState.currentSimHour.toFixed(2)} hrs</strong></div>
                </div>
              </div>

              <p className="text-xs mt-3 pt-3 border-t border-slate-800/80 text-slate-300 font-sans">
                {isSurplus && '🟢 Active surplus detected! Platform algorithm is executing P2P matched transfers and storing excess energy in virtual microgrid battery buffers.'}
                {isDeficit && '⚠️ Active consumer demand exceeds rooftop solar generation! Supplemental utility grid backup is seamlessly maintaining grid power stability.'}
                {isBalanced && '🔵 Optimal P2P equilibrium! Local rooftop solar generation perfectly matches consumer demand within microgrid tolerance.'}
              </p>
            </div>

            {/* Aggregated Visual Comparison Split Bar */}
            <div className="bg-slate-950/80 p-5 rounded-xl border border-slate-800 space-y-3">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-amber-400 font-bold flex items-center gap-1.5">
                  <Sun className="w-4 h-4" /> Aggregated Solar Supply: {supplyKwh.toFixed(1)} kWh ({supplyPct}%)
                </span>
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <Zap className="w-4 h-4" /> Total Consumer Demand: {demandKwh.toFixed(1)} kWh ({demandPct}%)
                </span>
              </div>

              {/* Dynamic Stacked Split Bar */}
              <div className="w-full bg-slate-900 h-4 rounded-full overflow-hidden flex border border-slate-800 p-0.5 gap-0.5">
                <div
                  className="bg-gradient-to-r from-amber-500 to-amber-400 h-full rounded-l-full transition-all duration-500 relative group"
                  style={{ width: `${Math.max(5, supplyPct)}%` }}
                >
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition"></div>
                </div>
                <div
                  className="bg-gradient-to-r from-emerald-400 to-teal-500 h-full rounded-r-full transition-all duration-500 relative group"
                  style={{ width: `${Math.max(5, demandPct)}%` }}
                >
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition"></div>
                </div>
              </div>

              <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono">
                <span>{installations.length} Active Prosumer Systems Connected</span>
                <span>{users.filter(u => u.role === 'CONSUMER').length} Subscribed Clean Energy Consumers</span>
              </div>
            </div>

            {/* 24-Hour Solar Generation vs Consumer Demand Recharts Curve */}
            <div className="bg-slate-950/90 p-5 rounded-xl border border-slate-800/90 space-y-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-cyan-400" />
                    24-Hour Solar Generation vs. Consumer Demand Curve
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Live curve overlay showing daylight solar peak vs morning/evening consumer demand profiles
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-mono">
                  <span className="flex items-center gap-1 text-amber-400">
                    <span className="w-2.5 h-2.5 bg-amber-400 rounded-sm"></span> Solar Supply (kWh)
                  </span>
                  <span className="flex items-center gap-1 text-sky-400">
                    <span className="w-2.5 h-2.5 bg-sky-400 rounded-sm"></span> Consumer Demand (kWh)
                  </span>
                </div>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={grid24hData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSolarAdmin" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px' }}
                      formatter={(val: any, name: any) => [
                        `${val} kWh`,
                        name === 'solarSupply' ? 'Solar Supply' : name === 'consumerDemand' ? 'Consumer Demand' : 'Net Balance'
                      ]}
                    />
                    <ReferenceLine x={currentHourLabel} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'NOW', fill: '#10b981', fontSize: 10, position: 'top' }} />
                    <Area type="monotone" dataKey="solarSupply" stroke="#f59e0b" fillOpacity={1} fill="url(#colorSolarAdmin)" strokeWidth={2} />
                    <Line type="monotone" dataKey="consumerDemand" stroke="#38bdf8" strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Microgrid Regional Zone Balances Matrix */}
            <div>
              <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                Microgrid Transformer Zones — Real-Time Balance Breakdown
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {zonePools.map((pool: any) => {
                  const pSurplus = pool.balanceKwh >= 0;
                  return (
                    <div key={pool.zoneId} className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2 hover:border-slate-700 transition">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-xs text-slate-200">{pool.zoneName}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          pSurplus ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' : 'bg-amber-950 text-amber-400 border border-amber-500/30'
                        }`}>
                          {pSurplus ? 'SURPLUS' : 'DEFICIT'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1">
                        <div>
                          <span className="text-slate-500 block">Supply</span>
                          <span className="text-amber-400 font-bold">{pool.surplusKwh} kWh</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Demand</span>
                          <span className="text-emerald-400 font-bold">{pool.demandKwh} kWh</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800/80 flex justify-between text-[11px] font-mono">
                        <span className="text-slate-400">Net Flow:</span>
                        <span className={`font-bold ${pSurplus ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {pSurplus ? '+' : ''}{pool.balanceKwh} kWh
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Dynamic Regional Tariff Matrix Management */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-purple-400" />
              Regional Dynamic Tariff Matrix &amp; Platform Spread
            </h2>
            <p className="text-xs text-slate-400">
              Configure government utility benchmarks, XYZ prosumer buyback, consumer sales rates, and platform margin per zone
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3">Zone / Region</th>
                <th className="p-3">Gov Retail ($/kWh)</th>
                <th className="p-3">Gov Buyback ($/kWh)</th>
                <th className="p-3">XYZ Buy from Prosumer ($/kWh)</th>
                <th className="p-3">XYZ Sell to Consumer ($/kWh)</th>
                <th className="p-3">XYZ Platform Margin</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono">
              {zones.map(zone => {
                const isEditing = editingZoneId === zone.zoneId;
                return (
                  <tr key={zone.zoneId} className="hover:bg-slate-800/30">
                    <td className="p-3 font-sans font-semibold text-slate-200">
                      <div>{zone.zoneName}</div>
                      <div className="text-[10px] text-slate-500 font-mono font-normal">{zone.pincodes.join(', ')}</div>
                    </td>

                    <td className="p-3 text-slate-400">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.005"
                          value={tariffForm.govtGridRetailRate}
                          onChange={e => setTariffForm({ ...tariffForm, govtGridRetailRate: parseFloat(e.target.value) })}
                          className="w-20 bg-slate-950 border border-slate-700 px-2 py-1 rounded text-slate-100"
                        />
                      ) : (
                        `$${zone.govtGridRetailRate.toFixed(3)}`
                      )}
                    </td>

                    <td className="p-3 text-slate-400">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.005"
                          value={tariffForm.govtBuybackRate}
                          onChange={e => setTariffForm({ ...tariffForm, govtBuybackRate: parseFloat(e.target.value) })}
                          className="w-20 bg-slate-950 border border-slate-700 px-2 py-1 rounded text-slate-100"
                        />
                      ) : (
                        `$${zone.govtBuybackRate.toFixed(3)}`
                      )}
                    </td>

                    <td className="p-3 text-amber-300 font-bold">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.005"
                          value={tariffForm.xyzDefaultBuyRate}
                          onChange={e => setTariffForm({ ...tariffForm, xyzDefaultBuyRate: parseFloat(e.target.value) })}
                          className="w-20 bg-slate-950 border border-slate-700 px-2 py-1 rounded text-amber-300"
                        />
                      ) : (
                        `$${zone.xyzDefaultBuyRate.toFixed(3)}`
                      )}
                    </td>

                    <td className="p-3 text-emerald-400 font-bold">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.005"
                          value={tariffForm.xyzDefaultSellRate}
                          onChange={e => setTariffForm({ ...tariffForm, xyzDefaultSellRate: parseFloat(e.target.value) })}
                          className="w-20 bg-slate-950 border border-slate-700 px-2 py-1 rounded text-emerald-400"
                        />
                      ) : (
                        `$${zone.xyzDefaultSellRate.toFixed(3)}`
                      )}
                    </td>

                    <td className="p-3 text-purple-300 font-bold">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.005"
                          value={tariffForm.xyzPlatformMarginRate}
                          onChange={e => setTariffForm({ ...tariffForm, xyzPlatformMarginRate: parseFloat(e.target.value) })}
                          className="w-20 bg-slate-950 border border-slate-700 px-2 py-1 rounded text-purple-300"
                        />
                      ) : (
                        `+$${zone.xyzPlatformMarginRate.toFixed(3)}`
                      )}
                    </td>

                    <td className="p-3 text-right">
                      {isEditing ? (
                        <button
                          onClick={() => handleSaveTariff(zone.zoneId)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-sans font-semibold text-xs flex items-center gap-1 ml-auto"
                        >
                          <Save className="w-3.5 h-3.5" /> Save
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStartEditTariff(zone)}
                          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-sans text-xs flex items-center gap-1 ml-auto"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid: Pending Prosumer Rate Bids Queue & Manual Meter Verification Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Rate Bids Approval Queue */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-400" />
                Rate Bidding &amp; Negotiation Approval Queue
              </h3>
              <p className="text-xs text-slate-400">Review custom prosumer buyback proposals</p>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-950 text-amber-400 border border-amber-500/30">
              {pendingBids.length} Pending
            </span>
          </div>

          {pendingBids.length === 0 ? (
            <div className="p-6 text-center bg-slate-950/50 rounded-xl border border-slate-800 text-xs text-slate-400">
              No pending prosumer rate proposals awaiting review.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingBids.map(bid => (
                <div key={bid.id} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-bold text-sm text-slate-100">{bid.prosumerName}</div>
                      <div className="text-[11px] text-slate-400">
                        Plant: {bid.plantCapacityKwp} kWp • Zone: {bid.zoneId}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-400 font-mono">Current: ${bid.currentAgreedRate}/kWh</div>
                      <div className="text-sm font-bold text-amber-400 font-mono">Proposed: ${bid.proposedRatePerKwh}/kWh</div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 my-2">
                    &ldquo;{bid.prosumerNotes}&rdquo;
                  </p>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80 text-xs">
                    <button
                      onClick={() => handleOpenCounterOffer(bid)}
                      className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold rounded-lg border border-amber-500/30 transition flex items-center gap-1"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> Counter-Offer
                    </button>
                    <button
                      onClick={() => handleBidDecision(bid.id, 'REJECTED')}
                      className="px-3 py-1.5 bg-rose-950 hover:bg-rose-900 text-rose-300 font-semibold rounded-lg border border-rose-500/30 transition flex items-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                    <button
                      onClick={() => handleBidDecision(bid.id, 'ACCEPTED')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Accept &amp; Bind Rate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Manual Telemetry Verification Queue */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-400" />
                Manual Telemetry Submission Verification
              </h3>
              <p className="text-xs text-slate-400">Validate physical solar meter photo proof uploads</p>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-500/30">
              {manualSubmissions.length} Pending
            </span>
          </div>

          {manualSubmissions.length === 0 ? (
            <div className="p-6 text-center bg-slate-950/50 rounded-xl border border-slate-800 text-xs text-slate-400">
              All manual meter readings are verified. IoT telemetry stream is healthy.
            </div>
          ) : (
            <div className="space-y-3">
              {manualSubmissions.map(sub => (
                <div key={sub.id} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="flex justify-between items-start mb-2 text-xs">
                    <div>
                      <span className="font-bold text-slate-100 text-sm">{sub.prosumerName}</span>
                      <span className="text-slate-400 ml-2 font-mono">Meter: {sub.meterId}</span>
                    </div>
                    <span className="text-slate-500 font-mono">{new Date(sub.timestamp).toLocaleDateString()}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 my-2 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs font-mono">
                    <div>
                      <span className="text-slate-400">Generated:</span>{' '}
                      <strong className="text-amber-400">{sub.unitsGeneratedKwh} kWh</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Export Surplus:</span>{' '}
                      <strong className="text-emerald-400">{sub.unitsExportedKwh} kWh</strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                    <span className="text-slate-400 italic text-[11px]">&ldquo;{sub.verificationNotes}&rdquo;</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleVerifyTelemetry(sub.id, false)}
                        className="px-2.5 py-1 bg-rose-950 hover:bg-rose-900 text-rose-300 rounded font-semibold transition"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleVerifyTelemetry(sub.id, true)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold transition"
                      >
                        Verify Reading
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Counter Offer Modal */}
      {activeCounterBid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-slate-100">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-1">
              <MessageSquare className="w-5 h-5 text-amber-400" />
              Propose Admin Counter-Offer
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Send a counter-rate proposal to {activeCounterBid.prosumerName} for contract binding.
            </p>

            <form onSubmit={handleSubmitCounterOffer} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Counter Buyback Rate ($/kWh)</label>
                <input
                  type="number"
                  step="0.001"
                  min="0.08"
                  max="0.25"
                  value={counterRate}
                  onChange={e => setCounterRate(parseFloat(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono text-base font-bold"
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Prosumer asked for: ${activeCounterBid.proposedRatePerKwh}/kWh (Current: ${activeCounterBid.currentAgreedRate}/kWh)
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Admin Negotiation Notes</label>
                <textarea
                  rows={3}
                  value={adminNotes}
                  onChange={e => setAdminNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveCounterBid(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCounter}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition"
                >
                  {isSubmittingCounter ? 'Sending...' : 'Send Counter-Offer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
