import React, { useState } from 'react';
import { LiveProvider, LiveEditor, LiveError, LivePreview } from 'react-live';
import { themes } from 'prism-react-renderer';

// Import from the parent library
import { createHoverSenseContainer } from '../../src/engine';

import './playground.css';

// Fake Data for testing
const fakeProjects = Array.from({ length: 6 }).map((_, i) => ({
  id: `proj-${i}`,
  name: `Project 0${i + 1}`,
  client: `Client ${String.fromCharCode(65 + i)}`,
  image: `https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&q=80&auto=format&fit=crop&sig=${i}`,
  category: i % 2 === 0 ? 'WEB' : 'MOBILE',
  year: 2024
}));

const scope = {
  React,
  useState,
  createHoverSenseContainer,
  fakeProjects,
};

const originalMainframeCode = `
function MainframeOriginal() {
  const [hovered, setHovered] = useState(fakeProjects[0]);
  
  return (
    <div className="mainframe-grid">
      {fakeProjects.map((p) => (
        <div 
          key={p.id} 
          className="mainframe-item"
          onMouseEnter={() => setHovered(p)}
          onMouseLeave={() => setHovered(fakeProjects[0])}
        >
          <img 
            src={p.image} 
            alt={p.name}
            style={{ 
              filter: hovered.id === p.id ? 'grayscale(0%)' : 'grayscale(100%)',
              transition: 'filter 0.3s ease'
            }}
          />
          <div className="mainframe-info">
            <h3>{p.name}</h3>
            <span>{p.category}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
`;

const dxMainframeCode = `
function MainframeDX() {
  // Use createHoverSenseContainer for turnkey setup
  const containerRef = React.useRef(null);
  
  React.useEffect(() => {
    if (!containerRef.current) return;
    
    // Returns a cleanup function
    const cleanup = createHoverSenseContainer({
      root: containerRef.current,
      itemSelector: '.mainframe-item', // CSS selector for trackable items
      layout: 'grid',
      // DX uses CSS variables for continuous 60fps binding
    });
    
    return cleanup;
  }, []);

  return (
    <div ref={containerRef} className="mainframe-grid">
      {fakeProjects.map((p) => (
        <div 
          key={p.id} 
          className="mainframe-item dx-item"
          data-hs-id={p.id}
        >
          <img 
            src={p.image} 
            alt={p.name}
            style={{ 
              // Zero-render 60fps CSS binding via var(--hs-strength)
              filter: \`grayscale(calc((1 - var(--hs-strength, 0)) * 100%))\`,
              opacity: \`calc(0.5 + var(--hs-strength, 0) * 0.5)\`
            }}
          />
          <div className="mainframe-info">
            <h3>{p.name}</h3>
            <span>{p.category}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
`;

const originalTeamGridCode = `
function TeamGridOriginal() {
  const [hovered, setHovered] = useState(null);
  
  return (
    <div className="team-grid">
      {fakeProjects.map((p, i) => (
        <div 
          key={p.id} 
          className="team-card"
          onMouseEnter={() => setHovered(p.id)}
          onMouseLeave={() => setHovered(null)}
          style={{
            transform: \`rotate(\${(i - 2.5) * 5}deg) translateY(\${Math.abs(i - 2.5) * 10}px)\`,
            zIndex: hovered === p.id ? 10 : 1
          }}
        >
          <img src={p.image} alt={p.name} />
          <div className="team-info" style={{
            opacity: hovered === p.id ? 1 : 0
          }}>
            {p.name}
          </div>
        </div>
      ))}
    </div>
  );
}
`;

const dxTeamGridCode = `
function TeamGridDX() {
  const containerRef = React.useRef(null);
  
  React.useEffect(() => {
    if (!containerRef.current) return;
    
    return createHoverSenseContainer({
      root: containerRef.current,
      itemSelector: '.team-card',
      layout: 'scatter',
      tune: {
        anchorRatio: 0.5,
        engageAt: 0.9
      }
    });
  }, []);

  return (
    <div ref={containerRef} className="team-grid dx-team">
      {fakeProjects.map((p, i) => (
        <div 
          key={p.id} 
          className="team-card"
          data-hs-id={p.id}
          style={{
            transform: \`rotate(\${(i - 2.5) * 5}deg) translateY(\${Math.abs(i - 2.5) * 10}px) scale(calc(1 + var(--hs-strength, 0) * 0.1))\`,
            zIndex: \`calc(1 + Math.round(var(--hs-strength, 0) * 10))\`
          }}
        >
          <img src={p.image} alt={p.name} />
          <div className="team-info" style={{
            opacity: \`var(--hs-strength, 0)\`
          }}>
            {p.name}
          </div>
        </div>
      ))}
    </div>
  );
}
`;

export default function App() {
  const [activeTab, setActiveTab] = useState('Mainframe');

  return (
    <div className="vscode-layout">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">EXPLORER</div>
        <div className="sidebar-section">
          <div className="sidebar-title">DX PLAYGROUND</div>
          <div 
            className={"sidebar-item " + (activeTab === 'Mainframe' ? 'active' : '')}
            onClick={() => setActiveTab('Mainframe')}
          >
            <span className="icon">DX</span> Mainframe.tsx
          </div>
          <div 
            className={"sidebar-item " + (activeTab === 'TeamGrid' ? 'active' : '')}
            onClick={() => setActiveTab('TeamGrid')}
          >
            <span className="icon">DX</span> TeamGrid.tsx
          </div>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="editor-area">
        <div className="tabs">
          <div className="tab active">
            <span className="icon">DX</span> {activeTab}.tsx
          </div>
        </div>
        <div className="editor-content">
          <div className="split-view">
            {/* Left: Original Code View */}
            <div className="pane code-pane">
              <div className="pane-header">Original Implementation (Hover state only)</div>
              <LiveProvider code={activeTab === 'Mainframe' ? originalMainframeCode : originalTeamGridCode} scope={scope} theme={themes.vsDark}>
                <div className="pane-body">
                  <LiveEditor disabled className="live-editor readonly" />
                </div>
                <div className="pane-preview">
                  <LivePreview className="live-preview-box" />
                  <LiveError />
                </div>
              </LiveProvider>
            </div>

            {/* Right: DX Code View */}
            <div className="pane code-pane dx-pane">
              <div className="pane-header dx-header">
                HoverSense DX Implementation 
                <span className="badge">LIVE EDITABLE</span>
              </div>
              <LiveProvider code={activeTab === 'Mainframe' ? dxMainframeCode : dxTeamGridCode} scope={scope} theme={themes.vsDark}>
                <div className="pane-body">
                  <LiveEditor className="live-editor editable" />
                </div>
                <div className="pane-preview">
                  <LivePreview className="live-preview-box" />
                  <LiveError />
                </div>
              </LiveProvider>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
