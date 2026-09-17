import React from 'react';
import { Crosshair, RotateCcw, Undo2, Redo2, Sparkles } from 'lucide-react';
import type { TuningConfig, TelemetryData, VisualGuidesConfig, ShowcaseMode } from '../types';

interface LeftSidebarProps {
  tuning: TuningConfig;
  onChangeTuning: (newTuning: Partial<TuningConfig>) => void;
  guides: VisualGuidesConfig;
  onToggleGuide: (guideKey: keyof VisualGuidesConfig) => void;
  telemetry: TelemetryData;
  onCenterScroll: () => void;
  onResetDefaults: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  showcase?: ShowcaseMode;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  tuning,
  onChangeTuning,
  guides,
  onToggleGuide,
  telemetry,
  onCenterScroll,
  onResetDefaults,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  showcase = 'mainframe',
}) => {
  return (
    <aside className="left-sidebar-pane" aria-label="Biomechanical Tuning Controls">
      {/* Sidebar Header */}
      <div className="sidebar-header-bar">
        <span className="sidebar-title-mono mono">BIOMECHANICAL TUNING</span>
        <div className="sidebar-header-actions">
          {/* Undo / Redo Tuning Stack */}
          <button
            type="button"
            className="btn-history-step mono"
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo Tuning Change (Ctrl+Z)"
          >
            <Undo2 size={12} />
          </button>
          <button
            type="button"
            className="btn-history-step mono"
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo Tuning Change (Ctrl+Y)"
          >
            <Redo2 size={12} />
          </button>
          <button
            type="button"
            className="btn-center-scroll mono"
            onClick={onCenterScroll}
            title="Scroll stage to center"
          >
            <Crosshair size={11} />
            <span>Center</span>
          </button>
        </div>
      </div>

      <div className="sidebar-scrollable-content">
        {/* Live Telemetry Strip */}
        <div className="telemetry-box">
          <div className="telemetry-box-header mono">
            <span>LIVE TELEMETRY</span>
            <span className={`badge-phase phase-${telemetry.phase}`}>{telemetry.phase.toUpperCase()}</span>
          </div>

          <div className="telem-metrics-grid mono">
            <div className="metric-row">
              <span className="metric-k">INTENT</span>
              <div className="metric-bar-wrap">
                <div
                  className="metric-bar-fill"
                  style={{ width: `${Math.min(100, (telemetry.intent || 0) * 100)}%` }}
                />
              </div>
              <span className="metric-v">{(telemetry.intent || 0).toFixed(2)}</span>
            </div>

            <div className="metric-row">
              <span className="metric-k">AUTHORITY</span>
              <div className="metric-bar-wrap">
                <div
                  className="metric-bar-fill fill-cyan"
                  style={{ width: `${Math.min(100, (telemetry.authority || 0) * 100)}%` }}
                />
              </div>
              <span className="metric-v">{(telemetry.authority || 0).toFixed(2)}</span>
            </div>

            <div className="metric-kv-pair">
              <span className="metric-k">TARGET:</span>
              <span className="metric-v target-text">{telemetry.activeId ? telemetry.activeId.toUpperCase() : 'NONE'}</span>
            </div>

            <div className="metric-kv-pair">
              <span className="metric-k">SOURCE:</span>
              <span className={`metric-v source-${telemetry.source}`}>{telemetry.source.toUpperCase()}</span>
            </div>
          </div>
        </div>

        {/* Visual Guides Switches */}
        <div className="tuning-section">
          <span className="section-label mono">VISUAL GUIDES</span>
          <div className="guide-toggles-list">
            <label className="guide-toggle-row">
              <span className="toggle-text">Anchor Position Line</span>
              <input
                type="checkbox"
                checked={guides.showAnchorLine}
                onChange={() => onToggleGuide('showAnchorLine')}
                className="guide-switch-input"
              />
            </label>

            <label className="guide-toggle-row">
              <span className="toggle-text">Falloff Band Zone</span>
              <input
                type="checkbox"
                checked={guides.showBand}
                onChange={() => onToggleGuide('showBand')}
                className="guide-switch-input"
              />
            </label>

            <label className="guide-toggle-row">
              <span className="toggle-text">Safe Zones Bezel</span>
              <input
                type="checkbox"
                checked={guides.showSafeZones}
                onChange={() => onToggleGuide('showSafeZones')}
                className="guide-switch-input"
              />
            </label>
          </div>
        </div>

        {/* Demo-Specific Properties Section - Specially Styled Card */}
        <div className="tuning-section demo-properties-card">
          <div className="demo-card-header mono">
            <div className="demo-card-title-group">
              <Sparkles size={12} className="demo-card-icon" />
              <span className="demo-card-title">
                {showcase === 'mainframe' ? 'DEMO: MAINFRAME' : 'DEMO: COLLECTIVE'}
              </span>
            </div>
            <span className="demo-override-badge">LAYOUT EXTENSION</span>
          </div>

          {showcase === 'mainframe' ? (
            <div className="slider-control">
              <div className="slider-header mono">
                <span>unit vertical gap</span>
                <span className="slider-val val-amber">{(tuning.mainframeGapPx ?? 2)}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="24"
                step="1"
                value={tuning.mainframeGapPx ?? 2}
                onChange={(e) => onChangeTuning({ mainframeGapPx: parseInt(e.target.value, 10) })}
                className="range-slider slider-amber"
              />
            </div>
          ) : (
            <div className="slider-control">
              <div className="slider-header mono">
                <span>scatter spread length</span>
                <span className="slider-val val-amber">{(tuning.collectiveScatterSpread ?? 1.0).toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="2.5"
                step="0.05"
                value={tuning.collectiveScatterSpread ?? 1.0}
                onChange={(e) => onChangeTuning({ collectiveScatterSpread: parseFloat(e.target.value) })}
                className="range-slider slider-amber"
              />
            </div>
          )}
        </div>

        {/* Screen Channel Sliders */}
        <div className="tuning-section">
          <div className="section-header-row mono">
            <span className="section-label">SCREEN GAZE CHANNEL</span>
            <button
              type="button"
              className={`btn-channel-pill mono ${tuning.screenChannelEnabled !== false ? 'channel-active' : 'channel-muted'}`}
              onClick={() => onChangeTuning({ screenChannelEnabled: tuning.screenChannelEnabled === false })}
              title="Toggle Screen Gaze Channel on/off"
            >
              {tuning.screenChannelEnabled !== false ? 'ACTIVE' : 'MUTED'}
            </button>
          </div>

          {/* Anchor Ratio */}
          <div className="slider-control">
            <div className="slider-header mono">
              <span>anchor ratio</span>
              <span className="slider-val">{tuning.anchorRatio.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.15"
              max="0.85"
              step="0.01"
              value={tuning.anchorRatio}
              onChange={(e) => onChangeTuning({ anchorRatio: parseFloat(e.target.value) })}
              className="range-slider"
              disabled={tuning.screenChannelEnabled === false}
            />
          </div>

          {/* Band Ratio */}
          <div className="slider-control">
            <div className="slider-header mono">
              <span>falloff band</span>
              <span className="slider-val">{tuning.bandRatio.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.08"
              max="0.80"
              step="0.01"
              value={tuning.bandRatio}
              onChange={(e) => onChangeTuning({ bandRatio: parseFloat(e.target.value) })}
              className="range-slider"
              disabled={tuning.screenChannelEnabled === false}
            />
          </div>

          {/* Row Split */}
          <div className="slider-control">
            <div className="slider-header mono">
              <span>in-row split</span>
              <span className="slider-val">{tuning.rowSplit === 0 ? '0% (together)' : `${Math.round(tuning.rowSplit * 100)}%`}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={tuning.rowSplit}
              onChange={(e) => onChangeTuning({ rowSplit: parseFloat(e.target.value) })}
              className="range-slider"
              disabled={tuning.screenChannelEnabled === false}
            />
          </div>
        </div>

        {/* Touch Channel Sliders */}
        <div className="tuning-section">
          <div className="section-header-row mono">
            <span className="section-label">TOUCH INTENT CHANNEL</span>
            <button
              type="button"
              className={`btn-channel-pill mono ${tuning.touchChannelEnabled !== false ? 'channel-active' : 'channel-muted'}`}
              onClick={() => onChangeTuning({ touchChannelEnabled: tuning.touchChannelEnabled === false })}
              title="Toggle Touch Intent Channel on/off"
            >
              {tuning.touchChannelEnabled !== false ? 'ACTIVE' : 'MUTED'}
            </button>
          </div>

          {/* Engage At */}
          <div className="slider-control">
            <div className="slider-header mono">
              <span>engage at</span>
              <span className="slider-val">{Math.round(tuning.engageAt * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.20"
              max="1.00"
              step="0.05"
              value={tuning.engageAt}
              onChange={(e) => onChangeTuning({ engageAt: parseFloat(e.target.value) })}
              className="range-slider"
            />
          </div>

          {/* Min Hold */}
          <div className="slider-control">
            <div className="slider-header mono">
              <span>min hold</span>
              <span className="slider-val">{tuning.holdMsMin}ms</span>
            </div>
            <input
              type="range"
              min="120"
              max="900"
              step="10"
              value={tuning.holdMsMin}
              onChange={(e) => onChangeTuning({ holdMsMin: parseInt(e.target.value, 10) })}
              className="range-slider"
            />
          </div>

          {/* Scroll Lock Grace */}
          <div className="slider-control">
            <div className="slider-header mono">
              <span>scroll grace</span>
              <span className="slider-val">{tuning.scrollLockGraceMs}ms</span>
            </div>
            <input
              type="range"
              min="100"
              max="450"
              step="10"
              value={tuning.scrollLockGraceMs}
              onChange={(e) => onChangeTuning({ scrollLockGraceMs: parseInt(e.target.value, 10) })}
              className="range-slider"
            />
          </div>

          {/* Release Mode */}
          <div className="slider-control">
            <div className="slider-header mono">
              <span>release mode</span>
              <span className="slider-val">{tuning.releaseMode}</span>
            </div>
            <select
              value={tuning.releaseMode}
              onChange={(e) => onChangeTuning({ releaseMode: e.target.value as TuningConfig['releaseMode'] })}
              className="select-dropdown mono"
            >
              <option value="off-screen">Off-screen (leaves view)</option>
              <option value="scroll">Scroll distance</option>
              <option value="never">Never</option>
            </select>
          </div>
        </div>

        {/* Reset Action */}
        <div className="sidebar-footer-actions">
          <button
            type="button"
            className="btn-reset-defaults mono"
            onClick={onResetDefaults}
          >
            <RotateCcw size={12} />
            <span>Reset Biomechanical Defaults</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
