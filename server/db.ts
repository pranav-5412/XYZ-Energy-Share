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
  LedgerEntry,
  Invoice,
  SimulationState,
  GridMetrics,
  MatchingMethod
} from '../src/types/index.ts';

import {
  INITIAL_USERS,
  INITIAL_INSTALLATIONS,
  INITIAL_CONSUMER_PROFILES,
  INITIAL_TARIFF_ZONES,
  INITIAL_BIDS,
  INITIAL_SIMULATION_STATE
} from './seedData.ts';

import {
  calculateSolarBellOutput,
  generate24HourTelemetryForInstallation
} from './telemetryEngine.ts';

import { executeZoneMatching } from './matchingEngine.ts';

class DatabaseStore {
  public users: User[] = [];
  public installations: SolarInstallation[] = [];
  public consumerProfiles: ConsumerProfile[] = [];
  public tariffZones: TariffZone[] = [];
  public bids: NegotiationBid[] = [];
  public telemetryLogs: TelemetryLog[] = [];
  public matchingRuns: MatchingRun[] = [];
  public transactions: EnergyTransaction[] = [];
  public wallets: Map<string, Wallet> = new Map();
  public invoices: Invoice[] = [];
  public simulationState: SimulationState = { ...INITIAL_SIMULATION_STATE };

  constructor() {
    this.seed();
  }

  public seed() {
    this.users = JSON.parse(JSON.stringify(INITIAL_USERS));
    this.installations = JSON.parse(JSON.stringify(INITIAL_INSTALLATIONS));
    this.consumerProfiles = JSON.parse(JSON.stringify(INITIAL_CONSUMER_PROFILES));
    this.tariffZones = JSON.parse(JSON.stringify(INITIAL_TARIFF_ZONES));
    this.bids = JSON.parse(JSON.stringify(INITIAL_BIDS));
    this.simulationState = { ...INITIAL_SIMULATION_STATE };
    this.wallets.clear();
    this.telemetryLogs = [];
    this.matchingRuns = [];
    this.transactions = [];
    this.invoices = [];

    // Initialize Wallets for all users
    this.users.forEach(user => {
      const initialBalance = user.role === 'CONSUMER' ? 250.0 : 45.0; // Consumers have prepaid balance, prosumers have initial balance
      this.wallets.set(user.id, {
        id: `wallet_${user.id}`,
        userId: user.id,
        balance: initialBalance,
        currency: 'USD',
        pendingEarnings: 0,
        totalEarned: user.role === 'PROSUMER' ? 428.50 : 0,
        totalSpent: user.role === 'CONSUMER' ? 612.80 : 0,
        totalEnergyExportedKwh: user.role === 'PROSUMER' ? 2850 : 0,
        totalEnergyConsumedKwh: user.role === 'CONSUMER' ? 3400 : 0,
        totalFinancialSavings: user.role === 'CONSUMER' ? 238.00 : 0,
        ledgerHistory: [
          {
            id: `led_init_${user.id}`,
            walletId: `wallet_${user.id}`,
            userId: user.id,
            timestamp: '2026-08-01T00:00:00Z',
            type: 'TOPUP',
            amount: initialBalance,
            balanceAfter: initialBalance,
            referenceType: 'WALLET_TOPUP',
            description: 'Initial wallet balance allocation'
          }
        ],
        updatedAt: new Date().toISOString()
      });
    });

    // Generate 24-hour telemetry logs for all prosumer installations
    this.installations.forEach(inst => {
      const user = this.users.find(u => u.id === inst.prosumerId);
      const logs = generate24HourTelemetryForInstallation(
        inst,
        user?.name || 'Prosumer',
        this.simulationState.weatherCondition
      );
      this.telemetryLogs.push(...logs);
    });

    // Execute realistic initial matching runs for past timestamps (e.g. 10:00, 11:30, 13:00)
    this.executeMatchingForAllZones('FIFO');
    this.executeMatchingForAllZones('PRO_RATA');

    // Generate sample invoices
    this.generateInitialInvoices();
  }

  public getWallet(userId: string): Wallet {
    let wallet = this.wallets.get(userId);
    if (!wallet) {
      wallet = {
        id: `wallet_${userId}`,
        userId,
        balance: 100.0,
        currency: 'USD',
        pendingEarnings: 0,
        totalEarned: 0,
        totalSpent: 0,
        totalEnergyExportedKwh: 0,
        totalEnergyConsumedKwh: 0,
        totalFinancialSavings: 0,
        ledgerHistory: [],
        updatedAt: new Date().toISOString()
      };
      this.wallets.set(userId, wallet);
    }
    return wallet;
  }

  public creditProsumer(
    userId: string,
    amount: number,
    kwh: number,
    txId: string,
    description: string
  ) {
    const wallet = this.getWallet(userId);
    wallet.balance = parseFloat((wallet.balance + amount).toFixed(2));
    wallet.totalEarned = parseFloat((wallet.totalEarned + amount).toFixed(2));
    wallet.totalEnergyExportedKwh = parseFloat((wallet.totalEnergyExportedKwh + kwh).toFixed(2));

    const ledgerEntry: LedgerEntry = {
      id: `led_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      walletId: wallet.id,
      userId,
      timestamp: new Date().toISOString(),
      type: 'CREDIT',
      amount,
      balanceAfter: wallet.balance,
      referenceType: 'ENERGY_EXPORT',
      referenceId: txId,
      description
    };
    wallet.ledgerHistory.unshift(ledgerEntry);
    wallet.updatedAt = new Date().toISOString();
  }

  public debitConsumer(
    userId: string,
    amount: number,
    kwh: number,
    txId: string,
    savingsAmount: number,
    description: string
  ) {
    const wallet = this.getWallet(userId);
    wallet.balance = parseFloat((wallet.balance - amount).toFixed(2));
    wallet.totalSpent = parseFloat((wallet.totalSpent + amount).toFixed(2));
    wallet.totalEnergyConsumedKwh = parseFloat((wallet.totalEnergyConsumedKwh + kwh).toFixed(2));
    wallet.totalFinancialSavings = parseFloat((wallet.totalFinancialSavings + savingsAmount).toFixed(2));

    const ledgerEntry: LedgerEntry = {
      id: `led_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      walletId: wallet.id,
      userId,
      timestamp: new Date().toISOString(),
      type: 'DEBIT',
      amount,
      balanceAfter: wallet.balance,
      referenceType: 'ENERGY_CONSUMPTION',
      referenceId: txId,
      description
    };
    wallet.ledgerHistory.unshift(ledgerEntry);
    wallet.updatedAt = new Date().toISOString();
  }

  public executeMatchingForAllZones(method: MatchingMethod = 'FIFO'): MatchingRun[] {
    const newRuns: MatchingRun[] = [];

    for (const zone of this.tariffZones) {
      // Find prosumers in this zone with available surplus
      const zoneProsumers = this.installations
        .filter(inst => inst.zoneId === zone.zoneId)
        .map(inst => {
          const user = this.users.find(u => u.id === inst.prosumerId)!;
          // Calculate current hour surplus based on plant capacity
          const output = calculateSolarBellOutput(
            this.simulationState.currentSimHour,
            inst.plantCapacityKwp,
            this.simulationState.weatherCondition,
            inst.efficiencyRatingPct
          );
          return {
            user,
            installation: inst,
            availableSurplusKwh: output.intervalExportKwh * 4 // 1 hour block equivalent
          };
        });

      // Find consumers in this zone
      const zoneConsumers = this.consumerProfiles
        .filter(p => p.zoneId === zone.zoneId)
        .map(p => {
          const user = this.users.find(u => u.id === p.consumerId)!;
          // Estimate current hour demand from monthly quota
          const hourlyDemand = (p.monthlyRequirementKwh / 30 / 24) * 1.8; // daytime weighting
          return {
            user,
            profile: p,
            demandKwh: parseFloat(hourlyDemand.toFixed(3))
          };
        });

      const { matchingRun, transactions } = executeZoneMatching({
        zone,
        prosumers: zoneProsumers,
        consumers: zoneConsumers,
        method
      });

      if (transactions.length > 0) {
        this.matchingRuns.unshift(matchingRun);
        this.transactions.unshift(...transactions);

        // Process double-entry ledger for each transaction
        transactions.forEach(tx => {
          this.creditProsumer(
            tx.prosumerId,
            tx.prosumerCreditAmount,
            tx.unitsKwh,
            tx.id,
            `Export settlement: ${tx.unitsKwh} kWh green solar to ${tx.consumerName} @ $${tx.prosumerRatePerKwh}/kWh`
          );

          const govtCost = tx.unitsKwh * zone.govtGridRetailRate;
          const savings = Math.max(0, govtCost - tx.consumerDebitAmount);

          this.debitConsumer(
            tx.consumerId,
            tx.consumerDebitAmount,
            tx.unitsKwh,
            tx.id,
            savings,
            `Clean energy consumption: ${tx.unitsKwh} kWh from ${tx.prosumerName} @ $${tx.consumerRatePerKwh}/kWh (Saved $${savings.toFixed(2)} vs Gov Utility)`
          );
        });

        newRuns.push(matchingRun);
      }
    }

    return newRuns;
  }

  public stepSimulation(hoursToAdvance: number = 0.25) {
    let nextHour = this.simulationState.currentSimHour + hoursToAdvance;
    if (nextHour >= 24) nextHour = nextHour % 24;
    this.simulationState.currentSimHour = parseFloat(nextHour.toFixed(2));
    this.simulationState.lastTickTimestamp = new Date().toISOString();

    // Recalculate irradiance
    if (nextHour >= 6 && nextHour <= 18) {
      const angle = ((nextHour - 6.0) / 12.0) * Math.PI;
      this.simulationState.solarIrradiancePct = Math.round(Math.sin(angle) * 100);
    } else {
      this.simulationState.solarIrradiancePct = 0;
    }

    // Ingest simulated telemetry for each installation at current hour
    const nowIso = new Date().toISOString();
    this.installations.forEach(inst => {
      const user = this.users.find(u => u.id === inst.prosumerId);
      const result = calculateSolarBellOutput(
        nextHour,
        inst.plantCapacityKwp,
        this.simulationState.weatherCondition,
        inst.efficiencyRatingPct
      );

      const log: TelemetryLog = {
        id: `tel_${inst.meterId}_${Date.now()}`,
        meterId: inst.meterId,
        prosumerId: inst.prosumerId,
        prosumerName: user?.name,
        timestamp: nowIso,
        unitsGeneratedKwh: result.intervalGenKwh,
        unitsExportedKwh: result.intervalExportKwh,
        unitsSelfConsumedKwh: result.intervalSelfKwh,
        gridVoltageVolts: result.voltage,
        inverterEfficiencyPct: inst.efficiencyRatingPct,
        frequencyHz: result.frequency,
        source: 'SIMULATOR',
        verified: true
      };
      this.telemetryLogs.unshift(log);

      // Keep telemetry logs array bounded
      if (this.telemetryLogs.length > 500) {
        this.telemetryLogs = this.telemetryLogs.slice(0, 500);
      }
    });

    // Auto-match if enabled and daytime
    if (this.simulationState.autoMatchEnabled && nextHour >= 6 && nextHour <= 19) {
      this.executeMatchingForAllZones('FIFO');
    }
  }

  public getGridMetrics(): GridMetrics {
    let totalSurplus = 0;
    let totalDemand = 0;

    this.installations.forEach(inst => {
      const out = calculateSolarBellOutput(
        this.simulationState.currentSimHour,
        inst.plantCapacityKwp,
        this.simulationState.weatherCondition,
        inst.efficiencyRatingPct
      );
      totalSurplus += out.intervalExportKwh * 4; // 1 hr equivalent
    });

    this.consumerProfiles.forEach(prof => {
      const hourlyDemand = (prof.monthlyRequirementKwh / 30 / 24) * 1.8;
      totalDemand += hourlyDemand;
    });

    const totalVolumeTraded = this.transactions.reduce((acc, t) => acc + t.unitsKwh, 0);
    const totalMargin = this.transactions.reduce((acc, t) => acc + t.platformMarginAmount, 0);
    const totalPayout = this.transactions.reduce((acc, t) => acc + t.prosumerCreditAmount, 0);
    const totalCo2 = this.transactions.reduce((acc, t) => acc + t.co2OffsetKg, 0);

    const totalSavings = this.transactions.reduce((acc, t) => {
      const zone = this.tariffZones.find(z => z.zoneId === t.zoneId);
      const govRate = zone ? zone.govtGridRetailRate : 0.24;
      const govCost = t.unitsKwh * govRate;
      return acc + Math.max(0, govCost - t.consumerDebitAmount);
    }, 0);

    return {
      totalSurplusAvailableKwh: parseFloat(totalSurplus.toFixed(2)),
      totalDemandWaitingKwh: parseFloat(totalDemand.toFixed(2)),
      netGridBalanceKwh: parseFloat((totalSurplus - totalDemand).toFixed(2)),
      totalVolumeTraded24hKwh: parseFloat(totalVolumeTraded.toFixed(2)),
      totalPlatformMarginEarned24h: parseFloat(totalMargin.toFixed(2)),
      totalProsumerEarnings24h: parseFloat(totalPayout.toFixed(2)),
      totalConsumerSavings24h: parseFloat(totalSavings.toFixed(2)),
      totalCo2Offset24hKg: parseFloat(totalCo2.toFixed(2)),
      activeSolarPlantsCount: this.installations.length,
      activeConsumersCount: this.consumerProfiles.length,
      avgProsumerBuybackRate: 0.142,
      avgConsumerRetailRate: 0.181,
      gridReliabilityPct: 99.8
    };
  }

  private generateInitialInvoices() {
    this.consumerProfiles.forEach(prof => {
      const user = this.users.find(u => u.id === prof.consumerId);
      if (!user) return;
      const zone = this.tariffZones.find(z => z.zoneId === prof.zoneId) || this.tariffZones[0];
      const billedKwh = Math.round(prof.monthlyRequirementKwh * 0.9);
      const rate = zone.xyzDefaultSellRate;
      const xyzCost = parseFloat((billedKwh * rate).toFixed(2));
      const govCost = parseFloat((billedKwh * zone.govtGridRetailRate).toFixed(2));
      const savings = parseFloat((govCost - xyzCost).toFixed(2));
      const platformFee = parseFloat((billedKwh * 0.015).toFixed(2));
      const co2 = parseFloat((billedKwh * 0.85).toFixed(2));

      this.invoices.push({
        id: `inv_cons_${prof.consumerId}_202607`,
        invoiceNumber: `XYZ-INV-${Math.floor(100000 + Math.random() * 900000)}`,
        userId: user.id,
        userName: user.name,
        userRole: 'CONSUMER',
        userAddress: user.address,
        billingPeriodStart: '2026-07-01',
        billingPeriodEnd: '2026-07-31',
        totalKwh: billedKwh,
        totalAmount: xyzCost,
        govtCostComparison: govCost,
        netSavingsAmount: savings,
        platformFee,
        co2OffsetKg: co2,
        status: 'PAID',
        lineItems: [
          {
            description: `Aggregated Solar Microgrid Consumption (${zone.zoneName})`,
            quantityKwh: billedKwh,
            unitRate: rate,
            amount: xyzCost,
            govtEquivalentAmount: govCost
          }
        ],
        generatedAt: '2026-08-01T09:00:00Z',
        dueDate: '2026-08-15T00:00:00Z'
      });
    });

    // Prosumer Earnings Statements
    this.installations.forEach(inst => {
      const user = this.users.find(u => u.id === inst.prosumerId);
      if (!user) return;
      const zone = this.tariffZones.find(z => z.zoneId === inst.zoneId) || this.tariffZones[0];
      const exportedKwh = Math.round(inst.plantCapacityKwp * 110);
      const buyRate = inst.agreedBuybackRatePerKwh || zone.xyzDefaultBuyRate;
      const payout = parseFloat((exportedKwh * buyRate).toFixed(2));
      const govtPayout = parseFloat((exportedKwh * zone.govtBuybackRate).toFixed(2));
      const extraEarned = parseFloat((payout - govtPayout).toFixed(2));
      const co2 = parseFloat((exportedKwh * 0.85).toFixed(2));

      this.invoices.push({
        id: `stmt_pro_${inst.prosumerId}_202607`,
        invoiceNumber: `XYZ-PAY-${Math.floor(100000 + Math.random() * 900000)}`,
        userId: user.id,
        userName: user.name,
        userRole: 'PROSUMER',
        userAddress: user.address,
        billingPeriodStart: '2026-07-01',
        billingPeriodEnd: '2026-07-31',
        totalKwh: exportedKwh,
        totalAmount: payout,
        govtCostComparison: govtPayout,
        netSavingsAmount: extraEarned, // Extra earnings above gov feed-in
        platformFee: 0,
        co2OffsetKg: co2,
        status: 'SETTLED',
        lineItems: [
          {
            description: `Rooftop Solar Export Credit (${inst.inverterModel})`,
            quantityKwh: exportedKwh,
            unitRate: buyRate,
            amount: payout,
            govtEquivalentAmount: govtPayout
          }
        ],
        generatedAt: '2026-08-01T09:00:00Z',
        dueDate: '2026-08-05T00:00:00Z'
      });
    });
  }
}

export const db = new DatabaseStore();
