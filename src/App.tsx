import { Clock, Compass, Maximize2, Minimize2, Moon } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CelestialArena3D,
  type AspectFilterMode,
  type ViewCoordinateMode,
} from './components/CelestialArena3D';
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

  // Lifted 3D Astrolabe scene filter & coordinate state (controlled from left 1/3 pane)
  const [aspectFilter, setAspectFilter] = useState<AspectFilterMode>('ALL');
  const [macroOnly, setMacroOnly] = useState(false);
  const [showShadowZones, setShowShadowZones] = useState(true);
  const [viewMode, setViewMode] = useState<ViewCoordinateMode>('GEOCENTRIC');

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
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-[#07090E] text-[#E6ECF5] flex flex-col lg:grid lg:grid-cols-3">
      {/* LEFT 1/3 PANE: Command Controls, Timeline Dock & Market Intelligence Deck */}
      <aside
        aria-label="Control Pane and Market Cycle Telemetry"
        className="min-w-0 lg:col-span-1 lg:h-screen flex flex-col border-b lg:border-b-0 lg:border-r border-[#C8A45D]/25 bg-[#080B12] lg:overflow-hidden"
      >
        {/* Pinned Top Brand, Lunar Phase, UTC Clock & Fullscreen Bar */}
        <header className="shrink-0 border-b border-[#C8A45D]/25 bg-[#090C14]/95 px-3.5 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-[#C8A45D]/60 bg-[#121826] text-[#F3DC9F]">
                <Compass className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-xs sm:text-sm font-bold tracking-wider text-[#F3DC9F]">
                  ASTRALIS <span className="text-[#C8A45D]/60">//</span> MARKET CYCLE TERMINAL
                </h1>
                <p className="truncate text-[10px] text-slate-400">
                  Geocentric Tropical Astrolabe · Quantitative Regime Telemetry
                </p>
              </div>
            </div>

            <button
              id="toggle-fullscreen-btn"
              type="button"
              onClick={toggleFullscreen}
              className="shrink-0 flex items-center gap-1 rounded border border-[#C8A45D]/50 bg-[#141C2E] px-2 py-1 font-mono-tabular text-[10.5px] font-semibold text-[#F3DC9F] hover:border-[#F3DC9F] cursor-pointer"
              title="Toggle Browser Fullscreen"
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="h-3 w-3" /> EXIT
                </>
              ) : (
                <>
                  <Maximize2 className="h-3 w-3" /> FULL
                </>
              )}
            </button>
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-1.5 font-mono-tabular text-[11px]">
            <div className="flex items-center gap-1.5 rounded border border-slate-800 bg-[#0D1320] px-2 py-0.5 text-slate-300">
              <Moon className="h-3 w-3 text-[#C8A45D]" />
              <span>{snapshot.lunar.phaseName}</span>
              <span className="text-slate-500">·</span>
              <span className="text-[#F3DC9F]">
                {snapshot.lunar.illuminationPct.toFixed(0)}%
              </span>
            </div>

            <div className="flex items-center gap-1.5 rounded border border-[#C8A45D]/35 bg-[#101624] px-2.5 py-0.5 text-[#F3DC9F]">
              <Clock className="h-3 w-3 text-[#C8A45D]" />
              <span>
                {currentDate.toISOString().replace('T', ' ').slice(0, 19)} UTC
              </span>
            </div>
          </div>
        </header>

        {/* Pinned +-5-Year Timeline Scrubber & 3D Scene Filter Dock */}
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
          aspectFilter={aspectFilter}
          onChangeAspectFilter={setAspectFilter}
          macroOnly={macroOnly}
          onToggleMacroOnly={() => setMacroOnly((v) => !v)}
          showShadowZones={showShadowZones}
          onToggleShadowZones={() => setShowShadowZones((v) => !v)}
          viewMode={viewMode}
          onToggleViewMode={() =>
            setViewMode((m) => (m === 'GEOCENTRIC' ? 'HELIOCENTRIC' : 'GEOCENTRIC'))
          }
        />

        {/* Pinned Executive Posture + Cockpit Tabs + Scrollable Intelligence Modules */}
        <MarketBriefing
          snapshot={snapshot}
          briefing={briefing}
          radarEvents={radarEvents}
          selectedBody={selectedBody}
          onSelectBody={setSelectedBody}
          onJumpToDate={handleSetDate}
        />

        {/* Slim Institutional Attribution Footer */}
        <footer className="shrink-0 border-t border-slate-800/80 bg-[#06080D] px-3.5 py-1.5 text-center font-mono-tabular text-[9.5px] text-slate-500 truncate">
          VSOP87 / JPL DE405 Geocentric Ephemeris · Non-Horoscopic Cycle Analytics
        </footer>
      </aside>

      {/* RIGHT 2/3 PANE: Full-Bleed 100vh Grand 3D Celestial Astrolabe */}
      <div className="min-w-0 lg:col-span-2 lg:h-screen relative bg-[#07090E]">
        <CelestialArena3D
          snapshot={snapshot}
          selectedBody={selectedBody}
          onSelectBody={setSelectedBody}
          onJumpToDate={handleSetDate}
          aspectFilter={aspectFilter}
          macroOnly={macroOnly}
          showShadowZones={showShadowZones}
          viewMode={viewMode}
        />
      </div>
    </div>
  );
}

export default App;
