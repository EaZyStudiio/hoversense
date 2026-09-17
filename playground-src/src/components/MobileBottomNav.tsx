import React from 'react';
import type { MobileTab } from '../types';

interface MobileBottomNavProps {
  activeTab: MobileTab;
  onSelectTab: (tab: MobileTab) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
}) => {
  return (
    <nav className="mobile-bottom-navbar" aria-label="Mobile Navigation">
      <button
        type="button"
        className={`mobile-nav-btn ${activeTab === 'tune' ? 'active' : ''}`}
        onClick={() => onSelectTab('tune')}
      >
        <span className="nav-btn-icon">🎛️</span>
        <span className="nav-btn-text mono">Tune</span>
      </button>

      <button
        type="button"
        className={`mobile-nav-btn ${activeTab === 'preview' ? 'active' : ''}`}
        onClick={() => onSelectTab('preview')}
      >
        <span className="nav-btn-icon">📱</span>
        <span className="nav-btn-text mono">Preview</span>
      </button>

      <button
        type="button"
        className={`mobile-nav-btn ${activeTab === 'code' ? 'active' : ''}`}
        onClick={() => onSelectTab('code')}
      >
        <span className="nav-btn-icon">💻</span>
        <span className="nav-btn-text mono">Code</span>
      </button>
    </nav>
  );
};
