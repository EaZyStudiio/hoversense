import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import type { Project, TelemetryData, TuningConfig, VisualGuidesConfig } from '../types';
import { HoverSense, type HoverSenseState, type HoverHit } from '../../../src';
import { createSvgThumbnail } from '../data';
import { useTouchDragScroll } from '../hooks/useTouchDragScroll';

interface MainframeStageProps {
  projects: Project[];
  tuning: TuningConfig;
  guides: VisualGuidesConfig;
  onTelemetryUpdate: (data: TelemetryData) => void;
  onCenterRequest?: (trigger: () => void) => void;
  touchSim?: boolean;
}

export const MainframeStage: React.FC<MainframeStageProps> = ({
  projects,
  tuning,
  guides,
  onTelemetryUpdate,
  onCenterRequest,
  touchSim = true,
}) => {
  const [activeUnitId, setActiveUnitId] = useState<string | null>('unit-omega-01');
  const [clickNotice, setClickNotice] = useState<string | null>(null);

  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const stageListRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<HoverSense | null>(null);

  // Mobile Touch Simulation on Desktop: Click and drag as swipe
  useTouchDragScroll<HTMLDivElement>({ enabled: !!touchSim }, scrollViewportRef);

  // Center scroll helper
  const scrollToCenter = () => {
    const viewport = scrollViewportRef.current;
    const stage = stageListRef.current;
    if (!viewport || !stage) return;

    const targetY = (stage.offsetTop + stage.offsetHeight / 2) - viewport.clientHeight / 2;
    viewport.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
  };

  useEffect(() => {
    if (onCenterRequest) {
      onCenterRequest(scrollToCenter);
    }
  }, [onCenterRequest]);

  // Initial centering on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToCenter();
    }, 180);
    return () => clearTimeout(timer);
  }, []);

  // Initialize HoverSense on scroll container
  useEffect(() => {
    const viewport = scrollViewportRef.current;
    if (!viewport) return;

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
          scrollLockGraceMs: tuning.scrollLockGraceMs,
          scrollLockAxisRatio: 1.3,
          dragDeadzonePx: 9,
          dragFullPx: 46,
        },
        arbitration: {
          releaseMode: tuning.releaseMode,
          takeoverStartPx: 160,
          takeoverFullPx: tuning.takeoverFullPx,
        },
        modes: {
          screen: tuning.screenChannelEnabled !== false,
          touch: tuning.touchChannelEnabled !== false,
        },
        bindCssVariables: true,
        feedback: true,
      },
      viewport
    );

    engineRef.current = engine;

    const handleState = (state: HoverSenseState) => {
      const topHit = state.hits[0] as HoverHit | undefined;
      const hitId = topHit ? topHit.id : null;

      if (hitId) {
        setActiveUnitId(hitId);
      }

      onTelemetryUpdate({
        phase: state.debug.phase,
        intent: state.debug.intent,
        authority: state.debug.authority,
        activeId: hitId,
        source: topHit ? topHit.source : 'idle',
        strength: topHit ? topHit.strength : 0,
        zoneWeight: state.debug.zoneWeight,
        scrollY: viewport.scrollTop,
      });
    };

    engine.onState(handleState);

    // Register tactical unit items
    const items = viewport.querySelectorAll<HTMLElement>('[data-hs-item]');
    items.forEach((el) => {
      const id = el.getAttribute('data-hs-id');
      if (id) engine.register(id, el);
    });

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [tuning, projects]);

  const handleDoNotClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setClickNotice('RESTRICTED PROTOCOL INITIATED');
    setTimeout(() => setClickNotice(null), 2000);
  };

  return (
    <div className="mainframe-mobile-viewport-wrapper">
      {/* Scrollable Container with abundant top and bottom padding */}
      <div
        ref={scrollViewportRef}
        className="mainframe-scroll-canvas"
      >
        {/* Visual Gaze Anchor Line (Strictly constrained to mobile viewport) */}
        {guides.showAnchorLine && tuning.screenChannelEnabled !== false && (
          <div
            className="visual-anchor-guide-line"
            style={{ top: `${tuning.anchorRatio * 100}%` }}
          >
            <span className="anchor-label mono">
              GAZE ANCHOR ({tuning.anchorRatio.toFixed(2)} vh)
            </span>
            <div className="anchor-hairline" />
          </div>
        )}

        {/* Visual Falloff Band (Soft highlight band) */}
        {guides.showBand && tuning.screenChannelEnabled !== false && (
          <div
            className="visual-falloff-band"
            style={{
              top: `${Math.max(0, (tuning.anchorRatio - tuning.bandRatio / 2) * 100)}%`,
              height: `${tuning.bandRatio * 100}%`,
            }}
          />
        )}

        {/* Safe Zone Bezels (Top Status Bar, Bottom Home Bar, Side Bezels) */}
        {guides.showSafeZones && (
          <div className="safe-zones-overlay" aria-hidden="true">
            <div className="safe-zone-top">
              <span className="safe-zone-tag mono">SAFE ZONE: TOP (STATUS BAR)</span>
            </div>
            <div className="safe-zone-bottom">
              <span className="safe-zone-tag mono">SAFE ZONE: BOTTOM (HOME INDICATOR)</span>
            </div>
            <div className="safe-zone-left" />
            <div className="safe-zone-right" />
          </div>
        )}

        {/* Abundant Spacing Header to allow scrolling past anchor */}
        <div className="abundant-scroll-lead">
          <span className="scroll-hint-text mono">↓ SCROLL DOWN PAST GAZE HORIZON ↓</span>
        </div>

        {/* THE TACTICAL RACK (Matches attached screenshot) */}
        <div ref={stageListRef} className="tactical-rack-container">
          {/* Top Bar: UNIT_ID and STATUS and [DO NOT CLICK] */}
          <div className="tactical-rack-header">
            <span className="col-header-id mono">UNIT_ID</span>
            <div className="header-right-group">
              <button
                type="button"
                className={`btn-do-not-click mono ${clickNotice ? 'glitch-alert' : ''}`}
                onClick={handleDoNotClick}
              >
                {clickNotice || 'DO NOT CLICK'}
              </button>
              <span className="col-header-status mono">STATUS</span>
            </div>
          </div>

          {/* List of Tactical Units */}
          <div className="tactical-units-list" style={{ gap: `${tuning.mainframeGapPx ?? 2}px` }}>
            {projects.map((project, index) => {
              const isFirst = index === 0;
              const isHovered = activeUnitId === project.id;

              return (
                <article
                  key={project.id}
                  data-hs-item
                  data-hs-id={project.id}
                  className={`tactical-unit-row ${isHovered ? 'unit-focused' : ''}`}
                  onClick={() => setActiveUnitId(project.id)}
                >
                  {/* Left Column: Code and Title */}
                  <div className="unit-meta-col">
                    <span className={`unit-code-mono mono ${isFirst ? 'code-glitch' : ''}`}>
                      {project.code}
                    </span>
                    <h3 className="unit-title-text">{project.title}</h3>
                  </div>

                  {/* Right Column: Status LED Dot */}
                  <div className="unit-status-col">
                    <span className={`status-led ${isHovered ? 'led-active' : ''}`} />
                  </div>

                  {/* FLOATING PORTRAIT PEEK POPUP (Matches attached screenshot) */}
                  <div
                    className={`floating-portrait-peek ${isHovered ? 'peek-visible' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      alert(`Accessing ${project.title}`);
                    }}
                  >
                    {/* CRT Scanline Overlay */}
                    <div className="peek-crt-texture" />

                    {/* Image Preview Container */}
                    <div className="peek-img-frame">
                      <img
                        src={project.image}
                        alt={project.title}
                        loading="lazy"
                        className="peek-thumbnail"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = createSvgThumbnail(project.code, project.title);
                        }}
                      />
                      <span className="peek-prev-pill mono">PREV</span>
                    </div>

                    {/* Unit Title truncated */}
                    <h4 className="peek-title-mono">{project.title}</h4>

                    {/* Peek Footer Bar */}
                    <div className="peek-footer-bar mono">
                      <span className="peek-live-status">
                        <span className="pulse-dot-indicator" /> LIVE
                      </span>
                      <span className="peek-access-btn">
                        ACCESS <ArrowRight size={11} style={{ verticalAlign: 'middle', marginLeft: 3 }} />
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        {/* Abundant Spacing Footer so user can scroll items up past the anchor */}
        <div className="abundant-scroll-trail">
          <span className="scroll-hint-text mono">↑ SCROLL UP PAST GAZE HORIZON ↑</span>
        </div>
      </div>
    </div>
  );
};
