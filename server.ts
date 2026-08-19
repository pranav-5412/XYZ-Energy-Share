import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db.ts';
import { calculateSolarBellOutput } from './server/telemetryEngine.ts';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Active session state (defaults to Prosumer Maya Lin for initial rich view)
  let activeUserId = 'user_prosumer_1';

  // AI client lazy initialization
  let aiClient: GoogleGenAI | null = null;
  function getAI(): GoogleGenAI | null {
    if (!aiClient && process.env.GEMINI_API_KEY) {
      try {
        aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      } catch (err) {
        console.error('Failed to init Gemini SDK:', err);
      }
    }
    return aiClient;
  }

  // --- API ROUTES ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), platform: 'XYZ Energy Share' });
  });

  // User & Auth Management
  app.get('/api/users', (req, res) => {
    res.json({ users: db.users, activeUserId });
  });

  app.get('/api/users/current', (req, res) => {
    const user = db.users.find(u => u.id === activeUserId) || db.users[0];
    const wallet = db.getWallet(user.id);
    const installation = db.installations.find(i => i.prosumerId === user.id);
    const consumerProfile = db.consumerProfiles.find(c => c.consumerId === user.id);
    const zone = db.tariffZones.find(z => z.zoneId === user.zoneId) || db.tariffZones[0];

    res.json({
      user,
      wallet,
      installation,
      consumerProfile,
      zone
    });
  });

  app.post('/api/users/switch', (req, res) => {
    const { userId } = req.body;
    const targetUser = db.users.find(u => u.id === userId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    activeUserId = userId;
    res.json({ success: true, activeUser: targetUser });
  });

  app.post('/api/users/kyc', (req, res) => {
    const { userId, kycStatus } = req.body;
    const user = db.users.find(u => u.id === userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.kycStatus = kycStatus;
    res.json({ success: true, user });
  });

  // Solar Installations (Prosumer Plants)
  app.get('/api/installations', (req, res) => {
    res.json(db.installations);
  });

  app.post('/api/installations', (req, res) => {
    const { prosumerId, plantCapacityKwp, inverterModel, meterId, agreedBuybackRatePerKwh, address, pincode, zoneId } = req.body;
    let inst = db.installations.find(i => i.prosumerId === prosumerId);
    if (inst) {
      inst.plantCapacityKwp = Number(plantCapacityKwp);
      inst.inverterModel = inverterModel;
      inst.meterId = meterId;
      inst.agreedBuybackRatePerKwh = Number(agreedBuybackRatePerKwh);
      inst.address = address;
      inst.pincode = pincode;
      inst.zoneId = zoneId;
    } else {
      inst = {
        id: `inst_${Date.now()}`,
        prosumerId,
        plantCapacityKwp: Number(plantCapacityKwp),
        inverterModel,
        meterId,
        installationDate: new Date().toISOString().split('T')[0],
        agreedBuybackRatePerKwh: Number(agreedBuybackRatePerKwh),
        address,
        pincode,
        zoneId,
        gridConnectionStatus: 'ACTIVE',
        efficiencyRatingPct: 97.5
      };
      db.installations.push(inst);
    }
    res.json({ success: true, installation: inst });
  });

  // Consumer Profiles
  app.get('/api/consumers', (req, res) => {
    res.json(db.consumerProfiles);
  });

  app.post('/api/consumers', (req, res) => {
    const { consumerId, monthlyRequirementKwh, connectedLoadKw, contractType, preferredMaxRatePerKwh, pincode, zoneId } = req.body;
    let profile = db.consumerProfiles.find(c => c.consumerId === consumerId);
    if (profile) {
      profile.monthlyRequirementKwh = Number(monthlyRequirementKwh);
      profile.connectedLoadKw = Number(connectedLoadKw);
      profile.contractType = contractType;
      profile.preferredMaxRatePerKwh = Number(preferredMaxRatePerKwh);
      profile.pincode = pincode;
      profile.zoneId = zoneId;
    } else {
      profile = {
        id: `prof_${Date.now()}`,
        consumerId,
        monthlyRequirementKwh: Number(monthlyRequirementKwh),
        connectedLoadKw: Number(connectedLoadKw),
        billingCycle: 'MONTHLY',
        contractType: contractType || 'SUBSCRIPTION',
        allocatedGreenQuotaKwh: Number(monthlyRequirementKwh),
        preferredMaxRatePerKwh: Number(preferredMaxRatePerKwh),
        pincode,
        zoneId
      };
      db.consumerProfiles.push(profile);
    }
    res.json({ success: true, profile });
  });

  // Tariffs & Zones
  app.get('/api/tariffs', (req, res) => {
    res.json(db.tariffZones);
  });

  app.put('/api/tariffs/:zoneId', (req, res) => {
    const { zoneId } = req.params;
    const zone = db.tariffZones.find(z => z.zoneId === zoneId);
    if (!zone) return res.status(404).json({ error: 'Zone not found' });

    const {
      govtGridRetailRate,
      govtBuybackRate,
      xyzDefaultBuyRate,
      xyzDefaultSellRate,
      xyzPlatformMarginRate
    } = req.body;

    if (govtGridRetailRate !== undefined) zone.govtGridRetailRate = Number(govtGridRetailRate);
    if (govtBuybackRate !== undefined) zone.govtBuybackRate = Number(govtBuybackRate);
    if (xyzDefaultBuyRate !== undefined) zone.xyzDefaultBuyRate = Number(xyzDefaultBuyRate);
    if (xyzDefaultSellRate !== undefined) zone.xyzDefaultSellRate = Number(xyzDefaultSellRate);
    if (xyzPlatformMarginRate !== undefined) zone.xyzPlatformMarginRate = Number(xyzPlatformMarginRate);
    zone.lastUpdated = new Date().toISOString();

    res.json({ success: true, zone });
  });

  // Smart Meter Telemetry Ingestion Engine
  app.post('/api/telemetry/ingest', (req, res) => {
    const {
      meterId,
      unitsGeneratedKwh,
      unitsExportedKwh,
      timestamp,
      gridVoltageVolts,
      frequencyHz
    } = req.body;

    if (!meterId || unitsGeneratedKwh === undefined || unitsExportedKwh === undefined) {
      return res.status(400).json({ error: 'Missing required telemetry fields: meterId, unitsGeneratedKwh, unitsExportedKwh' });
    }

    const installation = db.installations.find(i => i.meterId === meterId);
    const user = installation ? db.users.find(u => u.id === installation.prosumerId) : undefined;

    const gen = Number(unitsGeneratedKwh);
    const exp = Number(unitsExportedKwh);
    const self = Math.max(0, gen - exp);

    const log = {
      id: `tel_${meterId}_${Date.now()}`,
      meterId,
      prosumerId: installation ? installation.prosumerId : 'unknown',
      prosumerName: user ? user.name : 'Unknown Meter',
      timestamp: timestamp || new Date().toISOString(),
      unitsGeneratedKwh: gen,
      unitsExportedKwh: exp,
      unitsSelfConsumedKwh: self,
      gridVoltageVolts: gridVoltageVolts ? Number(gridVoltageVolts) : 240.2,
      inverterEfficiencyPct: installation ? installation.efficiencyRatingPct : 97.5,
      frequencyHz: frequencyHz ? Number(frequencyHz) : 60.0,
      source: 'SMART_METER' as const,
      verified: true
    };

    db.telemetryLogs.unshift(log);
    res.json({ success: true, log });
  });

  // Manual fallback telemetry submission
  app.post('/api/telemetry/manual-submit', (req, res) => {
    const { prosumerId, meterId, unitsGeneratedKwh, unitsExportedKwh, proofDocumentUrl, verificationNotes } = req.body;
    const user = db.users.find(u => u.id === prosumerId);

    const log = {
      id: `tel_manual_${Date.now()}`,
      meterId: meterId || 'MANUAL-MTR',
      prosumerId,
      prosumerName: user?.name || 'Manual Submitter',
      timestamp: new Date().toISOString(),
      unitsGeneratedKwh: Number(unitsGeneratedKwh),
      unitsExportedKwh: Number(unitsExportedKwh),
      unitsSelfConsumedKwh: Math.max(0, Number(unitsGeneratedKwh) - Number(unitsExportedKwh)),
      gridVoltageVolts: 240.0,
      inverterEfficiencyPct: 96.0,
      frequencyHz: 60.0,
      source: 'MANUAL_SUBMISSION' as const,
      verified: false,
      proofDocumentUrl: proofDocumentUrl || 'https://images.unsplash.com/photo-1558441719-2f7bb7e2d93e?w=500&auto=format&fit=crop&q=60',
      verificationNotes: verificationNotes || 'Manual reading invoice/photo submitted for admin review.'
    };

    db.telemetryLogs.unshift(log);
    res.json({ success: true, log });
  });

  // Admin verify manual telemetry reading
  app.post('/api/telemetry/verify/:id', (req, res) => {
    const { id } = req.params;
    const { verified, notes } = req.body;
    const log = db.telemetryLogs.find(l => l.id === id);
    if (!log) return res.status(404).json({ error: 'Telemetry log not found' });
    log.verified = Boolean(verified);
    if (notes) log.verificationNotes = notes;
    res.json({ success: true, log });
  });

  app.get('/api/telemetry/history', (req, res) => {
    const { meterId, prosumerId, limit } = req.query;
    let logs = db.telemetryLogs;
    if (meterId) logs = logs.filter(l => l.meterId === meterId);
    if (prosumerId) logs = logs.filter(l => l.prosumerId === prosumerId);
    const maxLimit = limit ? Number(limit) : 100;
    res.json(logs.slice(0, maxLimit));
  });

  // Rate Negotiation & Bidding Engine
  app.get('/api/bids', (req, res) => {
    const { prosumerId } = req.query;
    let bids = db.bids;
    if (prosumerId) bids = bids.filter(b => b.prosumerId === prosumerId);
    res.json(bids);
  });

  app.post('/api/bids', (req, res) => {
    const { prosumerId, proposedRatePerKwh, estimatedMonthlyExportKwh, prosumerNotes } = req.body;
    const user = db.users.find(u => u.id === prosumerId);
    const inst = db.installations.find(i => i.prosumerId === prosumerId);

    if (!user || !inst) return res.status(400).json({ error: 'Prosumer installation not found' });

    const newBid = {
      id: `bid_${Date.now()}`,
      prosumerId,
      prosumerName: user.name,
      zoneId: inst.zoneId,
      plantCapacityKwp: inst.plantCapacityKwp,
      currentAgreedRate: inst.agreedBuybackRatePerKwh,
      proposedRatePerKwh: Number(proposedRatePerKwh),
      estimatedMonthlyExportKwh: Number(estimatedMonthlyExportKwh),
      status: 'PENDING' as const,
      prosumerNotes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.bids.unshift(newBid);
    res.json({ success: true, bid: newBid });
  });

  app.post('/api/bids/:id/respond', (req, res) => {
    const { id } = req.params;
    const { decision, counterRatePerKwh, adminNotes } = req.body; // 'ACCEPTED' | 'REJECTED' | 'COUNTER_OFFER'
    const bid = db.bids.find(b => b.id === id);
    if (!bid) return res.status(404).json({ error: 'Bid not found' });

    bid.status = decision;
    bid.adminNotes = adminNotes;
    bid.updatedAt = new Date().toISOString();

    if (decision === 'COUNTER_OFFER') {
      bid.counterRatePerKwh = Number(counterRatePerKwh);
    } else if (decision === 'ACCEPTED') {
      bid.resolvedAt = new Date().toISOString();
      // Automatically bind new rate to prosumer installation contract!
      const inst = db.installations.find(i => i.prosumerId === bid.prosumerId);
      if (inst) {
        inst.agreedBuybackRatePerKwh = bid.proposedRatePerKwh;
      }
    }

    res.json({ success: true, bid });
  });

  app.post('/api/bids/:id/prosumer-decision', (req, res) => {
    const { id } = req.params;
    const { accept } = req.body;
    const bid = db.bids.find(b => b.id === id);
    if (!bid) return res.status(404).json({ error: 'Bid not found' });

    if (accept && bid.counterRatePerKwh) {
      bid.status = 'ACCEPTED';
      bid.resolvedAt = new Date().toISOString();
      const inst = db.installations.find(i => i.prosumerId === bid.prosumerId);
      if (inst) {
        inst.agreedBuybackRatePerKwh = bid.counterRatePerKwh;
      }
    } else {
      bid.status = 'REJECTED';
      bid.resolvedAt = new Date().toISOString();
    }
    bid.updatedAt = new Date().toISOString();

    res.json({ success: true, bid });
  });

  // Demand-Supply Matching & Micro-Grid Redistribution
  app.post('/api/matching/execute', (req, res) => {
    const { method } = req.body;
    const runs = db.executeMatchingForAllZones(method || 'FIFO');
    res.json({ success: true, matchingRuns: runs });
  });

  app.get('/api/matching/runs', (req, res) => {
    res.json(db.matchingRuns);
  });

  app.get('/api/matching/transactions', (req, res) => {
    const { userId, role } = req.query;
    let txs = db.transactions;
    if (userId) {
      if (role === 'PROSUMER') {
        txs = txs.filter(t => t.prosumerId === userId);
      } else if (role === 'CONSUMER') {
        txs = txs.filter(t => t.consumerId === userId);
      } else {
        txs = txs.filter(t => t.prosumerId === userId || t.consumerId === userId);
      }
    }
    res.json(txs);
  });

  app.get('/api/matching/zone-pools', (req, res) => {
    const pools = db.tariffZones.map(zone => {
      let surplus = 0;
      let demand = 0;

      db.installations.filter(i => i.zoneId === zone.zoneId).forEach(inst => {
        const out = calculateSolarBellOutput(
          db.simulationState.currentSimHour,
          inst.plantCapacityKwp,
          db.simulationState.weatherCondition,
          inst.efficiencyRatingPct
        );
        surplus += out.intervalExportKwh * 4;
      });

      db.consumerProfiles.filter(p => p.zoneId === zone.zoneId).forEach(prof => {
        demand += (prof.monthlyRequirementKwh / 30 / 24) * 1.8;
      });

      return {
        zoneId: zone.zoneId,
        zoneName: zone.zoneName,
        region: zone.region,
        surplusKwh: parseFloat(surplus.toFixed(2)),
        demandKwh: parseFloat(demand.toFixed(2)),
        balanceKwh: parseFloat((surplus - demand).toFixed(2)),
        xyzBuyRate: zone.xyzDefaultBuyRate,
        xyzSellRate: zone.xyzDefaultSellRate,
        govtRetailRate: zone.govtGridRetailRate,
        govtBuybackRate: zone.govtBuybackRate
      };
    });

    res.json(pools);
  });

  // Wallets & Virtual Ledger
  app.get('/api/wallets/:userId', (req, res) => {
    const wallet = db.getWallet(req.params.userId);
    res.json(wallet);
  });

  app.post('/api/wallets/topup', (req, res) => {
    const { userId, amount } = req.body;
    const val = Number(amount);
    if (!val || val <= 0) return res.status(400).json({ error: 'Invalid topup amount' });

    const wallet = db.getWallet(userId);
    wallet.balance = parseFloat((wallet.balance + val).toFixed(2));
    wallet.ledgerHistory.unshift({
      id: `led_topup_${Date.now()}`,
      walletId: wallet.id,
      userId,
      timestamp: new Date().toISOString(),
      type: 'TOPUP',
      amount: val,
      balanceAfter: wallet.balance,
      referenceType: 'WALLET_TOPUP',
      description: `Added $${val.toFixed(2)} to wallet balance via Instant ACH/Card`
    });
    wallet.updatedAt = new Date().toISOString();

    res.json({ success: true, wallet });
  });

  app.post('/api/wallets/payout', (req, res) => {
    const { userId, amount, bankAccount } = req.body;
    const val = Number(amount);
    const wallet = db.getWallet(userId);

    if (!val || val <= 0 || val > wallet.balance) {
      return res.status(400).json({ error: 'Insufficient wallet balance for withdrawal' });
    }

    wallet.balance = parseFloat((wallet.balance - val).toFixed(2));
    wallet.ledgerHistory.unshift({
      id: `led_payout_${Date.now()}`,
      walletId: wallet.id,
      userId,
      timestamp: new Date().toISOString(),
      type: 'PAYOUT',
      amount: val,
      balanceAfter: wallet.balance,
      referenceType: 'BANK_PAYOUT',
      description: `Payout transfer of $${val.toFixed(2)} to ${bankAccount || 'Connected Bank Account ****4821'}`
    });
    wallet.updatedAt = new Date().toISOString();

    res.json({ success: true, wallet });
  });

  // Invoices & Billing
  app.get('/api/invoices', (req, res) => {
    const { userId } = req.query;
    let invs = db.invoices;
    if (userId) invs = invs.filter(i => i.userId === userId);
    res.json(invs);
  });

  app.get('/api/invoices/:id', (req, res) => {
    const inv = db.invoices.find(i => i.id === req.params.id);
    if (!inv) return res.status(404).json({ error: 'Invoice not found' });
    res.json(inv);
  });

  // Simulator Controls
  app.get('/api/simulator/status', (req, res) => {
    res.json(db.simulationState);
  });

  app.post('/api/simulator/config', (req, res) => {
    const { isRunning, currentSimHour, weatherCondition, speedMultiplier, autoMatchEnabled } = req.body;
    if (isRunning !== undefined) db.simulationState.isRunning = Boolean(isRunning);
    if (currentSimHour !== undefined) db.simulationState.currentSimHour = Number(currentSimHour);
    if (weatherCondition !== undefined) db.simulationState.weatherCondition = weatherCondition;
    if (speedMultiplier !== undefined) db.simulationState.speedMultiplier = Number(speedMultiplier);
    if (autoMatchEnabled !== undefined) db.simulationState.autoMatchEnabled = Boolean(autoMatchEnabled);

    res.json({ success: true, simulationState: db.simulationState });
  });

  app.post('/api/simulator/step', (req, res) => {
    const { hours } = req.body;
    db.stepSimulation(hours !== undefined ? Number(hours) : 0.25);
    res.json({ success: true, simulationState: db.simulationState });
  });

  app.post('/api/simulator/reset', (req, res) => {
    db.seed();
    res.json({ success: true, message: 'Database reset to fresh seed state.' });
  });

  // Admin Metrics
  app.get('/api/admin/metrics', (req, res) => {
    res.json(db.getGridMetrics());
  });

  // Gemini AI Smart Grid Advisor
  app.post('/api/ai/advisor', async (req, res) => {
    const { promptTopic } = req.body;
    const ai = getAI();
    const metrics = db.getGridMetrics();
    const sim = db.simulationState;

    if (!ai) {
      // Fallback structured analysis if key not set
      return res.json({
        analysis: `[XYZ Automated Grid Intelligence]\n\nAt Sim-Hour ${sim.currentSimHour}:00 (${sim.weatherCondition} conditions), aggregate solar generation is producing ${metrics.totalSurplusAvailableKwh} kWh surplus against ${metrics.totalDemandWaitingKwh} kWh consumer demand.\n\nKey Strategic Recommendations:\n1. Dynamic Margin Optimization: Increase XYZ buyback spread by $0.005 in North Silicon Corridor to incentivize commercial prosumer battery exports during 4-6 PM peak.\n2. Arbitrage Opportunity: Consumer savings are running at $${metrics.totalConsumerSavings24h.toFixed(2)} today with 0.85 kg/kWh carbon abatement.\n3. Capacity Expansion: Onboard 30 kWp additional rooftop solar in South Green Haven to balance unmet afternoon HVAC demand.`,
        model: 'heuristic-engine',
        metrics
      });
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are the lead algorithmic grid economist for XYZ Energy Share, a decentralized P2P solar energy aggregation and microgrid redistribution platform.
Analyze current live telemetry and provide actionable, executive recommendations:
Current Time Slot: ${sim.currentSimHour}:00 hrs
Weather: ${sim.weatherCondition}
Available Solar Surplus: ${metrics.totalSurplusAvailableKwh} kWh
Pending Consumer Demand: ${metrics.totalDemandWaitingKwh} kWh
Net Balance: ${metrics.netGridBalanceKwh} kWh
Volume Traded: ${metrics.totalVolumeTraded24hKwh} kWh
Platform Margin Earned: $${metrics.totalPlatformMarginEarned24h}
Active Plants: ${metrics.activeSolarPlantsCount}
Topic/Focus: ${promptTopic || 'Grid Balance & Dynamic Pricing Strategy'}

Keep response crisp, highly actionable, with bullet points for:
1. Micro-grid Dispatch & Routing Strategy
2. Dynamic Regional Tariff & Bidding Advice
3. Prosumer Arbitrage & Carbon Offset Impact`
      });

      res.json({
        analysis: response.text,
        model: 'gemini-2.5-flash',
        metrics
      });
    } catch (err: any) {
      console.error('Gemini error:', err);
      res.json({
        analysis: `Grid Dispatch Status: Operating at optimal ${sim.weatherCondition} conditions. Net surplus is ${metrics.netGridBalanceKwh > 0 ? '+' : ''}${metrics.netGridBalanceKwh} kWh with 99.8% reliability.`,
        model: 'fallback-advisor'
      });
    }
  });

  // Vite middleware for development vs Static serving in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`XYZ Energy Share server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Fatal server startup error:', err);
});
