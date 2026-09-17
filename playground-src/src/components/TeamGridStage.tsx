import React, { useEffect, useRef } from 'react';
import type { TeamMember, TelemetryData, TuningConfig, VisualGuidesConfig } from '../types';
import { HoverSense, type HoverSenseState, type HoverHit } from '../../../src';
import { createSvgThumbnail } from '../data';
import { useTouchDragScroll } from '../hooks/useTouchDragScroll';

interface TeamGridStageProps {
  members: TeamMember[];
  tuning: TuningConfig;
  guides: VisualGuidesConfig;
  onTelemetryUpdate: (data: TelemetryData) => void;
  onCenterRequest?: (trigger: () => void) => void;
  touchSim?: boolean;
  preventImageDrag?: boolean;
}

export const TeamGridStage: React.FC<TeamGridStageProps> = ({
  members,
  tuning,
  guides,
  onTelemetryUpdate,
  onCenterRequest,
  touchSim = true,
  preventImageDrag = false,
}) => {
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const stageContentRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<HoverSense | null>(null);

  // Mobile Touch Simulation on Desktop: Click and drag as swipe
  useTouchDragScroll<HTMLDivElement>({ enabled: !!touchSim }, scrollViewportRef);

  const scrollToCenter = () => {
    const viewport = scrollViewportRef.current;
    const content = stageContentRef.current;
    if (!viewport || !content) return;
    const targetY = (content.offsetTop + content.offsetHeight / 2) - viewport.clientHeight / 2;
    viewport.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
  };

  useEffect(() => {
    if (onCenterRequest) {
      onCenterRequest(scrollToCenter);
    }
  }, [onCenterRequest]);

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToCenter();
    }, 180);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const viewport = scrollViewportRef.current;
    if (!viewport) return;

    const engine = new HoverSense(
      {
        screen: {
          anchorRatio: tuning.anchorRatio,
          bandRatio: tuning.bandRatio,
          resolve: 'global',
          rowSplit: 0.0,
        },
        touch: {
          engageAt: tuning.engageAt,
          holdMsMin: tuning.holdMsMin,
          holdMsMax: tuning.holdMsMax,
          scrollLockGraceMs: tuning.scrollLockGraceMs,
          clearLatchOnTap: true,
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
      onTelemetryUpdate({
        phase: state.debug.phase,
        intent: state.debug.intent,
        authority: state.debug.authority,
        activeId: topHit ? topHit.id : null,
        source: topHit ? topHit.source : 'idle',
        strength: topHit ? topHit.strength : 0,
        zoneWeight: state.debug.zoneWeight,
        scrollY: viewport.scrollTop,
      });
    };

    engine.onState(handleState);

    const items = viewport.querySelectorAll<HTMLElement>('[data-hs-item]');
    items.forEach((el) => {
      const id = el.getAttribute('data-hs-id');
      if (id) engine.register(id, el);
    });

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [tuning, members]);

  const spread = tuning.collectiveScatterSpread ?? 1.0;

  const cardLayouts = [
    { top: `${3.5 * spread}%`, left: '4%', rotate: '-2.5deg' },
    { top: `${6.5 * spread}%`, right: '4%', rotate: '3deg' },
    { top: `${36 * spread}%`, left: '6%', rotate: '1.5deg' },
    { top: `${42 * spread}%`, right: '6%', rotate: '-2deg' },
    { bottom: `${6.5 * spread}%`, left: '5%', rotate: '3.5deg' },
    { bottom: `${3.5 * spread}%`, right: '5%', rotate: '-1.5deg' },
  ];

  return (
    <div className="collective-viewport-wrapper">
      <div ref={scrollViewportRef} className="collective-scroll-canvas">
        {/* Visual Gaze Anchor Line */}
        {guides.showAnchorLine && tuning.screenChannelEnabled !== false && (
          <div
            className="visual-anchor-guide-line"
            style={{ top: `${tuning.anchorRatio * 100}%` }}
          >
            <span className="anchor-label mono">
              CENTER FOCAL ({tuning.anchorRatio.toFixed(2)} vh)
            </span>
            <div className="anchor-hairline" />
          </div>
        )}

        {/* Visual Falloff Band */}
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

        {/* Abundant Scroll Lead */}
        <div className="abundant-scroll-lead" />

        {/* Central Stage Content with dynamic min-height based on scatter spread */}
        <div
          ref={stageContentRef}
          className="collective-canvas-inner"
          style={{ minHeight: `calc(840px * ${spread})` }}
        >
          {/* Background Typography */}
          <div className="collective-background-text" aria-hidden="true">
            <span className="collective-subhead mono">THE COLLECTIVE</span>
            <div className="collective-massive-title">
              <span className="text-outline">WE ARE</span>
              <span className="text-solid">
                EaZY
                <span className="text-accent-glow" />
              </span>
            </div>
          </div>

          {/* Foreground Scattered Cards */}
          <div className="collective-cards-layer">
            {members.map((member, index) => {
              const layout = cardLayouts[index] || { top: '10%', left: '10%', rotate: '0deg' };

              return (
                <article
                  key={member.id}
                  data-hs-item
                  data-hs-id={member.id}
                  className="collective-team-card"
                  style={{
                    top: layout.top,
                    left: layout.left,
                    right: layout.right,
                    bottom: layout.bottom,
                    transform: `rotate(${layout.rotate})`,
                  }}
                >
                  <img
                    src={member.image}
                    alt={member.name}
                    loading="lazy"
                    draggable={!preventImageDrag}
                    className={`team-card-image ${preventImageDrag ? 'no-ghost-drag' : ''}`}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = createSvgThumbnail('0' + member.id, member.name);
                    }}
                  />
                  <div className="team-card-vignette" />

                  <div className="team-card-content">
                    <div className="card-top-header">
                      <span className="card-specialty-pill mono">
                        <span
                          className="specialty-dot"
                          style={{ backgroundColor: member.mainColor, boxShadow: `0 0 6px ${member.mainColor}` }}
                        />
                        {member.style}
                      </span>
                      <span className="card-index-mono mono">0{member.id}</span>
                    </div>

                    <div className="card-bottom-content">
                      <p className="personality-quote">“{member.personalityQuote}”</p>
                      <p className="personality-quirk mono">↳ {member.personalityQuirk}</p>
                      <div className="card-name-role-bar">
                        <h3 className="card-member-name">{member.name}</h3>
                        <span className="card-member-role">{member.role}</span>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        {/* Abundant Scroll Trail */}
        <div className="abundant-scroll-trail" />
      </div>
    </div>
  );
};
