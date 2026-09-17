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

          {/* Edge Cases */}
          <div className="dossier-section">
            <h3 className="section-heading">2. Edge Cases DX Cannot Handle Gracefully</h3>

            <div className="edge-card">
              <div className="edge-header">
                <span className="edge-badge badge-warning">EDGE CASE 1</span>
                <h4>Conditional DOM Trees vs Direct CSS Custom Properties</h4>
              </div>
              <p className="edge-text">
                <strong>The Conflict:</strong> Pure CSS variables (--hs-strength, --hs-source) run directly
                on the GPU compositor thread. This is ideal for transform, opacity, filter, and box-shadow.
                However, in mobile cards that reveal image popups, if developers want to avoid downloading
                10 high-resolution images upfront on mobile, they need to mount images conditionally. CSS
                variables cannot mount or unmount DOM nodes.
              </p>
              <p className="edge-text">
                <strong>How to pipe it in:</strong> Use dual-tier event dispatch: drive continuous 60fps
                scaling via CSS variables, and gate DOM mounting via the discrete onHover event with an
                activation threshold (strength &gt;= 0.75 or debug.phase === &apos;engaged&apos;).
              </p>
              <p className="edge-verdict">
                <strong>Is it worth it?</strong> Yes. Preserves 60fps scrolling while preventing mobile data waste.
              </p>
            </div>

            <div className="edge-card">
              <div className="edge-header">
                <span className="edge-badge badge-danger">EDGE CASE 2</span>
                <h4>Imperative Animation Engines (GSAP) Overwriting Inline Styles</h4>
              </div>
              <p className="edge-text">
                <strong>The Conflict:</strong> When GSAP animates an element directly (e.g. gsap.to(card, &#123; scale: 1.06 &#125;)),
                it writes inline style=&quot;transform: ...&quot;. This inline style completely overwrites
                HoverSense&apos;s CSS variable rule (transform: scale(calc(1 + var(--hs-strength) * 0.04))).
              </p>
              <p className="edge-text">
                <strong>How to pipe it in:</strong> Structural separation. The outer element is owned exclusively
                by HoverSense for spatial tracking and CSS variable transforms. The inner element is owned by
                GSAP for personality effects (glitch, optical blur, personality quotes).
              </p>
              <p className="edge-verdict">
                <strong>Is it worth it?</strong> Yes. Clean architectural separation between spatial layout and
                micro-choreography.
              </p>
            </div>

            <div className="edge-card">
              <div className="edge-header">
                <span className="edge-badge badge-success">EDGE CASE 3</span>
                <h4>Staggered Multi-Column Grids (2x3 Staggered Rack)</h4>
              </div>
              <p className="edge-text">
                <strong>The Conflict:</strong> In a 2x3 layout where Column 2 is offset downward by 140px,
                items in Row 1 Col 1 and Row 1 Col 2 do not cross the gaze horizon simultaneously.
              </p>
              <p className="edge-text">
                <strong>Resolution:</strong> HoverSense handles this natively. It does not calculate hover based
                on grid indices; it measures the physical viewport bounding box (getBoundingClientRect) on every
                frame. Combined with rowSplit: 1.0, Column 1 and Column 2 crossfade independently as you scroll.
              </p>
              <p className="edge-verdict">
                <strong>Is it worth it?</strong> Native capability. Zero custom plumbing required.
              </p>
            </div>

            <div className="edge-card">
              <div className="edge-header">
                <span className="edge-badge badge-warning">EDGE CASE 4</span>
                <h4>Rapid Scroll Flick vs Dwell (Mobile Popup Strobing)</h4>
              </div>
              <p className="edge-text">
                <strong>The Conflict:</strong> If a preview popup opens immediately on strength &gt; 0, a rapid
                vertical flick down the rack triggers 6 popups in rapid succession for 16ms each, creating visual
                strobing.
              </p>
              <p className="edge-text">
                <strong>Resolution:</strong> The touch channel enforces a 220ms scrollLockGraceMs window. Rapid
                vertical flicks are classified as native scrolling, suppressing touch hover. Additionally, the
                dwellThresholdMs setting (80ms default) requires continuous gaze presence before discrete triggers fire.
              </p>
              <p className="edge-verdict">
                <strong>Is it worth it?</strong> Yes. Eliminates strobing at the mathematical source without adding application-side timer boilerplate.
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
                  <li>Automatic iOS touch hygiene (eliminates callouts and selection delay).</li>
                  <li>Turnkey 1-line initialization replaces 140 lines of boilerplate.</li>
                  <li>Native MutationObserver auto-syncs dynamic tab switches.</li>
                  <li>Discrete data-hs-engaged attribute bridges CSS variables to conditional DOM mounting.</li>
                </ul>
              </div>

              <div className="score-col loss-col">
                <h4>Downsides &amp; Trade-offs</h4>
                <ul>
                  <li>Developers must adopt CSS custom properties rather than purely reactive state.</li>
                  <li>Independent scale and translate properties decouple GSAP, but monolithic transforms require scoping.</li>
                  <li>Server-side rendering requires hydration before spatial tracking mounts.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};
