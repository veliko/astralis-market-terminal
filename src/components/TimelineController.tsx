import {
  Bookmark,
  CalendarClock,
  FastForward,
  Pause,
  Play,
  Rewind,
  RotateCcw,
} from 'lucide-react';
import React, { useMemo } from 'react';
import type { MacroBookmark } from '../lib/ephemeris';

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
}

const MS_PER_HOUR = 3_600_000;
const MS_PER_DAY = 86_400_000;
const FIVE_YEARS_MS = 5 * 365.25 * MS_PER_DAY;

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

  const categoryColorMap: Record<MacroBookmark['category'], string> = {
    RETROGRADE: 'border-red-500/45 text-red-200 bg-red-950/25 hover:border-red-400',
    CONJUNCTION: 'border-amber-500/45 text-amber-200 bg-amber-950/25 hover:border-amber-400',
    TENSION: 'border-rose-500/45 text-rose-200 bg-rose-950/25 hover:border-rose-400',
    STRUCTURAL: 'border-emerald-500/45 text-emerald-200 bg-emerald-950/25 hover:border-emerald-400',
    ECLIPSE: 'border-sky-500/45 text-sky-200 bg-sky-950/25 hover:border-sky-400',
  };

  return (
    <section
      id="timeline-scrubber-dock"
      aria-label="Plus or minus 5-year ephemeris timeline scrubber"
      className="terminal-panel-brass border-x-0 border-t-0 px-4 py-3.5 sm:px-6"
    >
      {/* Top Row: Transport Controls, Step Buttons, UTC Date Picker & Speed Time-Lapse */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Play/Pause, Reverse, Speed & NOW */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            id="timeline-play-toggle"
            type="button"
            onClick={onTogglePlay}
            className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold tracking-wide transition cursor-pointer ${
              isPlaying
                ? 'bg-amber-500/25 text-[#F3DC9F] border border-[#F3DC9F]/80 shadow-[0_0_15px_rgba(227,197,130,0.3)]'
                : 'bg-[#141B29] text-[#E6ECF5] border border-[#C8A45D]/45 hover:border-[#F3DC9F]'
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
            className={`flex items-center gap-1 rounded px-2 py-1.5 font-mono-tabular text-[11px] font-medium border transition cursor-pointer ${
              playbackReverse
                ? 'border-rose-500/60 bg-rose-500/20 text-rose-200'
                : 'border-slate-700/80 bg-[#0E1420] text-slate-300 hover:border-slate-500'
            }`}
          >
            {playbackReverse ? (
              <>
                <Rewind className="h-3 w-3" /> REV
              </>
            ) : (
              <>
                <FastForward className="h-3 w-3" /> FWD
              </>
            )}
          </button>

          <div
            className="flex items-center rounded border border-slate-800 bg-[#0B0F17] p-0.5 font-mono-tabular text-[11px]"
            role="group"
            aria-label="Playback speed selector"
          >
            {([1, 7, 30] as PlaybackSpeedDaysPerSec[]).map((spd) => (
              <button
                key={spd}
                id={`speed-${spd}d`}
                type="button"
                onClick={() => onChangeSpeed(spd)}
                className={`rounded px-2 py-1 transition cursor-pointer ${
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
            className="flex items-center gap-1 rounded border border-[#C8A45D]/40 bg-[#121826] px-2.5 py-1.5 font-mono-tabular text-[11px] font-semibold text-[#E3C582] hover:border-[#F3DC9F] hover:bg-[#192236] cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" /> NOW
          </button>
        </div>

        {/* Center: Discrete Tactical Step Buttons (-1M -1W -1D -1H | +1H +1D +1W +1M) */}
        <div className="flex flex-wrap items-center gap-1 font-mono-tabular text-[11px]">
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
              className="rounded border border-slate-800 bg-[#0D1320] px-2 py-1 text-slate-300 hover:border-[#C8A45D]/60 hover:text-[#F3DC9F] transition cursor-pointer"
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Right: Direct UTC Date/Time Picker & Offset Readout */}
        <div className="flex items-center gap-2">
          <div className="hidden xl:block font-mono-tabular text-[11px] text-slate-400">
            {Math.abs(deltaDaysFromNow) < 0.05
              ? 'LIVE EPOCH'
              : `${deltaDaysFromNow > 0 ? '+' : ''}${deltaDaysFromNow.toFixed(1)}d vs Now`}
          </div>
          <label
            htmlFor="utc-datetime-picker"
            className="flex items-center gap-1.5 rounded border border-slate-700/80 bg-[#0B0F17] px-2.5 py-1 font-mono-tabular text-xs text-[#E6ECF5]"
          >
            <CalendarClock className="h-3.5 w-3.5 text-[#C8A45D]" />
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
              className="bg-transparent text-xs text-[#F3DC9F] focus:outline-none"
            />
            <span className="text-[10px] font-semibold text-slate-400">UTC</span>
          </label>
        </div>
      </div>

      {/* Middle Row: Continuous +-5-Year Scrubber Slider with Year/Quarter Ruler & Bookmark Pins */}
      <div className="mt-3.5 relative pt-1 pb-5">
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
        <div className="pointer-events-none absolute inset-x-0 top-1.5 h-3">
          {bookmarks.map((bm) => {
            const pct = ((bm.date.getTime() - minMs) / (maxMs - minMs)) * 100;
            return (
              <div
                key={`pin-${bm.id}`}
                style={{ left: `${pct}%` }}
                className="absolute -translate-x-1/2 top-0.5 h-1.5 w-1.5 rotate-45 bg-[#E3C582]/75"
              />
            );
          })}
        </div>

        {/* Quarter minor ticks & Year major ticks */}
        <div className="pointer-events-none relative mt-1 h-4 w-full">
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

      {/* Bottom Row: Pre-Scanned Macro Inflection Jump-Pills */}
      <div className="mt-1 flex items-center gap-2 overflow-x-auto pb-1">
        <span className="flex shrink-0 items-center gap-1 text-[10.5px] font-semibold uppercase tracking-wider text-[#C8A45D]">
          <Bookmark className="h-3 w-3" /> Macro Inflections (±5Y):
        </span>
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
              className={`shrink-0 flex items-center gap-1.5 rounded border px-2.5 py-1 text-[11px] transition cursor-pointer ${
                isNear
                  ? 'border-[#F3DC9F] bg-[#C8A45D]/25 text-[#FFF6DC] shadow-[0_0_12px_rgba(227,197,130,0.35)]'
                  : categoryColorMap[bm.category]
              }`}
            >
              <span className="font-medium">{bm.shortLabel}</span>
              <span className="rounded bg-black/40 px-1 py-[1px] font-mono-tabular text-[9px] uppercase tracking-tight opacity-90">
                {bm.regimeTag}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
