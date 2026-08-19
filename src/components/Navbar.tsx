import React from 'react';
import {
  Sun,
  Zap,
  Network,
  ShieldCheck,
  Play,
  RotateCcw,
  Sliders,
  CloudSun,
  TrendingUp,
  User as UserIcon,
  ChevronDown
} from 'lucide-react';
import { User, SimulationState, GridMetrics, UserRole } from '../types/index.ts';

interface NavbarProps {
  currentUser: User;
  allUsers: User[];
  onSwitchUser: (userId: string) => void;
  onSwitchRoleTab: (role: UserRole) => void;
  activeTabRole: UserRole;
  simState: SimulationState;
  gridMetrics: GridMetrics;
  onOpenSimulator: () => void;
  onQuickStep: (hours: number) => void;
  onQuickMatch: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  allUsers,
  onSwitchUser,
  onSwitchRoleTab,
  activeTabRole,
  simState,
  gridMetrics,
  onOpenSimulator,
  onQuickStep,
  onQuickMatch
}) => {
  const formatHour = (decimalHour: number) => {
    const hours = Math.floor(decimalHour);
    const minutes = Math.round((decimalHour - hours) * 60);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 === 0 ? 12 : hours % 12;
    return `${displayHour}:${minutes < 10 ? '0' : ''}${minutes} ${period}`;
  };

  const getWeatherIcon = (weather: string) => {
    switch (weather) {
      case 'SUNNY': return '☀️ Sunny';
      case 'PARTLY_CLOUDY': return '⛅ Partly Cloudy';
      case 'OVERCAST': return '☁️ Overcast';
      case 'RAINY': return '🌧️ Rainy';
      default: return '☀️ Sunny';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#020617]/80 backdrop-blur-xl border-b border-slate-800 text-slate-100">
      {/* Top Bar: Brand, Live Grid Ticker & Controls */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center glow-emerald shadow-lg ring-1 ring-emerald-400/40">
            <span className="font-bold text-slate-950 text-xl font-mono">Z</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-slate-100">
                XYZ ENERGY
              </span>
              <span className="text-[10px] text-emerald-400 font-mono tracking-widest uppercase bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                Micro-Grid v4.2
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Decentralized Rooftop Solar Aggregation &amp; Virtual Redistribution
            </p>
          </div>
        </div>

        {/* Live Grid Status Ticker */}
        <div className="hidden md:flex items-center gap-3 bg-slate-900/60 border border-slate-800/90 rounded-xl px-3 py-1.5 text-xs backdrop-blur-md">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
            <span className="text-slate-400">Sim Time:</span>
            <span className="font-mono font-bold text-amber-300">
              {formatHour(simState.currentSimHour)}
            </span>
          </div>

          <span className="text-slate-700">|</span>

          <div className="text-slate-300">
            {getWeatherIcon(simState.weatherCondition)}
          </div>

          <span className="text-slate-700">|</span>

          <div className="flex items-center gap-1">
            <span className="text-slate-400">Irradiance:</span>
            <span className="font-mono font-semibold text-emerald-400">
              {simState.solarIrradiancePct}%
            </span>
          </div>

          <span className="text-slate-700">|</span>

          <div className="flex items-center gap-1">
            <span className="text-slate-400">Net Surplus:</span>
            <span className={`font-mono font-bold ${gridMetrics.netGridBalanceKwh >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {gridMetrics.netGridBalanceKwh >= 0 ? '+' : ''}{gridMetrics.netGridBalanceKwh.toFixed(1)} kWh
            </span>
          </div>
        </div>

        {/* Action Controls & Profile */}
        <div className="flex items-center gap-2">
          {/* Quick Step Simulation Button */}
          <button
            id="quick-step-sim-btn"
            onClick={() => onQuickStep(0.25)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition"
            title="Advance solar time by 15 minutes"
          >
            <Play className="w-3.5 h-3.5 text-emerald-400" />
            <span>+15m</span>
          </button>

          {/* Quick Match Button */}
          <button
            id="quick-match-grid-btn"
            onClick={onQuickMatch}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-medium rounded-lg border border-emerald-500/30 transition"
            title="Execute instant microgrid demand-supply matching"
          >
            <Network className="w-3.5 h-3.5 text-emerald-400" />
            <span>Match Grid</span>
          </button>

          {/* Open Full Simulator Controls */}
          <button
            id="open-sim-modal-btn"
            onClick={onOpenSimulator}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500/20 to-emerald-500/20 hover:from-amber-500/30 hover:to-emerald-500/30 text-amber-200 text-xs font-semibold rounded-lg border border-amber-500/30 transition"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Telemetry Sim</span>
          </button>

          {/* User Account Switcher */}
          <div className="relative group">
            <div className="flex items-center gap-2 pl-2 pr-3 py-1 bg-slate-800/90 border border-slate-700 rounded-lg cursor-pointer hover:border-slate-600 transition">
              <img
                src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150'}
                alt={currentUser.name}
                className="w-6 h-6 rounded-full object-cover ring-1 ring-emerald-400"
              />
              <div className="text-left hidden sm:block">
                <div className="text-xs font-semibold text-slate-200 leading-tight">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-emerald-400 uppercase tracking-wider font-mono">
                  {currentUser.role}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>

            {/* Dropdown Menu */}
            <div className="absolute right-0 mt-1 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-2 z-50 hidden group-hover:block divide-y divide-slate-800">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Switch Active Persona
              </div>
              <div className="max-h-60 overflow-y-auto py-1">
                {allUsers.map(user => (
                  <button
                    key={user.id}
                    onClick={() => {
                      onSwitchUser(user.id);
                      onSwitchRoleTab(user.role);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800 transition ${
                      user.id === currentUser.id ? 'bg-slate-800/80 text-emerald-400 font-semibold' : 'text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        user.role === 'PROSUMER' ? 'bg-amber-400' :
                        user.role === 'CONSUMER' ? 'bg-emerald-400' :
                        user.role === 'DISPATCHER' ? 'bg-cyan-400' : 'bg-purple-400'
                      }`} />
                      <div>
                        <div>{user.name}</div>
                        <div className="text-[10px] text-slate-400">{user.email}</div>
                      </div>
                    </div>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">
                      {user.role}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Role Navigation Bar */}
      <div className="bg-slate-950/60 border-t border-slate-800/60 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto scrollbar-none py-1">
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Prosumer Tab */}
            <button
              id="role-tab-prosumer"
              onClick={() => onSwitchRoleTab('PROSUMER')}
              className={`flex items-center gap-2.5 px-3.5 py-2 rounded-md text-xs sm:text-sm font-medium transition ${
                activeTabRole === 'PROSUMER'
                  ? 'bg-slate-800/60 border border-slate-700 text-amber-300 shadow-[0_0_15px_rgba(0,0,0,0.5)]'
                  : 'text-slate-400 hover:text-white transition-colors'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${activeTabRole === 'PROSUMER' ? 'bg-amber-400 glow-amber-sm' : 'bg-slate-700'}`} />
              <span>Solar Prosumer</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-amber-950/80 text-amber-300 border border-amber-500/30 hidden md:inline">
                Sellers
              </span>
            </button>

            {/* Consumer Tab */}
            <button
              id="role-tab-consumer"
              onClick={() => onSwitchRoleTab('CONSUMER')}
              className={`flex items-center gap-2.5 px-3.5 py-2 rounded-md text-xs sm:text-sm font-medium transition ${
                activeTabRole === 'CONSUMER'
                  ? 'bg-slate-800/60 border border-slate-700 text-emerald-400 shadow-[0_0_15px_rgba(0,0,0,0.5)]'
                  : 'text-slate-400 hover:text-white transition-colors'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${activeTabRole === 'CONSUMER' ? 'bg-emerald-400 glow-emerald-sm' : 'bg-slate-700'}`} />
              <span>Energy Consumer</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 hidden md:inline">
                Buyers
              </span>
            </button>

            {/* Dispatcher Tab */}
            <button
              id="role-tab-dispatcher"
              onClick={() => onSwitchRoleTab('DISPATCHER')}
              className={`flex items-center gap-2.5 px-3.5 py-2 rounded-md text-xs sm:text-sm font-medium transition ${
                activeTabRole === 'DISPATCHER'
                  ? 'bg-slate-800/60 border border-slate-700 text-cyan-400 shadow-[0_0_15px_rgba(0,0,0,0.5)]'
                  : 'text-slate-400 hover:text-white transition-colors'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${activeTabRole === 'DISPATCHER' ? 'bg-cyan-400 glow-cyan-sm' : 'bg-slate-700'}`} />
              <span>Grid Dispatcher</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 hidden md:inline">
                Microgrid
              </span>
            </button>

            {/* Admin Tab */}
            <button
              id="role-tab-admin"
              onClick={() => onSwitchRoleTab('ADMIN')}
              className={`flex items-center gap-2.5 px-3.5 py-2 rounded-md text-xs sm:text-sm font-medium transition ${
                activeTabRole === 'ADMIN'
                  ? 'bg-slate-800/60 border border-slate-700 text-purple-300 shadow-[0_0_15px_rgba(0,0,0,0.5)]'
                  : 'text-slate-400 hover:text-white transition-colors'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${activeTabRole === 'ADMIN' ? 'bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.8)]' : 'bg-slate-700'}`} />
              <span>XYZ Org Admin</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-purple-950/80 text-purple-300 border border-purple-500/30 hidden md:inline">
                Command
              </span>
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Arbitrage Rate Spread: <strong className="text-emerald-300 font-mono">$0.04/kWh</strong>
            </span>
            <span className="text-slate-700">|</span>
            <span className="flex items-center gap-1.5">
              CO2 Abatement: <strong className="text-teal-300 font-mono">{gridMetrics.totalCo2Offset24hKg} kg</strong>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
