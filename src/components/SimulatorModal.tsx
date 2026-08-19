import React from 'react';
import {
  X,
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  Play,
  RotateCcw,
  FastForward,
  Sparkles,
  Zap,
  Sliders,
  CheckCircle
} from 'lucide-react';
import { SimulationState } from '../types/index.ts';

interface SimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  simState: SimulationState;
  onUpdateConfig: (config: Partial<SimulationState>) => void;
  onStepSimulation: (hours: number) => void;
  onResetDatabase: () => void;
}

export const SimulatorModal: React.FC<SimulatorModalProps> = ({
  isOpen,
  onClose,
  simState,
  onUpdateConfig,
  onStepSimulation,
  onResetDatabase
}) => {
  if (!isOpen) return null;

  const formatHour = (decimalHour: number) => {
    const hours = Math.floor(decimalHour);
    const minutes = Math.round((decimalHour - hours) * 60);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 === 0 ? 12 : hours % 12;
    return `${displayHour}:${minutes < 10 ? '0' : ''}${minutes} ${period}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative text-slate-100 divide-y divide-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
              <Sliders className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Smart Meter &amp; Solar Telemetry Simulator
              </h2>
              <p className="text-xs text-slate-400">
                Adjust daylight solar bell curves, weather factors, and grid redistribution ticks
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls Body */}
        <div className="py-5 space-y-5">
          {/* Time of Day Slider */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Sun className="w-4 h-4 text-amber-400" />
                Simulated Solar Time
              </label>
              <div className="text-sm font-bold font-mono text-amber-400 bg-amber-950/60 px-2.5 py-0.5 rounded border border-amber-500/30">
                {formatHour(simState.currentSimHour)} ({simState.currentSimHour.toFixed(2)}h)
              </div>
            </div>

            <input
              id="sim-hour-slider"
              type="range"
              min="0"
              max="23.75"
              step="0.25"
              value={simState.currentSimHour}
              onChange={(e) => onUpdateConfig({ currentSimHour: parseFloat(e.target.value) })}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />

            <div className="flex justify-between text-[10px] text-slate-400 mt-2">
              <span>00:00 (Night)</span>
              <span>06:00 (Sunrise)</span>
              <span className="text-amber-400 font-semibold">12:00 (Peak Sun)</span>
              <span>18:00 (Sunset)</span>
              <span>23:45 (Night)</span>
            </div>

            {/* Quick Time Preset Buttons */}
            <div className="grid grid-cols-4 gap-2 mt-3">
              <button
                onClick={() => onUpdateConfig({ currentSimHour: 6.5 })}
                className="px-2 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              >
                🌅 Morning (6:30)
              </button>
              <button
                onClick={() => onUpdateConfig({ currentSimHour: 12.5 })}
                className="px-2 py-1 text-xs rounded bg-amber-950/50 hover:bg-amber-900/50 text-amber-300 border border-amber-500/30 font-semibold transition"
              >
                ☀️ Peak Sun (12:30)
              </button>
              <button
                onClick={() => onUpdateConfig({ currentSimHour: 16.0 })}
                className="px-2 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              >
                🌇 Afternoon (16:00)
              </button>
              <button
                onClick={() => onUpdateConfig({ currentSimHour: 20.0 })}
                className="px-2 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              >
                🌙 Night (20:00)
              </button>
            </div>
          </div>

          {/* Weather Condition Matrix */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">
              Atmospheric &amp; Cloud Cover Condition
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { type: 'SUNNY', label: 'Clear Sunny', factor: '100% Yield', icon: Sun, color: 'border-amber-500 bg-amber-950/40 text-amber-300' },
                { type: 'PARTLY_CLOUDY', label: 'Partly Cloudy', factor: '75% Yield', icon: CloudSun, color: 'border-teal-500 bg-teal-950/40 text-teal-300' },
                { type: 'OVERCAST', label: 'Heavy Overcast', factor: '35% Yield', icon: Cloud, color: 'border-slate-500 bg-slate-800/40 text-slate-300' },
                { type: 'RAINY', label: 'Rainy Storm', factor: '15% Yield', icon: CloudRain, color: 'border-cyan-500 bg-cyan-950/40 text-cyan-300' },
              ].map(w => {
                const Icon = w.icon;
                const isSelected = simState.weatherCondition === w.type;
                return (
                  <button
                    key={w.type}
                    onClick={() => onUpdateConfig({ weatherCondition: w.type as any })}
                    className={`p-3 rounded-xl border flex flex-col items-center text-center transition ${
                      isSelected ? `${w.color} ring-2 ring-emerald-400` : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className="w-5 h-5 mb-1.5" />
                    <span className="text-xs font-semibold">{w.label}</span>
                    <span className="text-[10px] opacity-75">{w.factor}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stepping & Auto-Matching */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-200">Auto-Redistribution</div>
                <div className="text-[11px] text-slate-400">Match pools automatically on time advance</div>
              </div>
              <button
                onClick={() => onUpdateConfig({ autoMatchEnabled: !simState.autoMatchEnabled })}
                className={`w-11 h-6 rounded-full p-1 transition flex items-center ${
                  simState.autoMatchEnabled ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-md" />
              </button>
            </div>

            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-200">Simulation Advance</div>
                <div className="text-[11px] text-slate-400">Step grid clock &amp; log readings</div>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => onStepSimulation(0.25)}
                  className="px-2.5 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition"
                >
                  +15m
                </button>
                <button
                  onClick={() => onStepSimulation(1.0)}
                  className="px-2.5 py-1 text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg transition"
                >
                  +1h
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 flex items-center justify-between gap-3">
          <button
            onClick={() => {
              if (confirm('Reset entire platform database to clean initial seed data?')) {
                onResetDatabase();
                onClose();
              }
            }}
            className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 py-1.5 px-2.5 rounded-lg hover:bg-rose-950/30 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Data</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-semibold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition"
          >
            Apply &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
};
