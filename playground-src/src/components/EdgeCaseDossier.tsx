import React from 'react';
import { X } from 'lucide-react';

interface EdgeCaseDossierProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EdgeCaseDossier: React.FC<EdgeCaseDossierProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="dossier-backdrop" onClick={onClose}>
      <aside
        className="dossier-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Developer Experience Edge-Case Dossier"
      >
        <div className="dossier-header">
          <div>
            <span className="dossier-subhead">TECHNICAL SPECIFICATION</span>
            <h2 className="dossier-title">DX Edge-Case Analysis</h2>
          </div>
          <button type="button" className="btn-close-dossier" onClick={onClose}>
            <X size={15} />
            <span>Close</span>
          </button>
        </div>

        <div className="dossier-body">
          {/* Executive Summary Table */}
          <div className="dossier-section">
            <h3 className="section-heading">1. Executive Architecture Delta</h3>
            <table className="dossier-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Legacy Custom Code</th>
                  <th>HoverSense DX</th>
                  <th>Net Delta</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Plumbing Lines of Code</td>
                  <td>~140 LOC</td>
                  <td>~38 LOC</td>
                  <td>-73% code reduction</td>
                </tr>
                <tr>
                  <td>Virtual DOM Re-renders</td>
                  <td>40 to 60 re-renders/sec</td>
                  <td>0 re-renders/sec</td>
                  <td>Zero JS thread stutter</td>
                </tr>
                <tr>
                  <td>Mobile Touch Hygiene</td>
                  <td>Manual / Fragile</td>
                  <td>Automated (pan-y, no callouts)</td>
                  <td>Zero iOS callout conflicts</td>
                </tr>
                <tr>
                  <td>Animation Collision</td>
                  <td>GSAP queue collisions on flick</td>
                  <td>Decoupled (CSS for frame, GSAP for latch)</td>
                  <td>Smooth 60fps frame rate</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Edge Cases & Resolutions */}
          <div className="dossier-section">
            <h3 className="section-heading">2. Edge Cases &amp; Architectural Resolutions</h3>

            <div className="edge-card">
              <div className="edge-header">
                <span className="edge-badge badge-success">RESOLVED</span>
                <h4>Edge Case 1: Conditional DOM Trees vs CSS Custom Properties</h4>
              </div>
              <p className="edge-text">
                <strong>The Conflict:</strong> Pure CSS variables run on the GPU compositor thread. They are ideal
                for transforms and opacity, but cannot mount or unmount DOM subtrees. Preloading high-resolution images
                for 10 hidden popups wastes mobile bandwidth.
              </p>
              <p className="edge-text">
                <strong>DX Resolution:</strong> Implemented <code>data-hs-engaged=&quot;true&quot;</code> attribute binding in
                <code>CssVariableBinder</code> with a configurable <code>engageThreshold</code> (default 0.75). Developers can
                now mount popups using pure CSS selectors (<code>[data-hs-engaged=&quot;true&quot;] .peek</code>) without triggering
                virtual DOM re-renders during continuous 60fps scrolling.
              </p>
              <p className="edge-verdict">
                <strong>Trade-off:</strong> Gating is binary at the threshold. Progressive asset reveal (e.g. blurhash blend during approach) still requires pairing with <code>--hs-strength</code>.
              </p>
            </div>

            <div className="edge-card">
              <div className="edge-header">
                <span className="edge-badge badge-success">RESOLVED</span>
                <h4>Edge Case 2: GSAP Style Overwrite on Inline Transforms</h4>
              </div>
              <p className="edge-text">
                <strong>The Conflict:</strong> When GSAP animates an element directly, writing inline <code>style=&quot;transform: ...&quot;</code> clobbers
                HoverSense CSS variable rules (<code>transform: scale(calc(...))</code>).
              </p>
              <p className="edge-text">
                <strong>DX Resolution:</strong> Added independent transform properties <code>--hs-scale</code> and <code>--hs-translate-y</code> alongside
                standard CSS <code>scale: var(--hs-scale)</code>. Imperative animation engines can now animate positioning, rotation, or personality
                effects on the same DOM element without colliding with spatial hover scaling.
              </p>
              <p className="edge-verdict">
                <strong>Trade-off:</strong> Individual CSS transform properties (<code>scale</code>, <code>translate</code>) require modern browser support (iOS Safari 14.5+). Older browsers fall back to parent/child element scoping.
              </p>
            </div>

            <div className="edge-card">
              <div className="edge-header">
                <span className="edge-badge badge-success">RESOLVED</span>
                <h4>Edge Case 3: Staggered Multi-Column Grids (2x3 Rack)</h4>
              </div>
              <p className="edge-text">
                <strong>The Conflict:</strong> In asymmetric or staggered racks where Column 2 is offset downward, cards in different
                columns do not cross the gaze horizon at the same scroll position.
              </p>
              <p className="edge-text">
                <strong>DX Resolution:</strong> Added <code>resolve: &apos;auto&apos;</code> to <code>ScreenChannelConfig</code>. The engine dynamically
                inspects bounding box clusters; when multiple columns or horizontal offsets exist, it automatically engages full in-row split
                crossfading (<code>rowSplit = 1.0</code>), allowing each column to crossfade independently without manual parameter tuning.
              </p>
              <p className="edge-verdict">
                <strong>Trade-off:</strong> None. Pure geometric evaluation via <code>getBoundingClientRect</code> on every frame.
              </p>
            </div>

            <div className="edge-card">
              <div className="edge-header">
                <span className="edge-badge badge-success">RESOLVED</span>
                <h4>Edge Case 4: Rapid Scroll Flick vs Dwell (Mobile Popup Strobing)</h4>
              </div>
              <p className="edge-text">
                <strong>The Conflict:</strong> If discrete preview popups trigger immediately on proximity, a rapid vertical flick down the rack
                can trigger multiple popups in rapid succession for 16ms each, causing visual strobing.
              </p>
              <p className="edge-text">
                <strong>DX Resolution:</strong> Introduced <code>dwellThresholdMs</code> in arbitration config (default 80ms). Continuous CSS variables
                still paint at 60fps for visual feedback, but discrete engagement attributes and callbacks require sustained presence at the gaze
                horizon before firing.
              </p>
              <p className="edge-verdict">
                <strong>Trade-off:</strong> Fast users who flick deliberately to preview must let the scroll settle for 80ms before discrete popups activate.
              </p>
            </div>
          </div>

          {/* Upsides, Downsides, Small Wins & Losses */}
          <div className="dossier-section">
            <h3 className="section-heading">3. Scorecard: Upsides, Downsides, Wins &amp; Losses</h3>

            <div className="scorecard-grid">
              <div className="score-col win-col">
                <h4>Major Upsides</h4>
                <ul>
                  <li>True 60fps mobile performance via GPU compositor offloading.</li>
                  <li>Native <code>data-hs-engaged</code> attribute bridges CSS variables to conditional DOM mounting.</li>
                  <li>Independent transform properties (<code>--hs-scale</code>, <code>--hs-translate-y</code>) decouple GSAP collisions.</li>
                  <li>Automatic multi-column row split (<code>resolve: &apos;auto&apos;</code>) eliminates manual grid tuning.</li>
                  <li>Built-in <code>dwellThresholdMs</code> filter suppresses scroll-flick strobing at the signal level.</li>
                  <li>Automatic iOS touch hygiene (pan-y, callout suppression, zero tap delay).</li>
                </ul>
              </div>

              <div className="score-col loss-col">
                <h4>Active Trade-offs &amp; Constraints</h4>
                <ul>
                  <li>Developers must adopt CSS custom properties rather than purely reactive state.</li>
                  <li>Individual CSS transform properties require modern browser support (iOS Safari 14.5+).</li>
                  <li>Server-side rendering requires hydration before spatial tracking mounts.</li>
                  <li>Gaze anchor on desktop preview requires mapping window viewport coordinates into simulated device frames.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};
