import { describe, expect, it } from 'vitest';
import {
  computeDailyAngularVelocity,
  computeEphemerisSnapshot,
  computeMeanLunarNodes,
  computeUpcoming90DayRadar,
  getMacroInflectionBookmarks,
  shortestAngularSeparation,
} from './ephemeris';

describe('Astronomical & Ephemeris Engine Checkpoints', () => {
  it('Checkpoint 1 — Nov 12, 2026: Jupiter (~25° Leo) conjunct Mean South Node (~25° Leo), Venus Rx ending Nov 13–14, 2026', () => {
    const d = new Date('2026-11-12T12:00:00Z');
    const snap = computeEphemerisSnapshot(d);

    // Jupiter ~25° Leo
    expect(snap.bodies.Jupiter.signName).toBe('Leo');
    expect(snap.bodies.Jupiter.deg).toBeGreaterThanOrEqual(24);
    expect(snap.bodies.Jupiter.deg).toBeLessThanOrEqual(26);

    // Mean South Node ~25° Leo (North Node ~25° Aquarius)
    const nodes = computeMeanLunarNodes(d);
    expect(snap.bodies.SouthNode.signName).toBe('Leo');
    expect(snap.bodies.SouthNode.deg).toBe(25);
    expect(shortestAngularSeparation(nodes.northNode, nodes.southNode)).toBeCloseTo(180, 5);

    // Tight conjunction (< 0.5°) between Jupiter and Mean South Node
    const jupSnAspect = snap.aspects.find(
      (a) =>
        ((a.bodyA === 'Jupiter' && a.bodyB === 'SouthNode') ||
          (a.bodyA === 'SouthNode' && a.bodyB === 'Jupiter')) &&
        a.type === 'CONJUNCTION',
    );
    expect(jupSnAspect).toBeDefined();
    expect(jupSnAspect!.orb).toBeLessThan(0.5);
    expect(jupSnAspect!.isCriticalConjunction).toBe(true);

    // Venus Retrograde on Nov 12, stationing direct (`ST-D`) and turning positive velocity by Nov 14–15, 2026
    expect(snap.bodies.Venus.isRetrograde).toBe(true);
    expect(snap.bodies.Venus.stationState).toBe('ST-D');
    expect(snap.bodies.Venus.shadowZone).not.toBeNull();
    expect(snap.bodies.Venus.shadowZone!.phase).toBe('RETROGRADE');

    const velNov12 = computeDailyAngularVelocity('Venus', new Date('2026-11-12T12:00:00Z'));
    const velNov15 = computeDailyAngularVelocity('Venus', new Date('2026-11-15T00:00:00Z'));
    expect(velNov12).toBeLessThan(0);
    expect(velNov15).toBeGreaterThan(0);
  });

  it('Checkpoint 2 — Nov 25, 2026: Mars at anaretic 29° Leo crossing into 0° Virgo in late UTC; Sun in early Sagittarius opposite Uranus in early Gemini (~3°)', () => {
    const snapAfternoon = computeEphemerisSnapshot(new Date('2026-11-25T16:00:00Z'));
    expect(snapAfternoon.bodies.Mars.signName).toBe('Leo');
    expect(snapAfternoon.bodies.Mars.deg).toBe(29);
    expect(snapAfternoon.bodies.Mars.isAnaretic).toBe(true);
    expect(snapAfternoon.occupiedAnareticSigns).toContain(4); // Leo = index 4

    // Late UTC / after midnight crossing into 0° Virgo
    const snapAfterIngress = computeEphemerisSnapshot(new Date('2026-11-26T01:00:00Z'));
    expect(snapAfterIngress.bodies.Mars.signName).toBe('Virgo');
    expect(snapAfterIngress.bodies.Mars.deg).toBe(0);

    // Sun in early Sagittarius (~3°) opposite Uranus in early Gemini (~3°)
    expect(snapAfternoon.bodies.Sun.signName).toBe('Sagittarius');
    expect(snapAfternoon.bodies.Sun.deg).toBe(3);
    expect(snapAfternoon.bodies.Uranus.signName).toBe('Gemini');
    expect(snapAfternoon.bodies.Uranus.deg).toBe(3);
    expect(snapAfternoon.bodies.Uranus.isRetrograde).toBe(true);

    const sunUraOpp = snapAfternoon.aspects.find(
      (a) =>
        ((a.bodyA === 'Sun' && a.bodyB === 'Uranus') ||
          (a.bodyA === 'Uranus' && a.bodyB === 'Sun')) &&
        a.type === 'OPPOSITION',
    );
    expect(sunUraOpp).toBeDefined();
    expect(sunUraOpp!.orb).toBeLessThan(1.0);
    expect(sunUraOpp!.state).toBe('APPLYING');
  });

  it('Checkpoint 3 — Jan–Apr 2027: Jupiter and Mars retrograde simultaneously in Q1 2027, turning direct in April 2027 alongside Jupiter–Saturn fire trine (~17° Leo / Aries)', () => {
    const q1Snap = computeEphemerisSnapshot(new Date('2027-02-15T12:00:00Z'));
    expect(q1Snap.bodies.Jupiter.isRetrograde).toBe(true);
    expect(q1Snap.bodies.Mars.isRetrograde).toBe(true);
    expect(q1Snap.bodies.Jupiter.shadowZone?.phase).toBe('RETROGRADE');
    expect(q1Snap.bodies.Mars.shadowZone?.phase).toBe('RETROGRADE');

    // Early April 2027: Jupiter (~17° Leo) trine Saturn (~17° Aries)
    const aprEarlySnap = computeEphemerisSnapshot(new Date('2027-04-03T12:00:00Z'));
    expect(aprEarlySnap.bodies.Jupiter.signName).toBe('Leo');
    expect(aprEarlySnap.bodies.Jupiter.deg).toBe(17);
    expect(aprEarlySnap.bodies.Saturn.signName).toBe('Aries');
    expect(aprEarlySnap.bodies.Saturn.deg).toBe(17);

    const jupSatTrine = aprEarlySnap.aspects.find(
      (a) =>
        ((a.bodyA === 'Jupiter' && a.bodyB === 'Saturn') ||
          (a.bodyA === 'Saturn' && a.bodyB === 'Jupiter')) &&
        a.type === 'TRINE',
    );
    expect(jupSatTrine).toBeDefined();
    expect(jupSatTrine!.orb).toBeLessThan(1.0);

    // By late April 2027, both Mars and Jupiter have turned Direct
    const aprLateSnap = computeEphemerisSnapshot(new Date('2027-04-20T12:00:00Z'));
    expect(aprLateSnap.bodies.Mars.isRetrograde).toBe(false);
    expect(aprLateSnap.bodies.Jupiter.isRetrograde).toBe(false);
  });

  it('Checkpoint 4 — May–Jun 2028: Venus Retrograde in Gemini overlapping Uranus–Pluto trine and leading into Saturn square Pluto (~8° Taurus / Aquarius)', () => {
    const maySnap = computeEphemerisSnapshot(new Date('2028-05-24T12:00:00Z'));
    expect(maySnap.bodies.Venus.signName).toBe('Gemini');
    expect(maySnap.bodies.Venus.isRetrograde).toBe(true);

    // Uranus in Gemini trine Pluto in Aquarius
    expect(maySnap.bodies.Uranus.signName).toBe('Gemini');
    expect(maySnap.bodies.Pluto.signName).toBe('Aquarius');
    const uraPluTrine = maySnap.aspects.find(
      (a) =>
        ((a.bodyA === 'Uranus' && a.bodyB === 'Pluto') ||
          (a.bodyA === 'Pluto' && a.bodyB === 'Uranus')) &&
        a.type === 'TRINE',
    );
    expect(uraPluTrine).toBeDefined();
    expect(uraPluTrine!.orb).toBeLessThan(2.5);

    // Late June 2028: Saturn (~8° Taurus) square Pluto (~8° Aquarius)
    const junSnap = computeEphemerisSnapshot(new Date('2028-06-25T12:00:00Z'));
    expect(junSnap.bodies.Saturn.signName).toBe('Taurus');
    expect(junSnap.bodies.Saturn.deg).toBeGreaterThanOrEqual(7);
    expect(junSnap.bodies.Saturn.deg).toBeLessThanOrEqual(9);
    expect(junSnap.bodies.Pluto.signName).toBe('Aquarius');
    expect(junSnap.bodies.Pluto.deg).toBe(8);

    const satPluSquare = junSnap.aspects.find(
      (a) =>
        ((a.bodyA === 'Saturn' && a.bodyB === 'Pluto') ||
          (a.bodyA === 'Pluto' && a.bodyB === 'Saturn')) &&
        a.type === 'SQUARE',
    );
    expect(satPluSquare).toBeDefined();
    expect(satPluSquare!.orb).toBeLessThan(1.0);
  });

  it('Detects Solar Eclipses, 90-day Inflection Radar events, and +-5-year Macro Bookmarks cleanly', () => {
    // Aug 12, 2026 Total Solar Eclipse in Leo near South Node
    const eclipseSnap = computeEphemerisSnapshot(new Date('2026-08-12T17:46:00Z'));
    expect(eclipseSnap.lunar.eclipse).not.toBeNull();
    expect(eclipseSnap.lunar.eclipse?.type).toBe('SOLAR_ECLIPSE');

    // 90-day radar from Nov 25, 2026 captures Mars ingress into Virgo and Jupiter/Mars stations
    const radar = computeUpcoming90DayRadar(new Date('2026-11-25T12:00:00Z'), 90);
    expect(radar.length).toBeGreaterThan(5);
    expect(radar.some((e) => e.category === 'SIGN_INGRESS' && e.bodies.includes('Mars'))).toBe(true);
    expect(radar.some((e) => e.category === 'STATION')).toBe(true);

    // +-5y bookmarks around Nov 25, 2026
    const bookmarks = getMacroInflectionBookmarks(new Date('2026-11-25T16:00:00Z'));
    expect(bookmarks.length).toBeGreaterThanOrEqual(10);
  });
});
