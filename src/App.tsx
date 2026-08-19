import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { ProsumerView } from './components/ProsumerView.tsx';
import { ConsumerView } from './components/ConsumerView.tsx';
import { DispatcherView } from './components/DispatcherView.tsx';
import { AdminView } from './components/AdminView.tsx';
import { SimulatorModal } from './components/SimulatorModal.tsx';
import { InvoiceModal } from './components/InvoiceModal.tsx';
import {
  User,
  SolarInstallation,
  ConsumerProfile,
  TariffZone,
  NegotiationBid,
  TelemetryLog,
  MatchingRun,
  EnergyTransaction,
  Wallet,
  Invoice,
  SimulationState,
  GridMetrics,
  UserRole
} from './types/index.ts';
import { api } from './services/api.ts';
import { Sun, AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [activeTabRole, setActiveTabRole] = useState<UserRole>('PROSUMER');
  
  const [installation, setInstallation] = useState<SolarInstallation | undefined>();
  const [consumerProfile, setConsumerProfile] = useState<ConsumerProfile | undefined>();
  const [allInstallations, setAllInstallations] = useState<SolarInstallation[]>([]);
  const [zone, setZone] = useState<TariffZone | null>(null);
  const [allZones, setAllZones] = useState<TariffZone[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);

  const [telemetryLogs, setTelemetryLogs] = useState<TelemetryLog[]>([]);
  const [bids, setBids] = useState<NegotiationBid[]>([]);
  const [matchingRuns, setMatchingRuns] = useState<MatchingRun[]>([]);
  const [transactions, setTransactions] = useState<EnergyTransaction[]>([]);
  const [zonePools, setZonePools] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  
  const [simState, setSimState] = useState<SimulationState>({
    isRunning: true,
    currentSimHour: 13.5,
    weatherCondition: 'SUNNY',
    solarIrradiancePct: 92,
    speedMultiplier: 1,
    autoMatchEnabled: true,
    lastTickTimestamp: new Date().toISOString()
  });

  const [gridMetrics, setGridMetrics] = useState<GridMetrics>({
    totalSurplusAvailableKwh: 48.5,
    totalDemandWaitingKwh: 24.2,
    netGridBalanceKwh: 24.3,
    totalVolumeTraded24hKwh: 1420.5,
    totalPlatformMarginEarned24h: 56.82,
    totalProsumerEarnings24h: 213.08,
    totalConsumerSavings24h: 99.43,
    totalCo2Offset24hKg: 1207.4,
    activeSolarPlantsCount: 4,
    activeConsumersCount: 4,
    avgProsumerBuybackRate: 0.142,
    avgConsumerRetailRate: 0.181,
    gridReliabilityPct: 99.8
  });

  const [isSimModalOpen, setIsSimModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load all platform data
  const loadData = useCallback(async () => {
    try {
      const [
        currentRes,
        usersRes,
        tariffsRes,
        bidsRes,
        telemetryRes,
        matchingRunsRes,
        txsRes,
        zonePoolsRes,
        invoicesRes,
        simRes,
        metricsRes,
        allInstsRes
      ] = await Promise.all([
        api.getCurrentUser(),
        api.getAllUsers(),
        api.getTariffs(),
        api.getBids(),
        api.getTelemetryHistory({ limit: 200 }),
        api.getMatchingRuns(),
        api.getTransactions(),
        api.getZonePools(),
        api.getInvoices(),
        api.getSimulatorStatus(),
        api.getAdminMetrics(),
        api.getInstallations()
      ]);

      setCurrentUser(currentRes.user);
      setWallet(currentRes.wallet);
      setInstallation(currentRes.installation);
      setConsumerProfile(currentRes.consumerProfile);
      setZone(currentRes.zone);

      setAllUsers(usersRes.users);
      setAllZones(tariffsRes);
      setBids(bidsRes);
      setTelemetryLogs(telemetryRes);
      setMatchingRuns(matchingRunsRes);
      setTransactions(txsRes);
      setZonePools(zonePoolsRes);
      setInvoices(invoicesRes);
      setSimState(simRes);
      setGridMetrics(metricsRes);
      setAllInstallations(allInstsRes);
      setError(null);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.message || 'Failed to connect to XYZ Energy backend');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load + periodic real-time sync (every 3 seconds)
  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData();
    }, 3000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Handle switching active user persona
  const handleSwitchUser = async (userId: string) => {
    try {
      await api.switchUser(userId);
      await loadData();
    } catch (err) {
      console.error('Failed to switch user:', err);
    }
  };

  // Handle switching role tabs
  const handleSwitchRoleTab = (role: UserRole) => {
    setActiveTabRole(role);
    // If the active user has a different role, automatically pick a matching user for convenience
    if (currentUser && currentUser.role !== role) {
      const matchUser = allUsers.find(u => u.role === role);
      if (matchUser) {
        handleSwitchUser(matchUser.id);
      }
    }
  };

  // Quick simulation controls
  const handleQuickStep = async (hours: number) => {
    try {
      await api.stepSimulator(hours);
      await loadData();
    } catch (err) {
      console.error('Quick step failed:', err);
    }
  };

  const handleQuickMatch = async () => {
    try {
      await api.executeMatching('FIFO');
      await loadData();
    } catch (err) {
      console.error('Quick match failed:', err);
    }
  };

  const handleUpdateSimConfig = async (config: Partial<SimulationState>) => {
    try {
      await api.updateSimulator(config);
      await loadData();
    } catch (err) {
      console.error('Sim update failed:', err);
    }
  };

  const handleResetDatabase = async () => {
    try {
      await api.resetDatabase();
      await loadData();
    } catch (err) {
      console.error('Reset failed:', err);
    }
  };

  if (isLoading && !currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 p-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mb-4 animate-pulse">
          <Sun className="w-8 h-8 text-amber-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-100">Connecting to XYZ Energy Share Microgrid...</h2>
        <p className="text-xs text-slate-400 mt-1 font-mono">Initializing P2P smart contracts &amp; telemetry streams</p>
      </div>
    );
  }

  if (error && !currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 p-4">
        <AlertCircle className="w-12 h-12 text-rose-400 mb-3" />
        <h2 className="text-xl font-bold text-slate-100">Unable to Connect</h2>
        <p className="text-xs text-slate-400 mt-1 mb-4">{error}</p>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950 relative overflow-x-hidden">
      {/* Top Background Radial Ambient Glow */}
      <div className="absolute top-0 left-0 w-full h-96 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_50%_0%,_#10b981_0%,_transparent_60%)] z-0"></div>

      {/* Top Sticky Navigation */}
      <Navbar
        currentUser={currentUser!}
        allUsers={allUsers}
        onSwitchUser={handleSwitchUser}
        onSwitchRoleTab={handleSwitchRoleTab}
        activeTabRole={activeTabRole}
        simState={simState}
        gridMetrics={gridMetrics}
        onOpenSimulator={() => setIsSimModalOpen(true)}
        onQuickStep={handleQuickStep}
        onQuickMatch={handleQuickMatch}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 relative z-10">
        {activeTabRole === 'PROSUMER' && (
          <ProsumerView
            currentUser={currentUser!}
            installation={installation || allInstallations[0]}
            wallet={wallet!}
            zone={zone || allZones[0]}
            telemetryLogs={telemetryLogs}
            bids={bids.filter(b => b.prosumerId === currentUser?.id || currentUser?.role !== 'PROSUMER')}
            invoices={invoices.filter(i => i.userId === currentUser?.id)}
            simState={simState}
            onRefreshData={loadData}
            onViewInvoice={setSelectedInvoice}
          />
        )}

        {activeTabRole === 'CONSUMER' && (
          <ConsumerView
            currentUser={currentUser!}
            profile={consumerProfile || {
              id: 'temp_prof',
              consumerId: currentUser!.id,
              monthlyRequirementKwh: 1500,
              connectedLoadKw: 20,
              billingCycle: 'MONTHLY',
              contractType: 'SUBSCRIPTION',
              allocatedGreenQuotaKwh: 1500,
              preferredMaxRatePerKwh: 0.18,
              pincode: currentUser!.pincode,
              zoneId: currentUser!.zoneId
            }}
            wallet={wallet!}
            zone={zone || allZones[0]}
            invoices={invoices.filter(i => i.userId === currentUser?.id)}
            simState={simState}
            onRefreshData={loadData}
            onViewInvoice={setSelectedInvoice}
          />
        )}

        {activeTabRole === 'DISPATCHER' && (
          <DispatcherView
            zones={allZones}
            matchingRuns={matchingRuns}
            transactions={transactions}
            zonePools={zonePools}
            simState={simState}
            gridMetrics={gridMetrics}
            onRefreshData={loadData}
          />
        )}

        {activeTabRole === 'ADMIN' && (
          <AdminView
            zones={allZones}
            bids={bids}
            telemetryLogs={telemetryLogs}
            gridMetrics={gridMetrics}
            users={allUsers}
            installations={allInstallations}
            zonePools={zonePools}
            simState={simState}
            onRefreshData={loadData}
          />
        )}
      </main>

      {/* Simulator Modal */}
      <SimulatorModal
        isOpen={isSimModalOpen}
        onClose={() => setIsSimModalOpen(false)}
        simState={simState}
        onUpdateConfig={handleUpdateSimConfig}
        onStepSimulation={handleQuickStep}
        onResetDatabase={handleResetDatabase}
      />

      {/* Printable Invoice Modal */}
      <InvoiceModal
        invoice={selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
      />

      {/* Subtle Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong className="text-slate-400">XYZ Energy Share</strong> • Decentralized P2P Solar Energy Microgrid
          </div>
          <div className="font-mono text-[11px] text-slate-600">
            Double-Entry Virtual Ledger • 15-Minute IoT Telemetry Ingestion • Zero Emission Clean Grid
          </div>
        </div>
      </footer>
    </div>
  );
}
