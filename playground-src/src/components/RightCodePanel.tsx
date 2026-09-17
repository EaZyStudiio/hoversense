import React, { useState, useRef } from 'react';
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
  tuning: _tuning,
  onApplyTuning,
}) => {
  const [codeMap, setCodeMap] = useState<Record<string, string>>(CODE_SNIPPETS);
  const [copied, setCopied] = useState<boolean>(false);
  const [appliedFlash, setAppliedFlash] = useState<boolean>(false);
  const editorViewRef = useRef<EditorView | null>(null);

  const currentCode = codeMap[activeFile] || '';
  const isEditable = activeFile.includes('.dx.');

  const handleCodeChange = (val: string) => {
    setCodeMap((prev) => ({ ...prev, [activeFile]: val }));

    // Auto-parse tuning changes from code editor in real time
    if (activeFile.includes('.dx.')) {
      const anchorMatch = val.match(/anchorRatio:\s*([0-9.]+)/);
      const bandMatch = val.match(/bandRatio:\s*([0-9.]+)/);
      const engageMatch = val.match(/engageAt:\s*([0-9.]+)/);
      const holdMatch = val.match(/holdMsMin:\s*([0-9.]+)/);

      const updates: Partial<TuningConfig> = {};
      if (anchorMatch) updates.anchorRatio = parseFloat(anchorMatch[1]);
      if (bandMatch) updates.bandRatio = parseFloat(bandMatch[1]);
      if (engageMatch) updates.engageAt = parseFloat(engageMatch[1]);
      if (holdMatch) updates.holdMsMin = parseInt(holdMatch[1], 10);

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

    onApplyTuning({
      ...(anchorMatch ? { anchorRatio: parseFloat(anchorMatch[1]) } : {}),
      ...(bandMatch ? { bandRatio: parseFloat(bandMatch[1]) } : {}),
      ...(engageMatch ? { engageAt: parseFloat(engageMatch[1]) } : {}),
      ...(holdMatch ? { holdMsMin: parseInt(holdMatch[1], 10) } : {}),
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="right-code-panel" aria-label="CodeMirror 6 Inspector & Editor">
      {/* File Tabs Bar */}
      <div className="codemirror-tab-bar">
        {Object.keys(CODE_SNIPPETS).map((file) => {
          const isOriginal = file.includes('.original.');
          const isDX = file.includes('.dx.');
          const isActive = file === activeFile;

          return (
            <button
              key={file}
              type="button"
              className={`codemirror-tab ${isActive ? 'active' : ''}`}
              onClick={() => onSelectFile(file)}
            >
              <span className="tab-icon">
                {file.endsWith('.css') ? <Palette size={12} /> : <Code2 size={12} />}
              </span>
              <span className="tab-name mono">{file}</span>
              {isOriginal && <span className="tab-tag tag-legacy mono">ORIGINAL</span>}
              {isDX && <span className="tab-tag tag-dx mono">DX</span>}
            </button>
          );
        })}
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
