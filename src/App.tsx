import { Clock, Compass, Maximize2, Minimize2, Moon } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CelestialArena3D } from './components/CelestialArena3D';
import { MarketBriefing } from './components/MarketBriefing';
import {
  TimelineController,
  type PlaybackSpeedDaysPerSec,
} from './components/TimelineController';
import {
  computeEphemerisSnapshot,
  computeUpcoming90DayRadar,
  getMacroInflectionBookmarks,
  type BodyId,
} from './lib/ephemeris';
import { translateSnapshotToMarketRegime } from './lib/marketRegime';

const MS_PER_DAY = 86_400_000;
const FIVE_YEARS_MS = 5 * 365.25 * MS_PER_DAY;

export function App() {
  const [referenceNow] = useState<Date>(() => new Date());
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [selectedBody, setSelectedBody] = useState<BodyId | null>(null);

  // Time-lapse simulation transport state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeedDaysPerSec>(7);
  const [playbackReverse, setPlaybackReverse] = useState(false);

  const clampDate = useCallback(
    (d: Date) => {
      const minMs = referenceNow.getTime() - FIVE_YEARS_MS;
      const maxMs = referenceNow.getTime() + FIVE_YEARS_MS;
      return new Date(Math.max(minMs, Math.min(maxMs, d.getTime())));
    },
    [referenceNow],
  );

  const handleSetDate = useCallback(
    (next: Date) => {
      setCurrentDate(clampDate(next));
    },
    [clampDate],
  );

  // 60fps rAF Time-Lapse Simulation Loop
  const lastFrameRef = useRef<number | null>(null);
  useEffect(() => {
    if (!isPlaying) {
      lastFrameRef.current = null;
      return;
    }

    let rafId = 0;
    const minMs = referenceNow.getTime() - FIVE_YEARS_MS;
    const maxMs = referenceNow.getTime() + FIVE_YEARS_MS;
    const dir = playbackReverse ? -1 : 1;

    const tick = (nowPerf: number) => {
      if (lastFrameRef.current !== null) {
        const dtSec = Math.min(0.1, (nowPerf - lastFrameRef.current) / 1000);
        const deltaSimMs = dir * playbackSpeed * MS_PER_DAY * dtSec;
        setCurrentDate((prev) => {
          const nextMs = prev.getTime() + deltaSimMs;
          if (nextMs <= minMs || nextMs >= maxMs) {
            setIsPlaying(false);
            return new Date(Math.max(minMs, Math.min(maxMs, nextMs)));
          }
          return new Date(nextMs);
        });
      }
      lastFrameRef.current = nowPerf;
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, playbackSpeed, playbackReverse, referenceNow]);

  // Real-time 60fps client-side Ephemeris Snapshot & Market Cycle Briefing
  const snapshot = useMemo(
    () => computeEphemerisSnapshot(currentDate),
    [currentDate],
  );

  const briefing = useMemo(
    () => translateSnapshotToMarketRegime(snapshot),
    [snapshot],
  );

  const bookmarks = useMemo(
    () => getMacroInflectionBookmarks(referenceNow),
    [referenceNow],
  );

  // Debounce 90-day radar anchor slightly during rapid scrubbing/playback so 3D viewport stays locked at 60fps
  const [radarAnchorDate, setRadarAnchorDate] = useState<Date>(currentDate);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setRadarAnchorDate(currentDate);
    }, 110);
    return () => window.clearTimeout(timer);
  }, [currentDate]);

  const radarEvents = useMemo(
    () => computeUpcoming90DayRadar(radarAnchorDate, 90),
    [radarAnchorDate],
  );

  const [isFullscreen, setIsFullscreen] = useState(false);
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#07090E] text-[#E6ECF5] flex flex-col">
      {/* Top Institutional Macro Terminal Bar */}
      <header className="border-b border-[#C8A45D]/25 bg-[#090C14]/95 px-4 py-2.5 sm:px-6">
        <div className="mx-auto flex max-w-[1680px] flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded border border-[#C8A45D]/60 bg-[#121826] text-[#F3DC9F]">
              <Compass className="h-4.5 w-4.5" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold tracking-wider text-[#F3DC9F]">
                ASTRALIS <span className="text-[#C8A45D]/60">//</span> 3D EPHEMERIS &amp; MARKET CYCLE TERMINAL
              </h1>
              <p className="text-[11px] text-slate-400">
                True Geocentric Tropical Ecliptic Astrolabe · Quantitative Cycle &amp; Liquidity Regime Telemetry
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 font-mono-tabular text-xs">
            <div className="flex items-center gap-1.5 rounded border border-slate-800 bg-[#0D1320] px-2.5 py-1 text-slate-300">
              <Moon className="h-3.5 w-3.5 text-[#C8A45D]" />
              <span>{snapshot.lunar.phaseName}</span>
              <span className="text-slate-500">·</span>
              <span className="text-[#F3DC9F]">
                {snapshot.lunar.illuminationPct.toFixed(0)}%
              </span>
            </div>

            <div className="flex items-center gap-1.5 rounded border border-[#C8A45D]/35 bg-[#101624] px-3 py-1 text-[#F3DC9F]">
              <Clock className="h-3.5 w-3.5 text-[#C8A45D]" />
              <span>
                {currentDate.toISOString().replace('T', ' ').slice(0, 19)} UTC
              </span>
            </div>

            <button
              id="toggle-fullscreen-btn"
              type="button"
              onClick={toggleFullscreen}
              className="flex items-center gap-1.5 rounded border border-[#C8A45D]/50 bg-[#141C2E] px-2.5 py-1 font-semibold text-[#F3DC9F] hover:border-[#F3DC9F] cursor-pointer"
              title="Toggle Browser Fullscreen"
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="h-3.5 w-3.5" /> EXIT FULLSCREEN
                </>
              ) : (
                <>
                  <Maximize2 className="h-3.5 w-3.5" /> FULLSCREEN
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Centerpiece Hero (~68-70vh): Interactive 3D Celestial Astrolabe */}
      <CelestialArena3D
        snapshot={snapshot}
        selectedBody={selectedBody}
        onSelectBody={setSelectedBody}
        onJumpToDate={handleSetDate}
      />

      {/* Persistent +-5-Year Timeline Scrubber & Simulation Dock */}
      <TimelineController
        currentDate={currentDate}
        referenceNow={referenceNow}
        onChangeDate={handleSetDate}
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying((p) => !p)}
        playbackSpeed={playbackSpeed}
        onChangeSpeed={setPlaybackSpeed}
        playbackReverse={playbackReverse}
        onToggleReverse={() => setPlaybackReverse((r) => !r)}
        bookmarks={bookmarks}
      />

      {/* Below-the-Fold Market Cycle Intelligence Briefing */}
      <MarketBriefing
        snapshot={snapshot}
        briefing={briefing}
        radarEvents={radarEvents}
        selectedBody={selectedBody}
        onSelectBody={setSelectedBody}
        onJumpToDate={handleSetDate}
      />

      <footer className="mt-auto border-t border-slate-800/80 bg-[#06080D] px-6 py-4 text-center font-mono-tabular text-[11px] text-slate-500">
        ASTRALIS TERMINAL · Powered by VSOP87 / JPL DE405 Geocentric Tropical Ephemeris (`astronomy-engine`) · Strictly Non-Horoscopic Quantitative Cycle Analytics
      </footer>
    </div>
  );
}

export default App;
