import type { Project, TeamMember } from './types';

export const MOCK_PROJECTS: Project[] = [
  {
    id: 'unit-omega-01',
    code: 'P-OMEGA-01',
    title: 'AETHELGARD: THE SENTIENT CITY',
    client: 'Turing Matrix',
    category: 'PERSONAL',
    tags: ['TENSOR', 'VISION', 'LOW_LATENCY'],
    image: 'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?q=80&w=700&auto=format&fit=crop',
    summary: 'Autonomous spatial perception cluster and optical gaze inference model.',
    year: 2026,
  },
  {
    id: 'unit-p1',
    code: 'P1',
    title: 'NEON SKYLINE',
    client: 'Quantum Labs',
    category: 'PERSONAL',
    tags: ['BIOMECHANICS', 'HERMITE', 'INTENT_ACC'],
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=700&auto=format&fit=crop',
    summary: 'Sub-pixel capacitive filtering and cubic Hermite velocity damping.',
    year: 2026,
  },
  {
    id: 'unit-p11',
    code: 'P11',
    title: 'AETHERIA PROTOCOL',
    client: 'Voxel Horizon',
    category: 'TEAM',
    tags: ['GPU_COMPO', 'CSS_VARS', 'ZERO_VDOM'],
    image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=700&auto=format&fit=crop',
    summary: 'Zero-render design system streaming 60fps CSS custom properties.',
    year: 2025,
  },
  {
    id: 'unit-p13',
    code: 'P13',
    title: 'VAPORWAVE VISTA',
    client: 'Klang Soundworks',
    category: 'TEAM',
    tags: ['DSP_AUDIO', 'SPATIAL', 'REACT_19'],
    image: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=700&auto=format&fit=crop',
    summary: 'Capacitive audio envelope engine reacting to finger hover velocity.',
    year: 2025,
  },
  {
    id: 'unit-p3',
    code: 'P3',
    title: 'TECHFLOW MOTION',
    client: 'Synapse Core',
    category: 'PERSONAL',
    tags: ['ARBITRATION', 'DUAL_CHANNEL', 'GAZE'],
    image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=700&auto=format&fit=crop',
    summary: 'Multi-target authority coordinator balancing gaze anchors with touch latches.',
    year: 2024,
  },
  {
    id: 'unit-p10',
    code: 'P10',
    title: 'NEBULA COMPUTE',
    client: 'Apex Creative',
    category: 'TEAM',
    tags: ['SHADERS', 'WEBGL', 'TOUCH_HYGIENE'],
    image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=700&auto=format&fit=crop',
    summary: 'High-frequency telemetry pipeline binding micro-interactions to gestures.',
    year: 2024,
  },
];

export const MOCK_TEAM: TeamMember[] = [
  {
    id: '01',
    name: 'EaZY',
    role: 'Creative Director',
    style: 'Direction',
    specialties: ['Art Direction', 'Spatial Math', 'Systems'],
    mainColor: '#ff3300',
    personalityQuote: 'Form follows fiction: build systems that feel alive.',
    personalityQuirk: 'Tests touch ergonomics on 4 physical phones daily.',
    revealType: 'bold',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=700&auto=format&fit=crop',
    status: 'ACTIVE',
  },
  {
    id: '02',
    name: 'Esther',
    role: 'Lead UI/UX Designer',
    style: 'Precision',
    specialties: ['Editorial Layouts', 'Typography', 'Figma'],
    mainColor: '#00f0ff',
    personalityQuote: 'Precision is the only aesthetic that never degrades over time.',
    personalityQuirk: 'Demands 8pt grid alignment on sub-pixel borders.',
    revealType: 'precise',
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=700&auto=format&fit=crop',
    status: 'ACTIVE',
  },
  {
    id: '03',
    name: 'Whale',
    role: 'Brand Specialist',
    style: 'Narrative',
    specialties: ['Editorial Concept', 'Tone of Voice', 'Identity'],
    mainColor: '#ff0055',
    personalityQuote: 'Every interface tells a story before a single tap occurs.',
    personalityQuirk: 'Refuses to use generic stock templates under any circumstance.',
    revealType: 'narrative',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=700&auto=format&fit=crop',
    status: 'ACTIVE',
  },
  {
    id: '04',
    name: 'Eric',
    role: 'Creative Technologist',
    style: 'Rapid Prototype',
    specialties: ['WebGL Shaders', 'Vite', 'Hardware'],
    mainColor: '#ffd700',
    personalityQuote: 'If it runs at 59 frames per second, it is already broken.',
    personalityQuirk: 'Compiles custom WebGL shaders for hover micro-textures.',
    revealType: 'rapid',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=700&auto=format&fit=crop',
    status: 'ACTIVE',
  },
  {
    id: '05',
    name: 'Kai',
    role: 'Motion Designer',
    style: 'Kinetic',
    specialties: ['GSAP Choreography', 'Physics Springs', 'Sound'],
    mainColor: '#10b981',
    personalityQuote: 'Kinetic inertia should mirror the weight of physical glass.',
    personalityQuirk: 'Tunes cubic bezier timing curves by ear and tactile response.',
    revealType: 'kinetic',
    image: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=700&auto=format&fit=crop',
    status: 'ACTIVE',
  },
  {
    id: '06',
    name: 'Luna',
    role: 'Visual Artist',
    style: 'Organic',
    specialties: ['3D Modeling', 'Photogrammetry', 'Textures'],
    mainColor: '#8b5cf6',
    personalityQuote: 'Digital warmth comes from subtle imperfections and grain.',
    personalityQuirk: 'Collects CRT monitor phosphors for digital texture overlays.',
    revealType: 'organic',
    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=700&auto=format&fit=crop',
    status: 'ACTIVE',
  },
];

export const CODE_SNIPPETS: Record<string, string> = {
  'Mainframe.dx.tsx': `// [HOVERSENSE DX] Turnkey container with zero-render CSS variables and automatic mutation tracking
import React, { useEffect, useRef } from 'react';
import { createHoverSenseContainer } from 'hoversense';
import 'hoversense/dist/hoversense.css';

export const MainframeDX = ({ projects }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // 1-line turnkey initialization:
    // - Automatically binds touch hygiene (pan-y, prevents iOS callouts)
    // - Streams continuous strength (0.0 to 1.0) directly into CSS custom properties (--hs-strength)
    // - Subscribes MutationObserver for dynamic tab filtering
    const controller = createHoverSenseContainer(containerRef.current, {
      itemSelector: '[data-hs-item]',
      screen: {
        anchorRatio: 0.28, // Eye-gaze reading horizon (placed between 0.26 and 0.30)
        bandRatio: 0.30,   // Responsive falloff transition band
        rowSplit: 0.0,     // 1 column tactical rack layout
      },
      touch: {
        engageAt: 0.90,    // 90% intent required for touch lock
        holdMsMin: 320,
        scrollLockGraceMs: 220,
      },
      arbitration: {
        releaseMode: 'off-screen',
        takeoverStartPx: 180,
        takeoverFullPx: 560,
      },
    });

    return () => controller.destroy();
  }, []);

  return (
    <div ref={containerRef} className="mainframe-rack">
      <div className="rack-header">
        <span>UNIT_ID</span>
        <span>STATUS</span>
      </div>

      {projects.map((project) => (
        <article
          key={project.id}
          data-hs-item
          data-hs-id={project.id}
          className="rack-item"
        >
          <div className="unit-meta">
            <span className="unit-code">{project.code}</span>
            <h3 className="unit-title">{project.title}</h3>
          </div>
          <span className="status-dot" />

          {/* Floating Mobile Portrait Peek Popup (Shown on Gaze Anchor or Touch Latch) */}
          <div className="mobile-portrait-peek">
            <div className="peek-crt-noise" />
            <div className="peek-image-wrap">
              <img src={project.image} alt={project.title} loading="lazy" />
              <span className="peek-badge">PREV</span>
            </div>
            <h4 className="peek-title">{project.title}</h4>
            <div className="peek-footer">
              <span className="peek-live-indicator">
                <span className="pulse-dot" /> LIVE
              </span>
              <span className="peek-access-text">ACCESS →</span>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
};`,

  'Mainframe.original.tsx': `// [ORIGINAL CODE] Hand-rolled Mainframe with manual refs, state thrashing, and GSAP collisions
import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useHoverSense } from '../../lib/hoversense';

export const Mainframe = ({ eazyProjects, allProjects, onSelect }) => {
  const [scope, setScope] = useState<'PERSONAL' | 'TEAM'>('PERSONAL');
  const displayProjects = scope === 'PERSONAL' ? eazyProjects : allProjects;
  const [hoveredProject, setHoveredProject] = useState(displayProjects[0]);
  const [showMobileHint, setShowMobileHint] = useState(true);
  const [isInMainframeView, setIsInMainframeView] = useState(false);
  
  const isMobile = typeof window !== 'undefined' ? (window.innerWidth < 1024 || 'ontouchstart' in window) : false;
  const sectionRef = useRef(null);
  const terminalRef = useRef(null);
  const itemRefs = useRef(new Map());
  const lastHoveredIdRef = useRef(null);

  // Raw hook requiring manual item ref plumbing
  const { hits, register } = useHoverSense({
    screen: { anchorRatio: 0.28, bandRatio: 0.30, resolve: 'global', rowSplit: 0.0 },
    touch: { engageAt: 0.90, holdMsMin: 320, holdMsMax: 1200, scrollLockGraceMs: 220 },
    arbitration: { releaseMode: 'off-screen', takeoverStartPx: 180, takeoverFullPx: 560 },
    modes: { screen: true, touch: true },
    enabled: isMobile && isInMainframeView
  });

  // IntersectionObserver to enable/disable engine
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIsInMainframeView(entry.isIntersecting);
    }, { threshold: 0.15 });
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // Frame re-renders: continuous hits trigger state updates at 60fps
  useEffect(() => {
    if (!isMobile || !isInMainframeView) return;
    const topHit = hits[0];
    if (topHit && topHit.id !== lastHoveredIdRef.current) {
      const target = displayProjects.find(p => p.id === topHit.id);
      if (target) {
        lastHoveredIdRef.current = target.id;
        setHoveredProject(target); // Causes entire React tree re-render!
        setShowMobileHint(true);
      }
    }
  }, [hits, isMobile, isInMainframeView, displayProjects]);

  return (
    <section ref={sectionRef} className="mainframe-rack">
      {displayProjects.map((project) => (
        <div 
          key={project.id}
          ref={el => {
            if (el) { itemRefs.current.set(project.id, el); register(project.id, el); }
            else { itemRefs.current.delete(project.id); register(project.id, null); }
          }}
          onMouseEnter={() => setHoveredProject(project)}
          onTouchStart={() => { setHoveredProject(project); setShowMobileHint(true); }}
        >
          <h4>{project.title}</h4>
          {/* Mobile portrait popup mounts conditionally */}
          {isMobile && isInMainframeView && hoveredProject?.id === project.id && showMobileHint && (
            <div className="mobile-portrait-peek">
              <img src={project.image} alt={project.title} />
            </div>
          )}
        </div>
      ))}
    </section>
  );
};`,

  'TeamGrid.dx.tsx': `// [HOVERSENSE DX] TeamGrid with native dual-channel arbitration (Gaze Horizon + Touch Intent)
import React, { useEffect, useRef } from 'react';
import { createHoverSenseContainer } from 'hoversense';

export const TeamGridDX = ({ members }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Both screen channel AND touch channel active out of the box!
    const controller = createHoverSenseContainer(containerRef.current, {
      itemSelector: '[data-hs-item]',
      screen: {
        anchorRatio: 0.50, // Center focal horizon for scattered cards
        bandRatio: 0.42,
        resolve: 'global',
      },
      touch: {
        engageAt: 0.85,
        holdMsMin: 280,
        clearLatchOnTap: true,
      },
    });

    return () => controller.destroy();
  }, []);

  return (
    <div ref={containerRef} className="collective-container">
      {/* Background Typographic Statement */}
      <div className="background-giant-text">
        <span>THE COLLECTIVE</span>
        <h1>WE ARE EaZY</h1>
      </div>

      {/* Foreground Scattered Cards */}
      <div className="scattered-cards-layer">
        {members.map((member, index) => (
          <div
            key={member.id}
            data-hs-item
            data-hs-id={member.id}
            className={\`team-card card-pos-\${index}\`}
          >
            {/* B/W to Color image transition driven by GPU compositor */}
            <img src={member.image} alt={member.name} className="bw-to-color-img" />
            <div className="editorial-scrim" />
            <div className="card-content">
              <span className="specialty-tag">{member.style}</span>
              <p className="personality-quote">“{member.personalityQuote}”</p>
              <div className="card-bottom">
                <h3>{member.name}</h3>
                <span>{member.role}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};`,

  'TeamGrid.original.tsx': `// [ORIGINAL CODE] Hand-rolled TeamGrid with manual scroll listener and screen-only focal math
import React, { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';

export const TeamGrid = ({ displayMembers }) => {
  const [activeMobileIndex, setActiveMobileIndex] = useState<number | null>(null);
  const cardWrapperRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Manual viewport center calculation: lacks touch intent accumulation or safe zones
  useEffect(() => {
    const handleScrollOrTouch = () => {
      if (typeof window === 'undefined' || window.innerWidth >= 768) {
        if (activeMobileIndex !== null) setActiveMobileIndex(null);
        return;
      }

      const viewportCenterY = window.innerHeight / 2;
      let closestIdx: number | null = null;
      let minDistance = Infinity;

      cardWrapperRefs.current.forEach((el, idx) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        if (rect.bottom > 60 && rect.top < window.innerHeight - 60) {
          const cardCenterY = rect.top + rect.height / 2;
          const dist = Math.abs(cardCenterY - viewportCenterY);
          if (dist < minDistance) {
            minDistance = dist;
            closestIdx = idx;
          }
        }
      });

      const newIndex = (closestIdx !== null && minDistance < 360) ? closestIdx : null;
      setActiveMobileIndex(prev => (prev === newIndex ? prev : newIndex));
    };

    window.addEventListener('scroll', handleScrollOrTouch, { passive: true });
    window.addEventListener('touchmove', handleScrollOrTouch, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScrollOrTouch);
      window.removeEventListener('touchmove', handleScrollOrTouch);
    };
  }, [activeMobileIndex]);

  return (
    <div className="collective-stage">
      {displayMembers.map((member, index) => (
        <div 
          key={member.id}
          ref={el => { cardWrapperRefs.current[index] = el; }}
          className={\`card-wrap \${activeMobileIndex === index ? 'active' : ''}\`}
        >
          <img src={member.image} alt={member.name} />
          <p className="quote">“{member.personalityQuote}”</p>
        </div>
      ))}
    </div>
  );
};`,

  'hoversense.css': `/* HoverSense Zero-Render 60fps CSS Custom Property Stylesheet */
[data-hs-item] {
  --hs-strength: 0;
  --hs-source: idle;
  touch-action: pan-y;
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
  will-change: transform, filter, box-shadow;
  transition: transform 90ms linear, filter 90ms linear, box-shadow 90ms linear;
}

/* Tactical Mainframe Unit */
.rack-unit-item[data-hs-item] {
  border-left-color: color-mix(in srgb, var(--accent, #ff3300) calc(var(--hs-strength, 0) * 100%), #222);
}

/* Floating Portrait Peek Popup */
.mobile-portrait-peek {
  opacity: var(--hs-strength, 0);
  transform: scale(calc(0.92 + var(--hs-strength, 0) * 0.08));
  pointer-events: calc(var(--hs-strength, 0) > 0.5 ? auto : none);
  transition: opacity 120ms linear, transform 120ms cubic-bezier(0.16, 1, 0.3, 1);
}

/* TeamGrid Scattered Card Filter & Scale */
.team-card[data-hs-item] {
  transform: scale(calc(1 + var(--hs-strength, 0) * 0.08));
}

.team-card[data-hs-item] .bw-to-color-img {
  filter: grayscale(calc((1 - var(--hs-strength, 0)) * 100%))
          contrast(calc(125% - var(--hs-strength, 0) * 20%));
}

.team-card[data-hs-item] .personality-quote {
  opacity: var(--hs-strength, 0);
  transform: translateY(calc((1 - var(--hs-strength, 0)) * 8px));
  transition: opacity 90ms linear, transform 90ms linear;
}`,
};
