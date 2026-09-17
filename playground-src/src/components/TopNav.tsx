import React from 'react';
import type { ShowcaseMode, VisualGuidesConfig, MobileTab } from '../types';

interface TopNavProps {
  showcase: ShowcaseMode;
  onSelectShowcase: (mode: ShowcaseMode) => void;
  guides: VisualGuidesConfig;
  onToggleAllGuides: () => void;
  onCenterScroll: () => void;
  deviceFrame: boolean;
  onToggleDeviceFrame: () => void;
  showLeftSidebar: boolean;
  onToggleLeftSidebar: () => void;
  showRightPanel: boolean;
  onToggleRightPanel: () => void;
  onOpenDossier: () => void;
  mobileTab: MobileTab;
  onSelectMobileTab: (tab: MobileTab) => void;
  isMobileDevice: boolean;
}

export const TopNav: React.FC<TopNavProps> = ({
  showcase,
  onSelectShowcase,
  guides,
  onToggleAllGuides,
  onCenterScroll,
  deviceFrame,
  onToggleDeviceFrame,
  showLeftSidebar,
  onToggleLeftSidebar,
  showRightPanel,
  onToggleRightPanel,
  onOpenDossier,
  mobileTab,
  onSelectMobileTab,
  isMobileDevice,
}) => {
  const allGuidesActive = guides.showAnchorLine && guides.showBand;

  return (
    <header className="playground-top-header" aria-label="Main Navigation">
      <div className="header-brand-cluster">
        <a href="./" className="brand-link">
          <span className="brand-dot-pulse" />
          <span className="brand-title-text mono">HOVERSENSE</span>
          <span className="brand-tag-dx mono">DX</span>
        </a>

        {/* Showcase Switcher Tabs */}
        <div className="showcase-segmented-control" role="tablist">
          <button
            type="button"
            className={`seg-btn mono ${showcase === 'mainframe' ? 'active' : ''}`}
            onClick={() => onSelectShowcase('mainframe')}
          >
            1. The Mainframe
          </button>
          <button
            type="button"
            className={`seg-btn mono ${showcase === 'collective' ? 'active' : ''}`}
            onClick={() => onSelectShowcase('collective')}
          >
            2. The Collective
          </button>
        </div>
      </div>

      {/* Quick Visual Controls (Center) */}
      <div className="header-tools-cluster">
        {/* Quick Normal View Eye Button */}
        <button
          type="button"
          className={`btn-tool-pill mono ${allGuidesActive ? 'active-tool' : ''}`}
          onClick={onToggleAllGuides}
          title={allGuidesActive ? 'Hide Visual Anchor Guides (Normal View)' : 'Show Visual Anchor Guides'}
        >
          <span>{allGuidesActive ? '👁️ Guides: ON' : '👁️‍🗨️ Normal View'}</span>
        </button>

        {/* Center Canvas Button */}
        <button
          type="button"
          className="btn-tool-pill mono"
          onClick={onCenterScroll}
          title="Center Preview Scroll"
        >
          <span>⌖ Center</span>
        </button>

        {/* Desktop Device & Panel Toggles */}
        {!isMobileDevice && (
          <>
            <button
              type="button"
              className={`btn-tool-pill mono ${deviceFrame ? 'active-tool' : ''}`}
              onClick={onToggleDeviceFrame}
              title={deviceFrame ? 'Switch to Full Width View' : 'Simulate Mobile Device Frame'}
            >
              <span>{deviceFrame ? '📱 Mobile Frame' : '🖥️ Full Width'}</span>
            </button>

            <button
              type="button"
              className={`btn-tool-pill mono ${showLeftSidebar ? 'active-tool' : ''}`}
              onClick={onToggleLeftSidebar}
              title="Toggle Tuning Left Sidebar"
            >
              <span>🎛️ Tune</span>
            </button>

            <button
              type="button"
              className={`btn-tool-pill mono ${showRightPanel ? 'active-tool' : ''}`}
              onClick={onToggleRightPanel}
              title="Toggle Code Right Panel"
            >
              <span>💻 Code</span>
            </button>
          </>
        )}
      </div>

      {/* Right Actions Cluster */}
      <div className="header-actions-cluster">
        {/* On mobile: Code toggle button */}
        {isMobileDevice && (
          <button
            type="button"
            className={`btn-tool-pill mono ${mobileTab === 'code' ? 'active-tool' : ''}`}
            onClick={() => onSelectMobileTab(mobileTab === 'code' ? 'preview' : 'code')}
          >
            <span>💻 Code View</span>
          </button>
        )}

        {/* Technical Dossier Modal Trigger */}
        <button
          type="button"
          className="btn-tool-pill btn-dossier-pill mono"
          onClick={onOpenDossier}
        >
          <span>📑 Dossier</span>
        </button>

        {/* Back to Physics Lab Link */}
        <a href="../index.html" className="btn-tool-link mono">
          <span>← Physics Lab</span>
        </a>
      </div>
    </header>
  );
};
