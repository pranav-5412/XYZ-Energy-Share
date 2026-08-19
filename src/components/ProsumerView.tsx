import React, { useState } from 'react';
import {
  Sun,
  Zap,
  TrendingUp,
  DollarSign,
  Leaf,
  FileText,
  Upload,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  Activity,
  Sliders,
  ShieldAlert,
  ArrowDownLeft,
  Building,
  RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import {
  User,
  SolarInstallation,
  Wallet,
  TariffZone,
  NegotiationBid,
  TelemetryLog,
  Invoice,
  SimulationState
} from '../types/index.ts';
import { api } from '../services/api.ts';

interface ProsumerViewProps {
  currentUser: User;
  installation: SolarInstallation;
  wallet: Wallet;
  zone: TariffZone;
  telemetryLogs: TelemetryLog[];
  bids: NegotiationBid[];
  invoices: Invoice[];
  simState: SimulationState;
  onRefreshData: () => void;
  onViewInvoice: (invoice: Invoice) => void;
}

export const ProsumerView: React.FC<ProsumerViewProps> = ({
  currentUser,
  installation,
  wallet,
  zone,
  telemetryLogs,
  bids,
  invoices,
  simState,
  onRefreshData,
  onViewInvoice
}) => {
  // Bidding Form state
  const [showBidModal, setShowBidModal] = useState(false);
  const [proposedRate, setProposedRate] = useState((installation?.agreedBuybackRatePerKwh || 0.15) + 0.01);
  const [estMonthlyExport, setEstMonthlyExport] = useState(1500);
  const [prosumerNotes, setProsumerNotes] = useState('');
  const [isSubmittingBid, setIsSubmittingBid] = useState(false);

  // Manual submission state
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualGenKwh, setManualGenKwh] = useState(48.5);
  const [manualExpKwh, setManualExpKwh] = useState(36.2);
  const [manualNotes, setManualNotes] = useState('Monthly physical meter reading with utility bill snapshot.');
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);

  // Payout withdrawal state
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState(50);
  const [bankAccount, setBankAccount] = useState('Chase Renewable Checking (****7721)');
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);

  // Filter logs for this prosumer
  const prosumerLogs = telemetryLogs.filter(
    l => l.prosumerId === currentUser.id || l.meterId === installation?.meterId
  );

  // Prepare chart data (24-hour bell curve)
  const chartData = prosumerLogs.slice(0, 96).reverse().map(l => {
    const timeStr = new Date(l.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return {
      time: timeStr,
      generated: l.unitsGeneratedKwh,
      exported: l.unitsExportedKwh,
      selfConsumed: l.unitsSelfConsumedKwh,
      voltage: l.gridVoltageVolts
    };
  });

  const handleProsumerBidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingBid(true);
    try {
      await api.submitBid({
        prosumerId: currentUser.id,
        proposedRatePerKwh: Number(proposedRate),
        estimatedMonthlyExportKwh: Number(estMonthlyExport),
        prosumerNotes
      });
      setShowBidModal(false);
      setProsumerNotes('');
      onRefreshData();
    } catch (err) {
      alert('Failed to submit rate proposal');
    } finally {
      setIsSubmittingBid(false);
    }
  };

  const handleCounterDecision = async (bidId: string, accept: boolean) => {
    try {
      await api.decideProsumerCounter(bidId, accept);
      onRefreshData();
    } catch (err) {
      alert('Failed to process counter-offer decision');
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingManual(true);
    try {
      await api.manualSubmitTelemetry({
        prosumerId: currentUser.id,
        meterId: installation.meterId,
        unitsGeneratedKwh: Number(manualGenKwh),
        unitsExportedKwh: Number(manualExpKwh),
        verificationNotes: manualNotes,
        proofDocumentUrl: 'https://images.unsplash.com/photo-1558441719-2f7bb7e2d93e?w=500&auto=format&fit=crop&q=60'
      });
      setShowManualModal(false);
      onRefreshData();
    } catch (err) {
      alert('Failed to submit manual reading');
    } finally {
      setIsSubmittingManual(false);
    }
  };

  const handlePayoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingPayout(true);
    try {
      await api.payoutWallet(currentUser.id, Number(payoutAmount), bankAccount);
      setShowPayoutModal(false);
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Withdrawal failed');
    } finally {
      setIsSubmittingPayout(false);
    }
  };

  const govBuyRate = zone?.govtBuybackRate || 0.08;
  const agreedRate = installation?.agreedBuybackRatePerKwh || zone?.xyzDefaultBuyRate || 0.15;
  const premiumPct = Math.round(((agreedRate - govBuyRate) / govBuyRate) * 100);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner: Solar Plant & Tariff Contract Status */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-950/70 via-slate-900 to-emerald-950/70 border border-amber-500/30 p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
              <Sun className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-100">{currentUser.name}&apos;s Solar Array</h1>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                  {installation?.gridConnectionStatus || 'ACTIVE'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 flex items-center gap-2">
                <span>{installation?.address}</span>
                <span>•</span>
                <span className="font-mono text-amber-300">Meter ID: {installation?.meterId}</span>
                <span>•</span>
                <span>Zone: {zone?.zoneName}</span>
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-3 text-xs">
                <span className="bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800 text-slate-300">
                  Inverter: <strong>{installation?.inverterModel}</strong>
                </span>
                <span className="bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800 text-slate-300">
                  Efficiency: <strong>{installation?.efficiencyRatingPct}% MPPT</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Rate & Payout Card */}
          <div className="flex flex-wrap items-center gap-3 bg-slate-950/90 p-4 rounded-xl border border-slate-800/90">
            <div>
              <div className="text-[11px] text-slate-400 uppercase font-semibold">Active XYZ Buyback Rate</div>
              <div className="text-2xl font-black font-mono text-emerald-400 flex items-baseline gap-1">
                ${agreedRate.toFixed(3)}
                <span className="text-xs font-normal text-slate-400">/kWh</span>
              </div>
              <div className="text-[11px] text-amber-300 font-medium mt-0.5">
                +{premiumPct}% higher than Gov Tariff (${govBuyRate}/kWh)
              </div>
            </div>

            <div className="h-10 w-px bg-slate-800 hidden sm:block" />

            <div className="flex flex-col gap-2">
              <button
                id="propose-rate-bid-btn"
                onClick={() => setShowBidModal(true)}
                className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-lg shadow-lg transition flex items-center justify-center gap-1.5"
              >
                <DollarSign className="w-4 h-4" />
                <span>Negotiate Rate</span>
              </button>

              <button
                id="manual-reading-btn"
                onClick={() => setShowManualModal(true)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition flex items-center justify-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5 text-slate-400" />
                <span>Manual Reading</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Plant Capacity */}
        <div className="bg-slate-900/40 border border-white/5 rounded-xl p-4 shadow-2xl backdrop-blur-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-500 font-bold tracking-widest uppercase">Installed Capacity</div>
            <div className="text-2xl font-bold font-mono text-slate-100 mt-1">
              {installation?.plantCapacityKwp} <span className="text-xs font-normal text-slate-400 font-mono uppercase">kWp</span>
            </div>
            <div className="text-[11px] text-emerald-400 mt-1 font-mono">Tier-1 Monocrystalline</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Sun className="w-5 h-5" />
          </div>
        </div>

        {/* Wallet Balance & Instant Payout */}
        <div className="bg-slate-900/40 border border-white/5 rounded-xl p-4 shadow-2xl backdrop-blur-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-500 font-bold tracking-widest uppercase">Virtual Wallet Balance</div>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
              ${wallet?.balance.toFixed(2)}
            </div>
            <button
              onClick={() => setShowPayoutModal(true)}
              className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold underline mt-1 flex items-center gap-1 font-mono"
            >
              Withdraw Payout <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Lifetime Exported Units */}
        <div className="bg-slate-900/40 border border-white/5 rounded-xl p-4 shadow-2xl backdrop-blur-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-500 font-bold tracking-widest uppercase">Clean Energy Exported</div>
            <div className="text-2xl font-bold font-mono text-teal-300 mt-1">
              {wallet?.totalEnergyExportedKwh.toLocaleString()} <span className="text-xs font-normal text-slate-400 font-mono uppercase">kWh</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono">Total Earned: ${wallet?.totalEarned.toFixed(2)}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
            <Zap className="w-5 h-5" />
          </div>
        </div>

        {/* Carbon Abated */}
        <div className="bg-slate-900/40 border border-white/5 rounded-xl p-4 shadow-2xl backdrop-blur-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-500 font-bold tracking-widest uppercase">CO₂ Offset Contributed</div>
            <div className="text-2xl font-bold font-mono text-emerald-300 mt-1">
              {(wallet?.totalEnergyExportedKwh * 0.85).toFixed(0)} <span className="text-xs font-normal text-slate-400 font-mono uppercase">kg</span>
            </div>
            <div className="text-[11px] text-teal-400 mt-1 font-mono">~{Math.round((wallet?.totalEnergyExportedKwh * 0.85) / 21)} trees planted</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
            <Leaf className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Visual: 24h Solar Daylight Bell Curve & Export Chart */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Activity className="w-5 h-5 text-amber-400" />
              Daylight Generation vs. Microgrid Export Bell Curve
            </h2>
            <p className="text-xs text-slate-400">
              15-minute smart meter telemetry stream showing self-consumption vs surplus exported to XYZ pool
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-400"></span>
              <span className="text-slate-300">Generated</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span className="text-slate-300">Exported to XYZ</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-sky-400"></span>
              <span className="text-slate-300">Self-Consumed</span>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="genGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="selfGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
              <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} interval={8} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} unit=" kWh" />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                labelStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
              />
              <Area type="monotone" dataKey="generated" stroke="#f59e0b" strokeWidth={2.5} fillOpacity={1} fill="url(#genGrad)" name="Generated (kWh)" />
              <Area type="monotone" dataKey="exported" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#expGrad)" name="Exported to XYZ (kWh)" />
              <Area type="monotone" dataKey="selfConsumed" stroke="#38bdf8" strokeWidth={1.5} fillOpacity={1} fill="url(#selfGrad)" name="Self-Consumed (kWh)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid: Rate Bidding Negotiations & Recent Telemetry Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Rate Bids & Negotiation Engine */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-amber-400" />
                  P2P Rate Proposals &amp; Bids
                </h3>
                <p className="text-xs text-slate-400">Custom buyback rate negotiation with XYZ Energy Org</p>
              </div>
              <button
                onClick={() => setShowBidModal(true)}
                className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold rounded-lg border border-amber-500/30 transition"
              >
                + New Proposal
              </button>
            </div>

            {bids.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/50 rounded-xl border border-slate-800 text-xs text-slate-400">
                No active rate proposals. You are currently trading at the standard agreed contract rate of ${agreedRate}/kWh.
              </div>
            ) : (
              <div className="space-y-3">
                {bids.map(bid => (
                  <div key={bid.id} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-200">
                            Proposed: ${bid.proposedRatePerKwh.toFixed(3)}/kWh
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            bid.status === 'ACCEPTED' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' :
                            bid.status === 'COUNTER_OFFER' ? 'bg-amber-950 text-amber-400 border border-amber-500/30 animate-pulse' :
                            bid.status === 'REJECTED' ? 'bg-rose-950 text-rose-400 border border-rose-500/30' :
                            'bg-slate-800 text-slate-300'
                          }`}>
                            {bid.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{bid.prosumerNotes}</p>
                        <div className="text-[11px] text-slate-500 mt-1 font-mono">
                          Est. Monthly Export: {bid.estimatedMonthlyExportKwh} kWh • Submitted {new Date(bid.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-[11px] text-slate-400">Current Rate</div>
                        <div className="text-xs font-mono font-semibold text-slate-300">${bid.currentAgreedRate}/kWh</div>
                      </div>
                    </div>

                    {/* Counter Offer Interaction Box */}
                    {bid.status === 'COUNTER_OFFER' && bid.counterRatePerKwh && (
                      <div className="mt-3 p-3 rounded-lg bg-amber-950/50 border border-amber-500/40">
                        <div className="flex items-center justify-between text-xs">
                          <div>
                            <span className="font-semibold text-amber-300">XYZ Admin Counter-Offer:</span>{' '}
                            <strong className="font-mono text-emerald-400 text-sm">${bid.counterRatePerKwh.toFixed(3)}/kWh</strong>
                            <p className="text-[11px] text-amber-200/80 mt-0.5">{bid.adminNotes}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleCounterDecision(bid.id, true)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded transition"
                            >
                              Accept Rate
                            </button>
                            <button
                              onClick={() => handleCounterDecision(bid.id, false)}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded transition"
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Double-Entry Virtual Wallet & Ledger Activity */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                Virtual Wallet &amp; Payout Ledger
              </h3>
              <p className="text-xs text-slate-400">Double-entry export settlements credited per 15-minute trade</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                ${wallet?.balance.toFixed(2)} USD
              </span>
            </div>
          </div>

          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {wallet?.ledgerHistory.map(entry => (
              <div key={entry.id} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    entry.type === 'CREDIT' ? 'bg-emerald-500/20 text-emerald-400' :
                    entry.type === 'PAYOUT' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {entry.type === 'CREDIT' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-200">{entry.description}</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {new Date(entry.timestamp).toLocaleString()} • Ref: {entry.referenceType}
                    </div>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className={`font-bold ${entry.type === 'CREDIT' ? 'text-emerald-400' : 'text-slate-300'}`}>
                    {entry.type === 'CREDIT' ? '+' : '-'}${entry.amount.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-500">Bal: ${entry.balanceAfter.toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Invoices & Settlement Statements Section */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-400" />
              Monthly Generation &amp; Earnings Statements
            </h3>
            <p className="text-xs text-slate-400">Formal export credits and carbon accounting records</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {invoices.map(inv => (
            <div key={inv.id} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition">
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-mono font-semibold text-slate-300">{inv.invoiceNumber}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                    {inv.status}
                  </span>
                </div>
                <div className="text-sm font-bold text-slate-100">{inv.billingPeriodStart} to {inv.billingPeriodEnd}</div>
                <div className="text-xs text-slate-400 mt-1 font-mono">
                  Export Volume: <strong>{inv.totalKwh} kWh</strong>
                </div>
                <div className="text-xs text-emerald-400 font-mono mt-0.5">
                  Extra Earned vs Utility: <strong>+${inv.netSavingsAmount.toFixed(2)}</strong>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <div className="text-lg font-black font-mono text-emerald-400">
                  ${inv.totalAmount.toFixed(2)}
                </div>
                <button
                  onClick={() => onViewInvoice(inv)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition"
                >
                  View Statement
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* 1. Rate Proposal Negotiation Modal */}
      {showBidModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-slate-100">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-1">
              <TrendingUp className="w-5 h-5 text-amber-400" />
              Propose Custom Buyback Rate
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Submit your proposed $/kWh contract rate for review by XYZ Energy Supply Org.
            </p>

            <form onSubmit={handleProsumerBidSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Proposed Buyback Rate ($/kWh)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.001"
                    min={govBuyRate}
                    max={0.25}
                    value={proposedRate}
                    onChange={e => setProposedRate(parseFloat(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:border-amber-400 outline-none"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Current rate: ${agreedRate}/kWh • Benchmark Govt Feed-in: ${govBuyRate}/kWh
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Estimated Monthly Export Volume (kWh)</label>
                <input
                  type="number"
                  step="50"
                  min="100"
                  value={estMonthlyExport}
                  onChange={e => setEstMonthlyExport(parseInt(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:border-amber-400 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Justification / Generation Notes</label>
                <textarea
                  rows={3}
                  value={prosumerNotes}
                  onChange={e => setProsumerNotes(e.target.value)}
                  placeholder="e.g. Added high-efficiency bifacial panels with smart battery dispatch."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:border-amber-400 outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBidModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingBid}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition"
                >
                  {isSubmittingBid ? 'Submitting...' : 'Submit Rate Proposal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Manual Reading Submission Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-slate-100">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-1">
              <Upload className="w-5 h-5 text-emerald-400" />
              Manual Meter Reading Submission
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Fallback ingestion for meters without automatic IoT telemetry. Subject to admin verification.
            </p>

            <form onSubmit={handleManualSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Total Generated (kWh)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={manualGenKwh}
                    onChange={e => setManualGenKwh(parseFloat(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Surplus Exported (kWh)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={manualExpKwh}
                    onChange={e => setManualExpKwh(parseFloat(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Meter Snapshot / Proof Document</label>
                <div className="p-3 bg-slate-950 border border-dashed border-slate-700 rounded-lg flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-slate-800 flex items-center justify-center text-slate-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-200 font-semibold">solar_meter_reading_august.jpg</div>
                    <div className="text-[10px] text-emerald-400">Verified Image Attachment (1.8 MB)</div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Submission Notes</label>
                <textarea
                  rows={2}
                  value={manualNotes}
                  onChange={e => setManualNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingManual}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition"
                >
                  {isSubmittingManual ? 'Uploading...' : 'Submit for Verification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Payout Withdrawal Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-slate-100">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-1">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              Withdraw Export Earnings
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Transfer solar export credits directly to your verified bank account via Instant ACH.
            </p>

            <form onSubmit={handlePayoutSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Withdrawal Amount ($ USD)</label>
                <input
                  type="number"
                  step="1"
                  min="5"
                  max={wallet.balance}
                  value={payoutAmount}
                  onChange={e => setPayoutAmount(parseFloat(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono text-base font-bold"
                  required
                />
                <p className="text-[11px] text-emerald-400 mt-1 font-mono">
                  Available to withdraw: ${wallet.balance.toFixed(2)}
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Destination Bank Account</label>
                <select
                  value={bankAccount}
                  onChange={e => setBankAccount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                >
                  <option value="Chase Renewable Checking (****7721)">Chase Renewable Checking (****7721)</option>
                  <option value="Silicon Valley Community Bank (****4409)">Silicon Valley Community Bank (****4409)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPayoutModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPayout || payoutAmount > wallet.balance}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition"
                >
                  {isSubmittingPayout ? 'Processing...' : `Transfer $${payoutAmount.toFixed(2)}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
