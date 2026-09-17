import React from 'react';
import {
  Eye,
  EyeOff,
  Crosshair,
  Smartphone,
  Monitor,
  Sliders,
  Code2,
  FileText,
  ArrowLeft,
  Hand,
} from 'lucide-react';
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
  touchSim: boolean;
  onToggleTouchSim: () => void;
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
  touchSim,
  onToggleTouchSim,
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
          {allGuidesActive ? <Eye size={13} /> : <EyeOff size={13} />}
          <span>{allGuidesActive ? 'Guides: ON' : 'Normal View'}</span>
        </button>

        {/* Center Canvas Button */}
        <button
          type="button"
          className="btn-tool-pill mono"
          onClick={onCenterScroll}
          title="Center Preview Scroll"
        >
          <Crosshair size={13} />
          <span>Center</span>
        </button>

        {/* Desktop Device & Panel Toggles */}
        {!isMobileDevice && (
          <>
            {/* Touch Simulation Toggle */}
            <button
              type="button"
              className={`btn-tool-pill mono ${touchSim ? 'active-tool' : ''}`}
              onClick={onToggleTouchSim}
              title={touchSim ? 'Touch Simulation Active: Click & drag to swipe' : 'Touch Simulation Disabled'}
            >
              <Hand size={13} />
              <span>Touch Sim: {touchSim ? 'ON' : 'OFF'}</span>
            </button>

            <button
              type="button"
              className={`btn-tool-pill mono ${deviceFrame ? 'active-tool' : ''}`}
              onClick={onToggleDeviceFrame}
              title={deviceFrame ? 'Switch to Full Width View' : 'Simulate Mobile Device Frame'}
            >
              {deviceFrame ? <Smartphone size={13} /> : <Monitor size={13} />}
              <span>{deviceFrame ? 'Mobile Frame' : 'Full Width'}</span>
            </button>

            <button
              type="button"
              className={`btn-tool-pill mono ${showLeftSidebar ? 'active-tool' : ''}`}
              onClick={onToggleLeftSidebar}
              title="Toggle Tuning Left Sidebar"
            >
              <Sliders size={13} />
              <span>Tune</span>
            </button>

            <button
              type="button"
              className={`btn-tool-pill mono ${showRightPanel ? 'active-tool' : ''}`}
              onClick={onToggleRightPanel}
              title="Toggle Code Right Panel"
            >
              <Code2 size={13} />
              <span>Code</span>
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
            <Code2 size={13} />
            <span>Code View</span>
          </button>
        )}

        {/* Technical Dossier Modal Trigger */}
        <button
          type="button"
          className="btn-tool-pill btn-dossier-pill mono"
          onClick={onOpenDossier}
        >
          <FileText size={13} />
          <span>Dossier</span>
        </button>

        {/* Back to Physics Lab Link */}
        <a href="../index.html" className="btn-tool-link mono">
          <ArrowLeft size={13} />
          <span>Physics Lab</span>
        </a>
      </div>
    </header>
  );
};
