export type UserRole = 'PROSUMER' | 'CONSUMER' | 'DISPATCHER' | 'ADMIN';

export type KycStatus = 'VERIFIED' | 'PENDING' | 'REJECTED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  address: string;
  pincode: string;
  zoneId: string;
  kycStatus: KycStatus;
  avatarUrl?: string;
  createdAt: string;
}

export interface SolarInstallation {
  id: string;
  prosumerId: string;
  plantCapacityKwp: number; // kW peak
  inverterModel: string;
  meterId: string;
  installationDate: string;
  agreedBuybackRatePerKwh: number; // e.g. $0.14/kWh (vs Govt $0.08)
  address: string;
  pincode: string;
  zoneId: string;
  gridConnectionStatus: 'ACTIVE' | 'OFFLINE' | 'MAINTENANCE';
  currentPowerOutputKw?: number;
  dailyTotalGeneratedKwh?: number;
  dailyTotalExportedKwh?: number;
  efficiencyRatingPct: number;
}

export interface ConsumerProfile {
  id: string;
  consumerId: string;
  monthlyRequirementKwh: number;
  connectedLoadKw: number;
  billingCycle: 'MONTHLY' | 'PREPAID';
  contractType: 'SUBSCRIPTION' | 'ON_DEMAND';
  allocatedGreenQuotaKwh: number;
  preferredMaxRatePerKwh: number; // e.g. $0.18/kWh (vs Govt Retail $0.24)
  pincode: string;
  zoneId: string;
}

export interface TariffZone {
  zoneId: string;
  zoneName: string;
  region: string;
  pincodes: string[];
  govtGridRetailRate: number; // Standard retail utility grid rate ($/kWh, e.g. $0.24)
  govtBuybackRate: number;    // Govt export feed-in tariff ($/kWh, e.g. $0.08)
  xyzDefaultBuyRate: number;  // XYZ buyback from prosumer ($/kWh, e.g. $0.14 - 75% higher than govt!)
  xyzDefaultSellRate: number; // XYZ sale to consumer ($/kWh, e.g. $0.18 - 25% cheaper than govt!)
  xyzPlatformMarginRate: number; // Platform fee difference ($/kWh, e.g. $0.04)
  currency: string;
  lastUpdated: string;
}

export type BidStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COUNTER_OFFER' | 'CANCELLED';

export interface NegotiationBid {
  id: string;
  prosumerId: string;
  prosumerName: string;
  zoneId: string;
  plantCapacityKwp: number;
  currentAgreedRate: number;
  proposedRatePerKwh: number;
  estimatedMonthlyExportKwh: number;
  status: BidStatus;
  counterRatePerKwh?: number;
  prosumerNotes?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export type TelemetrySource = 'SMART_METER' | 'MANUAL_SUBMISSION' | 'SIMULATOR';

export interface TelemetryLog {
  id: string;
  meterId: string;
  prosumerId: string;
  prosumerName?: string;
  timestamp: string; // ISO string or time slot e.g. 2026-08-19T11:45:00Z
  unitsGeneratedKwh: number;
  unitsExportedKwh: number;
  unitsSelfConsumedKwh: number;
  gridVoltageVolts: number;
  inverterEfficiencyPct: number;
  frequencyHz: number;
  source: TelemetrySource;
  verified: boolean;
  proofDocumentUrl?: string;
  verificationNotes?: string;
}

export type MatchingMethod = 'FIFO' | 'PRO_RATA';

export interface MatchingRun {
  id: string;
  timestamp: string;
  zoneId: string;
  zoneName: string;
  totalSurplusKwh: number;
  totalDemandKwh: number;
  matchedKwh: number;
  unallocatedSurplusKwh: number;
  unfulfilledDemandKwh: number;
  method: MatchingMethod;
  avgBuyRatePerKwh: number;
  avgSellRatePerKwh: number;
  totalProsumerPayout: number;
  totalConsumerCharge: number;
  platformMarginEarned: number;
  co2OffsetKg: number;
  status: 'COMPLETED' | 'SIMULATED';
  transactionCount: number;
}

export interface EnergyTransaction {
  id: string;
  matchingRunId: string;
  timestamp: string;
  zoneId: string;
  prosumerId: string;
  prosumerName: string;
  consumerId: string;
  consumerName: string;
  unitsKwh: number;
  prosumerRatePerKwh: number;
  consumerRatePerKwh: number;
  prosumerCreditAmount: number;
  consumerDebitAmount: number;
  platformMarginAmount: number;
  co2OffsetKg: number;
  status: 'SETTLED' | 'PENDING';
}

export type LedgerEntryType = 'CREDIT' | 'DEBIT' | 'PAYOUT' | 'TOPUP' | 'BONUS';

export interface LedgerEntry {
  id: string;
  walletId: string;
  userId: string;
  timestamp: string;
  type: LedgerEntryType;
  amount: number;
  balanceAfter: number;
  referenceType: 'ENERGY_EXPORT' | 'ENERGY_CONSUMPTION' | 'WALLET_TOPUP' | 'BANK_PAYOUT' | 'ADJUSTMENT';
  referenceId?: string;
  description: string;
}

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  pendingEarnings: number;
  totalEarned: number;
  totalSpent: number;
  totalEnergyExportedKwh: number;
  totalEnergyConsumedKwh: number;
  totalFinancialSavings: number; // For consumers: savings vs Gov retail
  ledgerHistory: LedgerEntry[];
  updatedAt: string;
}

export interface InvoiceLineItem {
  description: string;
  quantityKwh: number;
  unitRate: number;
  amount: number;
  govtEquivalentAmount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  userAddress: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  totalKwh: number;
  totalAmount: number;
  govtCostComparison: number;
  netSavingsAmount: number; // positive = saved money
  platformFee: number;
  co2OffsetKg: number;
  status: 'PAID' | 'ISSUED' | 'SETTLED';
  lineItems: InvoiceLineItem[];
  generatedAt: string;
  dueDate: string;
}

export interface SimulationState {
  isRunning: boolean;
  currentSimHour: number; // 0 to 24 (e.g. 12.5 = 12:30 PM)
  weatherCondition: 'SUNNY' | 'PARTLY_CLOUDY' | 'OVERCAST' | 'RAINY';
  solarIrradiancePct: number; // 0 to 100%
  speedMultiplier: number; // 1x, 5x, 10x, 60x
  autoMatchEnabled: boolean;
  lastTickTimestamp: string;
}

export interface GridMetrics {
  totalSurplusAvailableKwh: number;
  totalDemandWaitingKwh: number;
  netGridBalanceKwh: number; // Surplus - Demand
  totalVolumeTraded24hKwh: number;
  totalPlatformMarginEarned24h: number;
  totalProsumerEarnings24h: number;
  totalConsumerSavings24h: number;
  totalCo2Offset24hKg: number;
  activeSolarPlantsCount: number;
  activeConsumersCount: number;
  avgProsumerBuybackRate: number;
  avgConsumerRetailRate: number;
  gridReliabilityPct: number;
}
