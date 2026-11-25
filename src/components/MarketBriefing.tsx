import {
  ArrowDownUp,
  ArrowUpRight,
  CalendarSearch,
  Gauge,
  Radio,
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

export type IntelligenceTab = 'HORIZONS' | 'BODIES' | 'ASPECTS' | 'RADAR';

interface MarketBriefingProps {
  activeTab: IntelligenceTab;
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
  activeTab,
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
    <main className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-4">
      {/* VIEW 1: EXECUTIVE SYNTHESIS & THREE-HORIZON BREAKDOWN */}
      {activeTab === 'HORIZONS' && (
        <section
          id="three-horizon-breakdown"
          aria-label="Three-Horizon Market Cycle Breakdown"
          className="space-y-4"
        >
          {/* Executive Cycle Synthesis Card */}
          <div
            id="executive-tape-posture"
            className={`terminal-panel rounded-lg border-l-4 ${postureStyle.accentBorder} p-4 space-y-2.5`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
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

              <span className="flex items-center gap-1.5 rounded border border-slate-800 bg-[#080C14] px-2.5 py-0.5 font-mono-tabular text-xs">
                <Gauge className="h-3.5 w-3.5 text-[#C8A45D]" />
                <span className={`font-bold ${postureStyle.glowText}`}>
                  {briefing.tensionIndex}
                </span>
                <span className="text-slate-500">/100</span>
              </span>
            </div>

            <h2 className="text-base sm:text-lg font-bold tracking-tight text-[#F3DC9F]">
              {briefing.postureLabel}
            </h2>

            <p className="text-xs sm:text-[13px] leading-relaxed text-slate-300">
              {briefing.executiveSummary}
            </p>
          </div>

          {/* Three-Horizon Breakdown Cards */}
          {briefing.horizons.map((card) => {
            const st = TONE_STYLES[card.statusTone];
            return (
              <article
                key={card.id}
                className="terminal-panel rounded-lg p-4 space-y-3.5"
              >
                <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-800/90 pb-3">
                  <div>
                    <span className="font-mono-tabular text-[10px] font-semibold uppercase tracking-widest text-[#C8A45D]">
                      {card.timeframeBadge}
                    </span>
                    <h3 className="mt-0.5 text-base font-bold text-[#E6ECF5]">
                      {card.title}
                    </h3>
                    <p className="text-xs text-slate-400">{card.bodiesLabel}</p>
                  </div>
                  <span
                    className={`rounded border px-2.5 py-1 font-mono-tabular text-[10.5px] font-semibold ${st.badge}`}
                  >
                    {card.statusHeadline}
                  </span>
                </div>

                <div className="space-y-2.5">
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
                        className="rounded-md border border-slate-800/80 bg-[#090D15] p-3"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
                          <span
                            className={`font-mono-tabular text-[10px] font-bold tracking-wider ${tagColor}`}
                          >
                            {b.tag}
                          </span>
                        </div>
                        <div className="mt-1 font-mono-tabular text-xs sm:text-[13px] font-semibold text-[#E6ECF5]">
                          {b.headline}
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-slate-400">
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

      {/* VIEW 2: 12-BODY EPHEMERIS TELEMETRY MATRIX */}
      {activeTab === 'BODIES' && (
        <section
          aria-label="Real-time 12-body geocentric ephemeris strip"
          className="terminal-panel rounded-lg p-4 space-y-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#C8A45D]" />
                <h2 className="text-sm sm:text-base font-bold text-[#F3DC9F]">
                  12-Body Geocentric Ephemeris
                </h2>
              </div>
              <p className="mt-0.5 text-xs text-slate-400">
                Click any body to isolate aspect beams &amp; inspect orbital telemetry in 3D.
              </p>
            </div>
            {selectedBody && (
              <button
                type="button"
                onClick={() => onSelectBody(null)}
                className="rounded border border-[#C8A45D]/60 bg-[#C8A45D]/15 px-2.5 py-1 font-mono-tabular text-xs text-[#F3DC9F] cursor-pointer"
              >
                Clear Focus: {selectedBody} ×
              </button>
            )}
          </div>

          <div className="rounded-md border border-slate-800/80 bg-[#080C14] px-3 py-2 font-mono-tabular text-xs text-slate-300 flex flex-wrap items-center justify-between gap-2">
            <span>
              True North Node (☊):{' '}
              <span className="text-[#F3DC9F] font-semibold">
                {snapshot.trueNorthNodeLon.toFixed(2)}°
              </span>
            </span>
            <span>
              Mean North Node:{' '}
              <span className="text-[#F3DC9F] font-semibold">
                {snapshot.meanNorthNodeLon.toFixed(2)}°
              </span>
            </span>
          </div>

          <div className="grid grid-cols-2 2xl:grid-cols-3 gap-2.5">
            {snapshot.bodyList.map((b) => {
              const isSelected = selectedBody === b.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => onSelectBody(isSelected ? null : b.id)}
                  className={`flex flex-col rounded-md border p-3 text-left transition cursor-pointer ${
                    isSelected
                      ? 'border-[#F3DC9F] bg-[#161F31] shadow-[0_0_15px_rgba(227,197,130,0.25)]'
                      : 'border-slate-800/90 bg-[#090D15] hover:border-[#C8A45D]/55'
                  }`}
                >
                  <div className="flex items-center justify-between w-full gap-1">
                    <span className="flex items-center gap-1.5 font-semibold text-xs sm:text-[13px] text-[#E6ECF5] truncate">
                      <span className="text-base" style={{ color: b.color }}>
                        {b.glyph}
                      </span>
                      <span className="truncate">{b.name}</span>
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      {b.stationState !== 'NONE' ? (
                        <span className="rounded bg-rose-500/25 px-1.5 py-[1px] font-mono-tabular text-[9px] font-bold text-rose-300 border border-rose-500/45">
                          {b.stationState}
                        </span>
                      ) : b.isRetrograde ? (
                        <span className="rounded bg-red-500/20 px-1.5 py-[1px] font-mono-tabular text-[9px] font-bold text-red-300 border border-red-500/35">
                          Rx
                        </span>
                      ) : (
                        <span className="font-mono-tabular text-[9.5px] text-emerald-400/85">
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
                  <div className="mt-2 font-mono-tabular text-xs font-semibold text-[#F3DC9F]">
                    {b.signGlyph} {b.formattedDMS}
                  </div>
                  <div className="mt-1 flex items-center justify-between font-mono-tabular text-[10.5px] text-slate-400">
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
      )}

      {/* VIEW 3: LIVE ACTIVE ASPECTS MATRIX */}
      {activeTab === 'ASPECTS' && (
        <section
          id="active-aspects-matrix"
          aria-label="Live Active Aspects Matrix"
          className="terminal-panel rounded-lg p-4 space-y-3.5"
        >
          <div className="space-y-3 border-b border-slate-800 pb-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-[#F3DC9F]">
                  Live Active Aspects ({sortedAspects.length})
                </h2>
                <p className="text-xs text-slate-400">
                  Applying orbs build compression toward exact geometric alignment.
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
                  Hard Only
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
                    {selectedBody} ×
                  </button>
                )}
              </div>
            </div>

            {/* Sort Strip */}
            <div className="flex flex-wrap items-center gap-1.5 font-mono-tabular text-[11px]">
              <span className="text-slate-500 mr-1">SORT BY:</span>
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
                  className={`flex items-center gap-1 rounded border px-2 py-1 transition cursor-pointer ${
                    sortKey === s.key
                      ? 'border-[#C8A45D]/60 bg-[#C8A45D]/15 text-[#F3DC9F]'
                      : 'border-slate-800 bg-[#090D15] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {s.label}
                  <ArrowDownUp className="h-3 w-3 opacity-70" />
                </button>
              ))}
            </div>
          </div>

          {sortedAspects.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-500">
              No active geometric aspects match the active filter criteria.
            </div>
          ) : (
            <div className="space-y-2.5">
              {sortedAspects.map((asp) => {
                const bA = snapshot.bodies[asp.bodyA];
                const bB = snapshot.bodies[asp.bodyB];
                const tierMeta = TIER_LABELS[asp.tier];
                return (
                  <div
                    key={asp.id}
                    className="rounded-md border border-slate-800/85 bg-[#090D15] p-3.5 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 text-xs sm:text-[13px] font-semibold text-[#E6ECF5]">
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
                        <div className="mt-0.5 font-mono-tabular text-[10.5px] text-slate-500">
                          {bA.formattedCompact} · {bB.formattedCompact}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          style={{
                            borderColor: `${asp.color}66`,
                            color: asp.color,
                          }}
                          className="inline-flex items-center gap-1 rounded border bg-black/30 px-2 py-0.5 font-mono-tabular text-[11px] font-semibold"
                        >
                          {asp.symbol} {asp.label}
                        </span>

                        <div className="font-mono-tabular text-right">
                          <div className="text-xs font-bold text-[#F3DC9F]">
                            {asp.orb.toFixed(2)}°
                          </div>
                          <div className="mt-0.5 h-1 w-14 rounded-full bg-slate-800 overflow-hidden">
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

                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span
                        className={`inline-block rounded px-2 py-0.5 font-mono-tabular text-[9.5px] font-bold ${
                          asp.state === 'APPLYING'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {asp.state}
                      </span>
                      <span
                        className={`inline-block rounded border px-2 py-0.5 font-mono-tabular text-[9.5px] font-semibold ${tierMeta.style}`}
                      >
                        {tierMeta.label}
                      </span>
                    </div>

                    <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                      {asp.marketImplication}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* VIEW 4: UPCOMING 90-DAY INFLECTION RADAR */}
      {activeTab === 'RADAR' && (
        <section
          id="upcoming-inflection-radar"
          aria-label="Upcoming 90-Day Inflection Radar"
          className="terminal-panel rounded-lg p-4 space-y-3.5"
        >
          <div className="border-b border-slate-800 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="h-4 w-4 text-rose-400" />
                <h2 className="text-sm sm:text-base font-bold text-[#F3DC9F]">
                  Upcoming 90-Day Inflection Radar
                </h2>
              </div>
              <span className="font-mono-tabular text-xs text-slate-400">
                {filteredRadar.length} events
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Chronological feed of upcoming stations, eclipses, exact macro aspects, and sign ingresses. Click any event to scrub 3D sky.
            </p>

            {/* Category filter tabs */}
            <div className="mt-3 flex flex-wrap gap-1.5">
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
                  className={`rounded px-2.5 py-1 text-[11px] font-medium transition cursor-pointer ${
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
            <div className="py-10 text-center text-xs text-slate-500">
              No inflection events in this category within the next 90 days.
            </div>
          ) : (
            <div className="space-y-2.5">
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
                    className="group w-full rounded-md border border-slate-800/90 bg-[#090D15] p-3.5 text-left transition hover:border-[#C8A45D]/65 hover:bg-[#0F1624] cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`rounded border px-2 py-0.5 font-mono-tabular text-[9.5px] font-bold ${badgeStyle}`}
                      >
                        {ev.tag}
                      </span>
                      <span className="flex items-center gap-1 font-mono-tabular text-[11px] text-slate-400 group-hover:text-[#F3DC9F]">
                        <CalendarSearch className="h-3 w-3" />
                        {ev.date.toISOString().slice(0, 10)} (+{daysAway.toFixed(1)}d)
                        <ArrowUpRight className="h-3 w-3 opacity-60 group-hover:opacity-100" />
                      </span>
                    </div>
                    <div className="mt-1.5 text-xs sm:text-[13px] font-bold text-[#E6ECF5] group-hover:text-[#F3DC9F]">
                      {ev.title}
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-slate-400">
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
  );
};
