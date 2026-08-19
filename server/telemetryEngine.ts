import { TelemetryLog, SolarInstallation, SimulationState } from '../src/types/index.ts';

export function calculateSolarBellOutput(
  hourOfDay: number, // 0.0 to 24.0 (e.g. 13.5 = 13:30)
  plantCapacityKwp: number,
  weather: 'SUNNY' | 'PARTLY_CLOUDY' | 'OVERCAST' | 'RAINY',
  inverterEfficiencyPct: number = 97.5
): {
  instantKw: number;
  intervalGenKwh: number; // For 15 minute interval (0.25h)
  intervalSelfKwh: number;
  intervalExportKwh: number;
  voltage: number;
  frequency: number;
} {
  // Daylight is between 6:00 AM (6.0) and 18:00 (18.0)
  let solarFactor = 0;
  if (hourOfDay >= 6.0 && hourOfDay <= 18.0) {
    const angle = ((hourOfDay - 6.0) / 12.0) * Math.PI;
    solarFactor = Math.sin(angle);
    // Skew slightly for afternoon thermal coefficient
    if (hourOfDay > 13) {
      solarFactor = solarFactor * (1 - (hourOfDay - 13) * 0.015);
    }
  }

  // Weather attenuation factor
  let weatherMultiplier = 1.0;
  switch (weather) {
    case 'SUNNY':
      weatherMultiplier = 0.95 + Math.random() * 0.05;
      break;
    case 'PARTLY_CLOUDY':
      weatherMultiplier = 0.65 + Math.random() * 0.2;
      break;
    case 'OVERCAST':
      weatherMultiplier = 0.3 + Math.random() * 0.15;
      break;
    case 'RAINY':
      weatherMultiplier = 0.1 + Math.random() * 0.1;
      break;
  }

  // DC to AC output power in kW
  const deratedCapacity = plantCapacityKwp * (inverterEfficiencyPct / 100);
  const instantKw = Math.max(0, deratedCapacity * solarFactor * weatherMultiplier);

  // 15-minute interval energy = power * 0.25 hours
  const intervalGenKwh = parseFloat((instantKw * 0.25).toFixed(4));

  // Residential base load model: morning (7-9am) ~1.5kW, midday ~0.8kW, evening (18-21pm) ~2.2kW
  let baseLoadKw = 0.8;
  if (hourOfDay >= 7 && hourOfDay <= 9) baseLoadKw = 1.8 + Math.random() * 0.6;
  else if (hourOfDay > 9 && hourOfDay < 17) baseLoadKw = 0.9 + Math.random() * 0.4;
  else if (hourOfDay >= 17 && hourOfDay <= 21) baseLoadKw = 2.4 + Math.random() * 0.8;
  else baseLoadKw = 0.5 + Math.random() * 0.3;

  // Scale base load for larger commercial prosumers (e.g. >25 kWp)
  if (plantCapacityKwp > 25) {
    baseLoadKw = baseLoadKw * (plantCapacityKwp / 10);
  }

  const intervalDemandKwh = parseFloat((baseLoadKw * 0.25).toFixed(4));
  const intervalSelfKwh = parseFloat(Math.min(intervalGenKwh, intervalDemandKwh).toFixed(4));
  const intervalExportKwh = parseFloat(Math.max(0, intervalGenKwh - intervalSelfKwh).toFixed(4));

  // Realistic grid electrical parameters
  const voltage = parseFloat((239.5 + (Math.random() * 3.0 - 1.5) + (instantKw > 5 ? 1.5 : 0)).toFixed(1));
  const frequency = parseFloat((60.0 + (Math.random() * 0.08 - 0.04)).toFixed(2));

  return {
    instantKw: parseFloat(instantKw.toFixed(2)),
    intervalGenKwh,
    intervalSelfKwh,
    intervalExportKwh,
    voltage,
    frequency
  };
}

export function generate24HourTelemetryForInstallation(
  installation: SolarInstallation,
  prosumerName: string,
  weather: 'SUNNY' | 'PARTLY_CLOUDY' | 'OVERCAST' | 'RAINY' = 'SUNNY'
): TelemetryLog[] {
  const logs: TelemetryLog[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 96 intervals of 15 minutes in 24 hours
  for (let slot = 0; slot < 96; slot++) {
    const hour = slot * 0.25;
    const logTime = new Date(today.getTime() + slot * 15 * 60 * 1000);
    const result = calculateSolarBellOutput(
      hour,
      installation.plantCapacityKwp,
      weather,
      installation.efficiencyRatingPct
    );

    logs.push({
      id: `tel_${installation.meterId}_${slot}`,
      meterId: installation.meterId,
      prosumerId: installation.prosumerId,
      prosumerName,
      timestamp: logTime.toISOString(),
      unitsGeneratedKwh: result.intervalGenKwh,
      unitsExportedKwh: result.intervalExportKwh,
      unitsSelfConsumedKwh: result.intervalSelfKwh,
      gridVoltageVolts: result.voltage,
      inverterEfficiencyPct: installation.efficiencyRatingPct,
      frequencyHz: result.frequency,
      source: 'SMART_METER',
      verified: true
    });
  }

  return logs;
}
