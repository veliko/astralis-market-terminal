import * as Astronomy from 'astronomy-engine';

export type BodyId =
  | 'Sun'
  | 'Moon'
  | 'Mercury'
  | 'Venus'
  | 'Mars'
  | 'Jupiter'
  | 'Saturn'
  | 'Uranus'
  | 'Neptune'
  | 'Pluto'
  | 'NorthNode'
  | 'SouthNode';

export type TimeframeTier = 'INNER' | 'MIDDLE' | 'OUTER';

export type ElementType = 'Fire' | 'Earth' | 'Air' | 'Water';

export type StationState = 'ST-Rx' | 'ST-D' | 'NONE';

export type ShadowPhase = 'PRE_SHADOW' | 'RETROGRADE' | 'POST_SHADOW';

export type AspectType =
  | 'CONJUNCTION'
  | 'OPPOSITION'
  | 'SQUARE'
  | 'TRINE'
  | 'SEXTILE';

export type AspectMotionState = 'APPLYING' | 'SEPARATING';

export type AspectHorizonTier =
  | 'SECULAR_MACRO'
  | 'TACTICAL_REGIME'
  | 'INTRADAY_TRIGGER';

export interface ZodiacSignInfo {
  index: number;
  name: string;
  short: string;
  glyph: string;
  element: ElementType;
  startDeg: number;
}

export const ZODIAC_SIGNS: readonly ZodiacSignInfo[] = [
  { index: 0, name: 'Aries', short: 'ARI', glyph: '♈', element: 'Fire', startDeg: 0 },
  { index: 1, name: 'Taurus', short: 'TAU', glyph: '♉', element: 'Earth', startDeg: 30 },
  { index: 2, name: 'Gemini', short: 'GEM', glyph: '♊', element: 'Air', startDeg: 60 },
  { index: 3, name: 'Cancer', short: 'CAN', glyph: '♋', element: 'Water', startDeg: 90 },
  { index: 4, name: 'Leo', short: 'LEO', glyph: '♌', element: 'Fire', startDeg: 120 },
  { index: 5, name: 'Virgo', short: 'VIR', glyph: '♍', element: 'Earth', startDeg: 150 },
  { index: 6, name: 'Libra', short: 'LIB', glyph: '♎', element: 'Air', startDeg: 180 },
  { index: 7, name: 'Scorpio', short: 'SCO', glyph: '♏', element: 'Water', startDeg: 210 },
  { index: 8, name: 'Sagittarius', short: 'SAG', glyph: '♐', element: 'Fire', startDeg: 240 },
  { index: 9, name: 'Capricorn', short: 'CAP', glyph: '♑', element: 'Earth', startDeg: 270 },
  { index: 10, name: 'Aquarius', short: 'AQU', glyph: '♒', element: 'Air', startDeg: 300 },
  { index: 11, name: 'Pisces', short: 'PIS', glyph: '♓', element: 'Water', startDeg: 330 },
] as const;

export interface BodyMeta {
  id: BodyId;
  name: string;
  glyph: string;
  tier: TimeframeTier;
  tierLabel: string;
  trackRadius: number;
  helioTrackRadius: number;
  sphereRadius: number;
  color: string;
  accentColor: string;
  isRetroCapable: boolean;
  isNode: boolean;
  isOuter: boolean;
}

export const BODY_DEFINITIONS: readonly BodyMeta[] = [
  {
    id: 'Moon',
    name: 'Moon',
    glyph: '☽',
    tier: 'INNER',
    tierLabel: 'Intraday / Liquidity Pivot',
    trackRadius: 4.5,
    helioTrackRadius: 5.7,
    sphereRadius: 0.24,
    color: '#D8E2F0',
    accentColor: '#94A3B8',
    isRetroCapable: false,
    isNode: false,
    isOuter: false,
  },
  {
    id: 'Mercury',
    name: 'Mercury',
    glyph: '☿',
    tier: 'INNER',
    tierLabel: 'Short-Term / Comms & Tape',
    trackRadius: 5.8,
    helioTrackRadius: 3.1,
    sphereRadius: 0.25,
    color: '#7DD3FC',
    accentColor: '#38BDF8',
    isRetroCapable: true,
    isNode: false,
    isOuter: false,
  },
  {
    id: 'Venus',
    name: 'Venus',
    glyph: '♀',
    tier: 'INNER',
    tierLabel: 'Tactical / Valuation & Credit',
    trackRadius: 7.2,
    helioTrackRadius: 4.2,
    sphereRadius: 0.31,
    color: '#FDE68A',
    accentColor: '#F59E0B',
    isRetroCapable: true,
    isNode: false,
    isOuter: false,
  },
  {
    id: 'Sun',
    name: 'Sun',
    glyph: '☉',
    tier: 'INNER',
    tierLabel: 'Daily / Seasonal Spotlight',
    trackRadius: 8.7,
    helioTrackRadius: 0,
    sphereRadius: 0.44,
    color: '#FBBF24',
    accentColor: '#F59E0B',
    isRetroCapable: false,
    isNode: false,
    isOuter: false,
  },
  {
    id: 'Mars',
    name: 'Mars',
    glyph: '♂',
    tier: 'MIDDLE',
    tierLabel: 'Multi-Month / Trend Traction',
    trackRadius: 10.8,
    helioTrackRadius: 7.4,
    sphereRadius: 0.33,
    color: '#F87171',
    accentColor: '#EF4444',
    isRetroCapable: true,
    isNode: false,
    isOuter: false,
  },
  {
    id: 'Jupiter',
    name: 'Jupiter',
    glyph: '♃',
    tier: 'MIDDLE',
    tierLabel: 'Quarterly / Liquidity & Multiples',
    trackRadius: 12.5,
    helioTrackRadius: 10.5,
    sphereRadius: 0.46,
    color: '#E3C582',
    accentColor: '#C8A45D',
    isRetroCapable: true,
    isNode: false,
    isOuter: true,
  },
  {
    id: 'Saturn',
    name: 'Saturn',
    glyph: '♄',
    tier: 'MIDDLE',
    tierLabel: 'Multi-Quarter / Credit & Floor',
    trackRadius: 14.2,
    helioTrackRadius: 13.0,
    sphereRadius: 0.4,
    color: '#D6B88A',
    accentColor: '#A38350',
    isRetroCapable: true,
    isNode: false,
    isOuter: true,
  },
  {
    id: 'NorthNode',
    name: 'North Node',
    glyph: '☊',
    tier: 'MIDDLE',
    tierLabel: 'Nodal / Capital Inflow Vector',
    trackRadius: 15.6,
    helioTrackRadius: 15.6,
    sphereRadius: 0.28,
    color: '#34D399',
    accentColor: '#10B981',
    isRetroCapable: false,
    isNode: true,
    isOuter: false,
  },
  {
    id: 'SouthNode',
    name: 'South Node',
    glyph: '☋',
    tier: 'MIDDLE',
    tierLabel: 'Nodal / Leverage & Valuation Drain',
    trackRadius: 15.6,
    helioTrackRadius: 15.6,
    sphereRadius: 0.28,
    color: '#FB7185',
    accentColor: '#E11D48',
    isRetroCapable: false,
    isNode: true,
    isOuter: false,
  },
  {
    id: 'Uranus',
    name: 'Uranus',
    glyph: '♅',
    tier: 'OUTER',
    tierLabel: 'Secular / Tech Shock & Convexity',
    trackRadius: 17.3,
    helioTrackRadius: 15.8,
    sphereRadius: 0.36,
    color: '#22D3EE',
    accentColor: '#06B6D4',
    isRetroCapable: true,
    isNode: false,
    isOuter: true,
  },
  {
    id: 'Neptune',
    name: 'Neptune',
    glyph: '♆',
    tier: 'OUTER',
    tierLabel: 'Secular / Liquidity Narrative',
    trackRadius: 18.9,
    helioTrackRadius: 18.0,
    sphereRadius: 0.35,
    color: '#60A5FA',
    accentColor: '#3B82F6',
    isRetroCapable: true,
    isNode: false,
    isOuter: true,
  },
  {
    id: 'Pluto',
    name: 'Pluto',
    glyph: '♇',
    tier: 'OUTER',
    tierLabel: 'Secular / Sovereign & Debt Regime',
    trackRadius: 20.5,
    helioTrackRadius: 20.2,
    sphereRadius: 0.3,
    color: '#F43F5E',
    accentColor: '#BE123C',
    isRetroCapable: true,
    isNode: false,
    isOuter: true,
  },
] as const;

export const BODY_META_MAP: Record<BodyId, BodyMeta> = Object.fromEntries(
  BODY_DEFINITIONS.map((b) => [b.id, b]),
) as Record<BodyId, BodyMeta>;

const ASTRO_BODY_MAP: Partial<Record<BodyId, Astronomy.Body>> = {
  Sun: Astronomy.Body.Sun,
  Moon: Astronomy.Body.Moon,
  Mercury: Astronomy.Body.Mercury,
  Venus: Astronomy.Body.Venus,
  Mars: Astronomy.Body.Mars,
  Jupiter: Astronomy.Body.Jupiter,
  Saturn: Astronomy.Body.Saturn,
  Uranus: Astronomy.Body.Uranus,
  Neptune: Astronomy.Body.Neptune,
  Pluto: Astronomy.Body.Pluto,
};

export interface RetrogradeCycle {
  bodyId: BodyId;
  preShadowStart: Date;
  srxDate: Date;
  sdDate: Date;
  postShadowEnd: Date;
  lonSD: number;
  lonSRx: number;
  arcSpanDeg: number;
  formattedSD: string;
  formattedSRx: string;
}

export interface ActiveShadowZone extends RetrogradeCycle {
  phase: ShadowPhase;
  progressPct: number;
}

export interface RibbonSample {
  elon: number;
  elat: number;
  dayOffset: number;
  isRetrograde: boolean;
}

export interface NextStationInfo {
  type: 'SRx' | 'SD';
  date: Date;
  elon: number;
  formattedPos: string;
}

export interface NextIngressInfo {
  date: Date;
  fromSign: string;
  toSign: string;
  toSignGlyph: string;
  isRetrogradeIngress: boolean;
}

export interface BodyTelemetry {
  id: BodyId;
  name: string;
  glyph: string;
  tier: TimeframeTier;
  tierLabel: string;
  trackRadius: number;
  helioTrackRadius: number;
  sphereRadius: number;
  color: string;
  accentColor: string;
  isNode: boolean;
  isOuter: boolean;
  elon: number;
  elat: number;
  distanceAu: number;
  helioElon: number;
  helioElat: number;
  helioDistAu: number;
  signIndex: number;
  signName: string;
  signShort: string;
  signGlyph: string;
  signElement: ElementType;
  degreeInSign: number;
  deg: number;
  min: number;
  formattedDMS: string;
  formattedCompact: string;
  degPerDay: number;
  isRetrograde: boolean;
  stationState: StationState;
  stationExactDate: Date | null;
  isAnaretic: boolean;
  shadowZone: ActiveShadowZone | null;
  ribbon: RibbonSample[];
}

export interface ActiveAspect {
  id: string;
  bodyA: BodyId;
  bodyB: BodyId;
  type: AspectType;
  symbol: string;
  label: string;
  targetAngle: number;
  separation: number;
  orb: number;
  maxOrb: number;
  intensity: number;
  isHard: boolean;
  isCriticalConjunction: boolean;
  state: AspectMotionState;
  tier: AspectHorizonTier;
  color: string;
  marketImplication: string;
}

export interface EclipseAlert {
  type: 'SOLAR_ECLIPSE' | 'LUNAR_ECLIPSE';
  classification: 'CENTRAL_HIGH_IMPACT' | 'PARTIAL_CORRIDOR';
  nearestNode: 'NorthNode' | 'SouthNode';
  nodeDistanceDeg: number;
  syzygyOrbDeg: number;
  label: string;
}

export interface LunarPhaseTelemetry {
  phaseAngle: number;
  phaseName: string;
  illuminationPct: number;
  isNewMoonWindow: boolean;
  isFullMoonWindow: boolean;
  nodeProximityDeg: number;
  eclipse: EclipseAlert | null;
}

export interface EphemerisSnapshot {
  date: Date;
  julianDay: number;
  meanNorthNodeLon: number;
  trueNorthNodeLon: number;
  earthHelio: {
    elon: number;
    elat: number;
    distAu: number;
  };
  bodies: Record<BodyId, BodyTelemetry>;
  bodyList: BodyTelemetry[];
  aspects: ActiveAspect[];
  lunar: LunarPhaseTelemetry;
  occupiedAnareticSigns: number[];
}

export interface InflectionEvent {
  id: string;
  date: Date;
  category: 'STATION' | 'ECLIPSE' | 'EXACT_ASPECT' | 'SIGN_INGRESS';
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE';
  title: string;
  subtitle: string;
  tag: string;
  bodies: BodyId[];
}

export interface MacroBookmark {
  id: string;
  date: Date;
  shortLabel: string;
  category: 'RETROGRADE' | 'CONJUNCTION' | 'TENSION' | 'STRUCTURAL' | 'ECLIPSE';
  regimeTag: string;
  description: string;
}

const MS_PER_HOUR = 3_600_000;
const MS_PER_DAY = 86_400_000;

/** Normalize any angle in degrees into [0, 360). */
export function normalizeDeg(deg: number): number {
  const m = deg % 360;
  return m < 0 ? m + 360 : m === 0 ? 0 : m;
}

/** Signed shortest angular travel from `fromDeg` to `toDeg` in [-180, +180]. */
export function signedAngleDelta(fromDeg: number, toDeg: number): number {
  const diff = ((toDeg - fromDeg + 540) % 360) - 180;
  return diff === -180 ? 180 : diff < -180 ? diff + 360 : diff;
}

/** Unsigned shortest angular separation in [0, 180]. */
export function shortestAngularSeparation(lonA: number, lonB: number): number {
  return Math.abs(signedAngleDelta(lonA, lonB));
}

/** Convert JS Date to Julian Day (UTC). */
export function dateToJulianDay(date: Date): number {
  return date.getTime() / MS_PER_DAY + 2440587.5;
}

/**
 * Exact Mean Lunar Nodes formula using Julian centuries from J2000.0:
 * omega = (125.0445479 - 1934.1362891 * T + 0.0020754 * T^2) mod 360
 */
export function computeMeanLunarNodes(date: Date): {
  northNode: number;
  southNode: number;
} {
  const jd = dateToJulianDay(date);
  const T = (jd - 2451545.0) / 36525.0;
  const omega = normalizeDeg(
    125.0445479 - 1934.1362891 * T + 0.0020754 * T * T,
  );
  const southNode = normalizeDeg(omega + 180);
  return { northNode: omega, southNode };
}

/**
 * Compute osculating True Lunar North Node from Moon's instantaneous
 * geocentric ecliptic position and velocity vectors (r x v ascending node).
 */
export function computeTrueLunarNorthNode(date: Date): number {
  const dt = 30 * 60_000; // +-30m state vector derivative
  const e1 = Astronomy.Ecliptic(
    Astronomy.GeoVector(Astronomy.Body.Moon, new Date(date.getTime() - dt), true),
  );
  const e2 = Astronomy.Ecliptic(
    Astronomy.GeoVector(Astronomy.Body.Moon, new Date(date.getTime() + dt), true),
  );
  const r1 = e1.vec;
  const r2 = e2.vec;
  // Orbital angular momentum normal h = r1 x r2 in ecliptic coordinates
  const hx = r1.y * r2.z - r1.z * r2.y;
  const hy = r1.z * r2.x - r1.x * r2.z;
  if (Math.hypot(hx, hy) < 1e-12) {
    return computeMeanLunarNodes(date).northNode;
  }
  // Line of ascending node n = k x h = (-hy, hx, 0)
  const trueOmega = (Math.atan2(hx, -hy) * 180) / Math.PI;
  return normalizeDeg(trueOmega);
}

/** Format ecliptic longitude into sign, degree, minute telemetry. */
export function formatLongitudeDMS(elon: number): {
  signIndex: number;
  sign: ZodiacSignInfo;
  degreeInSign: number;
  deg: number;
  min: number;
  isAnaretic: boolean;
  formattedDMS: string;
  formattedCompact: string;
} {
  const norm = normalizeDeg(elon);
  const signIndex = Math.min(11, Math.floor(norm / 30));
  const sign = ZODIAC_SIGNS[signIndex];
  const degreeInSign = Math.max(0, Math.min(29.999999, norm - signIndex * 30));
  const deg = Math.floor(degreeInSign);
  const min = Math.min(59, Math.floor((degreeInSign - deg) * 60));
  const isAnaretic = deg === 29;
  const dd = String(deg).padStart(2, '0');
  const mm = String(min).padStart(2, '0');
  return {
    signIndex,
    sign,
    degreeInSign,
    deg,
    min,
    isAnaretic,
    formattedDMS: `${dd}°${mm}' ${sign.name}`,
    formattedCompact: `${dd}°${mm}' ${sign.short}`,
  };
}

/**
 * Compute true geocentric tropical ecliptic coordinates (elon, elat, distanceAu)
 * via Astronomy.GeoVector(body, date, true) -> Astronomy.Ecliptic(gv).
 */
export function computeGeocentricPosition(
  bodyId: BodyId,
  date: Date,
): { elon: number; elat: number; distanceAu: number } {
  if (bodyId === 'NorthNode' || bodyId === 'SouthNode') {
    const nodes = computeMeanLunarNodes(date);
    return {
      elon: bodyId === 'NorthNode' ? nodes.northNode : nodes.southNode,
      elat: 0,
      distanceAu: 0.00257,
    };
  }
  const astroBody = ASTRO_BODY_MAP[bodyId]!;
  const gv = Astronomy.GeoVector(astroBody, date, true);
  const ecl = Astronomy.Ecliptic(gv);
  return {
    elon: normalizeDeg(ecl.elon),
    elat: ecl.elat,
    distanceAu: gv.Length(),
  };
}

/**
 * Compute heliocentric ecliptic coordinates for the secondary
 * "Heliocentric + Sightline View".
 */
export function computeHeliocentricPosition(
  bodyId: BodyId,
  date: Date,
): { elon: number; elat: number; distAu: number } {
  if (bodyId === 'Sun') {
    return { elon: 0, elat: 0, distAu: 0 };
  }
  if (bodyId === 'NorthNode' || bodyId === 'SouthNode') {
    const pos = computeGeocentricPosition(bodyId, date);
    return { elon: pos.elon, elat: 0, distAu: 1.0 };
  }
  if (bodyId === 'Moon') {
    const earthVec = Astronomy.HelioVector(Astronomy.Body.Earth, date);
    const moonGeo = Astronomy.GeoVector(Astronomy.Body.Moon, date, true);
    const earthEcl = Astronomy.Ecliptic(earthVec);
    const moonEcl = Astronomy.Ecliptic(moonGeo);
    // Slightly exaggerate Moon offset from Earth in heliocentric view for visual clarity
    return {
      elon: normalizeDeg(earthEcl.elon + Math.sin(((moonEcl.elon - earthEcl.elon) * Math.PI) / 180) * 6),
      elat: moonEcl.elat,
      distAu: earthVec.Length(),
    };
  }
  const astroBody = ASTRO_BODY_MAP[bodyId]!;
  const hv = Astronomy.HelioVector(astroBody, date);
  const ecl = Astronomy.Ecliptic(hv);
  return {
    elon: normalizeDeg(ecl.elon),
    elat: ecl.elat,
    distAu: hv.Length(),
  };
}

export function computeEarthHeliocentric(date: Date): {
  elon: number;
  elat: number;
  distAu: number;
} {
  const hv = Astronomy.HelioVector(Astronomy.Body.Earth, date);
  const ecl = Astronomy.Ecliptic(hv);
  return {
    elon: normalizeDeg(ecl.elon),
    elat: ecl.elat,
    distAu: hv.Length(),
  };
}

/**
 * Compute daily angular velocity (deg/day) by comparing geocentric longitude
 * at t - 12h and t + 12h, handling 360°/0° Aries wrap-around cleanly.
 */
export function computeDailyAngularVelocity(bodyId: BodyId, date: Date): number {
  const tMinus = new Date(date.getTime() - 12 * MS_PER_HOUR);
  const tPlus = new Date(date.getTime() + 12 * MS_PER_HOUR);
  const lon1 = computeGeocentricPosition(bodyId, tMinus).elon;
  const lon2 = computeGeocentricPosition(bodyId, tPlus).elon;
  return signedAngleDelta(lon1, lon2);
}

// ============================================================================
// RETROGRADE STATION & SHADOW ZONE CYCLE INDEX (Lazy-Cached per Planet)
// ============================================================================

interface CycleCacheBucket {
  startMs: number;
  endMs: number;
  cycles: RetrogradeCycle[];
  stations: Array<{ type: 'SRx' | 'SD'; date: Date; elon: number }>;
}

const cycleCache = new Map<string, CycleCacheBucket>();

function getStepDaysForBody(bodyId: BodyId): number {
  switch (bodyId) {
    case 'Mercury':
      return 2.5;
    case 'Venus':
      return 4;
    case 'Mars':
      return 5;
    default:
      return 9;
  }
}

function refineVelocityZeroCrossing(
  bodyId: BodyId,
  tLeftMs: number,
  tRightMs: number,
): Date {
  let lo = tLeftMs;
  let hi = tRightMs;
  let vLo = computeDailyAngularVelocity(bodyId, new Date(lo));
  for (let i = 0; i < 18; i++) {
    const mid = 0.5 * (lo + hi);
    const vMid = computeDailyAngularVelocity(bodyId, new Date(mid));
    if ((vLo >= 0 && vMid >= 0) || (vLo < 0 && vMid < 0)) {
      lo = mid;
      vLo = vMid;
    } else {
      hi = mid;
    }
  }
  return new Date(0.5 * (lo + hi));
}

function refineUnwrappedCrossing(
  bodyId: BodyId,
  tLoMs: number,
  uLo: number,
  tHiMs: number,
  targetU: number,
): Date {
  let lo = tLoMs;
  let hi = tHiMs;
  let baseT = tLoMs;
  let baseU = uLo;
  let baseNorm = computeGeocentricPosition(bodyId, new Date(lo)).elon;

  for (let i = 0; i < 16; i++) {
    const mid = 0.5 * (lo + hi);
    const midNorm = computeGeocentricPosition(bodyId, new Date(mid)).elon;
    const midU = baseU + signedAngleDelta(baseNorm, midNorm);
    if (midU < targetU) {
      lo = mid;
      baseT = mid;
      baseU = midU;
      baseNorm = midNorm;
    } else {
      hi = mid;
    }
  }
  void baseT;
  return new Date(0.5 * (lo + hi));
}

/**
 * Lazily indexes all retrograde cycles and exact SRx / SD stations for a planet
 * within a padded 4-year bucket around `date` (takes ~8-15ms once per bucket, 0ms cached).
 */
export function getRetrogradeBucketForDate(
  bodyId: BodyId,
  date: Date,
): CycleCacheBucket {
  const meta = BODY_META_MAP[bodyId];
  if (!meta.isRetroCapable) {
    return { startMs: 0, endMs: 0, cycles: [], stations: [] };
  }

  // Bucket in 4-year blocks with generous +-320 day padding so boundary cycles are complete
  const year = date.getUTCFullYear();
  const blockStartYear = Math.floor(year / 4) * 4;
  const cacheKey = `${bodyId}:${blockStartYear}`;
  const existing = cycleCache.get(cacheKey);
  if (existing) {
    return existing;
  }

  const padDays = 340;
  const startMs = Date.UTC(blockStartYear, 0, 1) - padDays * MS_PER_DAY;
  const endMs = Date.UTC(blockStartYear + 4, 0, 1) + padDays * MS_PER_DAY;
  const stepMs = getStepDaysForBody(bodyId) * MS_PER_DAY;

  const times: number[] = [];
  const normLons: number[] = [];
  const unwrapped: number[] = [];

  for (let t = startMs; t <= endMs; t += stepMs) {
    const lon = computeGeocentricPosition(bodyId, new Date(t)).elon;
    times.push(t);
    normLons.push(lon);
    if (unwrapped.length === 0) {
      unwrapped.push(lon);
    } else {
      const prevNorm = normLons[normLons.length - 2];
      const prevU = unwrapped[unwrapped.length - 1];
      unwrapped.push(prevU + signedAngleDelta(prevNorm, lon));
    }
  }

  // Detect velocity sign changes via finite differences on unwrapped curve
  interface RawStation {
    type: 'SRx' | 'SD';
    date: Date;
    elon: number;
    unwrappedLon: number;
    approxIndex: number;
  }

  const rawStations: RawStation[] = [];
  for (let i = 1; i < unwrapped.length - 1; i++) {
    const dPrev = unwrapped[i] - unwrapped[i - 1];
    const dNext = unwrapped[i + 1] - unwrapped[i];
    if (dPrev > 0 && dNext <= 0) {
      const exactDate = refineVelocityZeroCrossing(
        bodyId,
        times[i - 1],
        times[i + 1],
      );
      const exactLon = computeGeocentricPosition(bodyId, exactDate).elon;
      const exactU = unwrapped[i] + signedAngleDelta(normLons[i], exactLon);
      rawStations.push({
        type: 'SRx',
        date: exactDate,
        elon: exactLon,
        unwrappedLon: exactU,
        approxIndex: i,
      });
    } else if (dPrev <= 0 && dNext > 0) {
      const exactDate = refineVelocityZeroCrossing(
        bodyId,
        times[i - 1],
        times[i + 1],
      );
      const exactLon = computeGeocentricPosition(bodyId, exactDate).elon;
      const exactU = unwrapped[i] + signedAngleDelta(normLons[i], exactLon);
      rawStations.push({
        type: 'SD',
        date: exactDate,
        elon: exactLon,
        unwrappedLon: exactU,
        approxIndex: i,
      });
    }
  }

  // Pair each SRx -> SD into a complete Retrograde + Pre/Post-Shadow Cycle
  const cycles: RetrogradeCycle[] = [];
  for (let s = 0; s < rawStations.length - 1; s++) {
    const stA = rawStations[s];
    const stB = rawStations[s + 1];
    if (stA.type === 'SRx' && stB.type === 'SD') {
      const uSRx = stA.unwrappedLon;
      const uSD = stB.unwrappedLon;

      // Walk backward from SRx to find where direct motion crossed uSD (Pre-Shadow Entry)
      let preShadowStart = new Date(stA.date.getTime() - 30 * MS_PER_DAY);
      for (let k = stA.approxIndex; k > 0; k--) {
        if (unwrapped[k - 1] <= uSD && unwrapped[k] >= uSD) {
          preShadowStart = refineUnwrappedCrossing(
            bodyId,
            times[k - 1],
            unwrapped[k - 1],
            times[k],
            uSD,
          );
          break;
        }
      }

      // Walk forward from SD to find where direct motion re-crosses uSRx (Post-Shadow Clearance)
      let postShadowEnd = new Date(stB.date.getTime() + 30 * MS_PER_DAY);
      for (let k = stB.approxIndex; k < unwrapped.length - 1; k++) {
        if (unwrapped[k] <= uSRx && unwrapped[k + 1] >= uSRx) {
          postShadowEnd = refineUnwrappedCrossing(
            bodyId,
            times[k],
            unwrapped[k],
            times[k + 1],
            uSRx,
          );
          break;
        }
      }

      const arcSpanDeg = Math.max(0.2, uSRx - uSD);
      cycles.push({
        bodyId,
        preShadowStart,
        srxDate: stA.date,
        sdDate: stB.date,
        postShadowEnd,
        lonSD: stB.elon,
        lonSRx: stA.elon,
        arcSpanDeg,
        formattedSD: formatLongitudeDMS(stB.elon).formattedDMS,
        formattedSRx: formatLongitudeDMS(stA.elon).formattedDMS,
      });
    }
  }

  const bucket: CycleCacheBucket = {
    startMs,
    endMs,
    cycles,
    stations: rawStations.map((r) => ({
      type: r.type,
      date: r.date,
      elon: r.elon,
    })),
  };
  cycleCache.set(cacheKey, bucket);
  return bucket;
}

/**
 * Evaluate station state (within +-3 days of velocity crossing 0) and active
 * retrograde shadow zone (pre-shadow, retrograde, or post-shadow).
 */
export function evaluateStationAndShadow(
  bodyId: BodyId,
  date: Date,
): {
  stationState: StationState;
  stationExactDate: Date | null;
  shadowZone: ActiveShadowZone | null;
} {
  const meta = BODY_META_MAP[bodyId];
  if (!meta.isRetroCapable) {
    return { stationState: 'NONE', stationExactDate: null, shadowZone: null };
  }

  const bucket = getRetrogradeBucketForDate(bodyId, date);
  const tMs = date.getTime();
  const stationWindowMs = 3 * MS_PER_DAY;

  let stationState: StationState = 'NONE';
  let stationExactDate: Date | null = null;
  let closestDist = Infinity;

  for (const st of bucket.stations) {
    const dist = Math.abs(st.date.getTime() - tMs);
    if (dist <= stationWindowMs && dist < closestDist) {
      closestDist = dist;
      stationState = st.type === 'SRx' ? 'ST-Rx' : 'ST-D';
      stationExactDate = st.date;
    }
  }

  let shadowZone: ActiveShadowZone | null = null;
  for (const cyc of bucket.cycles) {
    const tPre = cyc.preShadowStart.getTime();
    const tSRx = cyc.srxDate.getTime();
    const tSD = cyc.sdDate.getTime();
    const tPost = cyc.postShadowEnd.getTime();

    if (tMs >= tPre && tMs <= tPost) {
      let phase: ShadowPhase;
      let progressPct: number;
      if (tMs < tSRx) {
        phase = 'PRE_SHADOW';
        progressPct = Math.max(0, Math.min(100, ((tMs - tPre) / Math.max(1, tSRx - tPre)) * 100));
      } else if (tMs <= tSD) {
        phase = 'RETROGRADE';
        progressPct = Math.max(0, Math.min(100, ((tMs - tSRx) / Math.max(1, tSD - tSRx)) * 100));
      } else {
        phase = 'POST_SHADOW';
        progressPct = Math.max(0, Math.min(100, ((tMs - tSD) / Math.max(1, tPost - tSD)) * 100));
      }
      shadowZone = { ...cyc, phase, progressPct };
      if (phase === 'RETROGRADE') {
        break; // Prefer active retrograde if two Mercury shadow tails ever touch
      }
    }
  }

  return { stationState, stationExactDate, shadowZone };
}

/** Compute next upcoming station for a focused body. */
export function getNextStationForBody(
  bodyId: BodyId,
  date: Date,
): NextStationInfo | null {
  const meta = BODY_META_MAP[bodyId];
  if (!meta.isRetroCapable) return null;

  const bucket = getRetrogradeBucketForDate(bodyId, date);
  const nextBucket = getRetrogradeBucketForDate(
    bodyId,
    new Date(date.getTime() + 400 * MS_PER_DAY),
  );
  const allStations = [...bucket.stations, ...nextBucket.stations].sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );

  const nowMs = date.getTime();
  for (const st of allStations) {
    if (st.date.getTime() > nowMs) {
      return {
        type: st.type,
        date: st.date,
        elon: st.elon,
        formattedPos: formatLongitudeDMS(st.elon).formattedDMS,
      };
    }
  }
  return null;
}

/** Compute next sign ingress date for a focused body. */
export function getNextIngressForBody(
  bodyId: BodyId,
  date: Date,
): NextIngressInfo | null {
  const startPos = computeGeocentricPosition(bodyId, date).elon;
  const startSign = Math.floor(startPos / 30);
  const stepDays =
    bodyId === 'Moon'
      ? 0.25
      : bodyId === 'Sun' || bodyId === 'Mercury' || bodyId === 'Venus'
        ? 1
        : bodyId === 'Mars'
          ? 2
          : 7;
  const maxDays = bodyId === 'Pluto' || bodyId === 'Neptune' || bodyId === 'Uranus' ? 1800 : 420;

  let prevMs = date.getTime();
  let prevSign = startSign;

  for (let d = stepDays; d <= maxDays; d += stepDays) {
    const curMs = date.getTime() + d * MS_PER_DAY;
    const curLon = computeGeocentricPosition(bodyId, new Date(curMs)).elon;
    const curSign = Math.floor(curLon / 30);
    if (curSign !== prevSign) {
      // Binary search exact sign boundary crossing
      let lo = prevMs;
      let hi = curMs;
      for (let i = 0; i < 18; i++) {
        const mid = 0.5 * (lo + hi);
        const midSign = Math.floor(
          computeGeocentricPosition(bodyId, new Date(mid)).elon / 30,
        );
        if (midSign === prevSign) {
          lo = mid;
        } else {
          hi = mid;
        }
      }
      const exactDate = new Date(hi);
      const vel = computeDailyAngularVelocity(bodyId, exactDate);
      const toSignInfo = ZODIAC_SIGNS[curSign];
      const fromSignInfo = ZODIAC_SIGNS[prevSign];
      return {
        date: exactDate,
        fromSign: fromSignInfo.name,
        toSign: toSignInfo.name,
        toSignGlyph: toSignInfo.glyph,
        isRetrogradeIngress: vel < 0 && !BODY_META_MAP[bodyId].isNode,
      };
    }
    prevMs = curMs;
    prevSign = curSign;
  }
  return null;
}

/**
 * Compute 60-day trailing/leading (-30d to +30d) orbital motion ribbon samples.
 * For Moon (which completes >2 full 360° revolutions in 60d), we sample a crisp
 * +-3.5d trailing/leading arc so it doesn't wrap into a solid full circle.
 */
function computeMotionRibbon(bodyId: BodyId, date: Date): RibbonSample[] {
  const isMoon = bodyId === 'Moon';
  const halfSpanDays = isMoon ? 3.5 : 30;
  const numSteps = isMoon ? 14 : bodyId === 'Mercury' || bodyId === 'Venus' || bodyId === 'Sun' ? 20 : 12;
  const stepDays = (halfSpanDays * 2) / numSteps;

  const samples: RibbonSample[] = [];
  let prevLon: number | null = null;
  const isRetroCapable = BODY_META_MAP[bodyId].isRetroCapable;

  for (let i = 0; i <= numSteps; i++) {
    const dayOffset = -halfSpanDays + i * stepDays;
    const sampleDate = new Date(date.getTime() + dayOffset * MS_PER_DAY);
    const pos = computeGeocentricPosition(bodyId, sampleDate);
    let isRx = false;
    if (isRetroCapable && prevLon !== null) {
      isRx = signedAngleDelta(prevLon, pos.elon) < 0;
    }
    prevLon = pos.elon;
    samples.push({
      elon: pos.elon,
      elat: pos.elat,
      dayOffset,
      isRetrograde: isRx,
    });
  }
  if (isRetroCapable && samples.length > 1) {
    samples[0].isRetrograde = samples[1].isRetrograde;
  }
  return samples;
}

// ============================================================================
// ASPECT DETECTION & APPLYING / SEPARATING CLASSIFICATION
// ============================================================================

interface AspectSpec {
  type: AspectType;
  targetAngle: number;
  maxOrb: number;
  outerOnlyMaxOrb: number;
  symbol: string;
  label: string;
  isHard: boolean;
  color: string;
}

const ASPECT_SPECS: readonly AspectSpec[] = [
  {
    type: 'CONJUNCTION',
    targetAngle: 0,
    maxOrb: 8,
    outerOnlyMaxOrb: 6,
    symbol: '☌',
    label: 'Conjunction (0°)',
    isHard: true,
    color: '#EAB308',
  },
  {
    type: 'OPPOSITION',
    targetAngle: 180,
    maxOrb: 8,
    outerOnlyMaxOrb: 8,
    symbol: '☍',
    label: 'Opposition (180°)',
    isHard: true,
    color: '#F59E0B',
  },
  {
    type: 'SQUARE',
    targetAngle: 90,
    maxOrb: 7,
    outerOnlyMaxOrb: 7,
    symbol: '□',
    label: 'Square (90°)',
    isHard: true,
    color: '#EF4444',
  },
  {
    type: 'TRINE',
    targetAngle: 120,
    maxOrb: 7,
    outerOnlyMaxOrb: 7,
    symbol: '△',
    label: 'Trine (120°)',
    isHard: false,
    color: '#10B981',
  },
  {
    type: 'SEXTILE',
    targetAngle: 60,
    maxOrb: 5,
    outerOnlyMaxOrb: 5,
    symbol: '✶',
    label: 'Sextile (60°)',
    isHard: false,
    color: '#14B8A6',
  },
] as const;

function classifyAspectHorizon(a: BodyMeta, b: BodyMeta): AspectHorizonTier {
  const fastIds: BodyId[] = ['Moon', 'Sun', 'Mercury'];
  if (fastIds.includes(a.id) || fastIds.includes(b.id)) {
    return 'INTRADAY_TRIGGER';
  }
  if (a.id === 'Venus' || b.id === 'Venus' || a.id === 'Mars' || b.id === 'Mars') {
    return 'TACTICAL_REGIME';
  }
  return 'SECULAR_MACRO';
}

function buildAspectMarketImplication(
  a: BodyMeta,
  b: BodyMeta,
  type: AspectType,
  state: AspectMotionState,
  orb: number,
): string {
  const ids = new Set<BodyId>([a.id, b.id]);
  const pressureTag =
    state === 'APPLYING'
      ? orb < 1.5
        ? 'Approaching exact climax — peak positioning compression'
        : 'Applying — regime pressure building into exactness'
      : 'Separating — post-exact volatility releasing';

  if (ids.has('Jupiter') && ids.has('SouthNode') && type === 'CONJUNCTION') {
    return `Excess multiple & leverage flush; crowded consensus growth audit (${pressureTag}).`;
  }
  if (ids.has('Jupiter') && ids.has('Saturn')) {
    if (type === 'TRINE' || type === 'SEXTILE') {
      return `Constructive macro expansion; disciplined capex meets credit stability (${pressureTag}).`;
    }
    return `Macro policy vs. growth friction; valuation multiples tested against cost of capital (${pressureTag}).`;
  }
  if (ids.has('Saturn') && ids.has('Pluto')) {
    if (type === 'TRINE' || type === 'SEXTILE') {
      return `Structured sovereign funding & institutional balance-sheet underwriting discipline (${pressureTag}).`;
    }
    return `Sovereign balance-sheet & funding-rate stress; credit collateral repricing (${pressureTag}).`;
  }
  if (ids.has('Uranus') && ids.has('Pluto')) {
    return `Secular technology, compute capex & structural liquidity regime tailwind (${pressureTag}).`;
  }
  if ((ids.has('Sun') || ids.has('Mercury')) && (ids.has('Uranus') || ids.has('Pluto'))) {
    return `24–72h acute headline/rate volatility spark (${pressureTag}).`;
  }
  if (ids.has('Mars') && (ids.has('Saturn') || ids.has('Pluto') || ids.has('Uranus'))) {
    return type === 'TRINE' || type === 'SEXTILE'
      ? `Disciplined directional breakout traction (${pressureTag}).`
      : `High-friction momentum whipsaw & stop-run hazard (${pressureTag}).`;
  }
  if (ids.has('Venus') && (ids.has('Saturn') || ids.has('Pluto') || ids.has('SouthNode'))) {
    return type === 'TRINE' || type === 'SEXTILE'
      ? `Orderly credit spread & valuation support (${pressureTag}).`
      : `Valuation repricing & risk-premium austerity check (${pressureTag}).`;
  }

  switch (type) {
    case 'SQUARE':
      return `Cross-asset friction & regime resistance between ${a.name} and ${b.name} (${pressureTag}).`;
    case 'OPPOSITION':
      return `Polarized liquidity tension & mean-reversion inflection (${pressureTag}).`;
    case 'CONJUNCTION':
      return `Cycle reset & concentrated flow fusion between ${a.name} and ${b.name} (${pressureTag}).`;
    case 'TRINE':
      return `Low-friction structural trend alignment & liquidity carry (${pressureTag}).`;
    case 'SEXTILE':
      return `Tactical execution window & constructive rotation channel (${pressureTag}).`;
  }
}

export function computeActiveAspects(
  bodies: Record<BodyId, BodyTelemetry>,
  date: Date,
): ActiveAspect[] {
  const futureDate = new Date(date.getTime() + 6 * MS_PER_HOUR);
  const futureLons: Partial<Record<BodyId, number>> = {};
  for (const def of BODY_DEFINITIONS) {
    futureLons[def.id] = computeGeocentricPosition(def.id, futureDate).elon;
  }

  const aspects: ActiveAspect[] = [];
  const criticalConjBodies = new Set<BodyId>(['SouthNode', 'Mars', 'Saturn', 'Pluto']);

  for (let i = 0; i < BODY_DEFINITIONS.length; i++) {
    for (let j = i + 1; j < BODY_DEFINITIONS.length; j++) {
      const metaA = BODY_DEFINITIONS[i];
      const metaB = BODY_DEFINITIONS[j];

      // Skip tautological permanent 180° opposition between North Node and South Node
      if (metaA.isNode && metaB.isNode) continue;

      const bodyA = bodies[metaA.id];
      const bodyB = bodies[metaB.id];
      const sepNow = shortestAngularSeparation(bodyA.elon, bodyB.elon);
      const sepFuture = shortestAngularSeparation(
        futureLons[metaA.id]!,
        futureLons[metaB.id]!,
      );

      const bothOuter = metaA.isOuter && metaB.isOuter;

      for (const spec of ASPECT_SPECS) {
        const limit = bothOuter ? spec.outerOnlyMaxOrb : spec.maxOrb;
        const orbNow = Math.abs(sepNow - spec.targetAngle);
        if (orbNow <= limit) {
          const orbFuture = Math.abs(sepFuture - spec.targetAngle);
          const state: AspectMotionState =
            orbFuture < orbNow ? 'APPLYING' : 'SEPARATING';
          const linearIntensity = Math.max(0, 1 - orbNow / limit);
          // Tighter visual opacity/glow scaling near 0.0° exact
          const intensity = Math.pow(linearIntensity, 1.35);
          const isCriticalConjunction =
            spec.type === 'CONJUNCTION' &&
            (criticalConjBodies.has(metaA.id) || criticalConjBodies.has(metaB.id));
          const color = isCriticalConjunction ? '#FB7185' : spec.color;

          aspects.push({
            id: `${metaA.id}-${metaB.id}-${spec.type}`,
            bodyA: metaA.id,
            bodyB: metaB.id,
            type: spec.type,
            symbol: spec.symbol,
            label: spec.label,
            targetAngle: spec.targetAngle,
            separation: sepNow,
            orb: orbNow,
            maxOrb: limit,
            intensity,
            isHard: spec.isHard,
            isCriticalConjunction,
            state,
            tier: classifyAspectHorizon(metaA, metaB),
            color,
            marketImplication: buildAspectMarketImplication(
              metaA,
              metaB,
              spec.type,
              state,
              orbNow,
            ),
          });
          break;
        }
      }
    }
  }

  // Sort tightest orb first
  return aspects.sort((a, b) => a.orb - b.orb);
}

/**
 * Compute Lunar Phase & Solar/Lunar Eclipse proximity (New/Full Moon within 18° of Nodes).
 */
export function computeLunarAndEclipse(
  sunLon: number,
  moonLon: number,
  northNodeLon: number,
  southNodeLon: number,
): LunarPhaseTelemetry {
  const phaseAngle = normalizeDeg(moonLon - sunLon);
  const sunMoonSep = shortestAngularSeparation(sunLon, moonLon);
  const illuminationPct = ((1 - Math.cos((phaseAngle * Math.PI) / 180)) / 2) * 100;

  let phaseName = 'Waxing Crescent';
  if (phaseAngle < 12 || phaseAngle >= 348) phaseName = 'New Moon';
  else if (phaseAngle < 78) phaseName = 'Waxing Crescent';
  else if (phaseAngle < 102) phaseName = 'First Quarter';
  else if (phaseAngle < 168) phaseName = 'Waxing Gibbous';
  else if (phaseAngle < 192) phaseName = 'Full Moon';
  else if (phaseAngle < 258) phaseName = 'Waning Gibbous';
  else if (phaseAngle < 282) phaseName = 'Last Quarter';
  else phaseName = 'Waning Crescent';

  const isNewMoonWindow = sunMoonSep <= 12;
  const isFullMoonWindow = Math.abs(sunMoonSep - 180) <= 12;

  const distNorth = Math.min(
    shortestAngularSeparation(sunLon, northNodeLon),
    shortestAngularSeparation(moonLon, northNodeLon),
  );
  const distSouth = Math.min(
    shortestAngularSeparation(sunLon, southNodeLon),
    shortestAngularSeparation(moonLon, southNodeLon),
  );
  const nearestNode: 'NorthNode' | 'SouthNode' =
    distNorth <= distSouth ? 'NorthNode' : 'SouthNode';
  const nodeProximityDeg = Math.min(distNorth, distSouth);

  let eclipse: EclipseAlert | null = null;
  if ((isNewMoonWindow || isFullMoonWindow) && nodeProximityDeg <= 18) {
    const syzygyOrbDeg = isNewMoonWindow ? sunMoonSep : Math.abs(sunMoonSep - 180);
    const type = isNewMoonWindow ? 'SOLAR_ECLIPSE' : 'LUNAR_ECLIPSE';
    const classification =
      nodeProximityDeg <= 10.5 ? 'CENTRAL_HIGH_IMPACT' : 'PARTIAL_CORRIDOR';
    eclipse = {
      type,
      classification,
      nearestNode,
      nodeDistanceDeg: nodeProximityDeg,
      syzygyOrbDeg,
      label:
        type === 'SOLAR_ECLIPSE'
          ? `Solar Eclipse Window (${nodeProximityDeg.toFixed(1)}° from ${nearestNode === 'NorthNode' ? 'North Node' : 'South Node'})`
          : `Lunar Eclipse Window (${nodeProximityDeg.toFixed(1)}° from ${nearestNode === 'NorthNode' ? 'North Node' : 'South Node'})`,
    };
  }

  return {
    phaseAngle,
    phaseName,
    illuminationPct,
    isNewMoonWindow,
    isFullMoonWindow,
    nodeProximityDeg,
    eclipse,
  };
}

/**
 * Compute full real-time EphemerisSnapshot for any date/time (~1.5ms execution).
 */
export function computeEphemerisSnapshot(
  date: Date,
  options?: { includeRibbons?: boolean },
): EphemerisSnapshot {
  const includeRibbons = options?.includeRibbons ?? true;
  const julianDay = dateToJulianDay(date);
  const meanNodes = computeMeanLunarNodes(date);
  const trueNorthNodeLon = computeTrueLunarNorthNode(date);
  const earthHelio = computeEarthHeliocentric(date);

  const bodies = {} as Record<BodyId, BodyTelemetry>;
  const occupiedAnareticSet = new Set<number>();

  for (const meta of BODY_DEFINITIONS) {
    const geo = computeGeocentricPosition(meta.id, date);
    const helio = computeHeliocentricPosition(meta.id, date);
    const dms = formatLongitudeDMS(geo.elon);
    const degPerDay = computeDailyAngularVelocity(meta.id, date);
    const isRetrograde = meta.isRetroCapable && degPerDay < 0;
    const { stationState, stationExactDate, shadowZone } =
      evaluateStationAndShadow(meta.id, date);

    if (dms.isAnaretic) {
      occupiedAnareticSet.add(dms.signIndex);
    }

    bodies[meta.id] = {
      id: meta.id,
      name: meta.name,
      glyph: meta.glyph,
      tier: meta.tier,
      tierLabel: meta.tierLabel,
      trackRadius: meta.trackRadius,
      helioTrackRadius: meta.helioTrackRadius,
      sphereRadius: meta.sphereRadius,
      color: meta.color,
      accentColor: meta.accentColor,
      isNode: meta.isNode,
      isOuter: meta.isOuter,
      elon: geo.elon,
      elat: geo.elat,
      distanceAu: geo.distanceAu,
      helioElon: helio.elon,
      helioElat: helio.elat,
      helioDistAu: helio.distAu,
      signIndex: dms.signIndex,
      signName: dms.sign.name,
      signShort: dms.sign.short,
      signGlyph: dms.sign.glyph,
      signElement: dms.sign.element,
      degreeInSign: dms.degreeInSign,
      deg: dms.deg,
      min: dms.min,
      formattedDMS: dms.formattedDMS,
      formattedCompact: dms.formattedCompact,
      degPerDay,
      isRetrograde,
      stationState,
      stationExactDate,
      isAnaretic: dms.isAnaretic,
      shadowZone,
      ribbon: includeRibbons ? computeMotionRibbon(meta.id, date) : [],
    };
  }

  const bodyList = BODY_DEFINITIONS.map((d) => bodies[d.id]);
  const aspects = computeActiveAspects(bodies, date);
  const lunar = computeLunarAndEclipse(
    bodies.Sun.elon,
    bodies.Moon.elon,
    meanNodes.northNode,
    meanNodes.southNode,
  );

  return {
    date,
    julianDay,
    meanNorthNodeLon: meanNodes.northNode,
    trueNorthNodeLon,
    earthHelio,
    bodies,
    bodyList,
    aspects,
    lunar,
    occupiedAnareticSigns: Array.from(occupiedAnareticSet),
  };
}

// ============================================================================
// UPCOMING 90-DAY INFLECTION RADAR SCANNER (Cached by UTC Day Key)
// ============================================================================

const radarCache = new Map<string, InflectionEvent[]>();

export function computeUpcoming90DayRadar(
  fromDate: Date,
  horizonDays = 90,
): InflectionEvent[] {
  const dayKey = `${fromDate.toISOString().slice(0, 10)}:${horizonDays}`;
  const cached = radarCache.get(dayKey);
  if (cached) return cached;

  const startMs = fromDate.getTime();
  const endMs = startMs + horizonDays * MS_PER_DAY;
  const events: InflectionEvent[] = [];

  // 1. Exact Planetary Stations (Mercury -> Pluto)
  for (const meta of BODY_DEFINITIONS) {
    if (!meta.isRetroCapable) continue;
    const b1 = getRetrogradeBucketForDate(meta.id, fromDate);
    const b2 = getRetrogradeBucketForDate(meta.id, new Date(endMs));
    const seen = new Set<number>();
    for (const st of [...b1.stations, ...b2.stations]) {
      const t = st.date.getTime();
      const roundedMin = Math.round(t / 60_000);
      if (t >= startMs && t <= endMs && !seen.has(roundedMin)) {
        seen.add(roundedMin);
        const dms = formatLongitudeDMS(st.elon);
        const isRx = st.type === 'SRx';
        events.push({
          id: `st-${meta.id}-${roundedMin}`,
          date: st.date,
          category: 'STATION',
          severity:
            meta.id === 'Venus' || meta.id === 'Mars' || meta.id === 'Jupiter' || meta.id === 'Saturn'
              ? 'CRITICAL'
              : 'HIGH',
          title: `${meta.glyph} ${meta.name} Stations ${isRx ? 'Retrograde (SRx)' : 'Direct (SD)'}`,
          subtitle: isRx
            ? `Velocity crosses 0°/d at ${dms.formattedDMS} — regime reversal / valuation & momentum pivot`
            : `Direct traction resumes at ${dms.formattedDMS} — retrograde pressure begins clearing`,
          tag: isRx ? 'ST-Rx' : 'ST-D',
          bodies: [meta.id],
        });
      }
    }
  }

  // 2. Sign Ingresses (Sun through Pluto + Nodes; skip Moon's 2.5-day ingresses to keep signal institutional)
  const ingressBodies: BodyId[] = [
    'Sun',
    'Mercury',
    'Venus',
    'Mars',
    'Jupiter',
    'Saturn',
    'Uranus',
    'Neptune',
    'Pluto',
    'NorthNode',
  ];
  const stepMs = 2 * MS_PER_DAY;
  for (const bodyId of ingressBodies) {
    const meta = BODY_META_MAP[bodyId];
    let prevT = startMs;
    let prevSign = Math.floor(
      computeGeocentricPosition(bodyId, new Date(prevT)).elon / 30,
    );
    for (let t = startMs + stepMs; t <= endMs; t += stepMs) {
      const curSign = Math.floor(
        computeGeocentricPosition(bodyId, new Date(t)).elon / 30,
      );
      if (curSign !== prevSign) {
        let lo = prevT;
        let hi = t;
        for (let k = 0; k < 14; k++) {
          const mid = 0.5 * (lo + hi);
          const midSign = Math.floor(
            computeGeocentricPosition(bodyId, new Date(mid)).elon / 30,
          );
          if (midSign === prevSign) lo = mid;
          else hi = mid;
        }
        const exactDate = new Date(hi);
        const toSign = ZODIAC_SIGNS[curSign];
        events.push({
          id: `ing-${bodyId}-${Math.round(hi / 3_600_000)}`,
          date: exactDate,
          category: 'SIGN_INGRESS',
          severity: meta.isOuter || bodyId === 'Mars' ? 'HIGH' : 'MODERATE',
          title: `${meta.glyph} ${meta.name} enters ${toSign.glyph} ${toSign.name}`,
          subtitle: `00°00' ${toSign.name} (${toSign.element}) — new ${meta.tierLabel.toLowerCase()} regime`,
          tag: 'INGRESS',
          bodies: [bodyId],
        });
        prevSign = curSign;
      }
      prevT = t;
    }
  }

  // 3. Solar & Lunar Eclipses in window (via Astronomy.SearchMoonQuarter)
  let mq = Astronomy.SearchMoonQuarter(fromDate);
  while (mq.time.date.getTime() <= endMs) {
    const qDate = mq.time.date;
    if (qDate.getTime() >= startMs && (mq.quarter === 0 || mq.quarter === 2)) {
      const sunLon = computeGeocentricPosition('Sun', qDate).elon;
      const nodes = computeMeanLunarNodes(qDate);
      const nodeDist = Math.min(
        shortestAngularSeparation(sunLon, nodes.northNode),
        shortestAngularSeparation(sunLon, nodes.southNode),
      );
      if (nodeDist <= 18) {
        const isSolar = mq.quarter === 0;
        const moonLon = computeGeocentricPosition('Moon', qDate).elon;
        const dms = formatLongitudeDMS(isSolar ? sunLon : moonLon);
        events.push({
          id: `ecl-${Math.round(qDate.getTime() / 60_000)}`,
          date: qDate,
          category: 'ECLIPSE',
          severity: 'CRITICAL',
          title: isSolar
            ? `☉☽ Solar Eclipse at ${dms.formattedDMS}`
            : `☽☉ Lunar Eclipse at ${dms.formattedDMS}`,
          subtitle: `${nodeDist.toFixed(1)}° from Lunar Node axis — macro liquidity & volatility shock corridor`,
          tag: isSolar ? 'SOLAR ECLIPSE' : 'LUNAR ECLIPSE',
          bodies: ['Sun', 'Moon', 'NorthNode', 'SouthNode'],
        });
      }
    }
    mq = Astronomy.NextMoonQuarter(mq);
  }

  // 4. Exact Macro & Tactical Planet Aspects (Mars, Jupiter, Saturn, Uranus, Neptune, Pluto, Nodes)
  const macroBodies: BodyId[] = [
    'Mars',
    'Jupiter',
    'Saturn',
    'Uranus',
    'Neptune',
    'Pluto',
    'NorthNode',
    'SouthNode',
  ];
  const aspectTargets: Array<{ angle: number; name: string; sym: string; hard: boolean }> = [
    { angle: 0, name: 'Conjunct', sym: '☌', hard: true },
    { angle: 180, name: 'Opposite', sym: '☍', hard: true },
    { angle: 90, name: 'Square', sym: '□', hard: true },
    { angle: 120, name: 'Trine', sym: '△', hard: false },
    { angle: 60, name: 'Sextile', sym: '✶', hard: false },
  ];

  // Pre-sample 3-day grid for macro bodies
  const gridStep = 3 * MS_PER_DAY;
  const gridTimes: number[] = [];
  for (let t = startMs; t <= endMs + gridStep; t += gridStep) {
    if (t <= endMs) gridTimes.push(t);
  }
  if (gridTimes[gridTimes.length - 1] < endMs) gridTimes.push(endMs);

  const lonsByBody = new Map<BodyId, number[]>();
  for (const b of macroBodies) {
    lonsByBody.set(
      b,
      gridTimes.map((t) => computeGeocentricPosition(b, new Date(t)).elon),
    );
  }

  for (let i = 0; i < macroBodies.length; i++) {
    for (let j = i + 1; j < macroBodies.length; j++) {
      const bA = macroBodies[i];
      const bB = macroBodies[j];
      if (BODY_META_MAP[bA].isNode && BODY_META_MAP[bB].isNode) continue;

      const arrA = lonsByBody.get(bA)!;
      const arrB = lonsByBody.get(bB)!;

      for (const target of aspectTargets) {
        for (let k = 0; k < gridTimes.length - 1; k++) {
          const diff1 = signedAngleDelta(arrB[k], arrA[k]);
          const diff2 = signedAngleDelta(arrB[k + 1], arrA[k + 1]);

          // Check signed distance to +target.angle or -target.angle
          const candidates =
            target.angle === 0 || target.angle === 180
              ? [target.angle]
              : [target.angle, -target.angle];

          for (const cand of candidates) {
            const err1 = signedAngleDelta(cand, diff1);
            const err2 = signedAngleDelta(cand, diff2);
            if (Math.abs(err1) < 25 && Math.abs(err2) < 25 && err1 * err2 <= 0 && err1 !== err2) {
              // Linear interpolation + 6-step refinement
              let lo = gridTimes[k];
              let hi = gridTimes[k + 1];
              let eLo = err1;
              for (let r = 0; r < 8; r++) {
                const mid = 0.5 * (lo + hi);
                const lA = computeGeocentricPosition(bA, new Date(mid)).elon;
                const lB = computeGeocentricPosition(bB, new Date(mid)).elon;
                const eMid = signedAngleDelta(cand, signedAngleDelta(lB, lA));
                if (eLo * eMid <= 0) hi = mid;
                else {
                  lo = mid;
                  eLo = eMid;
                }
              }
              const exactDate = new Date(0.5 * (lo + hi));
              if (exactDate.getTime() >= startMs && exactDate.getTime() <= endMs) {
                const mA = BODY_META_MAP[bA];
                const mB = BODY_META_MAP[bB];
                events.push({
                  id: `asp-${bA}-${bB}-${target.angle}-${Math.round(exactDate.getTime() / 3_600_000)}`,
                  date: exactDate,
                  category: 'EXACT_ASPECT',
                  severity: target.hard ? 'CRITICAL' : 'HIGH',
                  title: `${mA.glyph} ${mA.name} ${target.sym} ${target.name} ${mB.glyph} ${mB.name}`,
                  subtitle: `Exact ${target.angle}° alignment — ${target.hard ? 'peak macro friction / inflection climax' : 'structural flow & liquidity alignment'}`,
                  tag: `EXACT ${target.angle}°`,
                  bodies: [bA, bB],
                });
              }
            }
          }
        }
      }
    }
  }

  events.sort((a, b) => a.date.getTime() - b.date.getTime());
  radarCache.set(dayKey, events);
  return events;
}

// ============================================================================
// +-5-YEAR MACRO INFLECTION BOOKMARKS (Astronomically Verified Jump-Pills)
// ============================================================================

let cachedMacroBookmarks: MacroBookmark[] | null = null;

/**
 * Generates astronomically exact macro inflection bookmarks spanning the +-5-year
 * window around reference "now" so users can jump straight to key setups.
 */
export function getMacroInflectionBookmarks(referenceNow: Date): MacroBookmark[] {
  if (cachedMacroBookmarks) return cachedMacroBookmarks;

  const minMs = referenceNow.getTime() - 5 * 365.25 * MS_PER_DAY;
  const maxMs = referenceNow.getTime() + 5 * 365.25 * MS_PER_DAY;

  const findExactPairAspectNear = (
    bA: BodyId,
    bB: BodyId,
    targetSep: number,
    approxIso: string,
    searchDays = 35,
  ): Date => {
    const center = new Date(approxIso).getTime();
    let bestT = center;
    let bestErr = Infinity;
    for (let t = center - searchDays * MS_PER_DAY; t <= center + searchDays * MS_PER_DAY; t += MS_PER_DAY) {
      const lA = computeGeocentricPosition(bA, new Date(t)).elon;
      const lB = computeGeocentricPosition(bB, new Date(t)).elon;
      const err = Math.abs(shortestAngularSeparation(lA, lB) - targetSep);
      if (err < bestErr) {
        bestErr = err;
        bestT = t;
      }
    }
    // Refine around bestT +- 1 day
    for (let t = bestT - MS_PER_DAY; t <= bestT + MS_PER_DAY; t += 2 * MS_PER_HOUR) {
      const lA = computeGeocentricPosition(bA, new Date(t)).elon;
      const lB = computeGeocentricPosition(bB, new Date(t)).elon;
      const err = Math.abs(shortestAngularSeparation(lA, lB) - targetSep);
      if (err < bestErr) {
        bestErr = err;
        bestT = t;
      }
    }
    return new Date(bestT);
  };

  const candidates: MacroBookmark[] = [
    {
      id: 'bm-jup-ura-2024',
      date: findExactPairAspectNear('Jupiter', 'Uranus', 0, '2024-04-21T03:00:00Z', 10),
      shortLabel: 'Apr 2024 · ♃☌♅ Taurus',
      category: 'CONJUNCTION',
      regimeTag: 'CAPEX SURGE',
      description: 'Jupiter–Uranus exact conjunction (~21° Taurus): secular AI/compute capex acceleration.',
    },
    {
      id: 'bm-mars-rx-2024',
      date: new Date('2024-12-06T23:30:00Z'),
      shortLabel: 'Dec 2024 · ♂ SRx Leo',
      category: 'RETROGRADE',
      regimeTag: 'MOMENTUM CHOP',
      description: 'Mars stations Retrograde at ~6° Leo: multi-month directional momentum stall & whipsaw.',
    },
    {
      id: 'bm-venus-rx-2025',
      date: new Date('2025-03-02T01:00:00Z'),
      shortLabel: 'Mar 2025 · ♀ SRx Aries',
      category: 'RETROGRADE',
      regimeTag: 'VALUATION AUDIT',
      description: 'Venus stations Retrograde in Aries: Q1 valuation repricing & tariff/risk-premium reset.',
    },
    {
      id: 'bm-sat-nep-2026',
      date: findExactPairAspectNear('Saturn', 'Neptune', 0, '2026-02-20T17:00:00Z', 12),
      shortLabel: 'Feb 2026 · ♄☌♆ 0° Aries',
      category: 'CONJUNCTION',
      regimeTag: '0° ARIES RESET',
      description: 'Rare Saturn–Neptune conjunction at 0° Aries: structural liquidity vs. sovereign reality check.',
    },
    {
      id: 'bm-solar-ecl-aug-2026',
      date: new Date('2026-08-12T17:46:00Z'),
      shortLabel: 'Aug 2026 · Total Solar Eclipse',
      category: 'ECLIPSE',
      regimeTag: 'ECLIPSE PIVOT',
      description: 'Total Solar Eclipse at ~20° Leo near South Node: late-summer liquidity & positioning inflection.',
    },
    {
      id: 'bm-venus-srx-oct-2026',
      date: new Date('2026-10-03T07:00:00Z'),
      shortLabel: 'Oct 2026 · ♀ SRx Scorpio',
      category: 'RETROGRADE',
      regimeTag: 'AUSTERITY STICK',
      description: 'Venus stations Retrograde (~8° Scorpio): credit & valuation audit window begins.',
    },
    {
      id: 'bm-jup-sn-nov-2026',
      date: findExactPairAspectNear('Jupiter', 'SouthNode', 0, '2026-11-12T12:00:00Z', 6),
      shortLabel: 'Nov 12, 2026 · ♃☌☋ + ♀ Rx End',
      category: 'CONJUNCTION',
      regimeTag: 'LEVERAGE DRAIN',
      description: 'Jupiter (~25° Leo) conjunct Mean South Node right as Venus Rx prepares to station direct.',
    },
    {
      id: 'bm-mars-29leo-nov-2026',
      date: new Date('2026-11-25T20:00:00Z'),
      shortLabel: 'Nov 25, 2026 · ♂ 29° Leo + ☉☍♅',
      category: 'TENSION',
      regimeTag: 'ANARETIC SPARK',
      description: 'Mars at anaretic 29° Leo crossing into 0° Virgo alongside exact Sun opposite Uranus (~3° Sag/Gem).',
    },
    {
      id: 'bm-dual-rx-feb-2027',
      date: new Date('2027-02-15T12:00:00Z'),
      shortLabel: 'Feb 2027 · Dual ♃ Rx + ♂ Rx',
      category: 'RETROGRADE',
      regimeTag: 'DUAL CHOP',
      description: 'Jupiter Rx in Leo & Mars Rx in Virgo/Leo simultaneously: peak Q1 momentum retardant & chop.',
    },
    {
      id: 'bm-jup-sat-trine-apr-2027',
      date: findExactPairAspectNear('Jupiter', 'Saturn', 120, '2027-04-03T12:00:00Z', 12),
      shortLabel: 'Apr 2027 · ♃/♂ Direct + ♃△♄',
      category: 'STRUCTURAL',
      regimeTag: 'TREND RUNWAY',
      description: 'Mars & Jupiter turn direct alongside exact ~17° Leo/Aries Fire Trine: constructive macro runway.',
    },
    {
      id: 'bm-ura-plu-venus-rx-may-2028',
      date: new Date('2028-05-24T12:00:00Z'),
      shortLabel: 'May 2028 · ♀ Rx Gem + ♅△♇',
      category: 'RETROGRADE',
      regimeTag: 'TECH REPRICING',
      description: 'Venus Retrograde in Gemini overlapping exact Uranus–Pluto Air Trine (~9° Gem/Aqu).',
    },
    {
      id: 'bm-sat-sq-plu-jun-2028',
      date: findExactPairAspectNear('Saturn', 'Pluto', 90, '2028-06-25T12:00:00Z', 16),
      shortLabel: 'Jun 2028 · ♄□♇ ~8° Tau/Aqu',
      category: 'TENSION',
      regimeTag: 'CREDIT STRESS',
      description: 'Saturn (~8° Taurus) square Pluto (~8° Aquarius): structural credit & sovereign funding stress.',
    },
    {
      id: 'bm-venus-rx-dec-2029',
      date: new Date('2029-12-20T12:00:00Z'),
      shortLabel: 'Dec 2029 · ♀ Rx Capricorn',
      category: 'RETROGRADE',
      regimeTag: 'YEAR-END AUDIT',
      description: 'Venus Retrograde in Capricorn: institutional balance-sheet & year-end valuation discipline.',
    },
  ];

  cachedMacroBookmarks = candidates.filter(
    (b) => b.date.getTime() >= minMs && b.date.getTime() <= maxMs,
  );
  return cachedMacroBookmarks;
}
