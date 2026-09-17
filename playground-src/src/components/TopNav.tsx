import React from 'react';
import type { ShowcaseMode, ViewLayout, TelemetryData } from '../types';

interface TopNavProps {
  showcase: ShowcaseMode;
  onSelectShowcase: (mode: ShowcaseMode) => void;
  layout: ViewLayout;
  onSelectLayout: (layout: ViewLayout) => void;
  telemetry: TelemetryData;
  onOpenDossier: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  showcase,
  onSelectShowcase,
  layout,
  onSelectLayout,
  telemetry,
  onOpenDossier,
}) => {
  return (
    <header className="playground-header">
      <div className="header-left">
        <a href="./" className="brand-badge">
          <span className="brand-dot" />
          <span className="brand-name">HOVERSENSE</span>
          <span className="brand-sub">DX LAB</span>
        </a>

        {/* Showcase Switcher */}
        <nav className="showcase-nav" aria-label="Showcase Switcher">
          <button
            type="button"
            className={`nav-tab ${showcase === 'mainframe' ? 'active' : ''}`}
            onClick={() => onSelectShowcase('mainframe')}
          >
            1. The Mainframe (2x3 Stagger)
          </button>
          <button
            type="button"
            className={`nav-tab ${showcase === 'collective' ? 'active' : ''}`}
            onClick={() => onSelectShowcase('collective')}
          >
            2. The Collective (Scattered)
          </button>
        </nav>
      </div>

      <div className="header-center">
        {/* Telemetry Strip Pill */}
        <div className="telemetry-pill">
          <span className="telem-item">
            <span className="telem-key">PHASE</span>
            <span className={`telem-val phase-${telemetry.phase}`}>{telemetry.phase.toUpperCase()}</span>
          </span>
          <span className="telem-item">
            <span className="telem-key">INTENT</span>
            <span className="telem-val">{(telemetry.intent || 0).toFixed(2)}</span>
          </span>
          <span className="telem-item">
            <span className="telem-key">TARGET</span>
            <span className="telem-val target-highlight">{telemetry.activeId ? telemetry.activeId.toUpperCase() : 'NONE'}</span>
          </span>
          <span className="telem-item">
            <span className="telem-key">SOURCE</span>
            <span className={`telem-val source-${telemetry.source}`}>{telemetry.source.toUpperCase()}</span>
          </span>
        </div>
      </div>

      <div className="header-right">
        {/* Layout View Mode Buttons */}
        <div className="view-mode-toggle" aria-label="View Layout">
          <button
            type="button"
            className={`mode-btn ${layout === 'split' ? 'active' : ''}`}
            onClick={() => onSelectLayout('split')}
            title="Side-by-side Stage and Code"
          >
            Split
          </button>
          <button
            type="button"
            className={`mode-btn ${layout === 'stage' ? 'active' : ''}`}
            onClick={() => onSelectLayout('stage')}
            title="Full Interactive Stage"
          >
            Stage Only
          </button>
          <button
            type="button"
            className={`mode-btn ${layout === 'code' ? 'active' : ''}`}
            onClick={() => onSelectLayout('code')}
            title="Full VS Code Inspector"
          >
            Code Only
          </button>
        </div>

        {/* Dossier and Back Buttons */}
        <button type="button" className="btn-dossier" onClick={onOpenDossier}>
          📄 Edge Case Dossier
        </button>

        <a href="../index.html" className="btn-back-link">
          ← Physics Lab
        </a>
      </div>
    </header>
  );
};
