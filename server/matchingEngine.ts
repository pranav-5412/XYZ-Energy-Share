import {
  MatchingRun,
  EnergyTransaction,
  TariffZone,
  SolarInstallation,
  ConsumerProfile,
  User,
  Wallet,
  MatchingMethod
} from '../src/types/index.ts';

export interface MatchingInput {
  zone: TariffZone;
  prosumers: { user: User; installation: SolarInstallation; availableSurplusKwh: number }[];
  consumers: { user: User; profile: ConsumerProfile; demandKwh: number }[];
  method: MatchingMethod;
}

export function executeZoneMatching(input: MatchingInput): {
  matchingRun: MatchingRun;
  transactions: EnergyTransaction[];
} {
  const { zone, prosumers, consumers, method } = input;
  const runId = `run_${zone.zoneId}_${Date.now()}`;
  const timestamp = new Date().toISOString();

  const totalSurplusKwh = prosumers.reduce((acc, p) => acc + p.availableSurplusKwh, 0);
  const totalDemandKwh = consumers.reduce((acc, c) => acc + c.demandKwh, 0);

  const transactions: EnergyTransaction[] = [];
  let totalMatchedKwh = 0;
  let totalProsumerPayout = 0;
  let totalConsumerCharge = 0;
  let totalPlatformMargin = 0;

  const CO2_FACTOR_KG_PER_KWH = 0.85;

  if (totalSurplusKwh > 0 && totalDemandKwh > 0) {
    if (method === 'FIFO') {
      // FIFO: Match sequentially
      const prosumerQueue = prosumers
        .filter(p => p.availableSurplusKwh > 0)
        .map(p => ({ ...p, remainingSurplus: p.availableSurplusKwh }));
      
      const consumerQueue = consumers
        .filter(c => c.demandKwh > 0)
        .map(c => ({ ...c, remainingDemand: c.demandKwh }));

      let pIdx = 0;
      let cIdx = 0;

      while (pIdx < prosumerQueue.length && cIdx < consumerQueue.length) {
        const p = prosumerQueue[pIdx];
        const c = consumerQueue[cIdx];

        const matchKwh = Math.min(p.remainingSurplus, c.remainingDemand);
        if (matchKwh > 0.001) {
          const buyRate = p.installation.agreedBuybackRatePerKwh || zone.xyzDefaultBuyRate;
          const sellRate = zone.xyzDefaultSellRate;
          const creditAmount = parseFloat((matchKwh * buyRate).toFixed(3));
          const debitAmount = parseFloat((matchKwh * sellRate).toFixed(3));
          const marginAmount = parseFloat((debitAmount - creditAmount).toFixed(3));
          const co2Kg = parseFloat((matchKwh * CO2_FACTOR_KG_PER_KWH).toFixed(2));

          transactions.push({
            id: `tx_${runId}_${transactions.length + 1}`,
            matchingRunId: runId,
            timestamp,
            zoneId: zone.zoneId,
            prosumerId: p.user.id,
            prosumerName: p.user.name,
            consumerId: c.user.id,
            consumerName: c.user.name,
            unitsKwh: parseFloat(matchKwh.toFixed(3)),
            prosumerRatePerKwh: buyRate,
            consumerRatePerKwh: sellRate,
            prosumerCreditAmount: creditAmount,
            consumerDebitAmount: debitAmount,
            platformMarginAmount: marginAmount,
            co2OffsetKg: co2Kg,
            status: 'SETTLED'
          });

          totalMatchedKwh += matchKwh;
          totalProsumerPayout += creditAmount;
          totalConsumerCharge += debitAmount;
          totalPlatformMargin += marginAmount;

          p.remainingSurplus -= matchKwh;
          c.remainingDemand -= matchKwh;
        }

        if (p.remainingSurplus <= 0.001) pIdx++;
        if (c.remainingDemand <= 0.001) cIdx++;
      }
    } else {
      // PRO-RATA: Proportionally allocate available supply to demand
      const allocationRatio = Math.min(1.0, totalSurplusKwh / totalDemandKwh);

      for (const c of consumers) {
        if (c.demandKwh <= 0) continue;
        const targetConsumerKwh = c.demandKwh * allocationRatio;
        let consumerRemainingToFulfill = targetConsumerKwh;

        for (const p of prosumers) {
          if (p.availableSurplusKwh <= 0 || consumerRemainingToFulfill <= 0.001) continue;
          
          // Proportional share from this prosumer
          const prosumerShareRatio = p.availableSurplusKwh / totalSurplusKwh;
          const kwhFromThisProsumer = Math.min(
            targetConsumerKwh * prosumerShareRatio,
            consumerRemainingToFulfill
          );

          if (kwhFromThisProsumer > 0.001) {
            const buyRate = p.installation.agreedBuybackRatePerKwh || zone.xyzDefaultBuyRate;
            const sellRate = zone.xyzDefaultSellRate;
            const creditAmount = parseFloat((kwhFromThisProsumer * buyRate).toFixed(3));
            const debitAmount = parseFloat((kwhFromThisProsumer * sellRate).toFixed(3));
            const marginAmount = parseFloat((debitAmount - creditAmount).toFixed(3));
            const co2Kg = parseFloat((kwhFromThisProsumer * CO2_FACTOR_KG_PER_KWH).toFixed(2));

            transactions.push({
              id: `tx_${runId}_${transactions.length + 1}`,
              matchingRunId: runId,
              timestamp,
              zoneId: zone.zoneId,
              prosumerId: p.user.id,
              prosumerName: p.user.name,
              consumerId: c.user.id,
              consumerName: c.user.name,
              unitsKwh: parseFloat(kwhFromThisProsumer.toFixed(3)),
              prosumerRatePerKwh: buyRate,
              consumerRatePerKwh: sellRate,
              prosumerCreditAmount: creditAmount,
              consumerDebitAmount: debitAmount,
              platformMarginAmount: marginAmount,
              co2OffsetKg: co2Kg,
              status: 'SETTLED'
            });

            totalMatchedKwh += kwhFromThisProsumer;
            totalProsumerPayout += creditAmount;
            totalConsumerCharge += debitAmount;
            totalPlatformMargin += marginAmount;

            consumerRemainingToFulfill -= kwhFromThisProsumer;
          }
        }
      }
    }
  }

  totalMatchedKwh = parseFloat(totalMatchedKwh.toFixed(3));
  const unallocatedSurplus = parseFloat(Math.max(0, totalSurplusKwh - totalMatchedKwh).toFixed(3));
  const unfulfilledDemand = parseFloat(Math.max(0, totalDemandKwh - totalMatchedKwh).toFixed(3));
  const co2OffsetKg = parseFloat((totalMatchedKwh * CO2_FACTOR_KG_PER_KWH).toFixed(2));

  const matchingRun: MatchingRun = {
    id: runId,
    timestamp,
    zoneId: zone.zoneId,
    zoneName: zone.zoneName,
    totalSurplusKwh: parseFloat(totalSurplusKwh.toFixed(3)),
    totalDemandKwh: parseFloat(totalDemandKwh.toFixed(3)),
    matchedKwh: totalMatchedKwh,
    unallocatedSurplusKwh: unallocatedSurplus,
    unfulfilledDemandKwh: unfulfilledDemand,
    method,
    avgBuyRatePerKwh: zone.xyzDefaultBuyRate,
    avgSellRatePerKwh: zone.xyzDefaultSellRate,
    totalProsumerPayout: parseFloat(totalProsumerPayout.toFixed(2)),
    totalConsumerCharge: parseFloat(totalConsumerCharge.toFixed(2)),
    platformMarginEarned: parseFloat(totalPlatformMargin.toFixed(2)),
    co2OffsetKg,
    status: 'COMPLETED',
    transactionCount: transactions.length
  };

  return { matchingRun, transactions };
}
