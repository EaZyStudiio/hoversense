import { useState, useEffect, useRef } from 'react';
import type {
  ShowcaseMode,
  MobileTab,
  TelemetryData,
  TuningConfig,
  VisualGuidesConfig,
} from './types';
import { MOCK_PROJECTS, MOCK_TEAM } from './data';
import { TopNav } from './components/TopNav';
import { LeftSidebar } from './components/LeftSidebar';
import { RightCodePanel } from './components/RightCodePanel';
import { MainframeStage } from './components/MainframeStage';
import { TeamGridStage } from './components/TeamGridStage';
import { MobileBottomNav } from './components/MobileBottomNav';
import { EdgeCaseDossier } from './components/EdgeCaseDossier';
import './playground.css';

const DEFAULT_MAINFRAME_TUNING: TuningConfig = {
  anchorRatio: 0.28,
  bandRatio: 0.30,
  engageAt: 0.90,
  holdMsMin: 320,
  holdMsMax: 1200,
  scrollLockGraceMs: 220,
  rowSplit: 0.0,
  takeoverFullPx: 560,
  releaseMode: 'off-screen',
};

const DEFAULT_COLLECTIVE_TUNING: TuningConfig = {
  anchorRatio: 0.50,
  bandRatio: 0.42,
  engageAt: 0.85,
  holdMsMin: 280,
  holdMsMax: 1000,
  scrollLockGraceMs: 200,
  rowSplit: 0.0,
  takeoverFullPx: 480,
  releaseMode: 'off-screen',
};

export default function App() {
  const [showcase, setShowcase] = useState<ShowcaseMode>('mainframe');
  const [mobileTab, setMobileTab] = useState<MobileTab>('preview');
  const [activeFile, setActiveFile] = useState<string>('Mainframe.dx.tsx');
  const [dossierOpen, setDossierOpen] = useState<boolean>(false);
  const [deviceFrame, setDeviceFrame] = useState<boolean>(true);
  const [isMobileDevice, setIsMobileDevice] = useState<boolean>(false);
  const [touchSim, setTouchSim] = useState<boolean>(true);
  const [showSimToast, setShowSimToast] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('hs_sim_toast_dismissed') !== '1';
    } catch {
      return true;
    }
  });

  // Desktop sidebar collapse toggles
  const [showLeftSidebar, setShowLeftSidebar] = useState<boolean>(true);
  const [showRightPanel, setShowRightPanel] = useState<boolean>(true);

  const [tuning, setTuning] = useState<TuningConfig>(DEFAULT_MAINFRAME_TUNING);
  const [tuningHistory, setTuningHistory] = useState<TuningConfig[]>([DEFAULT_MAINFRAME_TUNING]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  const [guides, setGuides] = useState<VisualGuidesConfig>({
    showAnchorLine: true,
    showBand: true,
    showSafeZones: false,
    showTelemetryHUD: true,
  });

  const [telemetry, setTelemetry] = useState<TelemetryData>({
    phase: 'idle',
    intent: 0,
    authority: 0,
    activeId: null,
    source: 'idle',
    strength: 0,
    zoneWeight: 1,
    scrollY: 0,
  });

  const centerScrollTriggerRef = useRef<(() => void) | null>(null);

  // Detect mobile viewport width (< 820px)
  useEffect(() => {
    const handleResize = () => {
      setIsMobileDevice(window.innerWidth < 820);
    };
    handleResize();
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSelectShowcase = (mode: ShowcaseMode) => {
    setShowcase(mode);
    if (mode === 'mainframe') {
      setActiveFile('Mainframe.dx.tsx');
      setTuning(DEFAULT_MAINFRAME_TUNING);
      setTuningHistory([DEFAULT_MAINFRAME_TUNING]);
      setHistoryIndex(0);
    } else {
      setActiveFile('TeamGrid.dx.tsx');
      setTuning(DEFAULT_COLLECTIVE_TUNING);
      setTuningHistory([DEFAULT_COLLECTIVE_TUNING]);
      setHistoryIndex(0);
    }
  };

  const handleApplyTuning = (newTuning: Partial<TuningConfig>) => {
    setTuning((prev) => {
      const next = { ...prev, ...newTuning };
      setTuningHistory((h) => {
        const sliced = h.slice(0, historyIndex + 1);
        const updated = [...sliced, next];
        return updated.slice(-50);
      });
      setHistoryIndex((prevIdx) => Math.min(prevIdx + 1, 49));
      return next;
    });
  };

  const handleUndoTuning = () => {
    if (historyIndex > 0) {
      const nextIdx = historyIndex - 1;
      setHistoryIndex(nextIdx);
      setTuning(tuningHistory[nextIdx]);
    }
  };

  const handleRedoTuning = () => {
    if (historyIndex < tuningHistory.length - 1) {
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      setTuning(tuningHistory[nextIdx]);
    }
  };

  const handleToggleGuide = (guideKey: keyof VisualGuidesConfig) => {
    setGuides((prev) => ({ ...prev, [guideKey]: !prev[guideKey] }));
  };

  const handleToggleAllGuides = () => {
    const areOn = guides.showAnchorLine || guides.showBand;
    setGuides((prev) => ({
      ...prev,
      showAnchorLine: !areOn,
      showBand: !areOn,
    }));
  };

  const handleCenterScroll = () => {
    if (centerScrollTriggerRef.current) {
      centerScrollTriggerRef.current();
    }
  };

  const handleResetDefaults = () => {
    const defaultTuning = showcase === 'mainframe' ? DEFAULT_MAINFRAME_TUNING : DEFAULT_COLLECTIVE_TUNING;
    setTuning(defaultTuning);
    setTuningHistory((h) => {
      const sliced = h.slice(0, historyIndex + 1);
      return [...sliced, defaultTuning].slice(-50);
    });
    setHistoryIndex((idx) => Math.min(idx + 1, 49));
  };

  const handleDismissSimToast = () => {
    setShowSimToast(false);
    try {
      sessionStorage.setItem('hs_sim_toast_dismissed', '1');
    } catch {
      // Safe fallback
    }
  };

  return (
    <>
      {/* Top Navigation Bar */}
      <TopNav
        showcase={showcase}
        onSelectShowcase={handleSelectShowcase}
        guides={guides}
        onToggleAllGuides={handleToggleAllGuides}
        onCenterScroll={handleCenterScroll}
        deviceFrame={deviceFrame}
        onToggleDeviceFrame={() => setDeviceFrame((d) => !d)}
        showLeftSidebar={showLeftSidebar}
        onToggleLeftSidebar={() => setShowLeftSidebar((s) => !s)}
        showRightPanel={showRightPanel}
        onToggleRightPanel={() => setShowRightPanel((s) => !s)}
        onOpenDossier={() => setDossierOpen(true)}
        isMobileDevice={isMobileDevice}
        touchSim={touchSim}
        onToggleTouchSim={() => setTouchSim((t) => !t)}
      />

      {/* Master 3-Column Workspace */}
      <main className={`playground-master-layout ${isMobileDevice ? `mobile-view-${mobileTab}` : ''}`}>
        {/* LEFT COLUMN: Biomechanical Tuning Controls */}
        {(!isMobileDevice ? showLeftSidebar : mobileTab === 'tune') && (
          <LeftSidebar
            tuning={tuning}
            onChangeTuning={handleApplyTuning}
            guides={guides}
            onToggleGuide={handleToggleGuide}
            telemetry={telemetry}
            onCenterScroll={handleCenterScroll}
            onResetDefaults={handleResetDefaults}
            canUndo={historyIndex > 0}
            canRedo={historyIndex < tuningHistory.length - 1}
            onUndo={handleUndoTuning}
            onRedo={handleRedoTuning}
          />
        )}

        {/* CENTER COLUMN: Mobile Preview Canvas */}
        {(!isMobileDevice || mobileTab === 'preview') && (
          <section className="center-canvas-pane" aria-label="Interactive Preview Canvas">
            {/* Session Touch Emulation Toast */}
            {touchSim && showSimToast && !isMobileDevice && (
              <div className="touch-sim-notification-toast mono">
                <div className="toast-text-group">
                  <span className="toast-badge">TOUCH EMULATION</span>
                  <span className="toast-desc">
                    Click &amp; drag mouse to swipe/scroll. Hovers trigger via gaze anchor horizon or touch-hold.
                  </span>
                </div>
                <div className="toast-btn-group">
                  <button
                    type="button"
                    className="btn-toast-confirm"
                    onClick={handleDismissSimToast}
                  >
                    Got it
                  </button>
                  <button
                    type="button"
                    className="btn-toast-optout"
                    onClick={() => {
                      setTouchSim(false);
                      handleDismissSimToast();
                    }}
                  >
                    Disable
                  </button>
                </div>
              </div>
            )}

            <div className={deviceFrame && !isMobileDevice ? 'simulated-phone-frame' : 'full-width-canvas-wrapper'}>
              {deviceFrame && !isMobileDevice && <div className="phone-speaker-island" />}

              {showcase === 'mainframe' ? (
                <MainframeStage
                  projects={MOCK_PROJECTS}
                  tuning={tuning}
                  guides={guides}
                  onTelemetryUpdate={setTelemetry}
                  onCenterRequest={(fn) => { centerScrollTriggerRef.current = fn; }}
                  touchSim={touchSim}
                />
              ) : (
                <TeamGridStage
                  members={MOCK_TEAM}
                  tuning={tuning}
                  guides={guides}
                  onTelemetryUpdate={setTelemetry}
                  onCenterRequest={(fn) => { centerScrollTriggerRef.current = fn; }}
                  touchSim={touchSim}
                />
              )}
            </div>
          </section>
        )}

        {/* RIGHT COLUMN: CodeMirror 6 Panel */}
        {(!isMobileDevice ? showRightPanel : mobileTab === 'code') && (
          <RightCodePanel
            activeFile={activeFile}
            onSelectFile={setActiveFile}
            tuning={tuning}
            onApplyTuning={handleApplyTuning}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation (Visible on screen < 820px) */}
      {isMobileDevice && (
        <MobileBottomNav
          activeTab={mobileTab}
          onSelectTab={setMobileTab}
        />
      )}

      {/* Technical Edge Case Dossier Modal */}
      <EdgeCaseDossier isOpen={dossierOpen} onClose={() => setDossierOpen(false)} />
    </>
  );
}
