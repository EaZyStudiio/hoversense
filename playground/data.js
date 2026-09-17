/**
 * HoverSense DX Playground - Dataset & Code Snippets
 *
 * Mock projects inspired by The Mainframe and The Collective,
 * stripped of proprietary details and paired with curated Unsplash photography.
 */

export const MOCK_PROJECTS = [
  {
    id: 'UNIT_01',
    title: 'Neural Archive',
    subtitle: 'Autonomous Knowledge Matrix',
    category: 'Cybernetics',
    client: 'Synth Dynamics',
    status: 'ACTIVE',
    tags: ['NEURAL', 'GRAPH', 'INDEX'],
    accent: '#ff3300',
    image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=700&q=80',
    quote: 'Self-indexing knowledge clusters organized by semantic proximity.'
  },
  {
    id: 'UNIT_02',
    title: 'Quantum Relay',
    subtitle: 'Sub-Orbital Telemetry Hub',
    category: 'Hardware',
    client: 'Orbital Defense',
    status: 'SYNCHED',
    tags: ['TELEMETRY', 'RF', 'SAT'],
    accent: '#0ea5e9',
    image: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=700&q=80',
    quote: 'Zero-latency downlink processor bridging ground stations and low-earth orbit.'
  },
  {
    id: 'UNIT_03',
    title: 'Biometric Grid',
    subtitle: 'Haptic Surface Topology',
    category: 'Sensors',
    client: 'BioTech Corp',
    status: 'ACTIVE',
    tags: ['HAPTICS', 'SENSORS', 'DSP'],
    accent: '#10b981',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=700&q=80',
    quote: 'Sub-millimeter tactile resolution mapped to dynamic piezoelectric grids.'
  },
  {
    id: 'UNIT_04',
    title: 'Synthetic Void',
    subtitle: 'Procedural Shader Core',
    category: 'Graphics',
    client: 'Studio EaZY',
    status: 'SYNCHED',
    tags: ['WEBGL', 'SHADERS', 'SIM'],
    accent: '#f59e0b',
    image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=700&q=80',
    quote: 'Volumetric raymarching engine for reactive real-time installations.'
  },
  {
    id: 'UNIT_05',
    title: 'Chrono Drift',
    subtitle: 'Spectral Time Sequencer',
    category: 'Acoustics',
    client: 'Deep Time Lab',
    status: 'STANDBY',
    tags: ['AUDIO', 'SPECTRAL', 'MIDI'],
    accent: '#8b5cf6',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=700&q=80',
    quote: 'Phase-aligned microtonal sequencer operating on non-linear time scales.'
  },
  {
    id: 'UNIT_06',
    title: 'Hyper Thread',
    subtitle: 'Distributed Node Fabric',
    category: 'Protocol',
    client: 'Protocol Labs',
    status: 'ACTIVE',
    tags: ['P2P', 'MESH', 'CRYPTO'],
    accent: '#ec4899',
    image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=700&q=80',
    quote: 'Decentralized gossip protocol with zero-knowledge proof propagation.'
  }
];

export const DEFAULT_PLAYGROUND_CONFIG = {
  screen: {
    anchorRatio: 0.28,
    bandRatio: 0.30,
    resolve: 'all',
    rowSplit: 1.0
  },
  touch: {
    engageAt: 0.90,
    holdMsMin: 320,
    holdMsMax: 1200,
    scrollLockGraceMs: 220,
    scrollLockAxisRatio: 1.3,
    dragDeadzonePx: 9,
    dragFullPx: 46,
    outerFalloffPx: 42,
    inBetweenRatio: 0.40
  },
  arbitration: {
    releaseMode: 'off-screen',
    takeoverStartPx: 180,
    takeoverFullPx: 560
  }
};

export const CODE_SNIPPETS = {
  dx: `// Mainframe.dx.tsx: Turnkey HoverSense Developer Experience
// Zero React Virtual DOM re-renders during 60fps drag or scroll!

import React, { useEffect, useRef } from 'react';
import { createHoverSenseContainer } from 'hoversense';
import 'hoversense/dist/hoversense.css';

export const MainframeRack = ({ projects, onSelect }) => {
  const rackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rackRef.current) return;

    // 1-LINE SETUP: Configures mobile touch hygiene (pan-y, callout suppression),
    // discovers items, injects CSS variables (--hs-strength), and mounts SVG dwell feedback
    const controller = createHoverSenseContainer(rackRef.current, {
      itemSelector: '[data-hs-item]',
      bindCssVariables: true,
      feedback: true,
      screen: {
        anchorRatio: 0.28, // Eye gaze horizon
        bandRatio: 0.30,   // Soft crossfade band
        rowSplit: 1.0,     // Staggers asymmetric 2x3 columns cleanly
      },
      touch: {
        engageAt: 0.90,    // 90% confidence required to latch
        holdMsMin: 320,    // 320ms hold dwell (under OS 500ms menu)
      }
    });

    return () => controller.destroy();
  }, [projects]);

  return (
    <div ref={rackRef} className="rack-grid-2x3 hs-stage">
      {projects.map(p => (
        <article
          key={p.id}
          data-hs-item
          data-hs-id={p.id}
          onClick={() => onSelect(p)}
          className="rack-card hs-item"
        >
          <span className="unit-id">{p.id}</span>
          <h3>{p.title}</h3>

          {/* Mobile Image Peek: Driven by CSS variables without re-rendering */}
          <div className="mobile-portrait-peek">
            <img src={p.image} alt={p.title} loading="lazy" />
          </div>
        </article>
      ))}
    </div>
  );
};`,

  original: `// Mainframe.original.tsx: Legacy Manual Implementation
// Pitfalls: ~140 LOC boilerplate, 60 React re-renders/sec, missing touch hygiene

import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useHoverSense } from '../../lib/hoversense';

export const Mainframe = ({ projects, onSelect }) => {
  const [hoveredProject, setHoveredProject] = useState(projects[0]);
  const itemRefs = useRef(new Map());
  const lastHoveredIdRef = useRef(null);

  // Manual engine setup with raw math hits
  const { hits, register } = useHoverSense({
    screen: { anchorRatio: 0.28, bandRatio: 0.30 },
    touch: { engageAt: 0.90, holdMsMin: 320 }
  });

  // PITFALL 1: Frame-by-frame state updates trigger React Virtual DOM re-renders!
  // At 60fps scrolling, re-rendering 50 items causes mobile dropped frames.
  useEffect(() => {
    const topHit = hits[0];
    if (topHit && topHit.id !== lastHoveredIdRef.current) {
      const found = projects.find(p => p.id === topHit.id);
      if (found) {
        lastHoveredIdRef.current = found.id;
        setHoveredProject(found); // React re-render thrash
      }
    }
  }, [hits, projects]);

  return (
    <div className="flex flex-col gap-2">
      {projects.map(project => (
        <div
          key={project.id}
          // PITFALL 2: Manual ref mapping callback for every DOM node
          ref={el => {
            if (el) {
              itemRefs.current.set(project.id, el);
              register(project.id, el);
            } else {
              itemRefs.current.delete(project.id);
              register(project.id, null);
            }
          }}
          // PITFALL 3: Manual touch handler conflicts with native scroll & callouts
          onTouchStart={() => setHoveredProject(project)}
          className={hoveredProject?.id === project.id ? 'active' : ''}
        >
          <h3>{project.title}</h3>
        </div>
      ))}
    </div>
  );
};`,

  styles: `/* styles.css: Pure GPU Hardware-Accelerated Transforms */
/* Driven entirely by HoverSense CSS Custom Properties */

.rack-card {
  position: relative;
  background: #0d0f14;
  border: 1px solid #1e2230;
  border-radius: 8px;
  padding: 16px;
  overflow: hidden;

  /* 90ms linear transition provides optimal tactile response */
  transition:
    transform 90ms linear,
    border-color 90ms linear,
    box-shadow 90ms linear;

  /* GPU transform driven by --hs-strength (0.000 to 1.000) */
  transform: scale(calc(1 + var(--hs-strength, 0) * 0.035))
             translateY(calc(var(--hs-strength, 0) * -4px));

  border-color: color-mix(in srgb, #ff3300 calc(var(--hs-strength, 0) * 100%), #1e2230);
  box-shadow: 0 10px calc(var(--hs-strength, 0) * 28px) rgba(0, 0, 0, calc(var(--hs-strength, 0) * 0.5));
}

/* Mobile Portrait Peek: Hidden by default, expands when strength accumulates */
.mobile-portrait-peek {
  max-height: calc(var(--hs-strength, 0) * 160px);
  opacity: var(--hs-strength, 0);
  transition: max-height 120ms ease, opacity 90ms linear;
  overflow: hidden;
  border-radius: 6px;
  margin-top: 10px;
}`
};
