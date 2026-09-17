import React, { useState, useEffect } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-css';
import { CODE_SNIPPETS } from '../data';
import type { TuningConfig } from '../types';

interface VSCodeEditorProps {
  activeFile: string;
  onSelectFile: (file: string) => void;
  tuning: TuningConfig;
  onApplyTuning: (newTuning: Partial<TuningConfig>) => void;
}

export const VSCodeEditor: React.FC<VSCodeEditorProps> = ({
  activeFile,
  onSelectFile,
  tuning: _tuning,
  onApplyTuning,
}) => {
  const [editedCodes, setEditedCodes] = useState<Record<string, string>>(CODE_SNIPPETS);
  const [isEditable, setIsEditable] = useState<boolean>(activeFile.includes('.dx.'));
  const [applyFlash, setApplyFlash] = useState<boolean>(false);

  useEffect(() => {
    setIsEditable(activeFile.includes('.dx.'));
  }, [activeFile]);

  const currentCode = editedCodes[activeFile] || '';

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setEditedCodes((prev) => ({ ...prev, [activeFile]: val }));

    // Extract quick parameter changes if modified in editor
    if (activeFile === 'Mainframe.dx.tsx') {
      const anchorMatch = val.match(/anchorRatio:\s*([0-9.]+)/);
      const engageMatch = val.match(/engageAt:\s*([0-9.]+)/);
      if (anchorMatch || engageMatch) {
        onApplyTuning({
          ...(anchorMatch ? { anchorRatio: parseFloat(anchorMatch[1]) } : {}),
          ...(engageMatch ? { engageAt: parseFloat(engageMatch[1]) } : {}),
        });
      }
    }
  };

  const handleManualApply = () => {
    setApplyFlash(true);
    setTimeout(() => setApplyFlash(false), 1200);

    const val = editedCodes[activeFile] || '';
    const anchorMatch = val.match(/anchorRatio:\s*([0-9.]+)/);
    const engageMatch = val.match(/engageAt:\s*([0-9.]+)/);
    const holdMatch = val.match(/holdMsMin:\s*([0-9.]+)/);

    onApplyTuning({
      ...(anchorMatch ? { anchorRatio: parseFloat(anchorMatch[1]) } : {}),
      ...(engageMatch ? { engageAt: parseFloat(engageMatch[1]) } : {}),
      ...(holdMatch ? { holdMsMin: parseInt(holdMatch[1], 10) } : {}),
    });
  };

  const lines = currentCode.split('\n');

  // Syntax highlighting
  const getGrammar = (file: string) => {
    if (file.endsWith('.css')) return Prism.languages.css;
    return Prism.languages.tsx || Prism.languages.typescript || Prism.languages.javascript;
  };

  const highlightedHtml = Prism.highlight(
    currentCode,
    getGrammar(activeFile),
    activeFile.endsWith('.css') ? 'css' : 'tsx'
  );

  return (
    <div className="vscode-editor-container">
      {/* Tab bar */}
      <div className="vscode-tab-bar">
        {Object.keys(CODE_SNIPPETS).map((file) => {
          const isOriginal = file.includes('.original.');
          const isDX = file.includes('.dx.');
          const isActive = file === activeFile;

          return (
            <button
              key={file}
              type="button"
              className={`vscode-tab ${isActive ? 'active' : ''}`}
              onClick={() => onSelectFile(file)}
            >
              <span className="file-icon">{file.endsWith('.css') ? '🎨' : '⚛️'}</span>
              <span className="file-name">{file}</span>
              {isOriginal && <span className="tab-pill pill-legacy">LEGACY</span>}
              {isDX && <span className="tab-pill pill-dx">DX LIVE</span>}
            </button>
          );
        })}
      </div>

      {/* Editor sub-toolbar */}
      <div className="vscode-sub-toolbar">
        <div className="editor-breadcrumbs">
          <span>src</span>
          <span className="separator">/</span>
          <span>components</span>
          <span className="separator">/</span>
          <span className="current-file">{activeFile}</span>
        </div>

        <div className="toolbar-actions">
          {isEditable && (
            <button
              type="button"
              className={`btn-apply-code ${applyFlash ? 'applied' : ''}`}
              onClick={handleManualApply}
            >
              {applyFlash ? '✓ Applied to Stage' : '⚡ Run & Apply to Stage'}
            </button>
          )}
          <span className="edit-mode-indicator">
            {isEditable ? 'Mode: Live Editable' : 'Mode: Read-Only Comparison'}
          </span>
        </div>
      </div>

      {/* Editor Workspace */}
      <div className="vscode-workspace">
        {/* Line Numbers Gutter */}
        <div className="vscode-gutter" aria-hidden="true">
          {lines.map((_, i) => (
            <div key={i} className="line-num">
              {i + 1}
            </div>
          ))}
        </div>

        {/* Code Content Area */}
        <div className="vscode-code-area">
          {isEditable ? (
            <div className="editable-code-wrapper">
              <pre
                className="code-highlight-layer"
                aria-hidden="true"
                dangerouslySetInnerHTML={{ __html: highlightedHtml }}
              />
              <textarea
                value={currentCode}
                onChange={handleCodeChange}
                className="code-input-textarea"
                spellCheck={false}
                autoCapitalize="off"
                autoComplete="off"
              />
            </div>
          ) : (
            <pre
              className="readonly-code-view"
              dangerouslySetInnerHTML={{ __html: highlightedHtml }}
            />
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="vscode-status-bar">
        <div className="status-left">
          <span>UTF-8</span>
          <span>Spaces: 2</span>
          <span>{activeFile.endsWith('.css') ? 'CSS' : 'TypeScript JSX'}</span>
        </div>
        <div className="status-right">
          <span>Ln {lines.length}, Col 1</span>
          <span>HoverSense DX Engine: Connected</span>
        </div>
      </div>
    </div>
  );
};
