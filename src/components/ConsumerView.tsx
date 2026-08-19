import React, { useState } from 'react';
import {
  Zap,
  TrendingDown,
  DollarSign,
  Leaf,
  FileText,
  CreditCard,
  CheckCircle2,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  ShoppingBag,
  Percent,
  Sliders,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import {
  User,
  ConsumerProfile,
  Wallet,
  TariffZone,
  Invoice,
  SimulationState
} from '../types/index.ts';
import { api } from '../services/api.ts';

interface ConsumerViewProps {
  currentUser: User;
  profile: ConsumerProfile;
  wallet: Wallet;
  zone: TariffZone;
  invoices: Invoice[];
  simState: SimulationState;
  onRefreshData: () => void;
  onViewInvoice: (invoice: Invoice) => void;
}

export const ConsumerView: React.FC<ConsumerViewProps> = ({
  currentUser,
  profile,
  wallet,
  zone,
  invoices,
  simState,
  onRefreshData,
  onViewInvoice
}) => {
  // Topup modal state
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [topupAmount, setTopupAmount] = useState(100);
  const [isSubmittingTopup, setIsSubmittingTopup] = useState(false);

  // Quota config state
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [monthlyQuotaKwh, setMonthlyQuotaKwh] = useState(profile?.monthlyRequirementKwh || 2000);
  const [contractType, setContractType] = useState<'SUBSCRIPTION' | 'ON_DEMAND'>(profile?.contractType || 'SUBSCRIPTION');
  const [isSubmittingQuota, setIsSubmittingQuota] = useState(false);

  const govRetailRate = zone?.govtGridRetailRate || 0.25;
  const xyzRetailRate = zone?.xyzDefaultSellRate || 0.18;
  const unitDiscount = parseFloat((govRetailRate - xyzRetailRate).toFixed(3));
  const discountPct = Math.round((unitDiscount / govRetailRate) * 100);

  // Financial comparison chart data (Monthly estimated bill comparison)
  const consumptionTiers = [
    { name: 'Jan', kwh: 1200 },
    { name: 'Feb', kwh: 1350 },
    { name: 'Mar', kwh: 1500 },
    { name: 'Apr', kwh: 1650 },
    { name: 'May', kwh: 1900 },
    { name: 'Jun', kwh: 2200 },
    { name: 'Jul', kwh: 2500 },
    { name: 'Aug', kwh: 2400 }
  ];

  const comparisonData = consumptionTiers.map(tier => {
    const govCost = parseFloat((tier.kwh * govRetailRate).toFixed(2));
    const xyzCost = parseFloat((tier.kwh * xyzRetailRate).toFixed(2));
    const savings = parseFloat((govCost - xyzCost).toFixed(2));
    return {
      month: tier.name,
      'Standard Gov Utility': govCost,
      'XYZ P2P Solar': xyzCost,
      'Net Dollar Savings': savings
    };
  });

  const handleTopupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingTopup(true);
    try {
      await api.topupWallet(currentUser.id, Number(topupAmount));
      setShowTopupModal(false);
      onRefreshData();
    } catch (err) {
      alert('Top-up failed');
    } finally {
      setIsSubmittingTopup(false);
    }
  };

  const handleQuotaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingQuota(true);
    try {
      await api.saveConsumerProfile({
        consumerId: currentUser.id,
        monthlyRequirementKwh: Number(monthlyQuotaKwh),
        contractType,
        connectedLoadKw: profile?.connectedLoadKw || 25,
        preferredMaxRatePerKwh: xyzRetailRate,
        pincode: currentUser.pincode,
        zoneId: currentUser.zoneId
      });
      setShowQuotaModal(false);
      onRefreshData();
    } catch (err) {
      alert('Failed to update subscription quota');
    } finally {
      setIsSubmittingQuota(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner: Consumer Clean Energy Subscription */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-teal-950/70 border border-emerald-500/30 p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner">
              <Zap className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-100">{currentUser.name}&apos;s Green Energy Account</h1>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                  {profile?.contractType || 'SUBSCRIPTION'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 flex items-center gap-2">
                <span>{currentUser.address}</span>
                <span>•</span>
                <span>Zone: {zone?.zoneName}</span>
                <span>•</span>
                <span>Connected Load: {profile?.connectedLoadKw} kW</span>
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-3 text-xs">
                <span className="bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800 text-slate-300">
                  Monthly Green Quota: <strong>{profile?.monthlyRequirementKwh.toLocaleString()} kWh</strong>
                </span>
                <span className="bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-500/30 text-emerald-300 font-semibold">
                  🌿 100% Verified Local Rooftop Solar
                </span>
              </div>
            </div>
          </div>

          {/* Quick Tariff & Purchase Card */}
          <div className="flex flex-wrap items-center gap-3 bg-slate-950/90 p-4 rounded-xl border border-slate-800/90">
            <div>
              <div className="text-[11px] text-slate-400 uppercase font-semibold">XYZ Clean Power Rate</div>
              <div className="text-2xl font-black font-mono text-emerald-400 flex items-baseline gap-1">
                ${xyzRetailRate.toFixed(3)}
                <span className="text-xs font-normal text-slate-400">/kWh</span>
              </div>
              <div className="text-[11px] text-emerald-300 font-medium mt-0.5">
                🎉 Save {discountPct}% vs Gov Utility (${govRetailRate}/kWh)
              </div>
            </div>

            <div className="h-10 w-px bg-slate-800 hidden sm:block" />

            <div className="flex flex-col gap-2">
              <button
                id="topup-wallet-btn"
                onClick={() => setShowTopupModal(true)}
                className="px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs rounded-lg shadow-lg transition flex items-center justify-center gap-1.5"
              >
                <CreditCard className="w-4 h-4" />
                <span>Top-Up Wallet</span>
              </button>

              <button
                id="adjust-quota-btn"
                onClick={() => setShowQuotaModal(true)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition flex items-center justify-center gap-1.5"
              >
                <Sliders className="w-3.5 h-3.5 text-slate-400" />
                <span>Adjust Quota</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cumulative Financial Savings */}
        <div className="bg-slate-900/40 border border-white/5 rounded-xl p-4 shadow-2xl backdrop-blur-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-500 font-bold tracking-widest uppercase">Cumulative Savings</div>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
              +${wallet?.totalFinancialSavings.toFixed(2)}
            </div>
            <div className="text-[11px] text-emerald-400/80 mt-1 font-mono">Saved vs Public Grid Bills</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        {/* Prepaid Wallet Balance */}
        <div className="bg-slate-900/40 border border-white/5 rounded-xl p-4 shadow-2xl backdrop-blur-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-500 font-bold tracking-widest uppercase">Wallet Prepaid Balance</div>
            <div className="text-2xl font-bold font-mono text-slate-100 mt-1">
              ${wallet?.balance.toFixed(2)}
            </div>
            <button
              onClick={() => setShowTopupModal(true)}
              className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold underline mt-1 flex items-center gap-1 font-mono"
            >
              Add Funds <CreditCard className="w-3 h-3" />
            </button>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Green Units Consumed */}
        <div className="bg-slate-900/40 border border-white/5 rounded-xl p-4 shadow-2xl backdrop-blur-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-500 font-bold tracking-widest uppercase">Green Solar Consumed</div>
            <div className="text-2xl font-bold font-mono text-teal-300 mt-1">
              {wallet?.totalEnergyConsumedKwh.toLocaleString()} <span className="text-xs font-normal text-slate-400 font-mono uppercase">kWh</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono">Total Paid: ${wallet?.totalSpent.toFixed(2)}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Zap className="w-5 h-5" />
          </div>
        </div>

        {/* Carbon Footprint Avoided */}
        <div className="bg-slate-900/40 border border-white/5 rounded-xl p-4 shadow-2xl backdrop-blur-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-500 font-bold tracking-widest uppercase">Carbon Emissions Avoided</div>
            <div className="text-2xl font-bold font-mono text-emerald-300 mt-1">
              {(wallet?.totalEnergyConsumedKwh * 0.85).toFixed(0)} <span className="text-xs font-normal text-slate-400 font-mono uppercase">kg</span>
            </div>
            <div className="text-[11px] text-teal-400 mt-1 font-mono">100% Green Zero-Emission</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
            <Leaf className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Visual: Financial Cost & Savings Comparison Chart */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-emerald-400" />
              Utility Grid Tariff vs. XYZ P2P Solar Cost &amp; Savings
            </h2>
            <p className="text-xs text-slate-400">
              Monthly electricity bill comparison showing direct financial savings from peer-to-peer solar trading
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-slate-600"></span>
              <span className="text-slate-300">Gov Utility (${govRetailRate}/kWh)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-500"></span>
              <span className="text-slate-300">XYZ P2P Solar (${xyzRetailRate}/kWh)</span>
            </div>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} unit=" $" />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                formatter={(value: any) => [`$${Number(value).toFixed(2)}`, '']}
              />
              <Bar dataKey="Standard Gov Utility" fill="#64748b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="XYZ P2P Solar" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid: Auto-Debit Micro-Transactions Ledger & Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Virtual Wallet Ledger */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-teal-400" />
                Prepaid Ledger &amp; Consumption Debits
              </h3>
              <p className="text-xs text-slate-400">Automated micro-settlements for clean power consumed</p>
            </div>
            <button
              onClick={() => setShowTopupModal(true)}
              className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold rounded-lg border border-emerald-500/30 transition"
            >
              + Top-Up
            </button>
          </div>

          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {wallet?.ledgerHistory.map(entry => (
              <div key={entry.id} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    entry.type === 'TOPUP' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {entry.type === 'TOPUP' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-200">{entry.description}</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {new Date(entry.timestamp).toLocaleString()} • Ref: {entry.referenceType}
                    </div>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className={`font-bold ${entry.type === 'TOPUP' ? 'text-emerald-400' : 'text-slate-300'}`}>
                    {entry.type === 'TOPUP' ? '+' : '-'}${entry.amount.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-500">Bal: ${entry.balanceAfter.toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Verified Invoices & Billing Statements */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                Monthly Energy Bills &amp; Savings Invoices
              </h3>
              <p className="text-xs text-slate-400">Downloadable itemized bills with utility benchmark comparisons</p>
            </div>
          </div>

          <div className="space-y-3">
            {invoices.map(inv => (
              <div key={inv.id} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between hover:border-slate-700 transition">
                <div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono font-semibold text-slate-300">{inv.invoiceNumber}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                      {inv.status}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-slate-100 mt-1">{inv.billingPeriodStart} to {inv.billingPeriodEnd}</div>
                  <div className="text-xs text-slate-400 mt-0.5 font-mono">
                    Volume: {inv.totalKwh} kWh • Net Savings: <strong className="text-emerald-400">+${inv.netSavingsAmount.toFixed(2)}</strong>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-lg font-black font-mono text-emerald-400 mb-1">
                    ${inv.totalAmount.toFixed(2)}
                  </div>
                  <button
                    onClick={() => onViewInvoice(inv)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition"
                  >
                    View Bill
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* 1. Wallet Top-up Modal */}
      {showTopupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-slate-100">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-1">
              <CreditCard className="w-5 h-5 text-emerald-400" />
              Prepaid Energy Wallet Top-Up
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Add funds to your virtual energy wallet for continuous automatic microgrid settlements.
            </p>

            <form onSubmit={handleTopupSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Top-Up Amount ($ USD)</label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {[50, 100, 250].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setTopupAmount(amt)}
                      className={`py-2 rounded-lg font-bold font-mono border transition ${
                        topupAmount === amt
                          ? 'bg-emerald-600 text-white border-emerald-400'
                          : 'bg-slate-950 text-slate-300 border-slate-700 hover:bg-slate-800'
                      }`}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  step="10"
                  min="20"
                  value={topupAmount}
                  onChange={e => setTopupAmount(parseFloat(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono text-base font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Payment Method</label>
                <div className="p-3 bg-slate-950 border border-slate-700 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-slate-400" />
                    <span className="font-semibold text-slate-200">Corporate ACH Auto-Pay (****9102)</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold">DEFAULT</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTopupModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTopup}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition"
                >
                  {isSubmittingTopup ? 'Processing...' : `Pay $${topupAmount.toFixed(2)}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Quota Adjustment Modal */}
      {showQuotaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-slate-100">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-1">
              <Sliders className="w-5 h-5 text-emerald-400" />
              Adjust Solar Subscription Quota
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Configure your monthly clean energy target and billing model.
            </p>

            <form onSubmit={handleQuotaSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Monthly Green Quota (kWh)</label>
                <input
                  type="number"
                  step="100"
                  min="200"
                  value={monthlyQuotaKwh}
                  onChange={e => setMonthlyQuotaKwh(parseInt(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Contract Type</label>
                <select
                  value={contractType}
                  onChange={e => setContractType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                >
                  <option value="SUBSCRIPTION">Monthly Reserved Subscription (Priority Allocation)</option>
                  <option value="ON_DEMAND">On-Demand Pay-As-You-Go</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowQuotaModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingQuota}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition"
                >
                  {isSubmittingQuota ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
