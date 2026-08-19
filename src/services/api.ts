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
  GridMetrics
} from '../types/index.ts';

export const api = {
  // Users & Current Context
  async getCurrentUser(): Promise<{
    user: User;
    wallet: Wallet;
    installation?: SolarInstallation;
    consumerProfile?: ConsumerProfile;
    zone: TariffZone;
  }> {
    const res = await fetch('/api/users/current');
    if (!res.ok) throw new Error('Failed to fetch current user');
    return res.json();
  },

  async getAllUsers(): Promise<{ users: User[]; activeUserId: string }> {
    const res = await fetch('/api/users');
    return res.json();
  },

  async switchUser(userId: string): Promise<{ success: boolean; activeUser: User }> {
    const res = await fetch('/api/users/switch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    return res.json();
  },

  // Solar Installations
  async getInstallations(): Promise<SolarInstallation[]> {
    const res = await fetch('/api/installations');
    return res.json();
  },

  async saveInstallation(data: Partial<SolarInstallation>): Promise<{ success: boolean; installation: SolarInstallation }> {
    const res = await fetch('/api/installations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Consumer Profiles
  async getConsumers(): Promise<ConsumerProfile[]> {
    const res = await fetch('/api/consumers');
    return res.json();
  },

  async saveConsumerProfile(data: Partial<ConsumerProfile>): Promise<{ success: boolean; profile: ConsumerProfile }> {
    const res = await fetch('/api/consumers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Tariffs & Zones
  async getTariffs(): Promise<TariffZone[]> {
    const res = await fetch('/api/tariffs');
    return res.json();
  },

  async updateTariff(zoneId: string, data: Partial<TariffZone>): Promise<{ success: boolean; zone: TariffZone }> {
    const res = await fetch(`/api/tariffs/${zoneId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Telemetry
  async ingestTelemetry(data: {
    meterId: string;
    unitsGeneratedKwh: number;
    unitsExportedKwh: number;
    timestamp?: string;
    gridVoltageVolts?: number;
    frequencyHz?: number;
  }): Promise<{ success: boolean; log: TelemetryLog }> {
    const res = await fetch('/api/telemetry/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async manualSubmitTelemetry(data: {
    prosumerId: string;
    meterId: string;
    unitsGeneratedKwh: number;
    unitsExportedKwh: number;
    proofDocumentUrl?: string;
    verificationNotes?: string;
  }): Promise<{ success: boolean; log: TelemetryLog }> {
    const res = await fetch('/api/telemetry/manual-submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async verifyTelemetry(id: string, verified: boolean, notes?: string): Promise<{ success: boolean; log: TelemetryLog }> {
    const res = await fetch(`/api/telemetry/verify/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verified, notes })
    });
    return res.json();
  },

  async getTelemetryHistory(params?: { meterId?: string; prosumerId?: string; limit?: number }): Promise<TelemetryLog[]> {
    const q = new URLSearchParams();
    if (params?.meterId) q.set('meterId', params.meterId);
    if (params?.prosumerId) q.set('prosumerId', params.prosumerId);
    if (params?.limit) q.set('limit', String(params.limit));
    const res = await fetch(`/api/telemetry/history?${q.toString()}`);
    return res.json();
  },

  // Rate Bidding & Negotiations
  async getBids(prosumerId?: string): Promise<NegotiationBid[]> {
    const url = prosumerId ? `/api/bids?prosumerId=${prosumerId}` : '/api/bids';
    const res = await fetch(url);
    return res.json();
  },

  async submitBid(data: {
    prosumerId: string;
    proposedRatePerKwh: number;
    estimatedMonthlyExportKwh: number;
    prosumerNotes?: string;
  }): Promise<{ success: boolean; bid: NegotiationBid }> {
    const res = await fetch('/api/bids', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async respondToBid(
    bidId: string,
    data: {
      decision: 'ACCEPTED' | 'REJECTED' | 'COUNTER_OFFER';
      counterRatePerKwh?: number;
      adminNotes?: string;
    }
  ): Promise<{ success: boolean; bid: NegotiationBid }> {
    const res = await fetch(`/api/bids/${bidId}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async decideProsumerCounter(bidId: string, accept: boolean): Promise<{ success: boolean; bid: NegotiationBid }> {
    const res = await fetch(`/api/bids/${bidId}/prosumer-decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accept })
    });
    return res.json();
  },

  // Matching & Micro-Grid
  async executeMatching(method: 'FIFO' | 'PRO_RATA' = 'FIFO'): Promise<{ success: boolean; matchingRuns: MatchingRun[] }> {
    const res = await fetch('/api/matching/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method })
    });
    return res.json();
  },

  async getMatchingRuns(): Promise<MatchingRun[]> {
    const res = await fetch('/api/matching/runs');
    return res.json();
  },

  async getTransactions(params?: { userId?: string; role?: string }): Promise<EnergyTransaction[]> {
    const q = new URLSearchParams();
    if (params?.userId) q.set('userId', params.userId);
    if (params?.role) q.set('role', params.role);
    const res = await fetch(`/api/matching/transactions?${q.toString()}`);
    return res.json();
  },

  async getZonePools(): Promise<any[]> {
    const res = await fetch('/api/matching/zone-pools');
    return res.json();
  },

  // Wallets & Ledger
  async getWallet(userId: string): Promise<Wallet> {
    const res = await fetch(`/api/wallets/${userId}`);
    return res.json();
  },

  async topupWallet(userId: string, amount: number): Promise<{ success: boolean; wallet: Wallet }> {
    const res = await fetch('/api/wallets/topup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, amount })
    });
    return res.json();
  },

  async payoutWallet(userId: string, amount: number, bankAccount?: string): Promise<{ success: boolean; wallet: Wallet }> {
    const res = await fetch('/api/wallets/payout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, amount, bankAccount })
    });
    return res.json();
  },

  // Invoices
  async getInvoices(userId?: string): Promise<Invoice[]> {
    const url = userId ? `/api/invoices?userId=${userId}` : '/api/invoices';
    const res = await fetch(url);
    return res.json();
  },

  async getInvoice(id: string): Promise<Invoice> {
    const res = await fetch(`/api/invoices/${id}`);
    return res.json();
  },

  // Simulator
  async getSimulatorStatus(): Promise<SimulationState> {
    const res = await fetch('/api/simulator/status');
    return res.json();
  },

  async updateSimulator(config: Partial<SimulationState>): Promise<{ success: boolean; simulationState: SimulationState }> {
    const res = await fetch('/api/simulator/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    return res.json();
  },

  async stepSimulator(hours: number = 0.25): Promise<{ success: boolean; simulationState: SimulationState }> {
    const res = await fetch('/api/simulator/step', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hours })
    });
    return res.json();
  },

  async resetDatabase(): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/simulator/reset', { method: 'POST' });
    return res.json();
  },

  // Admin Metrics & AI
  async getAdminMetrics(): Promise<GridMetrics> {
    const res = await fetch('/api/admin/metrics');
    return res.json();
  },

  async getAiGridAdvice(promptTopic?: string): Promise<{ analysis: string; model: string; metrics?: GridMetrics }> {
    const res = await fetch('/api/ai/advisor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ promptTopic })
    });
    return res.json();
  }
};
