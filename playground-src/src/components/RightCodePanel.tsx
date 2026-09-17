import React, { useState, useRef, useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { undo, redo } from '@codemirror/commands';
import type { EditorView } from '@codemirror/view';
import { Undo2, Redo2, Copy, Check, Zap, Code2, Palette } from 'lucide-react';
import { CODE_SNIPPETS } from '../data';
import type { TuningConfig } from '../types';

interface RightCodePanelProps {
  activeFile: string;
  onSelectFile: (file: string) => void;
  tuning: TuningConfig;
  onApplyTuning: (newTuning: Partial<TuningConfig>) => void;
}

export const RightCodePanel: React.FC<RightCodePanelProps> = ({
  activeFile,
  onSelectFile,
  tuning,
  onApplyTuning,
}) => {
  const [codeMap, setCodeMap] = useState<Record<string, string>>(CODE_SNIPPETS);
  const [copied, setCopied] = useState<boolean>(false);
  const [appliedFlash, setAppliedFlash] = useState<boolean>(false);
  const editorViewRef = useRef<EditorView | null>(null);
  const isTypingRef = useRef<boolean>(false);
  const typingTimerRef = useRef<number | null>(null);

  const currentCode = codeMap[activeFile] || '';
  const isEditable = activeFile.includes('.dx.');

  // Bidirectional sync: when tuning changes from LeftSidebar, reflect values into the CodeMirror editor code
  useEffect(() => {
    if (isTypingRef.current) return;
    setCodeMap((prev) => {
      let updated = false;
      const next = { ...prev };

      if (next['Mainframe.dx.tsx']) {
        const original = next['Mainframe.dx.tsx'];
        let replaced = original
          .replace(/anchorRatio:\s*[0-9.]+/, `anchorRatio: ${tuning.anchorRatio.toFixed(2)}`)
          .replace(/bandRatio:\s*[0-9.]+/, `bandRatio: ${tuning.bandRatio.toFixed(2)}`)
          .replace(/engageAt:\s*[0-9.]+/, `engageAt: ${tuning.engageAt.toFixed(2)}`)
          .replace(/holdMsMin:\s*[0-9]+/, `holdMsMin: ${tuning.holdMsMin}`);
        if (tuning.mainframeGapPx !== undefined) {
          replaced = replaced.replace(/unitGapPx:\s*[0-9.]+/, `unitGapPx: ${tuning.mainframeGapPx}`);
        }
        if (replaced !== original) {
          next['Mainframe.dx.tsx'] = replaced;
          updated = true;
        }
      }

      if (next['TeamGrid.dx.tsx']) {
        const original = next['TeamGrid.dx.tsx'];
        let replaced = original
          .replace(/anchorRatio:\s*[0-9.]+/, `anchorRatio: ${tuning.anchorRatio.toFixed(2)}`)
          .replace(/bandRatio:\s*[0-9.]+/, `bandRatio: ${tuning.bandRatio.toFixed(2)}`)
          .replace(/engageAt:\s*[0-9.]+/, `engageAt: ${tuning.engageAt.toFixed(2)}`)
          .replace(/holdMsMin:\s*[0-9]+/, `holdMsMin: ${tuning.holdMsMin}`);
        if (tuning.collectiveScatterSpread !== undefined) {
          replaced = replaced.replace(/scatterSpread:\s*[0-9.]+/, `scatterSpread: ${tuning.collectiveScatterSpread.toFixed(2)}`);
        }
        if (replaced !== original) {
          next['TeamGrid.dx.tsx'] = replaced;
          updated = true;
        }
      }

      return updated ? next : prev;
    });
  }, [tuning]);

  const handleCodeChange = (val: string) => {
    isTypingRef.current = true;
    if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
    typingTimerRef.current = window.setTimeout(() => {
      isTypingRef.current = false;
    }, 450);

    setCodeMap((prev) => ({ ...prev, [activeFile]: val }));

    // Auto-parse tuning changes from code editor in real time
    if (activeFile.includes('.dx.')) {
      const anchorMatch = val.match(/anchorRatio:\s*([0-9.]+)/);
      const bandMatch = val.match(/bandRatio:\s*([0-9.]+)/);
      const engageMatch = val.match(/engageAt:\s*([0-9.]+)/);
      const holdMatch = val.match(/holdMsMin:\s*([0-9.]+)/);
      const gapMatch = val.match(/unitGapPx:\s*([0-9.]+)/);
      const spreadMatch = val.match(/scatterSpread:\s*([0-9.]+)/);

      const updates: Partial<TuningConfig> = {};
      if (anchorMatch) updates.anchorRatio = parseFloat(anchorMatch[1]);
      if (bandMatch) updates.bandRatio = parseFloat(bandMatch[1]);
      if (engageMatch) updates.engageAt = parseFloat(engageMatch[1]);
      if (holdMatch) updates.holdMsMin = parseInt(holdMatch[1], 10);
      if (gapMatch) updates.mainframeGapPx = parseFloat(gapMatch[1]);
      if (spreadMatch) updates.collectiveScatterSpread = parseFloat(spreadMatch[1]);

      if (Object.keys(updates).length > 0) {
        onApplyTuning(updates);
      }
    }
  };

  const handleUndo = () => {
    if (editorViewRef.current) {
      undo(editorViewRef.current);
    }
  };

  const handleRedo = () => {
    if (editorViewRef.current) {
      redo(editorViewRef.current);
    }
  };

  const handleApplyCode = () => {
    setAppliedFlash(true);
    setTimeout(() => setAppliedFlash(false), 1200);

    const val = codeMap[activeFile] || '';
    const anchorMatch = val.match(/anchorRatio:\s*([0-9.]+)/);
    const bandMatch = val.match(/bandRatio:\s*([0-9.]+)/);
    const engageMatch = val.match(/engageAt:\s*([0-9.]+)/);
    const holdMatch = val.match(/holdMsMin:\s*([0-9.]+)/);
    const gapMatch = val.match(/unitGapPx:\s*([0-9.]+)/);
    const spreadMatch = val.match(/scatterSpread:\s*([0-9.]+)/);

    onApplyTuning({
      ...(anchorMatch ? { anchorRatio: parseFloat(anchorMatch[1]) } : {}),
      ...(bandMatch ? { bandRatio: parseFloat(bandMatch[1]) } : {}),
      ...(engageMatch ? { engageAt: parseFloat(engageMatch[1]) } : {}),
      ...(holdMatch ? { holdMsMin: parseInt(holdMatch[1], 10) } : {}),
      ...(gapMatch ? { mainframeGapPx: parseFloat(gapMatch[1]) } : {}),
      ...(spreadMatch ? { collectiveScatterSpread: parseFloat(spreadMatch[1]) } : {}),
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="right-code-panel" aria-label="CodeMirror 6 Inspector & Editor">
      {/* 3-Column Vertically Paired Tab Grid */}
      <div className="codemirror-tab-grid" role="tablist">
        {/* Column 1: Mainframe pair */}
        <div className="tab-pair-col">
          <button
            type="button"
            className={`cm-grid-tab ${activeFile === 'Mainframe.original.tsx' ? 'active' : ''}`}
            onClick={() => onSelectFile('Mainframe.original.tsx')}
          >
            <span className="tab-icon"><Code2 size={12} /></span>
            <span className="tab-name mono">Mainframe.original.tsx</span>
            <span className="tab-tag tag-legacy mono">ORIGINAL</span>
          </button>
          <button
            type="button"
            className={`cm-grid-tab ${activeFile === 'Mainframe.dx.tsx' ? 'active' : ''}`}
            onClick={() => onSelectFile('Mainframe.dx.tsx')}
          >
            <span className="tab-icon"><Code2 size={12} /></span>
            <span className="tab-name mono">Mainframe.dx.tsx</span>
            <span className="tab-tag tag-dx mono">DX</span>
          </button>
        </div>

        {/* Column 2: TeamGrid pair */}
        <div className="tab-pair-col">
          <button
            type="button"
            className={`cm-grid-tab ${activeFile === 'TeamGrid.original.tsx' ? 'active' : ''}`}
            onClick={() => onSelectFile('TeamGrid.original.tsx')}
          >
            <span className="tab-icon"><Code2 size={12} /></span>
            <span className="tab-name mono">TeamGrid.original.tsx</span>
            <span className="tab-tag tag-legacy mono">ORIGINAL</span>
          </button>
          <button
            type="button"
            className={`cm-grid-tab ${activeFile === 'TeamGrid.dx.tsx' ? 'active' : ''}`}
            onClick={() => onSelectFile('TeamGrid.dx.tsx')}
          >
            <span className="tab-icon"><Code2 size={12} /></span>
            <span className="tab-name mono">TeamGrid.dx.tsx</span>
            <span className="tab-tag tag-dx mono">DX</span>
          </button>
        </div>

        {/* Column 3: Stylesheet standalone */}
        <div className="tab-col-standalone">
          <button
            type="button"
            className={`cm-grid-tab standalone-tab ${activeFile === 'hoversense.css' ? 'active' : ''}`}
            onClick={() => onSelectFile('hoversense.css')}
          >
            <span className="tab-icon"><Palette size={12} /></span>
            <span className="tab-name mono">hoversense.css</span>
            <span className="tab-tag tag-css mono">CSS</span>
          </button>
        </div>
      </div>

      {/* Code Editor Header Strip */}
      <div className="codemirror-sub-bar mono">
        <div className="breadcrumbs">
          <span>components</span>
          <span className="sep">/</span>
          <span className="active-file-text">{activeFile}</span>
        </div>

        <div className="actions-cluster">
          {/* Undo / Redo buttons for CodeMirror */}
          {isEditable && (
            <>
              <button
                type="button"
                className="btn-editor-action mono"
                onClick={handleUndo}
                title="Undo code edit (Ctrl+Z)"
              >
                <Undo2 size={12} />
              </button>
              <button
                type="button"
                className="btn-editor-action mono"
                onClick={handleRedo}
                title="Redo code edit (Ctrl+Y)"
              >
                <Redo2 size={12} />
              </button>
            </>
          )}

          {isEditable && (
            <button
              type="button"
              className={`btn-apply-run mono ${appliedFlash ? 'flash-success' : ''}`}
              onClick={handleApplyCode}
            >
              {appliedFlash ? <Check size={11} /> : <Zap size={11} />}
              <span>{appliedFlash ? 'Live Stage Synced' : 'Apply to Stage'}</span>
            </button>
          )}

          <button
            type="button"
            className="btn-copy-code mono"
            onClick={handleCopy}
            title="Copy file contents"
          >
            {copied ? <Check size={11} /> : <Copy size={11} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* CodeMirror 6 Editor Body */}
      <div className="codemirror-editor-wrapper">
        <CodeMirror
          value={currentCode}
          height="100%"
          theme={oneDark}
          extensions={[javascript({ jsx: true, typescript: true })]}
          onChange={handleCodeChange}
          onCreateEditor={(view) => {
            editorViewRef.current = view;
          }}
          editable={isEditable}
          basicSetup={{
            lineNumbers: true,
            foldGutter: true,
            dropCursor: false,
            allowMultipleSelections: false,
            indentOnInput: true,
          }}
          className="codemirror-instance"
        />
      </div>

      {/* Bottom Status Bar */}
      <div className="codemirror-status-bar mono">
        <div className="status-sec">
          <span>{isEditable ? 'Mode: Live Biomechanical Sync' : 'Mode: Read-Only Reference'}</span>
        </div>
        <div className="status-sec">
          <span>CodeMirror 6</span>
          <span>UTF-8</span>
        </div>
      </div>
    </div>
  );
};
