/**
 * HoverSense DX Playground - Main Orchestrator
 *
 * Connects the 2x3 staggered rack to the HoverSense turnkey engine,
 * updates the live telemetry bar, and binds the interactive code editor.
 */

import { createHoverSenseContainer } from '../dist/hoversense.es.js';
import { DEFAULT_PLAYGROUND_CONFIG } from './data.js';
import { renderRack, setColumnOffset } from './rack.js';
import { CodeEditor } from './editor.js';

let currentController = null;
let currentConfig = { ...DEFAULT_PLAYGROUND_CONFIG };

function initApp() {
  const rackContainer = document.getElementById('rack-container');
  const editorContainer = document.getElementById('editor-container');
  const gazeLine = document.getElementById('gaze-line');

  // 1. Render 2x3 Staggered Rack
  renderRack(rackContainer, (project) => {
    console.log(`Unit Selected: ${project.id} - ${project.title}`);
  });

  // 2. Start HoverSense Turnkey Container
  startHoverEngine(currentConfig);

  // 3. Initialize VS Code Previewer & Live Editor
  new CodeEditor({
    container: editorContainer,
    initialConfig: currentConfig,
    onConfigChange: (newConfig) => {
      currentConfig = newConfig;
      startHoverEngine(currentConfig);
    }
  });

  // 4. Bind Offset Controls
  document.querySelectorAll('.btn-offset').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.btn-offset').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const offsetPx = Number(btn.getAttribute('data-offset'));
      setColumnOffset(offsetPx);

      // Allow 260ms CSS transition to settle, then refresh physical geometry measurements
      setTimeout(() => {
        if (currentController) {
          currentController.refresh();
        }
      }, 280);
    });
  });

  // 5. Bind Dossier / Edge Case Modal
  const dossierOverlay = document.getElementById('dossier-overlay');
  const btnOpenDossier = document.getElementById('btn-open-dossier');
  const btnCloseDossier = document.getElementById('btn-close-dossier');

  if (btnOpenDossier && dossierOverlay) {
    btnOpenDossier.addEventListener('click', () => {
      dossierOverlay.classList.add('open');
    });
  }

  if (btnCloseDossier && dossierOverlay) {
    btnCloseDossier.addEventListener('click', () => {
      dossierOverlay.classList.remove('open');
    });
  }

  if (dossierOverlay) {
    dossierOverlay.addEventListener('click', (e) => {
      if (e.target === dossierOverlay) {
        dossierOverlay.classList.remove('open');
      }
    });
  }
}

function startHoverEngine(config) {
  if (currentController) {
    currentController.destroy();
    currentController = null;
  }

  const rackContainer = document.getElementById('rack-container');
  if (!rackContainer) return;

  // Turnkey 1-Line Setup
  currentController = createHoverSenseContainer(rackContainer, {
    itemSelector: '[data-hs-item]',
    bindCssVariables: true,
    feedback: true,
    screen: config.screen,
    touch: config.touch,
    arbitration: config.arbitration
  });

  // Update Gaze Line position on screen
  const gazeLine = document.getElementById('gaze-line');
  const gazeLabel = document.getElementById('gaze-label');
  if (gazeLine && config.screen && config.screen.anchorRatio) {
    const vhRatio = config.screen.anchorRatio * 100;
    gazeLine.style.top = `${vhRatio}vh`;
    if (gazeLabel) {
      gazeLabel.textContent = `GAZE ANCHOR (${config.screen.anchorRatio.toFixed(2)} vh)`;
    }
  }

  // Subscribe to telemetry state for HUD display
  currentController.engine.onState((state) => {
    updateTelemetry(state);
  });
}

function updateTelemetry(state) {
  const { hits, debug } = state;

  const elPhase = document.getElementById('t-phase');
  const elIntent = document.getElementById('t-intent');
  const elAuthority = document.getElementById('t-authority');
  const elActive = document.getElementById('t-active');
  const elStrength = document.getElementById('t-strength');

  if (elPhase) elPhase.textContent = debug.phase.toUpperCase();
  if (elIntent) elIntent.textContent = (debug.intent || 0).toFixed(2);
  if (elAuthority) elAuthority.textContent = (debug.authority || 0).toFixed(2);

  const topHit = hits[0];
  if (topHit) {
    if (elActive) elActive.textContent = `${topHit.id} (${topHit.source})`;
    if (elStrength) elStrength.textContent = topHit.strength.toFixed(3);
  } else {
    if (elActive) elActive.textContent = 'NONE';
    if (elStrength) elStrength.textContent = '0.000';
  }
}

// Bootstrap on DOM ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
}
