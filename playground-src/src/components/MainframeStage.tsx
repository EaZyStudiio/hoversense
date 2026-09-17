import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import type { Project, TelemetryData, TuningConfig } from '../types';
import { HoverSense, type HoverSenseState, type HoverHit } from '../../../src';

interface MainframeStageProps {
  projects: Project[];
  tuning: TuningConfig;
  onTelemetryUpdate: (data: TelemetryData) => void;
}

export const MainframeStage: React.FC<MainframeStageProps> = ({
  projects,
  tuning,
  onTelemetryUpdate,
}) => {
  const [scope, setScope] = useState<'PERSONAL' | 'TEAM'>('PERSONAL');
  const [activeProject, setActiveProject] = useState<Project>(projects[0]);
  const [staggerOffset, setStaggerOffset] = useState<number>(tuning.staggerOffset || 140);

  const containerRef = useRef<HTMLDivElement>(null);
  const terminalImgRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<HoverSense | null>(null);
  const lastActiveIdRef = useRef<string | null>(null);

  const filteredProjects = projects.filter((p) =>
    scope === 'PERSONAL' ? p.category === 'PERSONAL' : true
  );

  // Initialize and reconfigure HoverSense engine
  useEffect(() => {
    if (!containerRef.current) return;

    const engine = new HoverSense(
      {
        screen: {
          anchorRatio: tuning.anchorRatio,
          bandRatio: tuning.bandRatio,
          resolve: 'global',
          rowSplit: tuning.rowSplit,
        },
        touch: {
          engageAt: tuning.engageAt,
          holdMsMin: tuning.holdMsMin,
          holdMsMax: tuning.holdMsMax,
          scrollLockGraceMs: 220,
          scrollLockAxisRatio: 1.3,
          dragDeadzonePx: 9,
          dragFullPx: 46,
        },
        arbitration: {
          releaseMode: 'off-screen',
          takeoverStartPx: 160,
          takeoverFullPx: 500,
        },
        modes: {
          screen: true,
          touch: true,
        },
        bindCssVariables: true,
        feedback: true,
      },
      containerRef.current
    );

    engineRef.current = engine;

    const handleState = (state: HoverSenseState) => {
      const topHit = state.hits[0] as HoverHit | undefined;
      const activeId = topHit ? topHit.id : null;

      onTelemetryUpdate({
        phase: state.debug.phase,
        intent: state.debug.intent,
        authority: state.debug.authority,
        activeId: activeId,
        source: topHit ? topHit.source : 'idle',
        strength: topHit ? topHit.strength : 0,
        zoneWeight: state.debug.zoneWeight,
      });

      if (activeId && activeId !== lastActiveIdRef.current) {
        lastActiveIdRef.current = activeId;
        const found = projects.find((p) => p.id === activeId);
        if (found) {
          setActiveProject(found);
        }
      }
    };

    engine.onState(handleState);

    // Register items
    const items = containerRef.current.querySelectorAll<HTMLElement>('[data-hs-item]');
    items.forEach((el) => {
      const id = el.getAttribute('data-hs-id');
      if (id) engine.register(id, el);
    });

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [tuning, projects]);

  // Re-register when filtered list changes
  useEffect(() => {
    if (!engineRef.current || !containerRef.current) return;
    const items = containerRef.current.querySelectorAll<HTMLElement>('[data-hs-item]');
    items.forEach((el) => {
      const id = el.getAttribute('data-hs-id');
      if (id) engineRef.current?.register(id, el);
    });
  }, [filteredProjects]);

  // GSAP Glitch effect when activeProject changes on desktop terminal
  useEffect(() => {
    if (!terminalImgRef.current) return;
    gsap.fromTo(
      terminalImgRef.current,
      { filter: 'grayscale(100%) contrast(150%) hue-rotate(90deg)' },
      { filter: 'grayscale(0%) contrast(100%) hue-rotate(0deg)', duration: 0.35, ease: 'power2.out' }
    );
    gsap.fromTo(
      terminalImgRef.current,
      { x: -6 },
      { x: 0, duration: 0.08, yoyo: true, repeat: 3 }
    );
  }, [activeProject]);

  const col1Projects = filteredProjects.filter((_, i) => i % 2 === 0);
  const col2Projects = filteredProjects.filter((_, i) => i % 2 === 1);

  return (
    <div className="mainframe-stage-wrapper">
      {/* Scope and Stagger Offset Toolbar */}
      <div className="stage-subnav">
        <div className="scope-pills">
          <button
            type="button"
            className={`subnav-pill ${scope === 'PERSONAL' ? 'active' : ''}`}
            onClick={() => setScope('PERSONAL')}
          >
            Personal Units ({projects.filter((p) => p.category === 'PERSONAL').length})
          </button>
          <button
            type="button"
            className={`subnav-pill ${scope === 'TEAM' ? 'active' : ''}`}
            onClick={() => setScope('TEAM')}
          >
            Full Studio Rack ({projects.length})
          </button>
        </div>

        <div className="offset-controls">
          <span className="mono-label">COL 2 STAGGER:</span>
          {[80, 140, 200].map((off) => (
            <button
              key={off}
              type="button"
              className={`offset-pill ${staggerOffset === off ? 'active' : ''}`}
              onClick={() => setStaggerOffset(off)}
            >
              {off}px
            </button>
          ))}
        </div>
      </div>

      {/* Main Dual-Column Content Layout */}
      <div className="mainframe-columns-grid">
        {/* LEFT: 2 x 3 Staggered Rack */}
        <div ref={containerRef} className="mainframe-rack-container">
          <div className="rack-columns-wrap">
            {/* Column 1 */}
            <div className="rack-col">
              {col1Projects.map((project) => (
                <article
                  key={project.id}
                  data-hs-item
                  data-hs-id={project.id}
                  className="rack-unit-card"
                  onClick={() => setActiveProject(project)}
                >
                  <div className="unit-card-header">
                    <span className="unit-card-id">{project.id.toUpperCase()}</span>
                    <span className="unit-card-status">
                      <span className="status-dot-indicator" /> ACTIVE
                    </span>
                  </div>

                  <h3 className="unit-card-title">{project.title}</h3>
                  <p className="unit-card-desc">{project.summary}</p>

                  <div className="unit-card-tags">
                    {project.tags.map((t) => (
                      <span key={t} className="tag-pill">
                        {t}
                      </span>
                    ))}
                  </div>

                  {/* MOBILE PORTRAIT PEEK: Hidden on desktop; revealed on hover via CSS custom property */}
                  <div className="mobile-portrait-peek">
                    <img src={project.image} alt={project.title} loading="lazy" />
                    <div className="peek-tag-bar">
                      <span className="peek-live-dot">● LIVE PEAK</span>
                      <span className="peek-access-arrow">ACCESS →</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Column 2: Noticeable Staggered Downward Offset */}
            <div className="rack-col" style={{ marginTop: `${staggerOffset}px`, transition: 'margin-top 220ms ease' }}>
              {col2Projects.map((project) => (
                <article
                  key={project.id}
                  data-hs-item
                  data-hs-id={project.id}
                  className="rack-unit-card"
                  onClick={() => setActiveProject(project)}
                >
                  <div className="unit-card-header">
                    <span className="unit-card-id">{project.id.toUpperCase()}</span>
                    <span className="unit-card-status">
                      <span className="status-dot-indicator" /> ACTIVE
                    </span>
                  </div>

                  <h3 className="unit-card-title">{project.title}</h3>
                  <p className="unit-card-desc">{project.summary}</p>

                  <div className="unit-card-tags">
                    {project.tags.map((t) => (
                      <span key={t} className="tag-pill">
                        {t}
                      </span>
                    ))}
                  </div>

                  {/* MOBILE PORTRAIT PEEK */}
                  <div className="mobile-portrait-peek">
                    <img src={project.image} alt={project.title} loading="lazy" />
                    <div className="peek-tag-bar">
                      <span className="peek-live-dot">● LIVE PEAK</span>
                      <span className="peek-access-arrow">ACCESS →</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: The Terminal Monitor (Sticky on Desktop) */}
        <div className="desktop-terminal-panel">
          <div className="terminal-monitor-frame">
            <div className="terminal-header-bar">
              <span className="terminal-live-feed">● LIVE_FEED // {activeProject.id.toUpperCase()}</span>
              <span className="terminal-res">RES: 4K_UHD</span>
            </div>

            <div ref={terminalImgRef} className="terminal-screen-viewport">
              <img
                src={activeProject.image}
                alt={activeProject.title}
                className="terminal-feed-img"
              />
              {/* CRT Scanline and Vignette Layer */}
              <div className="terminal-crt-scanlines" />
              <div className="terminal-crt-vignette" />

              {/* Data Overlay */}
              <div className="terminal-data-overlay">
                <span className="terminal-client-tag">{activeProject.client}</span>
                <h2 className="terminal-project-title">{activeProject.title}</h2>
                <p className="terminal-project-summary">{activeProject.summary}</p>
                <div className="terminal-tag-list">
                  {activeProject.tags.map((tag) => (
                    <span key={tag} className="terminal-badge">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
