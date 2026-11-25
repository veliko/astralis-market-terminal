import { Line, OrbitControls } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import {
  Compass,
  Eye,
  Filter,
  Focus,
  Globe,
  Layers,
  Orbit,
  Sparkles,
  SunMedium,
  X,
} from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import {
  getNextIngressForBody,
  getNextStationForBody,
  normalizeDeg,
  ZODIAC_SIGNS,
  type ActiveAspect,
  type BodyId,
  type BodyTelemetry,
  type EphemerisSnapshot,
} from '../lib/ephemeris';

export type AspectFilterMode = 'ALL' | 'HARD_ONLY' | 'NONE';
export type ViewCoordinateMode = 'GEOCENTRIC' | 'HELIOCENTRIC';
export type LabelDensityMode = 'FULL' | 'COMPACT' | 'OFF';

interface CelestialArena3DProps {
  snapshot: EphemerisSnapshot;
  selectedBody: BodyId | null;
  onSelectBody: (body: BodyId | null) => void;
  onJumpToDate: (date: Date) => void;
}

const BEZEL_INNER = 22.0;
const BEZEL_OUTER = 27.2;

/**
 * Convert ecliptic longitude (deg) + radius + ecliptic latitude (deg) into
 * Three.js world coordinates where 0° Aries sits at (-R, 0, 0) and angles
 * advance counterclockwise when viewed from +Y above the arena.
 */
function eclipticToWorld(
  elonDeg: number,
  radius: number,
  elatDeg = 0,
): [number, number, number] {
  const rad = (elonDeg * Math.PI) / 180;
  const x = -radius * Math.cos(rad);
  const z = radius * Math.sin(rad);
  const y = Math.sin((elatDeg * Math.PI) / 180) * 6.0;
  return [x, y, z];
}

/**
 * Build a crisp 2048x2048 procedural CanvasTexture for the 360° Brushed Bronze
 * & Obsidian Zodiac Bezel (1°/5°/10° degree ticks, 12x30° sign sectors,
 * elemental inner accents, sign glyphs, and architectural typography).
 */
function createZodiacBezelTexture(): THREE.CanvasTexture {
  const size = 2048;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const cx = size / 2;
  const cy = size / 2;
  const rOuterPx = size * 0.495;
  const rInnerPx = rOuterPx * (BEZEL_INNER / BEZEL_OUTER);

  ctx.clearRect(0, 0, size, size);

  const grad = ctx.createRadialGradient(cx, cy, rInnerPx, cx, cy, rOuterPx);
  grad.addColorStop(0, '#101622');
  grad.addColorStop(0.15, '#151C2B');
  grad.addColorStop(0.45, '#0D121D');
  grad.addColorStop(0.88, '#1A1610');
  grad.addColorStop(1, '#2C2213');

  ctx.beginPath();
  ctx.arc(cx, cy, rOuterPx, 0, Math.PI * 2);
  ctx.arc(cx, cy, rInnerPx, 0, Math.PI * 2, true);
  ctx.fillStyle = grad;
  ctx.fill();

  const elementColors: Record<string, string> = {
    Fire: '#D97706',
    Earth: '#A38350',
    Air: '#38BDF8',
    Water: '#0EA5E9',
  };

  const elonToCanvasAngle = (elonDeg: number) =>
    Math.PI - (elonDeg * Math.PI) / 180;

  // Mid-bezel divider ring separating Vernier degree track from Sign Name ring
  const rMidDivider = rInnerPx + (rOuterPx - rInnerPx) * 0.44;

  for (let s = 0; s < 12; s++) {
    const sign = ZODIAC_SIGNS[s];
    const aStart = elonToCanvasAngle(s * 30);
    const aEnd = elonToCanvasAngle((s + 1) * 30);

    ctx.beginPath();
    ctx.arc(cx, cy, rOuterPx - 4, aStart, aEnd, true);
    ctx.arc(cx, cy, rInnerPx + 4, aEnd, aStart, false);
    ctx.closePath();
    ctx.fillStyle =
      s % 2 === 0 ? 'rgba(200, 164, 93, 0.05)' : 'rgba(15, 23, 42, 0.30)';
    ctx.fill();

    // Elemental inner rim accent arc
    ctx.beginPath();
    ctx.arc(cx, cy, rInnerPx + 9, aStart - 0.006, aEnd + 0.006, true);
    ctx.strokeStyle = elementColors[sign.element];
    ctx.globalAlpha = 0.72;
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.globalAlpha = 1.0;

    // Crisp 30° brass sector divider line
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(aStart) * rInnerPx, cy + Math.sin(aStart) * rInnerPx);
    ctx.lineTo(cx + Math.cos(aStart) * rOuterPx, cy + Math.sin(aStart) * rOuterPx);
    ctx.strokeStyle = 'rgba(227, 197, 130, 0.72)';
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  // Subtle brass Vernier track ring
  ctx.beginPath();
  ctx.arc(cx, cy, rMidDivider, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(200, 164, 93, 0.28)';
  ctx.lineWidth = 1.6;
  ctx.stroke();

  // Draw 360 degree ticks (1°, 5°, 10°)
  for (let deg = 0; deg < 360; deg++) {
    const inSign = deg % 30;
    if (inSign === 0) continue;
    const a = elonToCanvasAngle(deg);
    const isTen = inSign % 10 === 0;
    const isFive = inSign % 5 === 0;
    const isAnareticTick = inSign === 29;

    const tickLen = isTen ? 26 : isFive ? 18 : 10;
    const r0 = rInnerPx + 14;
    const r1 = r0 + tickLen;

    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
    ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
    ctx.strokeStyle = isAnareticTick
      ? 'rgba(251, 113, 133, 0.88)'
      : isTen
        ? 'rgba(227, 197, 130, 0.75)'
        : isFive
          ? 'rgba(200, 164, 93, 0.50)'
          : 'rgba(148, 163, 184, 0.25)';
    ctx.lineWidth = isTen ? 2.4 : isFive ? 1.7 : 1.0;
    ctx.stroke();

    if (isTen) {
      const rText = rInnerPx + 58;
      const tx = cx + Math.cos(a) * rText;
      const ty = cy + Math.sin(a) * rText;
      ctx.save();
      ctx.translate(tx, ty);
      let rot = a + Math.PI / 2;
      if (Math.sin(a) > 0.15) rot += Math.PI;
      ctx.rotate(rot);
      ctx.font = '600 16px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(227, 197, 130, 0.80)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${inSign}°`, 0, 0);
      ctx.restore();
    }
  }

  // Draw Sign Glyph + Sign Name cleanly in the outer engraved band
  for (let s = 0; s < 12; s++) {
    const sign = ZODIAC_SIGNS[s];
    const midAngle = elonToCanvasAngle(s * 30 + 15);
    const rLabel = (rMidDivider + rOuterPx) * 0.51;
    const lx = cx + Math.cos(midAngle) * rLabel;
    const ly = cy + Math.sin(midAngle) * rLabel;

    ctx.save();
    ctx.translate(lx, ly);
    let rot = midAngle + Math.PI / 2;
    if (Math.sin(midAngle) > 0.15) {
      rot += Math.PI;
    }
    ctx.rotate(rot);

    ctx.font = '700 26px "Space Grotesk", sans-serif';
    ctx.fillStyle = '#F3DC9F';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${sign.glyph}  ${sign.name.toUpperCase()}`, 0, 0);
    ctx.restore();
  }

  for (const rad of [rInnerPx + 2, rOuterPx - 2]) {
    ctx.beginPath();
    ctx.arc(cx, cy, rad, 0, Math.PI * 2);
    ctx.strokeStyle = '#C8A45D';
    ctx.lineWidth = 4;
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

function buildArcPoints(
  startLonDeg: number,
  spanDeg: number,
  radius: number,
  yOffset = 0.04,
  segments = 48,
): [number, number, number][] {
  const pts: [number, number, number][] = [];
  const count = Math.max(8, segments);
  for (let i = 0; i <= count; i++) {
    const lon = startLonDeg + (spanDeg * i) / count;
    const [x, , z] = eclipticToWorld(lon, radius, 0);
    pts.push([x, yOffset, z]);
  }
  return pts;
}

function buildCirclePoints(
  radius: number,
  segments = 128,
  y = 0,
): [number, number, number][] {
  return buildArcPoints(0, 360, radius, y, segments);
}

interface ProjectedAnchor {
  key: string;
  worldPos: [number, number, number];
}

/**
 * Zero-Portal 60fps 3D->2D Screen-Space HUD Projector.
 * Updates DOM badge transforms directly via refs inside `useFrame` without
 * creating separate ReactDOM roots or triggering React re-renders during OrbitControls drag.
 */
function ScreenSpaceProjector({
  anchors,
  domRefs,
}: {
  anchors: ProjectedAnchor[];
  domRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
}) {
  const { camera, size } = useThree();
  const scratchVec = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    for (const anchor of anchors) {
      const el = domRefs.current[anchor.key];
      if (!el) continue;
      scratchVec.set(anchor.worldPos[0], anchor.worldPos[1], anchor.worldPos[2]);
      scratchVec.project(camera);

      if (scratchVec.z > 1 || scratchVec.z < -1) {
        el.style.opacity = '0';
        el.style.pointerEvents = 'none';
        continue;
      }

      const px = (scratchVec.x * 0.5 + 0.5) * size.width;
      const py = (-scratchVec.y * 0.5 + 0.5) * size.height;
      el.style.opacity = '1';
      el.style.pointerEvents = 'auto';
      el.style.transform = `translate3d(${px.toFixed(1)}px, ${py.toFixed(1)}px, 0) translate(-50%, -100%)`;
    }
  });

  return null;
}

function CameraRig({
  presetTrigger,
  controlsRef,
}: {
  presetTrigger: { mode: 'PERSPECTIVE' | 'TOPDOWN'; seq: number };
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
}) {
  const { camera } = useThree();
  const targetPos = useRef<THREE.Vector3 | null>(null);

  useEffect(() => {
    if (presetTrigger.seq === 0) return;
    if (presetTrigger.mode === 'TOPDOWN') {
      targetPos.current = new THREE.Vector3(0, 47, 0.01);
    } else {
      targetPos.current = new THREE.Vector3(0, 30.5, 33.5);
    }
  }, [presetTrigger]);

  useFrame((_, delta) => {
    if (!targetPos.current) return;
    camera.position.lerp(targetPos.current, Math.min(1, delta * 5.5));
    if (controlsRef.current) {
      controlsRef.current.target.lerp(
        new THREE.Vector3(0, 0, 0),
        Math.min(1, delta * 6),
      );
      controlsRef.current.update();
    }
    if (camera.position.distanceTo(targetPos.current) < 0.15) {
      targetPos.current = null;
    }
  });

  return null;
}

function AspectBeam3D({
  aspect,
  posA,
  posB,
  dimmed,
}: {
  aspect: ActiveAspect;
  posA: [number, number, number];
  posB: [number, number, number];
  dimmed: boolean;
}) {
  const pulseARef = useRef<THREE.Mesh>(null);
  const pulseBRef = useRef<THREE.Mesh>(null);

  const { curve, points } = useMemo(() => {
    const vA = new THREE.Vector3(...posA);
    const vB = new THREE.Vector3(...posB);
    const mid = vA.clone().add(vB).multiplyScalar(0.5);
    const chordDist = vA.distanceTo(vB);
    mid.y += Math.min(1.35, 0.18 + chordDist * 0.032);
    const qCurve = new THREE.QuadraticBezierCurve3(vA, mid, vB);
    const sampled = qCurve
      .getPoints(36)
      .map((p) => [p.x, p.y, p.z] as [number, number, number]);
    return { curve: qCurve, points: sampled };
  }, [posA, posB]);

  useFrame(({ clock }) => {
    if (dimmed) return;
    const t = (clock.getElapsedTime() * (0.38 + aspect.intensity * 0.45)) % 1;
    const u1 = aspect.state === 'APPLYING' ? t * 0.5 : 0.5 - t * 0.5;
    const u2 = aspect.state === 'APPLYING' ? 1 - t * 0.5 : 0.5 + t * 0.5;

    if (pulseARef.current) {
      pulseARef.current.position.copy(curve.getPoint(u1));
    }
    if (pulseBRef.current) {
      pulseBRef.current.position.copy(curve.getPoint(u2));
    }
  });

  const baseOpacity = dimmed
    ? 0.06
    : Math.min(0.96, 0.22 + aspect.intensity * 0.76);
  const lineWidth = dimmed
    ? 0.7
    : 1.1 + aspect.intensity * (aspect.isHard ? 2.8 : 2.0);

  return (
    <group>
      <Line
        points={points}
        color={aspect.color}
        lineWidth={lineWidth}
        transparent
        opacity={baseOpacity}
      />
      {aspect.type === 'CONJUNCTION' && !dimmed && (
        <mesh
          position={[
            (posA[0] + posB[0]) * 0.5,
            (posA[1] + posB[1]) * 0.5 + 0.05,
            (posA[2] + posB[2]) * 0.5,
          ]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[0.55, 0.85 + aspect.intensity * 0.35, 36]} />
          <meshBasicMaterial
            color={aspect.isCriticalConjunction ? '#FB7185' : '#FACC15'}
            transparent
            opacity={0.35 + aspect.intensity * 0.5}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
      {!dimmed && aspect.intensity > 0.18 && (
        <>
          <mesh ref={pulseARef}>
            <sphereGeometry args={[0.09 + aspect.intensity * 0.07, 10, 10]} />
            <meshBasicMaterial
              color={aspect.color}
              transparent
              opacity={aspect.state === 'APPLYING' ? 0.95 : 0.55}
            />
          </mesh>
          <mesh ref={pulseBRef}>
            <sphereGeometry args={[0.09 + aspect.intensity * 0.07, 10, 10]} />
            <meshBasicMaterial
              color={aspect.color}
              transparent
              opacity={aspect.state === 'APPLYING' ? 0.95 : 0.55}
            />
          </mesh>
        </>
      )}
    </group>
  );
}

function CelestialBodyMesh({
  body,
  position,
  orbitRadius,
  orbitLon,
  isSelected,
  isDimmed,
  stemHeight,
  showStem,
  viewMode,
  onSelect,
}: {
  body: BodyTelemetry;
  position: [number, number, number];
  orbitRadius: number;
  orbitLon: number;
  isSelected: boolean;
  isDimmed: boolean;
  stemHeight: number;
  showStem: boolean;
  viewMode: ViewCoordinateMode;
  onSelect: (id: BodyId) => void;
}) {
  const rxHaloRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (rxHaloRef.current && (body.isRetrograde || body.stationState !== 'NONE')) {
      const pulse = 1 + Math.sin(clock.getElapsedTime() * 4.2) * 0.16;
      rxHaloRef.current.scale.set(pulse, pulse, 1);
    }
  });

  const arrowDirSign = body.isNode ? -1 : body.isRetrograde ? -1 : 1;
  const arrowLon = orbitLon + arrowDirSign * (4.6 - orbitRadius * 0.09);
  const arrowPos = eclipticToWorld(arrowLon, orbitRadius, 0);
  const arrowRad = (arrowLon * Math.PI) / 180;
  const tx = arrowDirSign * Math.sin(arrowRad);
  const tz = arrowDirSign * Math.cos(arrowRad);
  const arrowQuat = useMemo(() => {
    const dir = new THREE.Vector3(tx, 0, tz).normalize();
    return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  }, [tx, tz]);

  const rxBadgeColor =
    body.stationState !== 'NONE'
      ? '#FB7185'
      : body.isRetrograde
        ? '#EF4444'
        : '#C8A45D';

  const ribbonSegments = useMemo(() => {
    if (viewMode !== 'GEOCENTRIC' || body.ribbon.length < 2) return null;
    return body.ribbon.map((s) => eclipticToWorld(s.elon, body.trackRadius, s.elat));
  }, [viewMode, body.ribbon, body.trackRadius]);

  return (
    <group>
      {ribbonSegments && !isDimmed && (
        <Line
          points={ribbonSegments}
          color={body.isRetrograde ? '#F43F5E' : body.accentColor}
          lineWidth={isSelected ? 2.4 : 1.3}
          transparent
          opacity={isSelected ? 0.72 : 0.32}
        />
      )}

      {Math.abs(position[1]) > 0.06 && (
        <Line
          points={[
            [position[0], 0, position[2]],
            [position[0], position[1], position[2]],
          ]}
          color={body.color}
          lineWidth={1}
          transparent
          opacity={isDimmed ? 0.12 : 0.45}
        />
      )}

      {orbitRadius > 0.5 && !isDimmed && (
        <mesh position={[arrowPos[0], 0.04, arrowPos[2]]} quaternion={arrowQuat}>
          <coneGeometry args={[0.13, 0.38, 8]} />
          <meshBasicMaterial
            color={body.isRetrograde ? '#EF4444' : '#C8A45D'}
            transparent
            opacity={body.isRetrograde ? 0.95 : 0.62}
          />
        </mesh>
      )}

      <group
        position={position}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(body.id);
        }}
      >
        {body.isNode ? (
          <group>
            <mesh rotation={[0, ((orbitLon + 90) * Math.PI) / 180, 0]}>
              <torusGeometry args={[0.42, 0.065, 16, 36]} />
              <meshStandardMaterial
                color={body.color}
                emissive={body.accentColor}
                emissiveIntensity={isSelected ? 1.4 : 0.75}
                metalness={0.85}
                roughness={0.2}
              />
            </mesh>
            <mesh>
              <octahedronGeometry args={[0.18, 0]} />
              <meshBasicMaterial color={body.color} />
            </mesh>
          </group>
        ) : (
          <mesh>
            <sphereGeometry
              args={[body.sphereRadius * (isSelected ? 1.22 : 1), 28, 28]}
            />
            <meshStandardMaterial
              color={body.color}
              emissive={body.id === 'Sun' ? '#F59E0B' : body.accentColor}
              emissiveIntensity={
                body.id === 'Sun'
                  ? 1.5
                  : isSelected
                    ? 0.95
                    : isDimmed
                      ? 0.12
                      : 0.42
              }
              metalness={body.id === 'Sun' ? 0.1 : 0.55}
              roughness={body.id === 'Sun' ? 0.2 : 0.32}
              transparent={isDimmed}
              opacity={isDimmed ? 0.3 : 1}
            />
          </mesh>
        )}

        {body.id === 'Saturn' && (
          <mesh rotation={[Math.PI * 0.38, 0.25, 0]}>
            <ringGeometry args={[0.56, 0.92, 48]} />
            <meshStandardMaterial
              color="#E3C582"
              emissive="#8B6C35"
              emissiveIntensity={0.35}
              side={THREE.DoubleSide}
              transparent
              opacity={isDimmed ? 0.22 : 0.82}
            />
          </mesh>
        )}

        {body.id === 'Sun' && (
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.52, 0.88, 40]} />
            <meshBasicMaterial
              color="#FBBF24"
              transparent
              opacity={0.35}
              side={THREE.DoubleSide}
            />
          </mesh>
        )}

        {(body.isRetrograde || body.stationState !== 'NONE' || isSelected) && (
          <mesh ref={rxHaloRef} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry
              args={[
                body.sphereRadius + 0.16,
                body.sphereRadius + (isSelected ? 0.38 : 0.28),
                36,
              ]}
            />
            <meshBasicMaterial
              color={isSelected ? '#F3DC9F' : rxBadgeColor}
              transparent
              opacity={isSelected ? 0.9 : 0.78}
              side={THREE.DoubleSide}
            />
          </mesh>
        )}

        {showStem && (
          <Line
            points={[
              [0, body.sphereRadius + 0.08, 0],
              [0, stemHeight, 0],
            ]}
            color={isSelected ? '#F3DC9F' : 'rgba(200, 164, 93, 0.45)'}
            lineWidth={isSelected ? 1.6 : 1}
            transparent
            opacity={isSelected ? 0.9 : 0.55}
          />
        )}
      </group>
    </group>
  );
}

interface ComputedSceneLayout {
  visibleBodies: BodyTelemetry[];
  bodyPositions: Record<
    BodyId,
    { pos: [number, number, number]; radius: number; lon: number }
  >;
  earthHelioPos: [number, number, number];
  labelTiers: Record<BodyId, number>;
  visibleAspects: ActiveAspect[];
  helioSightlines: Array<{
    id: BodyId;
    color: string;
    points: [number, number, number][];
    bezelHit: [number, number, number];
    isRx: boolean;
    glyph: string;
    dms: string;
  }>;
  projectedAnchors: ProjectedAnchor[];
}

function AstrolabeScene({
  snapshot,
  layout,
  selectedBody,
  onSelectBody,
  macroOnly,
  showShadowZones,
  viewMode,
  labelDensity,
  cameraPreset,
  hudDomRefs,
}: {
  snapshot: EphemerisSnapshot;
  layout: ComputedSceneLayout;
  selectedBody: BodyId | null;
  onSelectBody: (id: BodyId | null) => void;
  macroOnly: boolean;
  showShadowZones: boolean;
  viewMode: ViewCoordinateMode;
  labelDensity: LabelDensityMode;
  cameraPreset: { mode: 'PERSPECTIVE' | 'TOPDOWN'; seq: number };
  hudDomRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
}) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const bezelTexture = useMemo(() => createZodiacBezelTexture(), []);

  useEffect(() => {
    return () => {
      bezelTexture.dispose();
    };
  }, [bezelTexture]);

  const trackRadii = useMemo(() => {
    if (viewMode === 'GEOCENTRIC') {
      return snapshot.bodyList
        .filter((b) => b.id !== 'SouthNode' && (!macroOnly || b.tier !== 'INNER'))
        .map((b) => ({
          id: b.id,
          r: b.trackRadius,
          isZoneDivider: b.id === 'Sun' || b.id === 'NorthNode' || b.id === 'Pluto',
        }));
    }
    return [
      { id: 'Mercury', r: 3.1, isZoneDivider: false },
      { id: 'Venus', r: 4.2, isZoneDivider: false },
      { id: 'Earth', r: 5.6, isZoneDivider: true },
      { id: 'Mars', r: 7.4, isZoneDivider: false },
      { id: 'Jupiter', r: 10.5, isZoneDivider: false },
      { id: 'Saturn', r: 13.0, isZoneDivider: true },
      { id: 'Uranus', r: 15.8, isZoneDivider: false },
      { id: 'Neptune', r: 18.0, isZoneDivider: false },
      { id: 'Pluto', r: 20.2, isZoneDivider: true },
    ];
  }, [snapshot.bodyList, viewMode, macroOnly]);

  const nodalAxisPoints = useMemo(() => {
    return [
      layout.bodyPositions.NorthNode.pos,
      layout.bodyPositions.SouthNode.pos,
    ] as [number, number, number][];
  }, [layout.bodyPositions]);

  return (
    <>
      <color attach="background" args={['#07090E']} />
      <fog attach="fog" args={['#07090E', 50, 96]} />

      <ambientLight intensity={0.68} />
      <pointLight position={[0, 18, 8]} intensity={1.8} color="#FFF3D6" />
      <directionalLight position={[-18, 26, 16]} intensity={1.15} color="#E3C582" />
      <directionalLight position={[20, 12, -16]} intensity={0.55} color="#38BDF8" />

      <CameraRig presetTrigger={cameraPreset} controlsRef={controlsRef} />
      <ScreenSpaceProjector anchors={layout.projectedAnchors} domRefs={hudDomRefs} />

      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.07}
        minDistance={12}
        maxDistance={64}
        maxPolarAngle={Math.PI * 0.475}
        minPolarAngle={0.04}
      />

      <mesh
        position={[0, -0.25, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={() => onSelectBody(null)}
      >
        <circleGeometry args={[34, 64]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Radial 30° Sign Spokes */}
      <group>
        {ZODIAC_SIGNS.map((s) => {
          const inner = eclipticToWorld(s.startDeg, 2.2, 0);
          const outer = eclipticToWorld(s.startDeg, BEZEL_INNER, 0);
          return (
            <Line
              key={s.index}
              points={[
                [inner[0], -0.02, inner[2]],
                [outer[0], -0.02, outer[2]],
              ]}
              color="rgba(200, 164, 93, 0.22)"
              lineWidth={0.85}
              transparent
              opacity={0.22}
            />
          );
        })}
      </group>

      {/* Sculpted 360° Brushed-Bronze Zodiac Bezel */}
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <ringGeometry args={[BEZEL_INNER, BEZEL_OUTER, 160, 1]} />
          <meshStandardMaterial
            map={bezelTexture}
            metalness={0.48}
            roughness={0.42}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
          <torusGeometry args={[BEZEL_INNER, 0.09, 16, 160]} />
          <meshStandardMaterial color="#C8A45D" metalness={0.85} roughness={0.24} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
          <torusGeometry args={[BEZEL_OUTER, 0.13, 16, 160]} />
          <meshStandardMaterial color="#8B6C35" metalness={0.88} roughness={0.28} />
        </mesh>

        {snapshot.occupiedAnareticSigns.map((signIdx) => {
          const arcPts = buildArcPoints(
            signIdx * 30 + 28.4,
            1.6,
            (BEZEL_INNER + BEZEL_OUTER) * 0.5,
            0.09,
            12,
          );
          return (
            <Line
              key={`anaretic-${signIdx}`}
              points={arcPts}
              color="#F59E0B"
              lineWidth={5}
              transparent
              opacity={0.95}
            />
          );
        })}
      </group>

      {/* Concentric Timeframe Track Rings */}
      <group>
        {trackRadii.map((tr) => (
          <Line
            key={tr.id}
            points={buildCirclePoints(tr.r, 128, -0.01)}
            color={tr.isZoneDivider ? '#C8A45D' : '#475569'}
            lineWidth={tr.isZoneDivider ? 1.35 : 0.75}
            transparent
            opacity={tr.isZoneDivider ? 0.36 : 0.22}
          />
        ))}
      </group>

      {/* Retrograde Shadow Zone Arcs */}
      {viewMode === 'GEOCENTRIC' &&
        showShadowZones &&
        layout.visibleBodies.map((b) => {
          const sz = b.shadowZone;
          if (!sz) return null;
          if (selectedBody && selectedBody !== b.id) return null;

          const shadowPts = buildArcPoints(
            normalizeDeg(sz.lonSD),
            sz.arcSpanDeg,
            b.trackRadius,
            0.03,
            40,
          );
          const sdPin = eclipticToWorld(sz.lonSD, b.trackRadius, 0);
          const srxPin = eclipticToWorld(sz.lonSRx, b.trackRadius, 0);
          const isActiveRx = sz.phase === 'RETROGRADE';

          return (
            <group key={`shadow-${b.id}`}>
              <Line
                points={shadowPts}
                color={isActiveRx ? '#EF4444' : '#F59E0B'}
                lineWidth={selectedBody === b.id ? 5.5 : 3.6}
                transparent
                opacity={isActiveRx ? 0.65 : 0.38}
              />
              <mesh position={[sdPin[0], 0.06, sdPin[2]]}>
                <cylinderGeometry args={[0.08, 0.08, 0.24, 12]} />
                <meshBasicMaterial color="#10B981" />
              </mesh>
              <mesh position={[srxPin[0], 0.06, srxPin[2]]}>
                <cylinderGeometry args={[0.08, 0.08, 0.24, 12]} />
                <meshBasicMaterial color="#EF4444" />
              </mesh>
            </group>
          );
        })}

      {viewMode === 'GEOCENTRIC' && (
        <Line
          points={nodalAxisPoints}
          color="#C8A45D"
          lineWidth={1}
          dashed
          dashSize={0.45}
          gapSize={0.35}
          transparent
          opacity={
            selectedBody && selectedBody !== 'NorthNode' && selectedBody !== 'SouthNode'
              ? 0.1
              : 0.35
          }
        />
      )}

      {/* Center Origin: Geocentric Earth vs Heliocentric Earth + Sightlines */}
      {viewMode === 'GEOCENTRIC' ? (
        <group position={[0, 0, 0]}>
          <mesh>
            <sphereGeometry args={[0.78, 32, 32]} />
            <meshStandardMaterial
              color="#1E3A5F"
              emissive="#0F2942"
              emissiveIntensity={0.45}
              metalness={0.45}
              roughness={0.45}
            />
          </mesh>
          <mesh rotation={[0.41, 0, 0]}>
            <torusGeometry args={[1.08, 0.03, 12, 64]} />
            <meshStandardMaterial color="#C8A45D" metalness={0.85} roughness={0.25} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.28, 1.34, 64]} />
            <meshBasicMaterial
              color="#C8A45D"
              transparent
              opacity={0.4}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      ) : (
        <group>
          <group position={layout.earthHelioPos}>
            <mesh>
              <sphereGeometry args={[0.34, 24, 24]} />
              <meshStandardMaterial
                color="#38BDF8"
                emissive="#0284C7"
                emissiveIntensity={0.65}
              />
            </mesh>
          </group>

          {layout.helioSightlines.map((sl) => (
            <group key={`sl-${sl.id}`}>
              <Line
                points={sl.points}
                color={sl.color}
                lineWidth={2.0}
                dashed
                dashSize={0.4}
                gapSize={0.22}
                transparent
                opacity={0.85}
              />
              <mesh position={sl.bezelHit}>
                <sphereGeometry args={[0.22, 16, 16]} />
                <meshBasicMaterial color={sl.color} />
              </mesh>
            </group>
          ))}
        </group>
      )}

      {/* 3D Aspect Laser / Chord Web */}
      {viewMode === 'GEOCENTRIC' &&
        layout.visibleAspects.map((asp) => {
          const pA = layout.bodyPositions[asp.bodyA].pos;
          const pB = layout.bodyPositions[asp.bodyB].pos;
          const dimmed =
            selectedBody !== null &&
            asp.bodyA !== selectedBody &&
            asp.bodyB !== selectedBody;
          return (
            <AspectBeam3D
              key={asp.id}
              aspect={asp}
              posA={pA}
              posB={pB}
              dimmed={dimmed}
            />
          );
        })}

      {/* Celestial Bodies */}
      {layout.visibleBodies.map((b) => {
        const bp = layout.bodyPositions[b.id];
        const isSelected = selectedBody === b.id;
        const isConnectedToSelected =
          selectedBody === null ||
          selectedBody === b.id ||
          layout.visibleAspects.some(
            (a) =>
              (a.bodyA === selectedBody && a.bodyB === b.id) ||
              (a.bodyB === selectedBody && a.bodyA === b.id),
          );
        const tier = layout.labelTiers[b.id] ?? 0;
        const stemHeight = 0.62 + tier * 0.68;
        return (
          <CelestialBodyMesh
            key={b.id}
            body={b}
            position={bp.pos}
            orbitRadius={bp.radius}
            orbitLon={bp.lon}
            isSelected={isSelected}
            isDimmed={!isConnectedToSelected}
            stemHeight={stemHeight}
            showStem={labelDensity !== 'OFF' && isConnectedToSelected}
            viewMode={viewMode}
            onSelect={(id) => onSelectBody(selectedBody === id ? null : id)}
          />
        );
      })}

      <EffectComposer multisampling={0}>
        <Bloom
          mipmapBlur
          luminanceThreshold={0.58}
          luminanceSmoothing={0.25}
          intensity={0.55}
        />
      </EffectComposer>
    </>
  );
}

export const CelestialArena3D: React.FC<CelestialArena3DProps> = ({
  snapshot,
  selectedBody,
  onSelectBody,
  onJumpToDate,
}) => {
  const [aspectFilter, setAspectFilter] = useState<AspectFilterMode>('ALL');
  const [macroOnly, setMacroOnly] = useState(false);
  const [showShadowZones, setShowShadowZones] = useState(true);
  const [viewMode, setViewMode] = useState<ViewCoordinateMode>('GEOCENTRIC');
  const [labelDensity, setLabelDensity] = useState<LabelDensityMode>('FULL');
  const [cameraPreset, setCameraPreset] = useState<{
    mode: 'PERSPECTIVE' | 'TOPDOWN';
    seq: number;
  }>({ mode: 'PERSPECTIVE', seq: 0 });

  const hudDomRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Compute deterministic 3D layout + anti-overlap HUD anchors shared between Canvas and Overlay
  const layout = useMemo<ComputedSceneLayout>(() => {
    const visibleBodies = snapshot.bodyList.filter((b) =>
      macroOnly ? b.tier !== 'INNER' : true,
    );

    const bodyPositions = {} as Record<
      BodyId,
      { pos: [number, number, number]; radius: number; lon: number }
    >;
    for (const b of snapshot.bodyList) {
      if (viewMode === 'GEOCENTRIC') {
        bodyPositions[b.id] = {
          pos: eclipticToWorld(b.elon, b.trackRadius, b.elat),
          radius: b.trackRadius,
          lon: b.elon,
        };
      } else {
        const r = b.helioTrackRadius;
        const lon = b.id === 'Sun' ? 0 : b.helioElon;
        bodyPositions[b.id] = {
          pos: r === 0 ? [0, 0, 0] : eclipticToWorld(lon, r, b.helioElat),
          radius: r,
          lon,
        };
      }
    }

    const earthHelioPos = eclipticToWorld(
      snapshot.earthHelio.elon,
      5.6,
      snapshot.earthHelio.elat,
    );

    const sorted = [...visibleBodies].sort(
      (a, b) => bodyPositions[a.id].lon - bodyPositions[b.id].lon,
    );
    const labelTiers: Partial<Record<BodyId, number>> = {};
    const occupiedSlots: Array<{ lon: number; tier: number }> = [];

    for (const b of sorted) {
      if (viewMode === 'HELIOCENTRIC' && b.id === 'Sun') {
        labelTiers[b.id] = 1;
        continue;
      }
      const lon = bodyPositions[b.id].lon;
      let chosenTier = 0;
      while (
        occupiedSlots.some((slot) => {
          const dLon = Math.abs(((lon - slot.lon + 540) % 360) - 180);
          return dLon < 16 && slot.tier === chosenTier;
        }) &&
        chosenTier < 4
      ) {
        chosenTier++;
      }
      labelTiers[b.id] = chosenTier;
      occupiedSlots.push({ lon, tier: chosenTier });
    }

    const visibleIds = new Set(visibleBodies.map((b) => b.id));
    const visibleAspects =
      aspectFilter === 'NONE'
        ? []
        : snapshot.aspects.filter((asp) => {
            if (!visibleIds.has(asp.bodyA) || !visibleIds.has(asp.bodyB)) {
              return false;
            }
            if (aspectFilter === 'HARD_ONLY' && !asp.isHard) return false;
            return true;
          });

    const helioSightlines =
      viewMode !== 'HELIOCENTRIC'
        ? []
        : (selectedBody
            ? [selectedBody]
            : (['Venus', 'Mars', 'Jupiter', 'Saturn'] as BodyId[])
          )
            .filter(
              (id) => id !== 'Sun' && id !== 'NorthNode' && id !== 'SouthNode',
            )
            .map((id) => {
              const b = snapshot.bodies[id];
              const pPlanet = bodyPositions[id].pos;
              const pBezel = eclipticToWorld(b.elon, BEZEL_INNER, 0);
              return {
                id,
                color: b.isRetrograde ? '#EF4444' : '#E3C582',
                points: [earthHelioPos, pPlanet, pBezel] as [
                  number,
                  number,
                  number,
                ][],
                bezelHit: pBezel,
                isRx: b.isRetrograde,
                glyph: b.glyph,
                dms: b.formattedCompact,
              };
            });

    const projectedAnchors: ProjectedAnchor[] = [];
    for (const b of visibleBodies) {
      const bp = bodyPositions[b.id].pos;
      const stemH = 0.62 + (labelTiers[b.id] ?? 0) * 0.68;
      projectedAnchors.push({
        key: `body-${b.id}`,
        worldPos: [bp[0], bp[1] + stemH + 0.08, bp[2]],
      });
    }
    if (viewMode === 'HELIOCENTRIC') {
      projectedAnchors.push({
        key: 'helio-earth',
        worldPos: [earthHelioPos[0], earthHelioPos[1] + 0.72, earthHelioPos[2]],
      });
      for (const sl of helioSightlines) {
        projectedAnchors.push({
          key: `sight-${sl.id}`,
          worldPos: [sl.bezelHit[0], 0.72, sl.bezelHit[2]],
        });
      }
    }

    return {
      visibleBodies,
      bodyPositions,
      earthHelioPos,
      labelTiers: labelTiers as Record<BodyId, number>,
      visibleAspects,
      helioSightlines,
      projectedAnchors,
    };
  }, [snapshot, macroOnly, viewMode, aspectFilter, selectedBody]);

  const focusedDetail = useMemo(() => {
    if (!selectedBody) return null;
    const body = snapshot.bodies[selectedBody];
    const nextStation = getNextStationForBody(selectedBody, snapshot.date);
    const nextIngress = getNextIngressForBody(selectedBody, snapshot.date);
    const activeAspects = snapshot.aspects.filter(
      (a) => a.bodyA === selectedBody || a.bodyB === selectedBody,
    );
    return { body, nextStation, nextIngress, activeAspects };
  }, [selectedBody, snapshot]);

  return (
    <section
      id="celestial-arena-viewport"
      aria-label="Interactive 3D Celestial Astrolabe"
      className="relative w-full h-[68vh] min-h-[520px] max-h-[820px] border-b border-[#C8A45D]/25 bg-[#07090E] overflow-hidden select-none"
    >
      {/* Top-Left Layer & Aspect Filter Controls Bar (z-20 above 3D HUD badges) */}
      <div className="pointer-events-none absolute top-3 left-3 right-3 z-20 flex flex-wrap items-start justify-between gap-2">
        <div className="pointer-events-auto flex flex-wrap items-center gap-1.5 rounded-md border border-slate-800/90 bg-[#0B0F17]/92 px-2.5 py-1.5 backdrop-blur-md shadow-xl">
          <span className="mr-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-[#C8A45D]">
            <Filter className="h-3 w-3" /> Filters
          </span>

          <button
            id="filter-all-aspects"
            type="button"
            onClick={() => setAspectFilter('ALL')}
            className={`rounded px-2 py-1 text-[11px] font-medium transition cursor-pointer ${
              aspectFilter === 'ALL'
                ? 'bg-[#C8A45D]/20 text-[#F3DC9F] border border-[#C8A45D]/60'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            All Aspects
          </button>

          <button
            id="filter-hard-aspects"
            type="button"
            onClick={() =>
              setAspectFilter(aspectFilter === 'HARD_ONLY' ? 'ALL' : 'HARD_ONLY')
            }
            className={`rounded px-2 py-1 text-[11px] font-medium transition cursor-pointer ${
              aspectFilter === 'HARD_ONLY'
                ? 'bg-red-500/20 text-red-300 border border-red-500/50'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            Hard / Volatility Only (0°, 90°, 180°)
          </button>

          <div className="h-3.5 w-[1px] bg-slate-800 mx-0.5" />

          <button
            id="filter-macro-only"
            type="button"
            onClick={() => setMacroOnly((v) => !v)}
            className={`flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium transition cursor-pointer ${
              macroOnly
                ? 'bg-amber-500/20 text-amber-200 border border-amber-500/50'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Orbit className="h-3 w-3" /> Macro / Slow Planets Only
          </button>

          <button
            id="filter-shadow-zones"
            type="button"
            onClick={() => setShowShadowZones((v) => !v)}
            className={`flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium transition cursor-pointer ${
              showShadowZones
                ? 'bg-rose-500/15 text-rose-200 border border-rose-500/45'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Sparkles className="h-3 w-3" /> Show Shadow Zones
          </button>

          <div className="h-3.5 w-[1px] bg-slate-800 mx-0.5" />

          <button
            id="toggle-coordinate-view"
            type="button"
            onClick={() =>
              setViewMode((m) => (m === 'GEOCENTRIC' ? 'HELIOCENTRIC' : 'GEOCENTRIC'))
            }
            className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer ${
              viewMode === 'HELIOCENTRIC'
                ? 'bg-sky-500/20 text-sky-200 border border-sky-400/60'
                : 'bg-[#131B2A] text-[#E3C582] border border-[#C8A45D]/40 hover:border-[#E3C582]'
            }`}
          >
            {viewMode === 'GEOCENTRIC' ? (
              <>
                <Globe className="h-3.5 w-3.5 text-sky-400" /> Geocentric Arena
              </>
            ) : (
              <>
                <SunMedium className="h-3.5 w-3.5 text-amber-400" /> Heliocentric + Sightline View
              </>
            )}
          </button>
        </div>

        {/* Top-Right Camera & HUD Label Controls */}
        <div className="pointer-events-auto flex items-center gap-1.5 rounded-md border border-slate-800/90 bg-[#0B0F17]/92 px-2 py-1.5 backdrop-blur-md shadow-xl">
          <button
            id="camera-perspective-btn"
            type="button"
            onClick={() =>
              setCameraPreset((p) => ({ mode: 'PERSPECTIVE', seq: p.seq + 1 }))
            }
            className="flex items-center gap-1 rounded px-2 py-1 text-[11px] text-slate-300 hover:bg-slate-800/80 hover:text-[#F3DC9F] cursor-pointer"
            title="45° 3D Astrolabe Perspective"
          >
            <Compass className="h-3.5 w-3.5 text-[#C8A45D]" /> 3D Tilt
          </button>
          <button
            id="camera-topdown-btn"
            type="button"
            onClick={() =>
              setCameraPreset((p) => ({ mode: 'TOPDOWN', seq: p.seq + 1 }))
            }
            className="flex items-center gap-1 rounded px-2 py-1 text-[11px] text-slate-300 hover:bg-slate-800/80 hover:text-[#F3DC9F] cursor-pointer"
            title="Top-Down 2D Precision Ecliptic View"
          >
            <Focus className="h-3.5 w-3.5 text-[#C8A45D]" /> Top-Down
          </button>
          <div className="h-3.5 w-[1px] bg-slate-800" />
          <button
            id="cycle-label-density-btn"
            type="button"
            onClick={() =>
              setLabelDensity((d) =>
                d === 'FULL' ? 'COMPACT' : d === 'COMPACT' ? 'OFF' : 'FULL',
              )
            }
            className="flex items-center gap-1 rounded px-2 py-1 text-[11px] text-slate-300 hover:bg-slate-800/80 cursor-pointer"
            title="Cycle 3D HUD Badge Density"
          >
            <Eye className="h-3.5 w-3.5 text-slate-400" /> HUD: {labelDensity}
          </button>
        </div>
      </div>

      {/* Heliocentric Educational Banner */}
      {viewMode === 'HELIOCENTRIC' && (
        <div className="pointer-events-none absolute top-15 left-3 z-20 max-w-md rounded border border-sky-500/40 bg-[#08111E]/92 px-3 py-2 text-xs text-sky-100 backdrop-blur-md">
          <div className="font-semibold text-sky-300">
            Heliocentric + Earth Sightline Mode Active
          </div>
          <p className="mt-0.5 text-[11px] leading-relaxed text-slate-300">
            Dashed sightlines project from <span className="text-sky-300">⊕ Earth</span> through
            each planet onto the outer 360° Tropical Zodiac Bezel. Scrub or play at{' '}
            <span className="font-mono-tabular text-[#F3DC9F]">7d/s</span> to watch Earth overtake
            outer/inner tracks and produce apparent retrograde (<span className="text-red-400">Rx</span>) loops.
          </p>
        </div>
      )}

      {/* Selected Planet Telemetry & Shadow Inspector Card (z-30) */}
      {focusedDetail && (
        <aside className="pointer-events-auto absolute top-15 right-3 z-30 w-80 rounded-md border border-[#C8A45D]/55 bg-[#0B0F17]/96 p-3.5 backdrop-blur-md shadow-2xl">
          <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl" style={{ color: focusedDetail.body.color }}>
                  {focusedDetail.body.glyph}
                </span>
                <h2 className="text-sm font-bold tracking-wide text-[#F3DC9F]">
                  {focusedDetail.body.name.toUpperCase()}
                </h2>
                {focusedDetail.body.stationState !== 'NONE' && (
                  <span className="rounded bg-rose-500/25 px-1.5 py-0.5 font-mono-tabular text-[10px] font-bold text-rose-300 border border-rose-500/50">
                    {focusedDetail.body.stationState}
                  </span>
                )}
                {focusedDetail.body.isRetrograde && (
                  <span className="rounded bg-red-500/20 px-1.5 py-0.5 font-mono-tabular text-[10px] font-bold text-red-300 border border-red-500/40">
                    RETROGRADE
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-[11px] text-slate-400">
                {focusedDetail.body.tierLabel}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onSelectBody(null)}
              className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
              aria-label="Clear planet focus"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-2.5 grid grid-cols-2 gap-2 font-mono-tabular text-[11px]">
            <div className="rounded bg-[#101624] p-2 border border-slate-800/80">
              <div className="text-[9.5px] uppercase text-slate-500">Ecliptic Pos</div>
              <div className="mt-0.5 font-semibold text-[#E6ECF5]">
                {focusedDetail.body.formattedDMS}
              </div>
              <div className="text-[10px] text-slate-400">
                λ {focusedDetail.body.elon.toFixed(3)}° · β{' '}
                {focusedDetail.body.elat >= 0 ? '+' : ''}
                {focusedDetail.body.elat.toFixed(2)}°
              </div>
            </div>
            <div className="rounded bg-[#101624] p-2 border border-slate-800/80">
              <div className="text-[9.5px] uppercase text-slate-500">Angular Velocity</div>
              <div
                className={`mt-0.5 font-semibold ${
                  focusedDetail.body.isRetrograde ? 'text-red-400' : 'text-emerald-400'
                }`}
              >
                {focusedDetail.body.degPerDay >= 0 ? '+' : ''}
                {focusedDetail.body.degPerDay.toFixed(4)}°/day
              </div>
              <div className="text-[10px] text-slate-400">
                Dist {focusedDetail.body.distanceAu.toFixed(3)} AU
              </div>
            </div>
          </div>

          {focusedDetail.body.shadowZone && (
            <div className="mt-2.5 rounded border border-rose-500/35 bg-rose-950/20 p-2.5 text-[11px]">
              <div className="flex items-center justify-between font-semibold text-rose-300">
                <span>
                  Active Shadow Zone (
                  {focusedDetail.body.shadowZone.phase.replace('_', '-')})
                </span>
                <span className="font-mono-tabular text-[10px]">
                  {focusedDetail.body.shadowZone.arcSpanDeg.toFixed(1)}° Arc
                </span>
              </div>
              <div className="mt-1 font-mono-tabular text-[10.5px] text-slate-300">
                Span: {focusedDetail.body.shadowZone.formattedSD} →{' '}
                {focusedDetail.body.shadowZone.formattedSRx}
              </div>
              <div className="mt-1.5 grid grid-cols-2 gap-1 font-mono-tabular text-[10px] text-slate-400">
                <button
                  type="button"
                  onClick={() => onJumpToDate(focusedDetail.body.shadowZone!.srxDate)}
                  className="rounded border border-slate-700/80 bg-[#0D1320] px-1.5 py-1 text-left hover:border-rose-400 cursor-pointer"
                >
                  SRx: {focusedDetail.body.shadowZone.srxDate.toISOString().slice(0, 10)}
                </button>
                <button
                  type="button"
                  onClick={() => onJumpToDate(focusedDetail.body.shadowZone!.sdDate)}
                  className="rounded border border-slate-700/80 bg-[#0D1320] px-1.5 py-1 text-left hover:border-emerald-400 cursor-pointer"
                >
                  SD: {focusedDetail.body.shadowZone.sdDate.toISOString().slice(0, 10)}
                </button>
              </div>
            </div>
          )}

          <div className="mt-2.5 space-y-1.5 text-[11px]">
            {focusedDetail.nextStation && (
              <button
                type="button"
                onClick={() => onJumpToDate(focusedDetail.nextStation!.date)}
                className="flex w-full items-center justify-between rounded border border-slate-800 bg-[#101624] px-2.5 py-1.5 text-left hover:border-[#C8A45D]/70 cursor-pointer"
              >
                <span className="text-slate-400">
                  Next Station ({focusedDetail.nextStation.type})
                </span>
                <span className="font-mono-tabular font-medium text-[#F3DC9F]">
                  {focusedDetail.nextStation.date.toISOString().slice(0, 10)} ·{' '}
                  {focusedDetail.nextStation.formattedPos}
                </span>
              </button>
            )}
            {focusedDetail.nextIngress && (
              <button
                type="button"
                onClick={() => onJumpToDate(focusedDetail.nextIngress!.date)}
                className="flex w-full items-center justify-between rounded border border-slate-800 bg-[#101624] px-2.5 py-1.5 text-left hover:border-[#C8A45D]/70 cursor-pointer"
              >
                <span className="text-slate-400">Next Ingress</span>
                <span className="font-mono-tabular font-medium text-[#E6ECF5]">
                  {focusedDetail.nextIngress.date.toISOString().slice(0, 10)} →{' '}
                  {focusedDetail.nextIngress.toSignGlyph}{' '}
                  {focusedDetail.nextIngress.toSign}
                </span>
              </button>
            )}
          </div>

          <div className="mt-2 text-[10px] text-slate-500">
            Showing {focusedDetail.activeAspects.length} active aspect beam(s). Click date pills to scrub.
          </div>
        </aside>
      )}

      {/* Zero-Portal Floating 3D HUD Badges Layer (z-10 cleanly beneath UI chrome) */}
      {labelDensity !== 'OFF' && (
        <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
          {layout.visibleBodies.map((body) => {
            const isSelected = selectedBody === body.id;
            const isConnected =
              selectedBody === null ||
              selectedBody === body.id ||
              layout.visibleAspects.some(
                (a) =>
                  (a.bodyA === selectedBody && a.bodyB === body.id) ||
                  (a.bodyB === selectedBody && a.bodyA === body.id),
              );
            if (!isConnected) return null;

            return (
              <div
                key={`hud-${body.id}`}
                ref={(el) => {
                  hudDomRefs.current[`body-${body.id}`] = el;
                }}
                style={{ left: 0, top: 0, opacity: 0 }}
                className="absolute will-change-transform"
              >
                <button
                  type="button"
                  onClick={() => onSelectBody(isSelected ? null : body.id)}
                  className={`flex items-center gap-1.5 whitespace-nowrap rounded border px-2 py-0.5 text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'border-[#F3DC9F] bg-[#131A29]/95 shadow-[0_0_16px_rgba(227,197,130,0.45)]'
                      : body.stationState !== 'NONE'
                        ? 'border-rose-500/80 bg-[#120D16]/92 shadow-[0_0_12px_rgba(244,63,94,0.35)]'
                        : body.isRetrograde
                          ? 'border-red-500/55 bg-[#0E121C]/90 hover:border-red-400'
                          : 'border-[#C8A45D]/35 bg-[#090D15]/88 hover:border-[#E3C582]/75'
                  }`}
                >
                  <span className="text-xs leading-none" style={{ color: body.color }}>
                    {body.glyph}
                  </span>
                  {labelDensity === 'FULL' && (
                    <span className="text-[11px] font-semibold tracking-tight text-[#E6ECF5]">
                      {body.name}
                    </span>
                  )}
                  <span className="font-mono-tabular text-[10.5px] text-[#C8A45D]">
                    {labelDensity === 'FULL'
                      ? `${String(body.deg).padStart(2, '0')}°${String(body.min).padStart(2, '0')}' ${body.signGlyph}${body.signShort}`
                      : `${String(body.deg).padStart(2, '0')}°${body.signGlyph}`}
                  </span>
                  {body.stationState !== 'NONE' ? (
                    <span className="animate-station-pulse rounded bg-rose-500/25 px-1 py-[1px] font-mono-tabular text-[9px] font-bold text-rose-300 border border-rose-500/50">
                      {body.stationState}
                    </span>
                  ) : body.isRetrograde ? (
                    <span className="rounded bg-red-500/20 px-1 py-[1px] font-mono-tabular text-[9px] font-bold text-red-300 border border-red-500/40">
                      Rx
                    </span>
                  ) : null}
                  {body.isAnaretic && (
                    <span className="rounded bg-amber-500/25 px-1 py-[1px] font-mono-tabular text-[9px] font-bold text-amber-300 border border-amber-400/50">
                      29°
                    </span>
                  )}
                </button>
              </div>
            );
          })}

          {viewMode === 'HELIOCENTRIC' && (
            <>
              <div
                ref={(el) => {
                  hudDomRefs.current['helio-earth'] = el;
                }}
                style={{ left: 0, top: 0, opacity: 0 }}
                className="pointer-events-none absolute will-change-transform"
              >
                <div className="rounded border border-sky-400/60 bg-[#08111D]/92 px-1.5 py-0.5 font-mono-tabular text-[10px] font-semibold text-sky-200 whitespace-nowrap">
                  ⊕ EARTH (Observer)
                </div>
              </div>
              {layout.helioSightlines.map((sl) => (
                <div
                  key={`sight-hud-${sl.id}`}
                  ref={(el) => {
                    hudDomRefs.current[`sight-${sl.id}`] = el;
                  }}
                  style={{ left: 0, top: 0, opacity: 0 }}
                  className="pointer-events-none absolute will-change-transform"
                >
                  <div className="rounded border border-[#E3C582]/60 bg-[#0B0F17]/92 px-1.5 py-0.5 font-mono-tabular text-[9.5px] text-[#F3DC9F] whitespace-nowrap">
                    Apparent {sl.glyph} {sl.dms} {sl.isRx ? '(Rx Loop)' : ''}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* Bottom-Left Concentric Timeframe Ring & Aspect Laser Legend (z-20) */}
      <div className="pointer-events-none absolute bottom-3 left-3 right-3 z-20 flex flex-wrap items-end justify-between gap-2">
        <div className="pointer-events-auto flex flex-wrap items-center gap-3 rounded border border-slate-800/90 bg-[#0B0F17]/92 px-3 py-1.5 text-[10.5px] text-slate-300 backdrop-blur-md">
          <span className="flex items-center gap-1 font-semibold uppercase tracking-wider text-[#C8A45D]">
            <Layers className="h-3 w-3" /> Aspect Beams:
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#EF4444]" /> 90° Square (Friction)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#F59E0B]" /> 180° Opposition (Tension)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#EAB308]" /> 0° Conjunction (Fusion)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#10B981]" /> 120° Trine (Flow)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#14B8A6]" /> 60° Sextile (Channel)
          </span>
        </div>

        {/* Quick Body Selector Strip */}
        <div className="pointer-events-auto flex flex-wrap items-center gap-1 rounded border border-slate-800/90 bg-[#0B0F17]/92 px-2 py-1 backdrop-blur-md">
          {snapshot.bodyList.map((b) => {
            const active = selectedBody === b.id;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => onSelectBody(active ? null : b.id)}
                title={`${b.name}: ${b.formattedDMS}${b.isRetrograde ? ' (Rx)' : ''}`}
                className={`flex items-center gap-1 rounded px-1.5 py-0.5 font-mono-tabular text-[10.5px] transition cursor-pointer ${
                  active
                    ? 'bg-[#C8A45D]/25 text-[#F3DC9F] border border-[#F3DC9F]/70'
                    : b.isRetrograde
                      ? 'text-red-300 hover:bg-slate-800/80 border border-red-500/30'
                      : 'text-slate-300 hover:bg-slate-800/80 border border-transparent'
                }`}
              >
                <span style={{ color: b.color }}>{b.glyph}</span>
                {b.isRetrograde && <span className="text-[8.5px] text-red-400">Rx</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Three.js WebGL Viewport */}
      <Canvas
        camera={{ position: [0, 30.5, 33.5], fov: 42, near: 0.1, far: 190 }}
        dpr={[1, 2]}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <AstrolabeScene
          snapshot={snapshot}
          layout={layout}
          selectedBody={selectedBody}
          onSelectBody={onSelectBody}
          macroOnly={macroOnly}
          showShadowZones={showShadowZones}
          viewMode={viewMode}
          labelDensity={labelDensity}
          cameraPreset={cameraPreset}
          hudDomRefs={hudDomRefs}
        />
      </Canvas>
    </section>
  );
};
