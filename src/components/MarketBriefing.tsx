import {
  Activity,
  AlertTriangle,
  ArrowDownUp,
  ArrowUpRight,
  CalendarSearch,
  Gauge,
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
    <main className="mx-auto max-w-[1680px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* 1. EXECUTIVE TAPE POSTURE BANNER */}
      <section
        id="executive-tape-posture"
        aria-label="Executive Tape Posture Banner"
        className={`terminal-panel rounded-lg border-l-4 ${postureStyle.accentBorder} p-5`}
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2 max-w-4xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span
                className={`rounded border px-2.5 py-0.5 font-mono-tabular text-[11px] font-bold tracking-wider ${postureStyle.badge}`}
              >
                {briefing.postureCode}
              </span>
              <span className="font-mono-tabular text-xs text-slate-400">
                EPOCH {snapshot.date.toISOString().replace('T', ' ').slice(0, 16)} UTC · JD{' '}
                {snapshot.julianDay.toFixed(3)}
              </span>
              {snapshot.lunar.eclipse && (
                <span className="animate-station-pulse rounded border border-rose-500/60 bg-rose-500/20 px-2 py-0.5 font-mono-tabular text-[11px] font-bold text-rose-200">
                  ⚡ {snapshot.lunar.eclipse.type.replace('_', ' ')} ACTIVE
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F3DC9F]">
              {briefing.postureLabel}
            </h2>

            <p className="text-sm leading-relaxed text-slate-300">
              {briefing.executiveSummary}
            </p>
          </div>

          {/* Right KPI Telemetry Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
            {/* Regime Tension Index */}
            <div className="rounded border border-slate-800 bg-[#080C13] px-3.5 py-2.5">
              <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                <Gauge className="h-3 w-3 text-[#C8A45D]" /> Tension Score
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

            {/* Active Retrograde Count */}
            <div className="rounded border border-slate-800 bg-[#080C13] px-3.5 py-2.5">
              <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                <Activity className="h-3 w-3 text-red-400" /> Active Rx
              </div>
              <div className="mt-1 font-mono-tabular text-xl font-bold text-[#E6ECF5]">
                {briefing.activeRxBodies.length}
                <span className="text-xs text-slate-500 font-normal"> / 8</span>
              </div>
              <div className="mt-1 flex flex-wrap gap-1 font-mono-tabular text-[11px] text-red-300">
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

            {/* Active Stations Alert */}
            <div className="rounded border border-slate-800 bg-[#080C13] px-3.5 py-2.5">
              <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                <ShieldAlert className="h-3 w-3 text-rose-400" /> Stations (±3d)
              </div>
              <div className="mt-1 font-mono-tabular text-xl font-bold text-[#E6ECF5]">
                {briefing.stationingBodies.length}
              </div>
              <div className="mt-1 font-mono-tabular text-[10.5px] text-rose-300 truncate">
                {briefing.stationingBodies.length > 0
                  ? briefing.stationingBodies
                      .map((b) => `${b.glyph} ${b.stationState}`)
                      .join(', ')
                  : 'No Immediate Station'}
              </div>
            </div>

            {/* Tightest Applying Hard Aspect */}
            <div className="rounded border border-slate-800 bg-[#080C13] px-3.5 py-2.5">
              <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                <AlertTriangle className="h-3 w-3 text-amber-400" /> Peak Applying
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
                  <div className="mt-1 text-[10.5px] text-slate-400 truncate">
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

      {/* 2. THREE-HORIZON BREAKDOWN CARDS (Speed = Market Timeframe) */}
      <section
        id="three-horizon-breakdown"
        aria-label="Three-Horizon Market Cycle Breakdown"
        className="grid grid-cols-1 gap-5 lg:grid-cols-3"
      >
        {briefing.horizons.map((card) => {
          const st = TONE_STYLES[card.statusTone];
          return (
            <article
              key={card.id}
              className="terminal-panel rounded-lg p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 border-b border-slate-800/90 pb-3">
                  <div>
                    <span className="font-mono-tabular text-[10px] font-semibold uppercase tracking-widest text-[#C8A45D]">
                      {card.timeframeBadge}
                    </span>
                    <h3 className="mt-0.5 text-base font-bold text-[#E6ECF5]">
                      {card.title}
                    </h3>
                    <p className="text-[11px] text-slate-400">{card.bodiesLabel}</p>
                  </div>
                  <span
                    className={`rounded border px-2 py-1 font-mono-tabular text-[10px] font-semibold ${st.badge}`}
                  >
                    {card.statusHeadline}
                  </span>
                </div>

                <div className="mt-4 space-y-3.5">
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
                        className="rounded border border-slate-800/75 bg-[#090D15] p-3"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
                          <span
                            className={`font-mono-tabular text-[10px] font-bold tracking-wider ${tagColor}`}
                          >
                            {b.tag}
                          </span>
                        </div>
                        <div className="mt-1 font-mono-tabular text-xs font-semibold text-[#E6ECF5]">
                          {b.headline}
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-slate-400">
                          {b.detail}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {/* FULL 12-BODY EPHEMERIS TELEMETRY MATRIX BAR */}
      <section
        aria-label="Real-time 12-body geocentric ephemeris strip"
        className="terminal-panel rounded-lg p-4"
      >
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[#C8A45D]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#E3C582]">
              Live Geocentric Tropical Ephemeris Telemetry (Click Any Body to Isolate in 3D)
            </h3>
          </div>
          <span className="font-mono-tabular text-[11px] text-slate-400">
            True Lunar North Node: {snapshot.trueNorthNodeLon.toFixed(2)}° · Mean North Node:{' '}
            {snapshot.meanNorthNodeLon.toFixed(2)}°
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
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
                <div className="flex items-center justify-between w-full">
                  <span className="flex items-center gap-1.5 font-semibold text-xs text-[#E6ECF5]">
                    <span className="text-sm" style={{ color: b.color }}>
                      {b.glyph}
                    </span>
                    {b.name}
                  </span>
                  <div className="flex items-center gap-1">
                    {b.stationState !== 'NONE' ? (
                      <span className="rounded bg-rose-500/25 px-1 py-[1px] font-mono-tabular text-[9px] font-bold text-rose-300 border border-rose-500/45">
                        {b.stationState}
                      </span>
                    ) : b.isRetrograde ? (
                      <span className="rounded bg-red-500/20 px-1 py-[1px] font-mono-tabular text-[9px] font-bold text-red-300 border border-red-500/35">
                        Rx
                      </span>
                    ) : (
                      <span className="font-mono-tabular text-[9px] text-emerald-400/80">
                        DIR
                      </span>
                    )}
                    {b.isAnaretic && (
                      <span className="rounded bg-amber-500/25 px-1 py-[1px] font-mono-tabular text-[9px] font-bold text-amber-300">
                        29°
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-1.5 font-mono-tabular text-xs font-semibold text-[#F3DC9F]">
                  {b.signGlyph} {b.formattedDMS}
                </div>
                <div className="mt-0.5 flex items-center justify-between font-mono-tabular text-[10px] text-slate-400">
                  <span>
                    {b.degPerDay >= 0 ? '+' : ''}
                    {b.degPerDay.toFixed(3)}°/d
                  </span>
                  {b.shadowZone && (
                    <span className="text-rose-300/90">
                      {b.shadowZone.phase === 'RETROGRADE'
                        ? 'In Rx Arc'
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

      {/* 3 & 4. LIVE ACTIVE ASPECTS MATRIX + UPCOMING 90-DAY INFLECTION RADAR */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* 3. Live Active Aspects Matrix (8 cols on XL) */}
        <section
          id="active-aspects-matrix"
          aria-label="Live Active Aspects Matrix"
          className="terminal-panel rounded-lg p-5 xl:col-span-8 flex flex-col"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
            <div>
              <h3 className="text-base font-bold text-[#F3DC9F]">
                Live Active Aspects Matrix ({sortedAspects.length})
              </h3>
              <p className="text-xs text-slate-400">
                Geometric angular alignments sorted by exactness; applying orbs build market compression into climax.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => setTableHardOnly((v) => !v)}
                className={`rounded border px-2.5 py-1 text-[11px] font-medium transition cursor-pointer ${
                  tableHardOnly
                    ? 'border-red-500/60 bg-red-500/20 text-red-200'
                    : 'border-slate-800 bg-[#090D15] text-slate-300 hover:border-slate-600'
                }`}
              >
                Hard Only (0°/90°/180°)
              </button>
              <button
                type="button"
                onClick={() => setTableApplyingOnly((v) => !v)}
                className={`rounded border px-2.5 py-1 text-[11px] font-medium transition cursor-pointer ${
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
                  className="rounded border border-[#C8A45D]/60 bg-[#C8A45D]/15 px-2.5 py-1 text-[11px] text-[#F3DC9F] cursor-pointer"
                >
                  Filter: {selectedBody} ×
                </button>
              )}
            </div>
          </div>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">
                  <th className="py-2.5 pr-3">Pair</th>
                  <th className="py-2.5 px-3">
                    <button
                      type="button"
                      onClick={() => handleSort('TYPE')}
                      className="flex items-center gap-1 hover:text-[#F3DC9F] cursor-pointer"
                    >
                      Aspect <ArrowDownUp className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="py-2.5 px-3">
                    <button
                      type="button"
                      onClick={() => handleSort('ORB')}
                      className="flex items-center gap-1 hover:text-[#F3DC9F] cursor-pointer"
                    >
                      Exact Orb <ArrowDownUp className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="py-2.5 px-3">
                    <button
                      type="button"
                      onClick={() => handleSort('STATE')}
                      className="flex items-center gap-1 hover:text-[#F3DC9F] cursor-pointer"
                    >
                      State <ArrowDownUp className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="py-2.5 px-3">
                    <button
                      type="button"
                      onClick={() => handleSort('TIER')}
                      className="flex items-center gap-1 hover:text-[#F3DC9F] cursor-pointer"
                    >
                      Horizon <ArrowDownUp className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="py-2.5 pl-3">Market Implication</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {sortedAspects.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No active geometric aspects match the active filter criteria.
                    </td>
                  </tr>
                ) : (
                  sortedAspects.map((asp) => {
                    const bA = snapshot.bodies[asp.bodyA];
                    const bB = snapshot.bodies[asp.bodyB];
                    const tierMeta = TIER_LABELS[asp.tier];
                    return (
                      <tr
                        key={asp.id}
                        className="hover:bg-[#111827]/70 transition-colors"
                      >
                        <td className="py-2.5 pr-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 font-semibold text-[#E6ECF5]">
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
                        </td>

                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span
                            style={{
                              borderColor: `${asp.color}66`,
                              color: asp.color,
                            }}
                            className="inline-flex items-center gap-1 rounded border bg-black/30 px-2 py-0.5 font-mono-tabular text-[11px] font-semibold"
                          >
                            {asp.symbol} {asp.label}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 whitespace-nowrap font-mono-tabular">
                          <div className="font-bold text-[#F3DC9F]">
                            {asp.orb.toFixed(2)}°
                          </div>
                          <div className="mt-1 h-1 w-14 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              style={{
                                width: `${Math.max(8, asp.intensity * 100)}%`,
                                backgroundColor: asp.color,
                              }}
                              className="h-full"
                            />
                          </div>
                        </td>

                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span
                            className={`inline-block rounded px-2 py-0.5 font-mono-tabular text-[10px] font-bold ${
                              asp.state === 'APPLYING'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            {asp.state}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span
                            className={`inline-block rounded border px-2 py-0.5 font-mono-tabular text-[9.5px] font-semibold ${tierMeta.style}`}
                          >
                            {tierMeta.label}
                          </span>
                        </td>

                        <td className="py-2.5 pl-3 text-slate-300 leading-snug max-w-md">
                          {asp.marketImplication}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* 4. Upcoming 90-Day Inflection Radar (4 cols on XL) */}
        <section
          id="upcoming-inflection-radar"
          aria-label="Upcoming 90-Day Inflection Radar"
          className="terminal-panel rounded-lg p-5 xl:col-span-4 flex flex-col"
        >
          <div className="border-b border-slate-800 pb-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="h-4 w-4 text-rose-400" />
                <h3 className="text-base font-bold text-[#F3DC9F]">
                  Upcoming 90-Day Inflection Radar
                </h3>
              </div>
              <span className="font-mono-tabular text-[11px] text-slate-400">
                {filteredRadar.length} events
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Chronological feed of upcoming stations, eclipses, exact macro aspects, and sign ingresses. Click any event to scrub 3D sky.
            </p>

            {/* Category filter tabs */}
            <div className="mt-3 flex flex-wrap gap-1">
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

          <div className="mt-3 max-h-[560px] space-y-2 overflow-y-auto pr-1">
            {filteredRadar.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No inflection events in this category within the next 90 days.
              </div>
            ) : (
              filteredRadar.map((ev) => {
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
                    className="group w-full rounded border border-slate-800/90 bg-[#090D15] p-3 text-left transition hover:border-[#C8A45D]/65 hover:bg-[#0F1624] cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`rounded border px-1.5 py-0.5 font-mono-tabular text-[9.5px] font-bold ${badgeStyle}`}
                      >
                        {ev.tag}
                      </span>
                      <span className="flex items-center gap-1 font-mono-tabular text-[10.5px] text-slate-400 group-hover:text-[#F3DC9F]">
                        <CalendarSearch className="h-3 w-3" />
                        {ev.date.toISOString().slice(0, 10)} (+{daysAway.toFixed(1)}d)
                        <ArrowUpRight className="h-3 w-3 opacity-60 group-hover:opacity-100" />
                      </span>
                    </div>
                    <div className="mt-1.5 text-xs font-bold text-[#E6ECF5] group-hover:text-[#F3DC9F]">
                      {ev.title}
                    </div>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-slate-400">
                      {ev.subtitle}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </section>
      </div>
    </main>
  );
};
