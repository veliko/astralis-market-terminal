import type { ActiveAspect, BodyId, BodyTelemetry, EphemerisSnapshot } from './ephemeris';

export type RegimeTone = 'BULLISH_RUNWAY' | 'AUDIT_CAUTION' | 'CHOP_FRICTION' | 'HIGH_INFLECTION';

export interface HorizonBullet {
  tag: string;
  tone: 'POSITIVE' | 'WARNING' | 'CRITICAL' | 'NEUTRAL';
  headline: string;
  detail: string;
}

export interface HorizonCardData {
  id: 'SECULAR' | 'TACTICAL' | 'SHORT_TERM';
  title: string;
  timeframeBadge: string;
  bodiesLabel: string;
  statusHeadline: string;
  statusTone: RegimeTone;
  bullets: HorizonBullet[];
}

export interface MarketRegimeBriefing {
  postureLabel: string;
  postureCode: string;
  postureTone: RegimeTone;
  tensionIndex: number; // 0 - 100 institutional stress/inflection index
  executiveSummary: string;
  activeRxBodies: BodyTelemetry[];
  stationingBodies: BodyTelemetry[];
  anareticBodies: BodyTelemetry[];
  tightestApplyingHard: ActiveAspect | null;
  horizons: [HorizonCardData, HorizonCardData, HorizonCardData];
}

function fmtShortDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function translateSnapshotToMarketRegime(
  snap: EphemerisSnapshot,
): MarketRegimeBriefing {
  const { bodies, bodyList, aspects, lunar } = snap;

  const activeRxBodies = bodyList.filter((b) => b.isRetrograde);
  const stationingBodies = bodyList.filter((b) => b.stationState !== 'NONE');
  const anareticBodies = bodyList.filter((b) => b.isAnaretic && b.id !== 'Moon');

  const applyingHardAspects = aspects
    .filter((a) => a.isHard && a.state === 'APPLYING')
    .sort((a, b) => a.orb - b.orb);

  const tightestApplyingHard = applyingHardAspects[0] ?? null;

  // Compute deterministic Tension / Inflection Index (0 - 100)
  let tension = 22;
  if (bodies.Venus.isRetrograde) tension += 18;
  if (bodies.Mars.isRetrograde) tension += 18;
  if (bodies.Jupiter.isRetrograde) tension += 10;
  if (bodies.Mercury.isRetrograde) tension += 8;
  tension += stationingBodies.length * 14;
  if (lunar.eclipse) tension += 18;
  if (anareticBodies.length > 0) tension += 7;

  for (const asp of aspects) {
    if (asp.isHard && asp.orb <= 3.0) {
      const weight = asp.tier === 'SECULAR_MACRO' ? 11 : asp.tier === 'TACTICAL_REGIME' ? 7 : 4;
      tension += weight * (asp.state === 'APPLYING' ? 1.2 : 0.75);
    } else if (!asp.isHard && asp.orb <= 3.0 && asp.tier !== 'INTRADAY_TRIGGER') {
      tension -= 5;
    }
  }
  const tensionIndex = Math.round(Math.max(8, Math.min(98, tension)));

  // Determine Executive Posture Label
  let postureLabel = 'Constructive Trend Runway';
  let postureCode = 'REGIME // CLEAR-RUNWAY';
  let postureTone: RegimeTone = 'BULLISH_RUNWAY';

  const hasMacroSouthNodeDrain = aspects.some(
    (a) =>
      a.type === 'CONJUNCTION' &&
      a.orb <= 4.5 &&
      (a.bodyA === 'SouthNode' || a.bodyB === 'SouthNode') &&
      (a.bodyA === 'Jupiter' || a.bodyB === 'Jupiter' || a.bodyA === 'Saturn' || a.bodyB === 'Saturn' || a.bodyA === 'Mars' || a.bodyB === 'Mars'),
  );

  if (stationingBodies.length > 0 || lunar.eclipse) {
    postureLabel = 'High-Tension Inflection Pivot';
    postureCode = 'REGIME // INFLECTION-ALERT';
    postureTone = 'HIGH_INFLECTION';
  } else if (bodies.Venus.isRetrograde || (bodies.Jupiter.isRetrograde && hasMacroSouthNodeDrain) || hasMacroSouthNodeDrain) {
    postureLabel = 'Valuation Audit & Liquidity Drain';
    postureCode = 'REGIME // VALUATION-AUDIT';
    postureTone = 'AUDIT_CAUTION';
  } else if (bodies.Mars.isRetrograde || (bodies.Jupiter.isRetrograde && activeRxBodies.length >= 3)) {
    postureLabel = 'Momentum Chop & Whipsaw Regime';
    postureCode = 'REGIME // MOMENTUM-CHOP';
    postureTone = 'CHOP_FRICTION';
  } else if (tensionIndex >= 62) {
    postureLabel = 'Cross-Asset Volatility Compression';
    postureCode = 'REGIME // VOL-COMPRESSION';
    postureTone = 'HIGH_INFLECTION';
  } else if (!bodies.Jupiter.isRetrograde && !bodies.Mars.isRetrograde && !bodies.Venus.isRetrograde) {
    postureLabel = 'Clear Trend Runway & Momentum Accelerant';
    postureCode = 'REGIME // TREND-ACCELERANT';
    postureTone = 'BULLISH_RUNWAY';
  } else {
    postureLabel = 'Selective Rotational Digestion';
    postureCode = 'REGIME // ROTATIONAL-DIGEST';
    postureTone = 'AUDIT_CAUTION';
  }

  // Build concise Executive Summary
  const summaryParts: string[] = [];
  if (stationingBodies.length > 0) {
    const stText = stationingBodies
      .map((b) => `${b.name} (${b.stationState} at ${b.formattedCompact})`)
      .join(', ');
    summaryParts.push(`Active planetary station alert on ${stText} signals an imminent velocity & positioning reversal.`);
  }
  if (bodies.Jupiter.isRetrograde && bodies.Mars.isRetrograde) {
    summaryParts.push(
      `Simultaneous Jupiter Rx (${bodies.Jupiter.formattedCompact}) and Mars Rx (${bodies.Mars.formattedCompact}) act as a dual macro retardant — fade breakout chases and respect range boundaries.`,
    );
  } else if (!bodies.Jupiter.isRetrograde && !bodies.Mars.isRetrograde) {
    summaryParts.push(
      `Direct Jupiter (${bodies.Jupiter.formattedCompact}) paired with Direct Mars (${bodies.Mars.formattedCompact}) provides constructive directional traction and liquidity follow-through.`,
    );
  } else if (bodies.Jupiter.isRetrograde) {
    summaryParts.push(
      `Jupiter Rx (${bodies.Jupiter.formattedCompact}) moderates multiple expansion into a disciplined valuation audit while tactical flows rotate.`,
    );
  }
  if (bodies.Venus.isRetrograde) {
    summaryParts.push(
      `Venus Rx (${bodies.Venus.formattedCompact}) enforces the macro austerity stick — stretched risk premiums and consensus multiples face repricing.`,
    );
  }
  if (tightestApplyingHard) {
    const mA = bodies[tightestApplyingHard.bodyA];
    const mB = bodies[tightestApplyingHard.bodyB];
    summaryParts.push(
      `Tightest applying hard vector: ${mA.name} ${tightestApplyingHard.symbol} ${mB.name} (${tightestApplyingHard.orb.toFixed(2)}° orb, building toward exact).`,
    );
  }

  const executiveSummary = summaryParts.join(' ');

  // =========================================================================
  // HORIZON 1: SECULAR & MACRO TIDES (Jupiter-Pluto + Nodes)
  // =========================================================================
  const secularBullets: HorizonBullet[] = [];

  // Jupiter Accelerant vs Retardant
  secularBullets.push({
    tag: bodies.Jupiter.isRetrograde ? 'JUPITER Rx // RETARDANT' : 'JUPITER DIRECT // ACCELERANT',
    tone: bodies.Jupiter.isRetrograde ? 'WARNING' : 'POSITIVE',
    headline: bodies.Jupiter.isRetrograde
      ? `Jupiter Retrograde at ${bodies.Jupiter.formattedDMS} (${bodies.Jupiter.degPerDay.toFixed(3)}°/d)`
      : `Jupiter Direct at ${bodies.Jupiter.formattedDMS} (+${bodies.Jupiter.degPerDay.toFixed(3)}°/d)`,
    detail: bodies.Jupiter.isRetrograde
      ? `Acts as a macro momentum retardant & valuation audit. Multiple expansion pauses; earnings quality and balance-sheet cash flow are scrutinized${bodies.Jupiter.shadowZone ? ` through SD on ${fmtShortDate(bodies.Jupiter.shadowZone.sdDate)}` : ''}.`
      : `Operates as a pro-cyclical liquidity & risk-appetite accelerant in ${bodies.Jupiter.signName} (${bodies.Jupiter.signElement}), supporting institutional trend extension.`,
  });

  // Saturn Structural Floor / Credit Tightening + Saturn-Pluto / Jupiter-Saturn
  const satPlu = aspects.find(
    (a) =>
      (a.bodyA === 'Saturn' && a.bodyB === 'Pluto') ||
      (a.bodyA === 'Pluto' && a.bodyB === 'Saturn'),
  );
  const jupSat = aspects.find(
    (a) =>
      (a.bodyA === 'Jupiter' && a.bodyB === 'Saturn') ||
      (a.bodyA === 'Saturn' && a.bodyB === 'Jupiter'),
  );

  if (satPlu && satPlu.isHard) {
    secularBullets.push({
      tag: `SATURN ${satPlu.symbol} PLUTO // CREDIT STRESS`,
      tone: 'CRITICAL',
      headline: `Saturn (${bodies.Saturn.formattedCompact}) ${satPlu.label} Pluto (${bodies.Pluto.formattedCompact}) — ${satPlu.orb.toFixed(2)}° ${satPlu.state}`,
      detail:
        'High-priority sovereign funding, term-premium, and credit collateral stress regime. Refinancing walls and balance-sheet leverage face strict institutional repricing.',
    });
  } else if (jupSat) {
    secularBullets.push({
      tag: `JUPITER ${jupSat.symbol} SATURN // MACRO ARCHITECTURE`,
      tone: jupSat.isHard ? 'WARNING' : 'POSITIVE',
      headline: `Jupiter ${jupSat.symbol} Saturn (${jupSat.orb.toFixed(2)}° orb, ${jupSat.state})`,
      detail: jupSat.isHard
        ? 'Growth expectations collide with cost-of-capital discipline; favor high-ROIC balance sheets.'
        : 'Constructive institutional alignment — liquidity expansion supported by structural capex and orderly credit.',
    });
  } else {
    secularBullets.push({
      tag: bodies.Saturn.isRetrograde ? 'SATURN Rx // FLOOR TEST' : 'SATURN DIRECT // STRUCTURAL',
      tone: 'NEUTRAL',
      headline: `Saturn ${bodies.Saturn.isRetrograde ? 'Rx' : 'Direct'} at ${bodies.Saturn.formattedDMS}`,
      detail: bodies.Saturn.isRetrograde
        ? 'Structural support levels and credit underwriting standards undergo re-verification.'
        : 'Establishes disciplined cost-of-capital floor and orderly institutional duration pricing.',
    });
  }

  // Uranus-Pluto Secular Tide + Nodal Conjunctions
  const uraPlu = aspects.find(
    (a) =>
      (a.bodyA === 'Uranus' && a.bodyB === 'Pluto') ||
      (a.bodyA === 'Pluto' && a.bodyB === 'Uranus'),
  );
  if (uraPlu) {
    secularBullets.push({
      tag: `URANUS ${uraPlu.symbol} PLUTO // SECULAR TIDE`,
      tone: uraPlu.isHard ? 'WARNING' : 'POSITIVE',
      headline: `Uranus (${bodies.Uranus.formattedCompact}) ${uraPlu.symbol} Pluto (${bodies.Pluto.formattedCompact}) — ${uraPlu.orb.toFixed(2)}°`,
      detail:
        'Multi-year secular productivity, AI/compute infrastructure, and sovereign grid modernization tailwind anchoring long-horizon capital formation.',
    });
  }

  const southNodeHits = aspects.filter(
    (a) =>
      a.type === 'CONJUNCTION' &&
      (a.bodyA === 'SouthNode' || a.bodyB === 'SouthNode'),
  );
  if (southNodeHits.length > 0) {
    const hit = southNodeHits[0];
    const otherId: BodyId = hit.bodyA === 'SouthNode' ? hit.bodyB : hit.bodyA;
    const other = bodies[otherId];
    secularBullets.push({
      tag: `${other.name.toUpperCase()} ☌ SOUTH NODE // DRAIN`,
      tone: 'CRITICAL',
      headline: `${other.name} Conjunct Mean South Node (${bodies.SouthNode.formattedCompact}) — ${hit.orb.toFixed(2)}° ${hit.state}`,
      detail:
        'Nodal excess/leverage drain active: crowded positioning and stretched consensus valuations experience liquidity extraction before sustainable basing.',
    });
  } else {
    secularBullets.push({
      tag: 'NODAL AXIS // FLOW VECTOR',
      tone: 'NEUTRAL',
      headline: `North Node ${bodies.NorthNode.formattedCompact} / South Node ${bodies.SouthNode.formattedCompact}`,
      detail:
        'Capital inflows gravitate toward North Node structural themes while South Node sectors undergo gradual deleveraging.',
    });
  }

  // =========================================================================
  // HORIZON 2: TACTICAL MOMENTUM & VALUATION (Mars & Venus)
  // =========================================================================
  const tacticalBullets: HorizonBullet[] = [];

  // Mars Direct vs Mars Rx
  const marsShadow = bodies.Mars.shadowZone;
  tacticalBullets.push({
    tag:
      bodies.Mars.stationState !== 'NONE'
        ? `MARS ${bodies.Mars.stationState} // INFLECTION`
        : bodies.Mars.isRetrograde
          ? 'MARS Rx // WHIPSAW CHOP'
          : 'MARS DIRECT // TREND TRACTION',
    tone:
      bodies.Mars.stationState !== 'NONE'
        ? 'CRITICAL'
        : bodies.Mars.isRetrograde
          ? 'WARNING'
          : 'POSITIVE',
    headline: `Mars ${bodies.Mars.isRetrograde ? 'Retrograde' : 'Direct'} at ${bodies.Mars.formattedDMS} (${bodies.Mars.degPerDay >= 0 ? '+' : ''}${bodies.Mars.degPerDay.toFixed(3)}°/d)`,
    detail: bodies.Mars.isRetrograde
      ? `Spinning-tire momentum regime: directional breakouts prone to failure and stop-hunting chop across ${marsShadow ? `${marsShadow.formattedSD} – ${marsShadow.formattedSRx} (SD ${fmtShortDate(marsShadow.sdDate)})` : bodies.Mars.signName}. Favor mean-reversion execution.`
      : marsShadow
        ? `Mars Direct inside ${marsShadow.phase === 'PRE_SHADOW' ? 'Pre-Shadow' : 'Post-Shadow'} zone (${marsShadow.formattedSD} – ${marsShadow.formattedSRx}): directional traction active, watching station/clearance boundaries.`
        : `Unencumbered directional trend traction in ${bodies.Mars.signName}; systematic momentum & breakout follow-through remain constructive.`,
  });

  // Venus Direct vs Venus Rx (with shadow dates!)
  const venusShadow = bodies.Venus.shadowZone;
  tacticalBullets.push({
    tag:
      bodies.Venus.stationState !== 'NONE'
        ? `VENUS ${bodies.Venus.stationState} // REPRICING PIVOT`
        : bodies.Venus.isRetrograde
          ? 'VENUS Rx // AUSTERITY STICK'
          : venusShadow
            ? `VENUS ${venusShadow.phase === 'PRE_SHADOW' ? 'PRE-SHADOW' : 'POST-SHADOW'}`
            : 'VENUS DIRECT // VALUATION EQUILIBRIUM',
    tone:
      bodies.Venus.stationState !== 'NONE' || bodies.Venus.isRetrograde
        ? 'CRITICAL'
        : venusShadow
          ? 'WARNING'
          : 'POSITIVE',
    headline: `Venus ${bodies.Venus.isRetrograde ? 'Retrograde' : 'Direct'} at ${bodies.Venus.formattedDMS} (${bodies.Venus.degPerDay >= 0 ? '+' : ''}${bodies.Venus.degPerDay.toFixed(3)}°/d)`,
    detail: bodies.Venus.isRetrograde
      ? `Active Valuation Repricing & Austerity Stick: multiple compression and credit spread widening pressure consensus darlings. Shadow window: Pre ${venusShadow ? fmtShortDate(venusShadow.preShadowStart) : 'N/A'} -> SRx ${venusShadow ? fmtShortDate(venusShadow.srxDate) : 'N/A'} -> SD ${venusShadow ? fmtShortDate(venusShadow.sdDate) : 'N/A'} -> Clear ${venusShadow ? fmtShortDate(venusShadow.postShadowEnd) : 'N/A'}.`
      : venusShadow
        ? `Venus Direct in ${venusShadow.phase === 'PRE_SHADOW' ? `Pre-Shadow (SRx ${fmtShortDate(venusShadow.srxDate)} at ${venusShadow.formattedSRx})` : `Post-Shadow recovery (clears ${fmtShortDate(venusShadow.postShadowEnd)} at ${venusShadow.formattedSRx})`}: monitor valuation resistance across the ${venusShadow.formattedSD}–${venusShadow.formattedSRx} arc.`
        : `Orderly valuation discovery and stable credit risk-appetite across ${bodies.Venus.signName} (${bodies.Venus.signElement}).`,
  });

  // Tactical Mars/Venus aspects
  const tacticalAspect = aspects.find(
    (a) =>
      (a.bodyA === 'Mars' || a.bodyB === 'Mars' || a.bodyA === 'Venus' || a.bodyB === 'Venus') &&
      a.orb <= 5.0,
  );
  if (tacticalAspect) {
    const bA = bodies[tacticalAspect.bodyA];
    const bB = bodies[tacticalAspect.bodyB];
    tacticalBullets.push({
      tag: `TACTICAL VECTOR // ${tacticalAspect.state}`,
      tone: tacticalAspect.isHard ? 'WARNING' : 'POSITIVE',
      headline: `${bA.name} ${tacticalAspect.symbol} ${bB.name} (${tacticalAspect.orb.toFixed(2)}° orb)`,
      detail: tacticalAspect.marketImplication,
    });
  }

  // =========================================================================
  // HORIZON 3: SHORT-TERM VOLATILITY SPARKS (Sun, Mercury, Moon)
  // =========================================================================
  const shortBullets: HorizonBullet[] = [];

  // Mercury Comms / Data Revisions
  shortBullets.push({
    tag:
      bodies.Mercury.stationState !== 'NONE'
        ? `MERCURY ${bodies.Mercury.stationState} // TAPE PIVOT`
        : bodies.Mercury.isRetrograde
          ? 'MERCURY Rx // NOISY TAPE'
          : 'MERCURY DIRECT // CLEAN SIGNAL',
    tone:
      bodies.Mercury.stationState !== 'NONE'
        ? 'CRITICAL'
        : bodies.Mercury.isRetrograde
          ? 'WARNING'
          : 'NEUTRAL',
    headline: `Mercury ${bodies.Mercury.isRetrograde ? 'Retrograde' : 'Direct'} at ${bodies.Mercury.formattedDMS} (${bodies.Mercury.degPerDay >= 0 ? '+' : ''}${bodies.Mercury.degPerDay.toFixed(2)}°/d)`,
    detail:
      bodies.Mercury.isRetrograde || bodies.Mercury.stationState !== 'NONE'
        ? 'Elevated headline noise, macro data revisions, and algorithmic knee-jerk reversals — demand confirmation past initial print spikes.'
        : 'Clean short-term macro tape transmission and standard intraday liquidity discovery.',
  });

  // Fast Sun/Mercury hits to Uranus/Pluto/Saturn
  const shockTrigger = aspects.find(
    (a) =>
      (a.bodyA === 'Sun' || a.bodyB === 'Sun' || a.bodyA === 'Mercury' || a.bodyB === 'Mercury') &&
      (a.bodyA === 'Uranus' || a.bodyB === 'Uranus' || a.bodyA === 'Pluto' || a.bodyB === 'Pluto' || a.bodyA === 'Saturn' || a.bodyB === 'Saturn') &&
      a.orb <= 5.5,
  );
  if (shockTrigger) {
    const bA = bodies[shockTrigger.bodyA];
    const bB = bodies[shockTrigger.bodyB];
    shortBullets.push({
      tag: `24–72H SHOCK SPARK // ${shockTrigger.state}`,
      tone: shockTrigger.isHard && shockTrigger.state === 'APPLYING' ? 'CRITICAL' : 'WARNING',
      headline: `${bA.name} ${shockTrigger.symbol} ${bB.name} (${shockTrigger.orb.toFixed(2)}° orb, ${shockTrigger.state})`,
      detail:
        shockTrigger.state === 'APPLYING'
          ? 'Fast inner trigger approaching outer-planet barrier — acute 24–72h volatility compression building into exact alignment.'
          : 'Fast trigger separating post-exact — acute shock pressure releasing as intraday dealers re-hedge.',
    });
  }

  // 29° Anaretic Urgency
  if (anareticBodies.length > 0) {
    const names = anareticBodies.map((b) => `${b.name} (${b.formattedDMS})`).join(', ');
    shortBullets.push({
      tag: '29° ANARETIC URGENCY',
      tone: 'CRITICAL',
      headline: `Late-Sign 29° Exhaustion: ${names}`,
      detail:
        '29°00\'–29°59\' anaretic threshold triggers late-regime positioning urgency and exhaustion spikes immediately prior to sign ingress.',
    });
  }

  // Lunar / Eclipse Corridor
  if (lunar.eclipse) {
    shortBullets.push({
      tag: lunar.eclipse.type === 'SOLAR_ECLIPSE' ? 'SOLAR ECLIPSE CORRIDOR' : 'LUNAR ECLIPSE CORRIDOR',
      tone: 'CRITICAL',
      headline: lunar.eclipse.label,
      detail:
        'Syzygy aligned within 18° of Lunar Nodes — elevated gap-risk, liquidity air-pockets, and multi-week trend inflection catalyst.',
    });
  } else {
    shortBullets.push({
      tag: `LUNAR CYCLE // ${lunar.phaseName.toUpperCase()}`,
      tone: lunar.isNewMoonWindow || lunar.isFullMoonWindow ? 'WARNING' : 'NEUTRAL',
      headline: `${lunar.phaseName} (${lunar.illuminationPct.toFixed(0)}% illum · ${lunar.nodeProximityDeg.toFixed(1)}° to Node)`,
      detail:
        lunar.isNewMoonWindow || lunar.isFullMoonWindow
          ? 'Bi-weekly syzygy window — watch short-term sentiment extremes and dealer gamma flips.'
          : `Moon at ${bodies.Moon.formattedDMS} modulating intraday order-book rhythm.`,
    });
  }

  const secularTone: RegimeTone = secularBullets.some((b) => b.tone === 'CRITICAL')
    ? 'HIGH_INFLECTION'
    : bodies.Jupiter.isRetrograde
      ? 'AUDIT_CAUTION'
      : 'BULLISH_RUNWAY';

  const tacticalTone: RegimeTone =
    bodies.Venus.isRetrograde || bodies.Mars.stationState !== 'NONE' || bodies.Venus.stationState !== 'NONE'
      ? 'AUDIT_CAUTION'
      : bodies.Mars.isRetrograde
        ? 'CHOP_FRICTION'
        : 'BULLISH_RUNWAY';

  const shortTone: RegimeTone = shortBullets.some((b) => b.tone === 'CRITICAL')
    ? 'HIGH_INFLECTION'
    : bodies.Mercury.isRetrograde
      ? 'CHOP_FRICTION'
      : 'BULLISH_RUNWAY';

  return {
    postureLabel,
    postureCode,
    postureTone,
    tensionIndex,
    executiveSummary,
    activeRxBodies,
    stationingBodies,
    anareticBodies,
    tightestApplyingHard,
    horizons: [
      {
        id: 'SECULAR',
        title: 'Secular & Macro Tides',
        timeframeBadge: 'QUARTERLY – MULTI-YEAR',
        bodiesLabel: 'Jupiter – Pluto + Lunar Nodes',
        statusHeadline: bodies.Jupiter.isRetrograde
          ? 'Macro Valuation Audit'
          : 'Liquidity Accelerant Active',
        statusTone: secularTone,
        bullets: secularBullets,
      },
      {
        id: 'TACTICAL',
        title: 'Tactical Momentum & Valuation',
        timeframeBadge: 'MULTI-WEEK – MULTI-MONTH',
        bodiesLabel: 'Mars & Venus Cycles',
        statusHeadline: bodies.Venus.isRetrograde
          ? 'Venus Rx Repricing Window'
          : bodies.Mars.isRetrograde
            ? 'Mars Rx Whipsaw Chop'
            : 'Constructive Tactical Traction',
        statusTone: tacticalTone,
        bullets: tacticalBullets,
      },
      {
        id: 'SHORT_TERM',
        title: 'Short-Term Volatility Sparks',
        timeframeBadge: 'INTRADAY – 2 WEEKS',
        bodiesLabel: 'Sun, Mercury & Moon',
        statusHeadline: lunar.eclipse
          ? 'Active Eclipse Shock Window'
          : anareticBodies.length > 0
            ? '29° Anaretic Inflection'
            : bodies.Mercury.isRetrograde
              ? 'Mercury Rx Headline Noise'
              : 'Standard Tape Transmission',
        statusTone: shortTone,
        bullets: shortBullets,
      },
    ],
  };
}
