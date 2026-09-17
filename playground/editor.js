/**
 * HoverSense DX Playground - VS Code Code Previewer & Live Editor
 *
 * Provides a dark IDE interface for comparing legacy vs modern DX code,
 * with live JSON configuration editing that applies directly to the running rack.
 */

import { CODE_SNIPPETS } from './data.js';

export class CodeEditor {
  constructor(options) {
    this.container = options.container;
    this.onConfigChange = options.onConfigChange;
    this.currentTab = 'dx';
    this.liveConfig = options.initialConfig;

    this.initDOM();
    this.setTab('dx');
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="editor-window">
        <!-- Editor Tabs Bar -->
        <div class="editor-tabs-bar">
          <button class="editor-tab active" data-tab="dx">
            <span class="editor-tab-icon">⚡</span>
            <span>Mainframe.dx.tsx</span>
          </button>
          <button class="editor-tab" data-tab="original">
            <span class="editor-tab-icon">⚠️</span>
            <span>Mainframe.original.tsx</span>
          </button>
          <button class="editor-tab" data-tab="config">
            <span class="editor-tab-icon">⚙️</span>
            <span>config.json (Live)</span>
          </button>
          <button class="editor-tab" data-tab="styles">
            <span class="editor-tab-icon">🎨</span>
            <span>styles.css</span>
          </button>
        </div>

        <!-- Editor Toolbar -->
        <div class="editor-toolbar mono">
          <span class="editor-status-badge" id="editor-status-label">MODE: INSPECTING DX ARCHITECTURE</span>
          <button class="btn-apply-config mono" id="btn-apply-config">APPLY CONFIG →</button>
        </div>

        <!-- Editor Body -->
        <div class="editor-body">
          <div class="line-numbers-col mono" id="editor-line-numbers"></div>
          <div class="code-viewport" id="editor-code-viewport">
            <pre class="code-display mono" id="editor-code-display"></pre>
            <textarea class="code-editor-textarea mono" id="editor-textarea" style="display: none;"></textarea>
          </div>
        </div>

        <!-- Editor Footer -->
        <div class="editor-footer mono">
          <span>UTF-8 &bull; TypeScript &bull; Zero Virtual DOM Re-renders</span>
          <span>HoverSense v1.0.0</span>
        </div>
      </div>
    `;

    // Bind tab clicks
    this.container.querySelectorAll('.editor-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        this.setTab(btn.getAttribute('data-tab'));
      });
    });

    // Bind apply config button
    const applyBtn = this.container.querySelector('#btn-apply-config');
    const textarea = this.container.querySelector('#editor-textarea');

    applyBtn.addEventListener('click', () => {
      try {
        const parsed = JSON.parse(textarea.value);
        this.liveConfig = parsed;
        if (this.onConfigChange) {
          this.onConfigChange(parsed);
        }
        const statusLabel = this.container.querySelector('#editor-status-label');
        statusLabel.textContent = 'STATUS: CONFIG APPLIED TO RACK';
        statusLabel.style.color = '#10b981';
        setTimeout(() => {
          statusLabel.textContent = 'MODE: LIVE CONFIG EDITOR';
          statusLabel.style.color = 'var(--accent-cyan)';
        }, 2000);
      } catch (err) {
        alert('JSON Syntax Error: ' + err.message);
      }
    });
  }

  setTab(tabId) {
    this.currentTab = tabId;

    // Update active tab button
    this.container.querySelectorAll('.editor-tab').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });

    const statusLabel = this.container.querySelector('#editor-status-label');
    const applyBtn = this.container.querySelector('#btn-apply-config');
    const codeDisplay = this.container.querySelector('#editor-code-display');
    const textarea = this.container.querySelector('#editor-textarea');
    const lineCol = this.container.querySelector('#editor-line-numbers');

    let textContent = '';

    if (tabId === 'config') {
      textContent = JSON.stringify(this.liveConfig, null, 2);
      codeDisplay.style.display = 'none';
      textarea.style.display = 'block';
      textarea.value = textContent;
      applyBtn.style.display = 'inline-block';
      statusLabel.textContent = 'MODE: LIVE CONFIG EDITOR (EDIT & APPLY)';
      statusLabel.style.color = 'var(--accent-cyan)';
    } else {
      codeDisplay.style.display = 'block';
      textarea.style.display = 'none';
      applyBtn.style.display = 'none';

      if (tabId === 'dx') {
        textContent = CODE_SNIPPETS.dx;
        statusLabel.textContent = 'MODE: INSPECTING DX ARCHITECTURE';
        statusLabel.style.color = '#10b981';
      } else if (tabId === 'original') {
        textContent = CODE_SNIPPETS.original;
        statusLabel.textContent = 'MODE: LEGACY IMPLEMENTATION (PITFALLS MARKED)';
        statusLabel.style.color = '#f59e0b';
      } else if (tabId === 'styles') {
        textContent = CODE_SNIPPETS.styles;
        statusLabel.textContent = 'MODE: HARDWARE-ACCELERATED GPU TRANSFORMS';
        statusLabel.style.color = 'var(--accent-cyan)';
      }

      codeDisplay.innerHTML = this.highlightSyntax(textContent);
    }

    // Populate line numbers
    const lineCount = textContent.split('\n').length;
    lineCol.innerHTML = Array.from({ length: lineCount }, (_, i) => i + 1).join('<br>');
  }

  highlightSyntax(raw) {
    // Clean, lightweight syntax formatting
    return raw
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/(\/\/.*)/g, '<span style="color: #636d83; font-style: italic;">$1</span>')
      .replace(/(\/\*[\s\S]*?\*\/)/g, '<span style="color: #636d83; font-style: italic;">$1</span>')
      .replace(/\b(import|from|export|const|return|function|class|interface|type|new)\b/g, '<span style="color: #ff7b72;">$1</span>')
      .replace(/\b(true|false|null|undefined)\b/g, '<span style="color: #79c0ff;">$1</span>')
      .replace(/('([^'\\]|\\.)*'|"([^"\\]|\\.)*")/g, '<span style="color: #a5d6ff;">$1</span>')
      .replace(/\b(PITFALL \d+)/g, '<span style="color: #ff3300; font-weight: bold;">$1</span>')
      .replace(/\b(1-LINE SETUP)/g, '<span style="color: #10b981; font-weight: bold;">$1</span>');
  }
}
