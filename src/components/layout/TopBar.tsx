import React from 'react';
import {
  Play,
  Pause,
  Clock,
  Sun,
  Moon,
  Globe,
  SlidersHorizontal,
  Droplets,
  AlertCircle
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { TRANSLATIONS } from '../../data/translations';
import { isSupplyWindow } from '../../engine/scoring';
import { Role, Language } from '../../types';

interface TopBarProps {
  onToggleDemoController: () => void;
  isDemoControllerOpen: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  onToggleDemoController,
  isDemoControllerOpen,
}) => {
  const {
    role,
    setRole,
    language,
    setLanguage,
    theme,
    setTheme,
    simulatedTime,
    isPlaying,
    speed,
    togglePlay,
    setSpeed,
    advanceSimulatedTime,
  } = useAppStore();

  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const windowStatus = isSupplyWindow(simulatedTime);

  const formattedTime = simulatedTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#1C2541]/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
      {/* Left: App Logo & Permanent Simulated Badge */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-jalora-blue text-white flex items-center justify-center font-bold shadow-xs">
            <Droplets size={20} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-jalora-navy dark:text-white">
                {t.appName}
              </span>
              {/* Permanent Simulated Data Badge */}
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                <AlertCircle size={11} className="text-amber-700 dark:text-amber-400" />
                {t.simulatedData}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
              {t.appSubtitle} (JJM PS 26255)
            </p>
          </div>
        </div>
      </div>

      {/* Center: Clock & Supply Window */}
      <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
        <div className="flex items-center gap-1.5 font-mono text-slate-800 dark:text-slate-200 font-medium">
          <Clock size={14} className="text-jalora-blue" />
          <span>{formattedTime}</span>
        </div>

        {/* Supply Window Status Tag */}
        {windowStatus.inWindow ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            {windowStatus.windowName === 'morning' ? 'Morning Window (06:00-08:00)' : 'Evening Window (17:00-19:00)'}
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-medium bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
            Off-schedule (0 flow normal)
          </span>
        )}

        {/* Play/Pause & Speed Controls */}
        <div className="flex items-center gap-1 pl-1 border-l border-slate-300 dark:border-slate-700">
          <button
            type="button"
            id="clock-play-pause-btn"
            onClick={togglePlay}
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 focus:ring-1 focus:ring-jalora-blue"
            aria-label={isPlaying ? t.pause : t.play}
            title={isPlaying ? t.pause : t.play}
          >
            {isPlaying ? <Pause size={13} /> : <Play size={13} />}
          </button>

          <button
            type="button"
            id="clock-step-15m-btn"
            onClick={() => advanceSimulatedTime(15)}
            className="px-1.5 py-0.5 text-[11px] rounded bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600"
            title="Step +15 minutes"
          >
            +15m
          </button>

          {/* Speed Selector */}
          <div className="flex items-center rounded overflow-hidden border border-slate-300 dark:border-slate-600 text-[10px]">
            {([1, 10, 60] as const).map((spd) => (
              <button
                key={spd}
                type="button"
                id={`clock-speed-${spd}x-btn`}
                onClick={() => setSpeed(spd)}
                className={`px-1.5 py-0.5 ${
                  speed === spd
                    ? 'bg-jalora-blue text-white font-semibold'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Role Switcher, Controls, Theme, Language */}
      <div className="flex items-center gap-2">
        {/* Role Selector */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
          <label htmlFor="role-select" className="sr-only">Select Role</label>
          <select
            id="role-select"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="bg-transparent text-xs font-medium text-slate-800 dark:text-slate-200 px-2 py-1 rounded cursor-pointer focus:ring-1 focus:ring-jalora-blue focus:outline-none"
          >
            <option value="vwsc" className="dark:bg-slate-800">{t.roleVWSC}</option>
            <option value="villager" className="dark:bg-slate-800">{t.roleVillager}</option>
            <option value="state" className="dark:bg-slate-800">{t.roleState}</option>
          </select>
        </div>

        {/* Language Switcher */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
          <Globe size={13} className="ml-1.5 text-slate-500 dark:text-slate-400" />
          <label htmlFor="language-select" className="sr-only">Select Language</label>
          <select
            id="language-select"
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="bg-transparent text-xs text-slate-800 dark:text-slate-200 px-1.5 py-1 rounded cursor-pointer focus:ring-1 focus:ring-jalora-blue focus:outline-none"
          >
            <option value="en" className="dark:bg-slate-800">EN</option>
            <option value="ta" className="dark:bg-slate-800">தமிழ்</option>
            <option value="hi" className="dark:bg-slate-800">हिंदी</option>
          </select>
        </div>

        {/* Theme Toggle */}
        <button
          type="button"
          id="theme-toggle-btn"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 focus:ring-1 focus:ring-jalora-blue"
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Demo Controller Drawer Toggle */}
        <button
          type="button"
          id="demo-controller-toggle-btn"
          onClick={onToggleDemoController}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
            isDemoControllerOpen
              ? 'bg-jalora-navy text-white dark:bg-blue-600'
              : 'bg-jalora-blue text-white hover:bg-jalora-blue-dark'
          }`}
          aria-label="Toggle Demo Scenarios Controller"
        >
          <SlidersHorizontal size={14} />
          <span className="hidden sm:inline">Scenarios</span>
        </button>
      </div>
    </header>
  );
};
