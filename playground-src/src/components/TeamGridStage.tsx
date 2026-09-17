import React, { useEffect, useRef, useState, useCallback } from 'react';
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
  const wrapperRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<HoverSense | null>(null);

  // Anchor guide position mapped from browser viewport into phone-frame-local coords
  const [anchorGuideTop, setAnchorGuideTop] = useState<number | null>(null);
  const [bandGuideTop, setBandGuideTop] = useState<number | null>(null);
  const [bandGuideHeight, setBandGuideHeight] = useState<number | null>(null);

  const recalcAnchorGuide = useCallback(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const wrapperRect = wrapper.getBoundingClientRect();
    const vh = window.innerHeight;
    const anchorY = vh * tuning.anchorRatio;
    setAnchorGuideTop(anchorY - wrapperRect.top);

    const bandTopY = vh * Math.max(0, tuning.anchorRatio - tuning.bandRatio / 2);
    const bandBottomY = vh * Math.min(1, tuning.anchorRatio + tuning.bandRatio / 2);
    setBandGuideTop(bandTopY - wrapperRect.top);
    setBandGuideHeight(bandBottomY - bandTopY);
  }, [tuning.anchorRatio, tuning.bandRatio]);

  useEffect(() => {
    recalcAnchorGuide();
    window.addEventListener('resize', recalcAnchorGuide, { passive: true });
    return () => window.removeEventListener('resize', recalcAnchorGuide);
  }, [recalcAnchorGuide]);

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

  // Base tops for each card: Card 0 stays stationary, subsequent cards progressively lower by spread
  const baseTops = [24, 94, 300, 390, 590, 680];
  const stageMinHeight = Math.round(24 + (baseTops[baseTops.length - 1] - baseTops[0]) * spread + 300);

  const cardLayouts: Array<{ top?: string; bottom?: string; left?: string; right?: string; rotate: string }> = [
    { top: `${baseTops[0]}px`, left: '4%', rotate: '-2.5deg' },
    { top: `${baseTops[0] + Math.round((baseTops[1] - baseTops[0]) * spread)}px`, right: '4%', rotate: '3deg' },
    { top: `${baseTops[0] + Math.round((baseTops[2] - baseTops[0]) * spread)}px`, left: '6%', rotate: '1.5deg' },
    { top: `${baseTops[0] + Math.round((baseTops[3] - baseTops[0]) * spread)}px`, right: '6%', rotate: '-2deg' },
    { top: `${baseTops[0] + Math.round((baseTops[4] - baseTops[0]) * spread)}px`, left: '5%', rotate: '3.5deg' },
    { top: `${baseTops[0] + Math.round((baseTops[5] - baseTops[0]) * spread)}px`, right: '5%', rotate: '-1.5deg' },
  ];

  return (
    <div ref={wrapperRef} className="collective-viewport-wrapper">
      {/* Visual Gaze Anchor Line (Stationary over mobile viewport) */}
      {guides.showAnchorLine && tuning.screenChannelEnabled !== false && anchorGuideTop !== null && (
        <div
          className="visual-anchor-guide-line"
          style={{ top: `${anchorGuideTop}px` }}
        >
          <span className="anchor-label mono">
            CENTER FOCAL ({tuning.anchorRatio.toFixed(2)} vh)
          </span>
          <div className="anchor-hairline" />
        </div>
      )}

      {/* Visual Falloff Band (Stationary soft highlight band) */}
      {guides.showBand && tuning.screenChannelEnabled !== false && bandGuideTop !== null && bandGuideHeight !== null && (
        <div
          className="visual-falloff-band"
          style={{
            top: `${bandGuideTop}px`,
            height: `${bandGuideHeight}px`,
          }}
        />
      )}

      {/* Safe Zone Bezels (Stationary Top Status Bar, Bottom Home Bar, Side Bezels) */}
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

      <div ref={scrollViewportRef} className="collective-scroll-canvas">
        {/* Abundant Scroll Lead */}
        <div className="abundant-scroll-lead" />

        {/* Central Stage Content with dynamic min-height based on scatter spread */}
        <div
          ref={stageContentRef}
          className="collective-canvas-inner"
          style={{ minHeight: `${stageMinHeight}px` }}
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
