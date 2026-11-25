import {
  ArrowDownUp,
  Clock,
  Compass,
  Layers,
  Maximize2,
  Minimize2,
  Moon,
  Pause,
  Play,
  Radio,
  SlidersHorizontal,
  TrendingUp,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CelestialArena3D,
  type AspectFilterMode,
  type ViewCoordinateMode,
} from './components/CelestialArena3D';
import { MarketBriefing, type IntelligenceTab } from './components/MarketBriefing';
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

type WorkspaceTab = 'CONTROLS' | IntelligenceTab;

export function App() {
  const [referenceNow] = useState<Date>(() => new Date());
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [selectedBody, setSelectedBody] = useState<BodyId | null>(null);
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>('CONTROLS');

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

  const navItems: Array<{
    id: WorkspaceTab;
    shortLabel: string;
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number;
    dot?: boolean;
  }> = [
    {
      id: 'CONTROLS',
      shortLabel: 'CTRL',
      title: 'Command Surface & Timeline Controls',
      icon: SlidersHorizontal,
    },
    {
      id: 'HORIZONS',
      shortLabel: 'TIDES',
      title: 'Executive Synthesis & Three-Horizon Breakdown',
      icon: Layers,
    },
    {
      id: 'BODIES',
      shortLabel: 'BODIES',
      title: '12-Body Live Geocentric Ephemeris',
      icon: TrendingUp,
      dot: Boolean(selectedBody),
    },
    {
      id: 'ASPECTS',
      shortLabel: 'ASPECT',
      title: `Live Active Aspects (${snapshot.aspects.length})`,
      icon: ArrowDownUp,
      badge: snapshot.aspects.length,
    },
    {
      id: 'RADAR',
      shortLabel: '90D',
      title: `Upcoming 90-Day Inflection Radar (${radarEvents.length})`,
      icon: Radio,
      badge: radarEvents.length,
    },
  ];

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-[#07090E] text-[#E6ECF5] flex flex-col lg:flex-row">
      {/* LEFT 1/3 PANE (capped at 800px on ultrawide): Slim Persistent Top Bar + Vertical Icon Rail + Full-Height Active Tab */}
      <aside
        aria-label="Control Pane and Market Cycle Telemetry"
        className="w-full lg:w-1/3 lg:max-w-[800px] lg:shrink-0 min-w-0 lg:h-screen flex flex-col border-b lg:border-b-0 lg:border-r border-[#C8A45D]/25 bg-[#080B12] lg:overflow-hidden"
      >
        {/* Slim Persistent Single-Row Top Header */}
        <header className="shrink-0 border-b border-[#C8A45D]/25 bg-[#090C14]/95 px-3 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded border border-[#C8A45D]/60 bg-[#121826] text-[#F3DC9F]">
              <Compass className="h-3.5 w-3.5" />
            </div>
            <h1 className="truncate text-xs font-bold tracking-wider text-[#F3DC9F]">
              ASTRALIS <span className="text-[#C8A45D]/60">//</span> TERMINAL
            </h1>
          </div>

          <div className="flex items-center gap-1.5 font-mono-tabular text-[11px] shrink-0">
            <button
              type="button"
              onClick={() => setIsPlaying((p) => !p)}
              title={isPlaying ? 'Pause Time-Lapse' : 'Start Time-Lapse'}
              className={`flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-semibold transition cursor-pointer ${
                isPlaying
                  ? 'border-[#F3DC9F]/80 bg-amber-500/25 text-[#F3DC9F]'
                  : 'border-slate-800 bg-[#0D1320] text-slate-300 hover:border-[#C8A45D]/50 hover:text-[#F3DC9F]'
              }`}
            >
              {isPlaying ? <Pause className="h-2.5 w-2.5" /> : <Play className="h-2.5 w-2.5" />}
              <span>{isPlaying ? `${playbackReverse ? '-' : '+'}${playbackSpeed}d/s` : 'IDLE'}</span>
            </button>

            <div className="flex items-center gap-1 rounded border border-[#C8A45D]/35 bg-[#101624] px-2 py-0.5 text-[10.5px] text-[#F3DC9F]">
              <Clock className="h-3 w-3 text-[#C8A45D]" />
              <span>{currentDate.toISOString().replace('T', ' ').slice(0, 16)}Z</span>
            </div>

            <button
              id="toggle-fullscreen-btn"
              type="button"
              onClick={toggleFullscreen}
              className="flex items-center gap-1 rounded border border-[#C8A45D]/50 bg-[#141C2E] px-2 py-0.5 text-[10px] font-semibold text-[#F3DC9F] hover:border-[#F3DC9F] cursor-pointer"
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
        </header>

        {/* Body Area: Vertical Icon Rail + Full-Height Active Panel */}
        <div className="flex-1 min-h-0 flex flex-row overflow-hidden">
          {/* Small Vertical Icon Navigation Rail */}
          <nav
            aria-label="Workspace Navigation Rail"
            className="w-14 shrink-0 border-r border-[#C8A45D]/20 bg-[#06080E] py-2.5 px-1.5 flex flex-col items-center justify-between select-none"
          >
            <div className="w-full space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = workspaceTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-tab-${item.id.toLowerCase()}`}
                    type="button"
                    onClick={() => setWorkspaceTab(item.id)}
                    title={item.title}
                    className={`relative w-full flex flex-col items-center justify-center gap-1 rounded-md py-2 px-1 transition cursor-pointer ${
                      active
                        ? 'bg-[#131B2C] text-[#F3DC9F] border border-[#C8A45D]/60 shadow-[0_0_12px_rgba(200,164,93,0.18)]'
                        : 'text-slate-400 border border-transparent hover:bg-[#0D1320] hover:text-slate-200'
                    }`}
                  >
                    {active && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-[2.5px] rounded-r bg-[#F3DC9F]" />
                    )}
                    <Icon
                      className={`h-4 w-4 ${active ? 'text-[#F3DC9F]' : 'text-[#C8A45D]/80'}`}
                    />
                    <span className="font-mono-tabular text-[8.5px] font-semibold tracking-tight leading-none">
                      {item.shortLabel}
                    </span>
                    {item.badge !== undefined && (
                      <span className="font-mono-tabular text-[8px] leading-none text-slate-400">
                        {item.badge}
                      </span>
                    )}
                    {item.dot && (
                      <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-[#F3DC9F]" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Subtle Lunar Illumination Readout at Rail Foot */}
            <div
              title={`${snapshot.lunar.phaseName} (${snapshot.lunar.illuminationPct.toFixed(0)}% Illumination)`}
              className="flex flex-col items-center gap-0.5 rounded border border-slate-800/80 bg-[#0A0E17] px-1.5 py-1.5 text-center"
            >
              <Moon className="h-3 w-3 text-[#C8A45D]" />
              <span className="font-mono-tabular text-[8.5px] font-semibold text-[#F3DC9F] leading-none">
                {snapshot.lunar.illuminationPct.toFixed(0)}%
              </span>
            </div>
          </nav>

          {/* Full-Height Tab Content Surface */}
          <div className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden">
            {workspaceTab === 'CONTROLS' ? (
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
                onChangeViewMode={setViewMode}
                snapshot={snapshot}
                briefing={briefing}
                onSelectBody={setSelectedBody}
                onOpenHorizons={() => setWorkspaceTab('HORIZONS')}
              />
            ) : (
              <MarketBriefing
                activeTab={workspaceTab}
                snapshot={snapshot}
                briefing={briefing}
                radarEvents={radarEvents}
                selectedBody={selectedBody}
                onSelectBody={setSelectedBody}
                onJumpToDate={handleSetDate}
              />
            )}

            <footer className="shrink-0 border-t border-slate-800/80 bg-[#06080D] px-3.5 py-1.5 text-center font-mono-tabular text-[9.5px] text-slate-500 truncate">
              VSOP87 / JPL DE405 Geocentric Ephemeris · Non-Horoscopic Cycle Analytics
            </footer>
          </div>
        </div>
      </aside>

      {/* RIGHT PANE (2/3 or all remaining width past 800px): Full-Bleed 100vh Grand 3D Celestial Astrolabe */}
      <div className="min-w-0 flex-1 lg:h-screen relative bg-[#07090E]">
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
