import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bookmark,
  CalendarClock,
  FastForward,
  Filter,
  Gauge,
  Globe,
  Moon,
  Orbit,
  Pause,
  Play,
  Rewind,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  SunMedium,
} from 'lucide-react';
import React, { useMemo } from 'react';
import type { BodyId, EphemerisSnapshot, MacroBookmark } from '../lib/ephemeris';
import type { MarketRegimeBriefing, RegimeTone } from '../lib/marketRegime';
import type { AspectFilterMode, ViewCoordinateMode } from './CelestialArena3D';

export type PlaybackSpeedDaysPerSec = 1 | 7 | 30;

interface TimelineControllerProps {
  currentDate: Date;
  referenceNow: Date;
  onChangeDate: (next: Date) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  playbackSpeed: PlaybackSpeedDaysPerSec;
  onChangeSpeed: (speed: PlaybackSpeedDaysPerSec) => void;
  playbackReverse: boolean;
  onToggleReverse: () => void;
  bookmarks: MacroBookmark[];
  aspectFilter: AspectFilterMode;
  onChangeAspectFilter: (mode: AspectFilterMode) => void;
  macroOnly: boolean;
  onToggleMacroOnly: () => void;
  showShadowZones: boolean;
  onToggleShadowZones: () => void;
  viewMode: ViewCoordinateMode;
  onChangeViewMode: (mode: ViewCoordinateMode) => void;
  snapshot: EphemerisSnapshot;
  briefing: MarketRegimeBriefing;
  onSelectBody: (id: BodyId | null) => void;
  onOpenHorizons: () => void;
}

const MS_PER_HOUR = 3_600_000;
const MS_PER_DAY = 86_400_000;
const FIVE_YEARS_MS = 5 * 365.25 * MS_PER_DAY;

const TONE_STYLES: Record<
  RegimeTone,
  { badge: string; accentBorder: string; glowText: string }
> = {
  BULLISH_RUNWAY: {
    badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/45',
    accentBorder: 'border-l-emerald-500',
    glowText: 'text-emerald-300',
  },
  AUDIT_CAUTION: {
    badge: 'bg-amber-500/15 text-amber-200 border-amber-500/45',
    accentBorder: 'border-l-amber-500',
    glowText: 'text-amber-300',
  },
  CHOP_FRICTION: {
    badge: 'bg-orange-500/15 text-orange-200 border-orange-500/45',
    accentBorder: 'border-l-orange-500',
    glowText: 'text-orange-300',
  },
  HIGH_INFLECTION: {
    badge: 'bg-rose-500/20 text-rose-200 border-rose-500/55',
    accentBorder: 'border-l-rose-500',
    glowText: 'text-rose-300',
  },
};

function toUtcDatetimeLocalValue(date: Date): string {
  // YYYY-MM-DDTHH:mm in UTC
  return date.toISOString().slice(0, 16);
}

export const TimelineController: React.FC<TimelineControllerProps> = ({
  currentDate,
  referenceNow,
  onChangeDate,
  isPlaying,
  onTogglePlay,
  playbackSpeed,
  onChangeSpeed,
  playbackReverse,
  onToggleReverse,
  bookmarks,
  aspectFilter,
  onChangeAspectFilter,
  macroOnly,
  onToggleMacroOnly,
  showShadowZones,
  onToggleShadowZones,
  viewMode,
  onChangeViewMode,
  snapshot,
  briefing,
  onSelectBody,
  onOpenHorizons,
}) => {
  const minMs = referenceNow.getTime() - FIVE_YEARS_MS;
  const maxMs = referenceNow.getTime() + FIVE_YEARS_MS;
  const clampedMs = Math.max(minMs, Math.min(maxMs, currentDate.getTime()));

  // Year & Quarter tick marks across the 10-year span
  const yearTicks = useMemo(() => {
    const startYear = new Date(minMs).getUTCFullYear() + 1;
    const endYear = new Date(maxMs).getUTCFullYear();
    const ticks: Array<{ year: number; pct: number }> = [];
    for (let y = startYear; y <= endYear; y++) {
      const t = Date.UTC(y, 0, 1);
      if (t >= minMs && t <= maxMs) {
        ticks.push({
          year: y,
          pct: ((t - minMs) / (maxMs - minMs)) * 100,
        });
      }
    }
    return ticks;
  }, [minMs, maxMs]);

  const monthMinorTicks = useMemo(() => {
    const startYear = new Date(minMs).getUTCFullYear();
    const endYear = new Date(maxMs).getUTCFullYear();
    const pcts: number[] = [];
    for (let y = startYear; y <= endYear; y++) {
      for (const m of [3, 6, 9]) {
        const t = Date.UTC(y, m, 1);
        if (t >= minMs && t <= maxMs) {
          pcts.push(((t - minMs) / (maxMs - minMs)) * 100);
        }
      }
    }
    return pcts;
  }, [minMs, maxMs]);

  const stepByMs = (deltaMs: number) => {
    const nextMs = Math.max(minMs, Math.min(maxMs, currentDate.getTime() + deltaMs));
    onChangeDate(new Date(nextMs));
  };

  const deltaDaysFromNow = (currentDate.getTime() - referenceNow.getTime()) / MS_PER_DAY;
  const postureStyle = TONE_STYLES[briefing.postureTone];

  const categoryColorMap: Record<MacroBookmark['category'], string> = {
    RETROGRADE: 'border-red-500/40 text-red-200 bg-red-950/20 hover:border-red-400',
    CONJUNCTION: 'border-amber-500/40 text-amber-200 bg-amber-950/20 hover:border-amber-400',
    TENSION: 'border-rose-500/40 text-rose-200 bg-rose-950/20 hover:border-rose-400',
    STRUCTURAL: 'border-emerald-500/40 text-emerald-200 bg-emerald-950/20 hover:border-emerald-400',
    ECLIPSE: 'border-sky-500/40 text-sky-200 bg-sky-950/20 hover:border-sky-400',
  };

  return (
    <section
      id="timeline-scrubber-dock"
      aria-label="Command surface: timeline simulation, 3D optics, and live regime telemetry"
      className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-5"
    >
      {/* 1. TEMPORAL TRANSPORT & DIRECT EPOCH STEPPING */}
      <div className="terminal-panel-brass rounded-lg p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#C8A45D]/20 pb-3">
          <div>
            <div className="font-mono-tabular text-[10px] font-semibold uppercase tracking-widest text-[#C8A45D]">
              Temporal Transport // Simulation Engine
            </div>
            <div className="mt-0.5 flex items-center gap-2 font-mono-tabular text-xs text-slate-300">
              <Moon className="h-3.5 w-3.5 text-[#C8A45D]" />
              <span>{snapshot.lunar.phaseName}</span>
              <span className="text-slate-600">·</span>
              <span className="text-[#F3DC9F] font-semibold">
                {snapshot.lunar.illuminationPct.toFixed(0)}% Illum
              </span>
            </div>
          </div>

          <span className="rounded border border-slate-700/80 bg-[#090D16] px-2.5 py-1 font-mono-tabular text-[11px] font-medium text-[#F3DC9F]">
            {Math.abs(deltaDaysFromNow) < 0.05
              ? 'LIVE EPOCH'
              : `${deltaDaysFromNow > 0 ? '+' : ''}${deltaDaysFromNow.toFixed(1)}d vs Now`}
          </span>
        </div>

        {/* Transport Action Row */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="timeline-play-toggle"
            type="button"
            onClick={onTogglePlay}
            className={`flex items-center justify-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-semibold tracking-wide transition cursor-pointer ${
              isPlaying
                ? 'bg-amber-500/25 text-[#F3DC9F] border border-[#F3DC9F]/80 shadow-[0_0_15px_rgba(227,197,130,0.3)]'
                : 'bg-[#141B29] text-[#E6ECF5] border border-[#C8A45D]/50 hover:border-[#F3DC9F]'
            }`}
          >
            {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {isPlaying ? 'PAUSE' : 'TIME-LAPSE'}
          </button>

          <button
            id="timeline-direction-toggle"
            type="button"
            onClick={onToggleReverse}
            title="Toggle Forward / Reverse Time-Lapse"
            className={`flex items-center gap-1 rounded-md px-2.5 py-2 font-mono-tabular text-xs font-medium border transition cursor-pointer ${
              playbackReverse
                ? 'border-rose-500/60 bg-rose-500/20 text-rose-200'
                : 'border-slate-700/80 bg-[#0E1420] text-slate-300 hover:border-slate-500'
            }`}
          >
            {playbackReverse ? (
              <>
                <Rewind className="h-3.5 w-3.5" /> REV
              </>
            ) : (
              <>
                <FastForward className="h-3.5 w-3.5" /> FWD
              </>
            )}
          </button>

          <div
            className="flex items-center rounded-md border border-slate-800 bg-[#0B0F17] p-0.5 font-mono-tabular text-xs"
            role="group"
            aria-label="Playback speed selector"
          >
            {([1, 7, 30] as PlaybackSpeedDaysPerSec[]).map((spd) => (
              <button
                key={spd}
                id={`speed-${spd}d`}
                type="button"
                onClick={() => onChangeSpeed(spd)}
                className={`rounded px-2.5 py-1.5 transition cursor-pointer ${
                  playbackSpeed === spd
                    ? 'bg-[#C8A45D]/25 text-[#F3DC9F] font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {playbackReverse ? `-${spd}d/s` : `${spd}d/s`}
              </button>
            ))}
          </div>

          <button
            id="timeline-reset-now"
            type="button"
            onClick={() => onChangeDate(new Date(referenceNow.getTime()))}
            className="ml-auto flex items-center gap-1.5 rounded-md border border-[#C8A45D]/45 bg-[#121826] px-3 py-2 font-mono-tabular text-xs font-semibold text-[#E3C582] hover:border-[#F3DC9F] hover:bg-[#192236] cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" /> NOW
          </button>
        </div>

        {/* Direct UTC Date-Time Input + 8-Button Tactical Step Grid */}
        <div className="space-y-2.5 pt-1">
          <label
            htmlFor="utc-datetime-picker"
            className="flex w-full items-center justify-between gap-2 rounded-md border border-slate-700/80 bg-[#080C14] px-3 py-2 font-mono-tabular text-xs text-[#E6ECF5]"
          >
            <span className="flex items-center gap-2 text-slate-400">
              <CalendarClock className="h-4 w-4 text-[#C8A45D]" />
              <span>Epoch</span>
            </span>
            <div className="flex items-center gap-2">
              <input
                id="utc-datetime-picker"
                type="datetime-local"
                value={toUtcDatetimeLocalValue(currentDate)}
                onChange={(e) => {
                  if (!e.target.value) return;
                  const parsed = new Date(`${e.target.value}:00Z`);
                  if (!Number.isNaN(parsed.getTime())) {
                    onChangeDate(parsed);
                  }
                }}
                className="bg-transparent text-xs font-semibold text-[#F3DC9F] focus:outline-none"
              />
              <span className="rounded bg-slate-800/90 px-1.5 py-0.5 text-[10px] font-semibold text-slate-300">
                UTC
              </span>
            </div>
          </label>

          <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 font-mono-tabular text-xs">
            {[
              { id: 'step-m1m', label: '-1M', ms: -30 * MS_PER_DAY },
              { id: 'step-m1w', label: '-1W', ms: -7 * MS_PER_DAY },
              { id: 'step-m1d', label: '-1D', ms: -1 * MS_PER_DAY },
              { id: 'step-m1h', label: '-1H', ms: -1 * MS_PER_HOUR },
              { id: 'step-p1h', label: '+1H', ms: 1 * MS_PER_HOUR },
              { id: 'step-p1d', label: '+1D', ms: 1 * MS_PER_DAY },
              { id: 'step-p1w', label: '+1W', ms: 7 * MS_PER_DAY },
              { id: 'step-p1m', label: '+1M', ms: 30 * MS_PER_DAY },
            ].map((btn) => (
              <button
                key={btn.id}
                id={btn.id}
                type="button"
                onClick={() => stepByMs(btn.ms)}
                className="rounded border border-slate-800 bg-[#0D1320] py-1.5 text-center text-slate-300 hover:border-[#C8A45D]/60 hover:text-[#F3DC9F] transition cursor-pointer"
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. CONTINUOUS +-5Y SCRUBBER & WRAPPED MACRO INFLECTION BOOKMARKS */}
      <div className="terminal-panel rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono-tabular text-[10px] font-semibold uppercase tracking-widest text-[#C8A45D]">
            10-Year Ephemeris Horizon (±5Y)
          </span>
          <span className="font-mono-tabular text-[11px] text-slate-400">
            JD {snapshot.julianDay.toFixed(3)}
          </span>
        </div>

        {/* Continuous Scrubber Slider with Diamond Pins & Year/Quarter Ruler */}
        <div className="relative pt-2 pb-5">
          <input
            id="five-year-scrubber-slider"
            type="range"
            min={minMs}
            max={maxMs}
            step={MS_PER_HOUR}
            value={clampedMs}
            onChange={(e) => onChangeDate(new Date(Number(e.target.value)))}
            aria-label="Continuous 10-year ephemeris timeline slider"
            className="astrolabe-scrubber relative z-10"
          />

          {/* Bookmark diamond pins along scrubber */}
          <div className="pointer-events-none absolute inset-x-0 top-2.5 h-3">
            {bookmarks.map((bm) => {
              const pct = ((bm.date.getTime() - minMs) / (maxMs - minMs)) * 100;
              return (
                <div
                  key={`pin-${bm.id}`}
                  style={{ left: `${pct}%` }}
                  className="absolute -translate-x-1/2 top-0.5 h-1.5 w-1.5 rotate-45 bg-[#E3C582]/80"
                />
              );
            })}
          </div>

          {/* Quarter minor ticks & Year major ticks */}
          <div className="pointer-events-none relative mt-1.5 h-4 w-full">
            {monthMinorTicks.map((pct, idx) => (
              <span
                key={idx}
                style={{ left: `${pct}%` }}
                className="absolute top-0 h-1.5 w-[1px] bg-slate-700/70"
              />
            ))}
            {yearTicks.map((yt) => (
              <div
                key={yt.year}
                style={{ left: `${yt.pct}%` }}
                className="absolute top-0 -translate-x-1/2 flex flex-col items-center"
              >
                <span className="h-2.5 w-[1px] bg-[#C8A45D]/70" />
                <span className="mt-0.5 font-mono-tabular text-[10px] text-slate-400">
                  {yt.year}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Organically Wrapped Macro Inflection Bookmarks (Zero Horizontal Scrollbar) */}
        <div className="space-y-2 border-t border-slate-800/80 pt-3.5">
          <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-[#C8A45D]">
            <Bookmark className="h-3.5 w-3.5" /> Macro Inflection Bookmarks (±5Y)
          </div>

          <div className="grid grid-cols-1 2xl:grid-cols-2 gap-2">
            {bookmarks.map((bm) => {
              const isNear =
                Math.abs(currentDate.getTime() - bm.date.getTime()) <= 2.5 * MS_PER_DAY;
              return (
                <button
                  key={bm.id}
                  id={bm.id}
                  type="button"
                  onClick={() => onChangeDate(bm.date)}
                  title={bm.description}
                  className={`flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-left text-xs transition cursor-pointer ${
                    isNear
                      ? 'border-[#F3DC9F] bg-[#C8A45D]/25 text-[#FFF6DC] shadow-[0_0_12px_rgba(227,197,130,0.3)]'
                      : categoryColorMap[bm.category]
                  }`}
                >
                  <span className="font-medium truncate">{bm.shortLabel}</span>
                  <span className="shrink-0 rounded bg-black/45 px-1.5 py-0.5 font-mono-tabular text-[9.5px] uppercase tracking-tight opacity-95">
                    {bm.regimeTag}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. 3D ASTROLABE OPTICS, COORDINATE FRAME & LAYER FILTERS */}
      <div className="terminal-panel rounded-lg p-4 space-y-3.5">
        <div className="flex items-center gap-1.5 font-mono-tabular text-[10px] font-semibold uppercase tracking-widest text-[#C8A45D]">
          <Filter className="h-3.5 w-3.5" /> 3D Astrolabe Optics &amp; Layer Filters
        </div>

        {/* Coordinate Frame Selector */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onChangeViewMode('GEOCENTRIC')}
            className={`flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-xs font-semibold transition cursor-pointer ${
              viewMode === 'GEOCENTRIC'
                ? 'border-[#C8A45D]/70 bg-[#151E30] text-[#F3DC9F] shadow-[0_0_12px_rgba(200,164,93,0.18)]'
                : 'border-slate-800 bg-[#090D15] text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="h-3.5 w-3.5 text-sky-400" /> Geocentric Arena
          </button>

          <button
            id="toggle-coordinate-view"
            type="button"
            onClick={() =>
              onChangeViewMode(viewMode === 'GEOCENTRIC' ? 'HELIOCENTRIC' : 'GEOCENTRIC')
            }
            className={`flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-xs font-semibold transition cursor-pointer ${
              viewMode === 'HELIOCENTRIC'
                ? 'border-sky-400/65 bg-sky-500/20 text-sky-200 shadow-[0_0_12px_rgba(56,189,248,0.2)]'
                : 'border-slate-800 bg-[#090D15] text-slate-400 hover:text-slate-200'
            }`}
          >
            <SunMedium className="h-3.5 w-3.5 text-amber-400" /> Helio + Sightlines
          </button>
        </div>

        {/* Aspect & Layer Toggles */}
        <div className="grid grid-cols-2 gap-2">
          <button
            id="filter-all-aspects"
            type="button"
            onClick={() => onChangeAspectFilter('ALL')}
            className={`rounded-md border px-3 py-2 text-xs font-medium transition cursor-pointer ${
              aspectFilter === 'ALL'
                ? 'bg-[#C8A45D]/20 text-[#F3DC9F] border-[#C8A45D]/60'
                : 'border-slate-800 bg-[#090D15] text-slate-400 hover:text-slate-200'
            }`}
          >
            All Aspects
          </button>

          <button
            id="filter-hard-aspects"
            type="button"
            onClick={() =>
              onChangeAspectFilter(aspectFilter === 'HARD_ONLY' ? 'ALL' : 'HARD_ONLY')
            }
            className={`rounded-md border px-3 py-2 text-xs font-medium transition cursor-pointer ${
              aspectFilter === 'HARD_ONLY'
                ? 'bg-red-500/20 text-red-200 border-red-500/55'
                : 'border-slate-800 bg-[#090D15] text-slate-400 hover:text-slate-200'
            }`}
          >
            Hard / Volatility Only
          </button>

          <button
            id="filter-macro-only"
            type="button"
            onClick={onToggleMacroOnly}
            className={`flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-xs font-medium transition cursor-pointer ${
              macroOnly
                ? 'bg-amber-500/20 text-amber-200 border-amber-500/55'
                : 'border-slate-800 bg-[#090D15] text-slate-400 hover:text-slate-200'
            }`}
          >
            <Orbit className="h-3.5 w-3.5" /> Macro Planets Only
          </button>

          <button
            id="filter-shadow-zones"
            type="button"
            onClick={onToggleShadowZones}
            className={`flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-xs font-medium transition cursor-pointer ${
              showShadowZones
                ? 'bg-rose-500/15 text-rose-200 border-rose-500/45'
                : 'border-slate-800 bg-[#090D15] text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" /> Rx Shadow Zones
          </button>
        </div>
      </div>

      {/* 4. LIVE REGIME POSTURE & SPACIOUS 2x2 KPI TELEMETRY SNAPSHOT */}
      <div
        id="executive-tape-posture"
        className={`terminal-panel rounded-lg border-l-4 ${postureStyle.accentBorder} p-4 space-y-3.5`}
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded border px-2 py-0.5 font-mono-tabular text-[10.5px] font-bold tracking-wider ${postureStyle.badge}`}
              >
                {briefing.postureCode}
              </span>
              {snapshot.lunar.eclipse && (
                <span className="animate-station-pulse rounded border border-rose-500/60 bg-rose-500/20 px-2 py-0.5 font-mono-tabular text-[10.5px] font-bold text-rose-200">
                  ⚡ {snapshot.lunar.eclipse.type.replace('_', ' ')}
                </span>
              )}
            </div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-[#F3DC9F]">
              {briefing.postureLabel}
            </h2>
          </div>

          <button
            type="button"
            onClick={onOpenHorizons}
            className="flex items-center gap-1 rounded border border-[#C8A45D]/40 bg-[#111827] px-2.5 py-1 font-mono-tabular text-[10.5px] font-semibold text-[#E3C582] hover:border-[#F3DC9F] cursor-pointer"
          >
            Full Briefing <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {/* Tension Score */}
          <div className="rounded-md border border-slate-800/90 bg-[#080C14] p-3">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              <Gauge className="h-3.5 w-3.5 text-[#C8A45D]" /> Tension Score
            </div>
            <div className={`mt-1 font-mono-tabular text-xl font-bold ${postureStyle.glowText}`}>
              {briefing.tensionIndex}
              <span className="text-xs text-slate-500 font-normal">/100</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                style={{ width: `${briefing.tensionIndex}%` }}
                className={`h-full ${
                  briefing.tensionIndex >= 65
                    ? 'bg-rose-500'
                    : briefing.tensionIndex >= 42
                      ? 'bg-amber-400'
                      : 'bg-emerald-400'
                }`}
              />
            </div>
          </div>

          {/* Active Rx */}
          <div className="rounded-md border border-slate-800/90 bg-[#080C14] p-3">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              <Activity className="h-3.5 w-3.5 text-red-400" /> Active Rx
            </div>
            <div className="mt-1 font-mono-tabular text-xl font-bold text-[#E6ECF5]">
              {briefing.activeRxBodies.length}
              <span className="text-xs text-slate-500 font-normal"> / 8</span>
            </div>
            <div className="mt-1 flex flex-wrap gap-1.5 font-mono-tabular text-xs text-red-300">
              {briefing.activeRxBodies.length > 0
                ? briefing.activeRxBodies.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => onSelectBody(b.id)}
                      title={`${b.name} Rx at ${b.formattedDMS}`}
                      className="hover:text-white cursor-pointer"
                    >
                      {b.glyph}
                    </button>
                  ))
                : 'None (All Direct)'}
            </div>
          </div>

          {/* Stations */}
          <div className="rounded-md border border-slate-800/90 bg-[#080C14] p-3">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              <ShieldAlert className="h-3.5 w-3.5 text-rose-400" /> Stations (±3d)
            </div>
            <div className="mt-1 font-mono-tabular text-xl font-bold text-[#E6ECF5]">
              {briefing.stationingBodies.length}
            </div>
            <div className="mt-1 font-mono-tabular text-[11px] text-rose-300 truncate">
              {briefing.stationingBodies.length > 0
                ? briefing.stationingBodies
                    .map((b) => `${b.glyph} ${b.stationState}`)
                    .join(', ')
                : 'No Immediate Station'}
            </div>
          </div>

          {/* Peak Applying */}
          <div className="rounded-md border border-slate-800/90 bg-[#080C14] p-3">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" /> Peak Applying
            </div>
            {briefing.tightestApplyingHard ? (
              <>
                <div className="mt-1 font-mono-tabular text-base font-bold text-[#F3DC9F]">
                  {snapshot.bodies[briefing.tightestApplyingHard.bodyA].glyph}{' '}
                  {briefing.tightestApplyingHard.symbol}{' '}
                  {snapshot.bodies[briefing.tightestApplyingHard.bodyB].glyph}{' '}
                  <span className="text-xs text-amber-300">
                    {briefing.tightestApplyingHard.orb.toFixed(2)}°
                  </span>
                </div>
                <div className="mt-1 text-[11px] text-slate-400 truncate">
                  {briefing.tightestApplyingHard.label}
                </div>
              </>
            ) : (
              <div className="mt-2 font-mono-tabular text-xs text-slate-500">
                No Applying Hard Vector
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
