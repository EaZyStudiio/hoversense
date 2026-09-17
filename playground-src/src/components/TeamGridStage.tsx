import React, { useEffect, useRef } from 'react';
import type { TeamMember, TelemetryData, TuningConfig } from '../types';
import { HoverSense, type HoverSenseState, type HoverHit } from '../../../src';

interface TeamGridStageProps {
  members: TeamMember[];
  tuning: TuningConfig;
  onTelemetryUpdate: (data: TelemetryData) => void;
}

export const TeamGridStage: React.FC<TeamGridStageProps> = ({
  members,
  tuning,
  onTelemetryUpdate,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<HoverSense | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Dual-channel HoverSense: Center focal gaze horizon + Intentional touch latch
    const engine = new HoverSense(
      {
        screen: {
          anchorRatio: 0.50, // Center focal horizon for scattered cards
          bandRatio: 0.42,
          resolve: 'global',
          rowSplit: 0.0,
        },
        touch: {
          engageAt: tuning.engageAt,
          holdMsMin: tuning.holdMsMin,
          holdMsMax: tuning.holdMsMax,
          scrollLockGraceMs: 200,
          scrollLockAxisRatio: 1.2,
          clearLatchOnTap: true,
        },
        arbitration: {
          releaseMode: 'off-screen',
          takeoverStartPx: 160,
          takeoverFullPx: 480,
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
      onTelemetryUpdate({
        phase: state.debug.phase,
        intent: state.debug.intent,
        authority: state.debug.authority,
        activeId: topHit ? topHit.id : null,
        source: topHit ? topHit.source : 'idle',
        strength: topHit ? topHit.strength : 0,
        zoneWeight: state.debug.zoneWeight,
      });
    };

    engine.onState(handleState);

    // Register scattered cards
    const items = containerRef.current.querySelectorAll<HTMLElement>('[data-hs-item]');
    items.forEach((el) => {
      const id = el.getAttribute('data-hs-id');
      if (id) engine.register(id, el);
    });

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [tuning, members]);

  // Predefined organic positions and rotations framing the central typography
  const cardLayouts = [
    { top: '3%', left: '4%', rotate: '-2.5deg' },
    { top: '6%', right: '4%', rotate: '3deg' },
    { top: '35%', left: '8%', rotate: '1.5deg' },
    { top: '38%', right: '8%', rotate: '-2deg' },
    { bottom: '5%', left: '6%', rotate: '3.5deg' },
    { bottom: '3%', right: '7%', rotate: '-1.5deg' },
  ];

  return (
    <div ref={containerRef} className="collective-stage-wrapper">
      {/* BACKGROUND GIANT TEXT */}
      <div className="collective-background-text" aria-hidden="true">
        <span className="collective-subhead">THE COLLECTIVE</span>
        <div className="collective-massive-title">
          <span className="text-outline">WE ARE</span>
          <span className="text-solid">
            EaZY
            <span className="text-accent-glow" />
          </span>
        </div>
      </div>

      {/* FOREGROUND SCATTERED CARDS */}
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
              {/* Layer 1: Image (B/W to Color shift driven by CSS variable) */}
              <img
                src={member.image}
                alt={member.name}
                loading="lazy"
                className="team-card-image"
              />

              {/* Layer 2: Editorial Scrim & Vignette Gradient */}
              <div className="team-card-vignette" />

              {/* Layer 3: Editorial Typography Overlay */}
              <div className="team-card-content">
                <div className="card-top-header">
                  <span className="card-specialty-pill">
                    <span
                      className="specialty-dot"
                      style={{ backgroundColor: member.mainColor, boxShadow: `0 0 6px ${member.mainColor}` }}
                    />
                    {member.style}
                  </span>
                  <span className="card-index-mono">0{member.id}</span>
                </div>

                <div className="card-bottom-content">
                  {/* Micro-content personality quote */}
                  <p className="personality-quote">“{member.personalityQuote}”</p>
                  <p className="personality-quirk">↳ {member.personalityQuirk}</p>

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
  );
};
