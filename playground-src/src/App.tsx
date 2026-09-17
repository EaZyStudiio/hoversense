import { useState } from 'react';
import type { ShowcaseMode, ViewLayout, TelemetryData, TuningConfig } from './types';
import { MOCK_PROJECTS, MOCK_TEAM } from './data';
import { TopNav } from './components/TopNav';
import { MainframeStage } from './components/MainframeStage';
import { TeamGridStage } from './components/TeamGridStage';
import { VSCodeEditor } from './components/VSCodeEditor';
import { EdgeCaseDossier } from './components/EdgeCaseDossier';
import './playground.css';

export default function App() {
  const [showcase, setShowcase] = useState<ShowcaseMode>('mainframe');
  const [layout, setLayout] = useState<ViewLayout>('split');
  const [activeFile, setActiveFile] = useState<string>('Mainframe.dx.tsx');
  const [dossierOpen, setDossierOpen] = useState<boolean>(false);

  const [tuning, setTuning] = useState<TuningConfig>({
    anchorRatio: 0.28,
    bandRatio: 0.32,
    engageAt: 0.90,
    holdMsMin: 320,
    holdMsMax: 1200,
    staggerOffset: 140,
    rowSplit: 1.0,
  });

  const [telemetry, setTelemetry] = useState<TelemetryData>({
    phase: 'idle',
    intent: 0,
    authority: 0,
    activeId: null,
    source: 'idle',
    strength: 0,
    zoneWeight: 1,
  });

  const handleSelectShowcase = (mode: ShowcaseMode) => {
    setShowcase(mode);
    if (mode === 'mainframe') {
      setActiveFile('Mainframe.dx.tsx');
      setTuning((prev) => ({ ...prev, anchorRatio: 0.28, rowSplit: 1.0 }));
    } else {
      setActiveFile('TeamGrid.dx.tsx');
      setTuning((prev) => ({ ...prev, anchorRatio: 0.50, rowSplit: 0.0 }));
    }
  };

  const handleApplyTuning = (newTuning: Partial<TuningConfig>) => {
    setTuning((prev) => ({ ...prev, ...newTuning }));
  };

  return (
    <>
      {/* Sleek Top Navigation Bar */}
      <TopNav
        showcase={showcase}
        onSelectShowcase={handleSelectShowcase}
        layout={layout}
        onSelectLayout={setLayout}
        telemetry={telemetry}
        onOpenDossier={() => setDossierOpen(true)}
      />

      {/* Main Split Application View */}
      <main className={`playground-body-layout layout-${layout}`}>
        {/* Left / Center: Interactive Live Stage */}
        <section className="stage-pane" aria-label="Interactive Preview Stage">
          {showcase === 'mainframe' ? (
            <MainframeStage
              projects={MOCK_PROJECTS}
              tuning={tuning}
              onTelemetryUpdate={setTelemetry}
            />
          ) : (
            <TeamGridStage
              members={MOCK_TEAM}
              tuning={tuning}
              onTelemetryUpdate={setTelemetry}
            />
          )}
        </section>

        {/* Right / Full: VS Code Dark Inspector & Live Code Editor */}
        <section className="editor-pane" aria-label="Code Inspector & Live Editor">
          <VSCodeEditor
            activeFile={activeFile}
            onSelectFile={setActiveFile}
            tuning={tuning}
            onApplyTuning={handleApplyTuning}
          />
        </section>
      </main>

      {/* Slide-out Technical Edge Case Dossier */}
      <EdgeCaseDossier isOpen={dossierOpen} onClose={() => setDossierOpen(false)} />
    </>
  );
}
