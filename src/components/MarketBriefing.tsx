import {
  Activity,
  AlertTriangle,
  ArrowDownUp,
  ArrowUpRight,
  CalendarSearch,
  ChevronDown,
  ChevronUp,
  Gauge,
  Layers,
  Radio,
  ShieldAlert,
  TrendingUp,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import type {
  ActiveAspect,
  BodyId,
  EphemerisSnapshot,
  InflectionEvent,
} from '../lib/ephemeris';
import type { MarketRegimeBriefing, RegimeTone } from '../lib/marketRegime';

interface MarketBriefingProps {
  snapshot: EphemerisSnapshot;
  briefing: MarketRegimeBriefing;
  radarEvents: InflectionEvent[];
  selectedBody: BodyId | null;
  onSelectBody: (id: BodyId | null) => void;
  onJumpToDate: (date: Date) => void;
}

type SortKey = 'ORB' | 'TYPE' | 'STATE' | 'TIER';
type RadarCategoryFilter = 'ALL' | 'STATION' | 'EXACT_ASPECT' | 'ECLIPSE' | 'SIGN_INGRESS';
type BriefingTab = 'HORIZONS' | 'BODIES' | 'ASPECTS' | 'RADAR';

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

const TIER_RANK: Record<ActiveAspect['tier'], number> = {
  SECULAR_MACRO: 0,
  TACTICAL_REGIME: 1,
  INTRADAY_TRIGGER: 2,
};

const TIER_LABELS: Record<ActiveAspect['tier'], { label: string; style: string }> = {
  SECULAR_MACRO: {
    label: 'SECULAR MACRO',
    style: 'border-[#C8A45D]/50 bg-[#C8A45D]/15 text-[#F3DC9F]',
  },
  TACTICAL_REGIME: {
    label: 'TACTICAL REGIME',
    style: 'border-sky-500/40 bg-sky-500/15 text-sky-200',
  },
  INTRADAY_TRIGGER: {
    label: 'SHORT-TERM SPARK',
    style: 'border-slate-600/60 bg-slate-800/70 text-slate-300',
  },
};

export const MarketBriefing: React.FC<MarketBriefingProps> = ({
  snapshot,
  briefing,
  radarEvents,
  selectedBody,
  onSelectBody,
  onJumpToDate,
}) => {
  const [activeTab, setActiveTab] = useState<BriefingTab>('HORIZONS');
  const [postureExpanded, setPostureExpanded] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>('ORB');
  const [sortAsc, setSortAsc] = useState(true);
  const [tableHardOnly, setTableHardOnly] = useState(false);
  const [tableApplyingOnly, setTableApplyingOnly] = useState(false);
  const [radarFilter, setRadarFilter] = useState<RadarCategoryFilter>('ALL');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc((a) => !a);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const sortedAspects = useMemo(() => {
    const filtered = snapshot.aspects.filter((a) => {
      if (tableHardOnly && !a.isHard) return false;
      if (tableApplyingOnly && a.state !== 'APPLYING') return false;
      if (selectedBody && a.bodyA !== selectedBody && a.bodyB !== selectedBody) {
        return false;
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'ORB':
          cmp = a.orb - b.orb;
          break;
        case 'TYPE':
          cmp = b.targetAngle - a.targetAngle;
          break;
        case 'STATE':
          cmp = a.state.localeCompare(b.state) || a.orb - b.orb;
          break;
        case 'TIER':
          cmp = TIER_RANK[a.tier] - TIER_RANK[b.tier] || a.orb - b.orb;
          break;
      }
      return sortAsc ? cmp : -cmp;
    });
  }, [snapshot.aspects, sortKey, sortAsc, tableHardOnly, tableApplyingOnly, selectedBody]);

  const filteredRadar = useMemo(() => {
    if (radarFilter === 'ALL') return radarEvents;
    return radarEvents.filter((e) => e.category === radarFilter);
  }, [radarEvents, radarFilter]);

  const postureStyle = TONE_STYLES[briefing.postureTone];

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {/* PINNED EXECUTIVE TAPE POSTURE & 4-KPI TELEMETRY STRIP */}
      <section
        id="executive-tape-posture"
        aria-label="Executive Tape Posture Banner"
        className={`shrink-0 border-b border-slate-800/90 bg-[#090D16] border-l-4 ${postureStyle.accentBorder} px-3.5 py-2.5`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={`rounded border px-2 py-0.5 font-mono-tabular text-[10px] font-bold tracking-wider ${postureStyle.badge}`}
              >
                {briefing.postureCode}
              </span>
              <span className="font-mono-tabular text-[10.5px] text-slate-400">
                JD {snapshot.julianDay.toFixed(3)}
              </span>
              {snapshot.lunar.eclipse && (
                <span className="animate-station-pulse rounded border border-rose-500/60 bg-rose-500/20 px-1.5 py-0.5 font-mono-tabular text-[10px] font-bold text-rose-200">
                  ⚡ {snapshot.lunar.eclipse.type.replace('_', ' ')}
                </span>
              )}
            </div>

            <h2 className="mt-1 text-sm sm:text-base font-bold tracking-tight text-[#F3DC9F] leading-snug">
              {briefing.postureLabel}
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setPostureExpanded((v) => !v)}
            className="shrink-0 rounded border border-slate-800 bg-[#0D1320] p-1 text-slate-400 hover:border-[#C8A45D]/50 hover:text-[#F3DC9F] cursor-pointer"
            title={postureExpanded ? 'Collapse KPI strip' : 'Expand KPI strip'}
            aria-label={postureExpanded ? 'Collapse KPI strip' : 'Expand KPI strip'}
          >
            {postureExpanded ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        {postureExpanded && (
          <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {/* Regime Tension Index */}
            <div className="rounded border border-slate-800/90 bg-[#070A11] px-2.5 py-1.5">
              <div className="flex items-center gap-1 text-[9.5px] font-semibold uppercase tracking-wider text-slate-400">
                <Gauge className="h-2.5 w-2.5 text-[#C8A45D]" /> Tension
              </div>
              <div className={`mt-0.5 font-mono-tabular text-base font-bold leading-tight ${postureStyle.glowText}`}>
                {briefing.tensionIndex}
                <span className="text-[10px] text-slate-500 font-normal">/100</span>
              </div>
              <div className="mt-1 h-1 w-full rounded-full bg-slate-800 overflow-hidden">
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

            {/* Active Retrograde Count */}
            <div className="rounded border border-slate-800/90 bg-[#070A11] px-2.5 py-1.5">
              <div className="flex items-center gap-1 text-[9.5px] font-semibold uppercase tracking-wider text-slate-400">
                <Activity className="h-2.5 w-2.5 text-red-400" /> Active Rx
              </div>
              <div className="mt-0.5 font-mono-tabular text-base font-bold leading-tight text-[#E6ECF5]">
                {briefing.activeRxBodies.length}
                <span className="text-[10px] text-slate-500 font-normal">/8</span>
              </div>
              <div className="mt-0.5 flex flex-wrap gap-1 font-mono-tabular text-[10px] text-red-300 truncate">
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
                  : 'All Direct'}
              </div>
            </div>

            {/* Active Stations Alert */}
            <div className="rounded border border-slate-800/90 bg-[#070A11] px-2.5 py-1.5">
              <div className="flex items-center gap-1 text-[9.5px] font-semibold uppercase tracking-wider text-slate-400">
                <ShieldAlert className="h-2.5 w-2.5 text-rose-400" /> Stations
              </div>
              <div className="mt-0.5 font-mono-tabular text-base font-bold leading-tight text-[#E6ECF5]">
                {briefing.stationingBodies.length}
              </div>
              <div className="mt-0.5 font-mono-tabular text-[9.5px] text-rose-300 truncate">
                {briefing.stationingBodies.length > 0
                  ? briefing.stationingBodies
                      .map((b) => `${b.glyph} ${b.stationState}`)
                      .join(', ')
                  : 'None (±3d)'}
              </div>
            </div>

            {/* Tightest Applying Hard Aspect */}
            <div className="rounded border border-slate-800/90 bg-[#070A11] px-2.5 py-1.5">
              <div className="flex items-center gap-1 text-[9.5px] font-semibold uppercase tracking-wider text-slate-400">
                <AlertTriangle className="h-2.5 w-2.5 text-amber-400" /> Applying
              </div>
              {briefing.tightestApplyingHard ? (
                <>
                  <div className="mt-0.5 font-mono-tabular text-xs font-bold leading-tight text-[#F3DC9F] truncate">
                    {snapshot.bodies[briefing.tightestApplyingHard.bodyA].glyph}
                    {briefing.tightestApplyingHard.symbol}
                    {snapshot.bodies[briefing.tightestApplyingHard.bodyB].glyph}{' '}
                    <span className="text-[10.5px] text-amber-300">
                      {briefing.tightestApplyingHard.orb.toFixed(2)}°
                    </span>
                  </div>
                  <div className="mt-0.5 text-[9.5px] text-slate-400 truncate">
                    {briefing.tightestApplyingHard.label}
                  </div>
                </>
              ) : (
                <div className="mt-1 font-mono-tabular text-[10px] text-slate-500">
                  Clear
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* PINNED COCKPIT WORKSPACE TAB BAR */}
      <nav
        aria-label="Market Intelligence Modules"
        className="shrink-0 grid grid-cols-4 gap-1 border-b border-[#C8A45D]/20 bg-[#070A10] px-2.5 py-1.5"
      >
        {(
          [
            { id: 'HORIZONS', label: 'Horizons', icon: Layers },
            {
              id: 'BODIES',
              label: selectedBody ? `12 Bodies •` : '12 Bodies',
              icon: TrendingUp,
            },
            {
              id: 'ASPECTS',
              label: `Aspects (${sortedAspects.length})`,
              icon: ArrowDownUp,
            },
            {
              id: 'RADAR',
              label: `90D (${filteredRadar.length})`,
              icon: Radio,
            },
          ] as Array<{
            id: BriefingTab;
            label: string;
            icon: React.ComponentType<{ className?: string }>;
          }>
        ).map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-${tab.id.toLowerCase()}`}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center justify-center gap-1 rounded px-2 py-1.5 font-mono-tabular text-[10.5px] font-semibold tracking-tight transition cursor-pointer ${
                active
                  ? 'border border-[#C8A45D]/65 bg-[#131B2B] text-[#F3DC9F] shadow-[0_0_10px_rgba(200,164,93,0.18)]'
                  : 'border border-transparent text-slate-400 hover:bg-[#0D1320] hover:text-slate-200'
              }`}
            >
              <Icon className="h-3 w-3 shrink-0 text-[#C8A45D]" />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* INDEPENDENTLY SCROLLABLE INTELLIGENCE FEED */}
      <main className="flex-1 min-h-0 overflow-y-auto px-3.5 py-3 space-y-3">
        {/* TAB 1: EXECUTIVE BRIEF & THREE-HORIZON BREAKDOWN */}
        {activeTab === 'HORIZONS' && (
          <section
            id="three-horizon-breakdown"
            aria-label="Three-Horizon Market Cycle Breakdown"
            className="space-y-3"
          >
            <div className="terminal-panel rounded-md p-3.5">
              <div className="text-[10px] font-mono-tabular font-semibold uppercase tracking-wider text-[#C8A45D]">
                Executive Cycle Synthesis
              </div>
              <p className="mt-1 text-xs leading-relaxed text-slate-300">
                {briefing.executiveSummary}
              </p>
            </div>

            {briefing.horizons.map((card) => {
              const st = TONE_STYLES[card.statusTone];
              return (
                <article
                  key={card.id}
                  className="terminal-panel rounded-md p-3.5 flex flex-col justify-between"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-800/90 pb-2.5">
                    <div>
                      <span className="font-mono-tabular text-[9.5px] font-semibold uppercase tracking-widest text-[#C8A45D]">
                        {card.timeframeBadge}
                      </span>
                      <h3 className="mt-0.5 text-sm font-bold text-[#E6ECF5]">
                        {card.title}
                      </h3>
                      <p className="text-[10.5px] text-slate-400">{card.bodiesLabel}</p>
                    </div>
                    <span
                      className={`rounded border px-2 py-0.5 font-mono-tabular text-[9.5px] font-semibold ${st.badge}`}
                    >
                      {card.statusHeadline}
                    </span>
                  </div>

                  <div className="mt-2.5 space-y-2">
                    {card.bullets.map((b, idx) => {
                      const dotColor =
                        b.tone === 'CRITICAL'
                          ? 'bg-rose-500'
                          : b.tone === 'WARNING'
                            ? 'bg-amber-400'
                            : b.tone === 'POSITIVE'
                              ? 'bg-emerald-400'
                              : 'bg-slate-400';
                      const tagColor =
                        b.tone === 'CRITICAL'
                          ? 'text-rose-300'
                          : b.tone === 'WARNING'
                            ? 'text-amber-300'
                            : b.tone === 'POSITIVE'
                              ? 'text-emerald-300'
                              : 'text-slate-400';
                      return (
                        <div
                          key={idx}
                          className="rounded border border-slate-800/75 bg-[#090D15] p-2.5"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
                            <span
                              className={`font-mono-tabular text-[9.5px] font-bold tracking-wider ${tagColor}`}
                            >
                              {b.tag}
                            </span>
                          </div>
                          <div className="mt-1 font-mono-tabular text-xs font-semibold text-[#E6ECF5]">
                            {b.headline}
                          </div>
                          <p className="mt-0.5 text-[11.5px] leading-relaxed text-slate-400">
                            {b.detail}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </article>
              );
            })}
          </section>
        )}

        {/* TAB 2: 12-BODY EPHEMERIS TELEMETRY MATRIX */}
        {activeTab === 'BODIES' && (
          <section
            aria-label="Real-time 12-body geocentric ephemeris strip"
            className="terminal-panel rounded-md p-3.5 space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#E3C582]">
                  12-Body Geocentric Ephemeris
                </h3>
                <p className="text-[11px] text-slate-400">
                  Click any body to isolate beams &amp; inspect in the 3D view.
                </p>
              </div>
              {selectedBody && (
                <button
                  type="button"
                  onClick={() => onSelectBody(null)}
                  className="rounded border border-[#C8A45D]/60 bg-[#C8A45D]/15 px-2 py-0.5 font-mono-tabular text-[10.5px] text-[#F3DC9F] cursor-pointer"
                >
                  Clear: {selectedBody} ×
                </button>
              )}
            </div>

            <div className="rounded border border-slate-800/80 bg-[#080C14] px-2.5 py-1.5 font-mono-tabular text-[10.5px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
              <span>True ☊: {snapshot.trueNorthNodeLon.toFixed(2)}°</span>
              <span>Mean ☊: {snapshot.meanNorthNodeLon.toFixed(2)}°</span>
            </div>

            <div className="grid grid-cols-2 2xl:grid-cols-3 gap-2">
              {snapshot.bodyList.map((b) => {
                const isSelected = selectedBody === b.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => onSelectBody(isSelected ? null : b.id)}
                    className={`flex flex-col rounded border p-2.5 text-left transition cursor-pointer ${
                      isSelected
                        ? 'border-[#F3DC9F] bg-[#161F31] shadow-[0_0_15px_rgba(227,197,130,0.25)]'
                        : 'border-slate-800/90 bg-[#090D15] hover:border-[#C8A45D]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full gap-1">
                      <span className="flex items-center gap-1.5 font-semibold text-xs text-[#E6ECF5] truncate">
                        <span className="text-sm" style={{ color: b.color }}>
                          {b.glyph}
                        </span>
                        <span className="truncate">{b.name}</span>
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        {b.stationState !== 'NONE' ? (
                          <span className="rounded bg-rose-500/25 px-1 py-[1px] font-mono-tabular text-[8.5px] font-bold text-rose-300 border border-rose-500/45">
                            {b.stationState}
                          </span>
                        ) : b.isRetrograde ? (
                          <span className="rounded bg-red-500/20 px-1 py-[1px] font-mono-tabular text-[8.5px] font-bold text-red-300 border border-red-500/35">
                            Rx
                          </span>
                        ) : (
                          <span className="font-mono-tabular text-[8.5px] text-emerald-400/80">
                            DIR
                          </span>
                        )}
                        {b.isAnaretic && (
                          <span className="rounded bg-amber-500/25 px-1 py-[1px] font-mono-tabular text-[8.5px] font-bold text-amber-300">
                            29°
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-1.5 font-mono-tabular text-[11.5px] font-semibold text-[#F3DC9F]">
                      {b.signGlyph} {b.formattedDMS}
                    </div>
                    <div className="mt-0.5 flex items-center justify-between font-mono-tabular text-[9.5px] text-slate-400">
                      <span>
                        {b.degPerDay >= 0 ? '+' : ''}
                        {b.degPerDay.toFixed(3)}°/d
                      </span>
                      {b.shadowZone && (
                        <span className="text-rose-300/90">
                          {b.shadowZone.phase === 'RETROGRADE'
                            ? 'Rx Arc'
                            : b.shadowZone.phase === 'PRE_SHADOW'
                              ? 'Pre-Shdw'
                              : 'Post-Shdw'}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* TAB 3: LIVE ACTIVE ASPECTS MATRIX (COMPACT 1/3 COLUMN CARDS) */}
        {activeTab === 'ASPECTS' && (
          <section
            id="active-aspects-matrix"
            aria-label="Live Active Aspects Matrix"
            className="terminal-panel rounded-md p-3.5 space-y-3"
          >
            <div className="space-y-2 border-b border-slate-800 pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-[#F3DC9F]">
                  Live Active Aspects ({sortedAspects.length})
                </h3>

                <div className="flex flex-wrap items-center gap-1 text-[10.5px]">
                  <button
                    type="button"
                    onClick={() => setTableHardOnly((v) => !v)}
                    className={`rounded border px-2 py-0.5 font-medium transition cursor-pointer ${
                      tableHardOnly
                        ? 'border-red-500/60 bg-red-500/20 text-red-200'
                        : 'border-slate-800 bg-[#090D15] text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    Hard Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setTableApplyingOnly((v) => !v)}
                    className={`rounded border px-2 py-0.5 font-medium transition cursor-pointer ${
                      tableApplyingOnly
                        ? 'border-amber-500/60 bg-amber-500/20 text-amber-200'
                        : 'border-slate-800 bg-[#090D15] text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    Applying Only
                  </button>
                  {selectedBody && (
                    <button
                      type="button"
                      onClick={() => onSelectBody(null)}
                      className="rounded border border-[#C8A45D]/60 bg-[#C8A45D]/15 px-2 py-0.5 text-[#F3DC9F] cursor-pointer"
                    >
                      {selectedBody} ×
                    </button>
                  )}
                </div>
              </div>

              {/* Sort Strip */}
              <div className="flex flex-wrap items-center gap-1 font-mono-tabular text-[10px]">
                <span className="text-slate-500 mr-1">SORT:</span>
                {(
                  [
                    { key: 'ORB', label: 'Exact Orb' },
                    { key: 'TYPE', label: 'Aspect' },
                    { key: 'STATE', label: 'State' },
                    { key: 'TIER', label: 'Horizon' },
                  ] as Array<{ key: SortKey; label: string }>
                ).map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => handleSort(s.key)}
                    className={`flex items-center gap-0.5 rounded border px-1.5 py-0.5 transition cursor-pointer ${
                      sortKey === s.key
                        ? 'border-[#C8A45D]/60 bg-[#C8A45D]/15 text-[#F3DC9F]'
                        : 'border-slate-800 bg-[#090D15] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {s.label}
                    <ArrowDownUp className="h-2.5 w-2.5 opacity-70" />
                  </button>
                ))}
              </div>
            </div>

            {sortedAspects.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No active geometric aspects match the active filter criteria.
              </div>
            ) : (
              <div className="space-y-2">
                {sortedAspects.map((asp) => {
                  const bA = snapshot.bodies[asp.bodyA];
                  const bB = snapshot.bodies[asp.bodyB];
                  const tierMeta = TIER_LABELS[asp.tier];
                  return (
                    <div
                      key={asp.id}
                      className="rounded border border-slate-800/85 bg-[#090D15] p-2.5 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#E6ECF5]">
                            <button
                              type="button"
                              onClick={() => onSelectBody(bA.id)}
                              className="hover:text-[#F3DC9F] cursor-pointer"
                            >
                              <span style={{ color: bA.color }}>{bA.glyph}</span> {bA.name}
                            </button>
                            <span className="text-slate-600">/</span>
                            <button
                              type="button"
                              onClick={() => onSelectBody(bB.id)}
                              className="hover:text-[#F3DC9F] cursor-pointer"
                            >
                              <span style={{ color: bB.color }}>{bB.glyph}</span> {bB.name}
                            </button>
                          </div>
                          <div className="font-mono-tabular text-[10px] text-slate-500">
                            {bA.formattedCompact} · {bB.formattedCompact}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            style={{
                              borderColor: `${asp.color}66`,
                              color: asp.color,
                            }}
                            className="inline-flex items-center gap-1 rounded border bg-black/30 px-1.5 py-0.5 font-mono-tabular text-[10.5px] font-semibold"
                          >
                            {asp.symbol} {asp.label}
                          </span>

                          <div className="font-mono-tabular text-right">
                            <div className="text-xs font-bold text-[#F3DC9F]">
                              {asp.orb.toFixed(2)}°
                            </div>
                            <div className="h-1 w-12 rounded-full bg-slate-800 overflow-hidden">
                              <div
                                style={{
                                  width: `${Math.max(8, asp.intensity * 100)}%`,
                                  backgroundColor: asp.color,
                                }}
                                className="h-full"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <span
                          className={`inline-block rounded px-1.5 py-[1px] font-mono-tabular text-[9px] font-bold ${
                            asp.state === 'APPLYING'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {asp.state}
                        </span>
                        <span
                          className={`inline-block rounded border px-1.5 py-[1px] font-mono-tabular text-[9px] font-semibold ${tierMeta.style}`}
                        >
                          {tierMeta.label}
                        </span>
                      </div>

                      <p className="mt-1.5 text-[11.5px] text-slate-300 leading-relaxed">
                        {asp.marketImplication}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* TAB 4: UPCOMING 90-DAY INFLECTION RADAR */}
        {activeTab === 'RADAR' && (
          <section
            id="upcoming-inflection-radar"
            aria-label="Upcoming 90-Day Inflection Radar"
            className="terminal-panel rounded-md p-3.5 space-y-3"
          >
            <div className="border-b border-slate-800 pb-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Radio className="h-3.5 w-3.5 text-rose-400" />
                  <h3 className="text-sm font-bold text-[#F3DC9F]">
                    Upcoming 90-Day Inflection Radar
                  </h3>
                </div>
                <span className="font-mono-tabular text-[10.5px] text-slate-400">
                  {filteredRadar.length} events
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-slate-400">
                Click any station, eclipse, exact aspect, or ingress to scrub the 3D astrolabe.
              </p>

              {/* Category filter tabs */}
              <div className="mt-2.5 flex flex-wrap gap-1">
                {(
                  [
                    { id: 'ALL', label: 'All' },
                    { id: 'STATION', label: 'Stations' },
                    { id: 'EXACT_ASPECT', label: 'Macro Aspects' },
                    { id: 'ECLIPSE', label: 'Eclipses' },
                    { id: 'SIGN_INGRESS', label: 'Ingresses' },
                  ] as Array<{ id: RadarCategoryFilter; label: string }>
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setRadarFilter(tab.id)}
                    className={`rounded px-2 py-0.5 text-[10.5px] font-medium transition cursor-pointer ${
                      radarFilter === tab.id
                        ? 'bg-[#C8A45D]/25 text-[#F3DC9F] border border-[#C8A45D]/60'
                        : 'bg-[#090D15] text-slate-400 border border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredRadar.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No inflection events in this category within the next 90 days.
              </div>
            ) : (
              <div className="space-y-2">
                {filteredRadar.map((ev) => {
                  const daysAway =
                    (ev.date.getTime() - snapshot.date.getTime()) / 86_400_000;
                  const badgeStyle =
                    ev.category === 'STATION'
                      ? 'border-rose-500/50 bg-rose-500/20 text-rose-200'
                      : ev.category === 'ECLIPSE'
                        ? 'border-amber-500/60 bg-amber-500/20 text-amber-200'
                        : ev.category === 'EXACT_ASPECT'
                          ? 'border-[#C8A45D]/50 bg-[#C8A45D]/15 text-[#F3DC9F]'
                          : 'border-sky-500/40 bg-sky-500/15 text-sky-200';

                  return (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={() => onJumpToDate(ev.date)}
                      className="group w-full rounded border border-slate-800/90 bg-[#090D15] p-2.5 text-left transition hover:border-[#C8A45D]/65 hover:bg-[#0F1624] cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`rounded border px-1.5 py-0.5 font-mono-tabular text-[9px] font-bold ${badgeStyle}`}
                        >
                          {ev.tag}
                        </span>
                        <span className="flex items-center gap-1 font-mono-tabular text-[10px] text-slate-400 group-hover:text-[#F3DC9F]">
                          <CalendarSearch className="h-3 w-3" />
                          {ev.date.toISOString().slice(0, 10)} (+{daysAway.toFixed(1)}d)
                          <ArrowUpRight className="h-3 w-3 opacity-60 group-hover:opacity-100" />
                        </span>
                      </div>
                      <div className="mt-1 text-xs font-bold text-[#E6ECF5] group-hover:text-[#F3DC9F]">
                        {ev.title}
                      </div>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-slate-400">
                        {ev.subtitle}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
};
