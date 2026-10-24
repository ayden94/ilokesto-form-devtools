import { css, html, LitElement, nothing, type PropertyValues, type TemplateResult } from 'lit';
import type { FieldPathInput } from '@ilokesto/form';

import type { FormDevtoolsPosition, FormDevtoolsSource, FormDevtoolsTab } from './types';

type FormSnapshot = ReturnType<FormDevtoolsSource['getState']>;
type FieldSnapshot = FormSnapshot['fields'][string];
type PathSegments = readonly (string | number)[];

const MASKED_VALUE = '••••••';

export class IlokestoFormDevtoolsElement extends LitElement {
  public static override properties = {
    form: { attribute: false },
    open: { type: Boolean, reflect: true },
    position: { type: String, reflect: true },
    maskPaths: { attribute: false },
    activeTab: { state: true },
    snapshot: { state: true },
  };

  public form?: FormDevtoolsSource;
  public open = false;
  public position: FormDevtoolsPosition = 'bottom-right';
  public maskPaths: readonly FieldPathInput[] = [];

  private activeTab: FormDevtoolsTab = 'overview';
  private snapshot?: FormSnapshot;
  private unsubscribe?: () => void;

  public static override styles = css`
    :host {
      --ilokesto-devtools-accent: #7c3aed;
      --ilokesto-devtools-bg: #111318;
      --ilokesto-devtools-panel: #191c23;
      --ilokesto-devtools-border: #303541;
      --ilokesto-devtools-muted: #99a1b3;
      --ilokesto-devtools-text: #f5f7fb;
      position: fixed;
      display: flex;
      flex-direction: column;
      z-index: 2147483647;
      color: var(--ilokesto-devtools-text);
      font: 12px/1.5 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }

    :host([position='bottom-right']) { right: 16px; bottom: 16px; }
    :host([position='bottom-left']) { left: 16px; bottom: 16px; }
    :host([position='top-right']) { right: 16px; top: 16px; }
    :host([position='top-left']) { left: 16px; top: 16px; }
    :host([position$='right']) { align-items: flex-end; }
    :host([position$='left']) { align-items: flex-start; }

    button {
      color: inherit;
      font: inherit;
    }

    .launcher {
      display: grid;
      width: 44px;
      height: 44px;
      border: 1px solid color-mix(in srgb, var(--ilokesto-devtools-accent) 70%, white);
      border-radius: 999px;
      background: var(--ilokesto-devtools-accent);
      box-shadow: 0 10px 30px rgb(0 0 0 / 35%);
      cursor: pointer;
      place-items: center;
      font-weight: 800;
    }

    .panel {
      width: min(680px, calc(100vw - 32px));
      max-height: min(720px, calc(100vh - 84px));
      margin-bottom: 10px;
      overflow: hidden;
      border: 1px solid var(--ilokesto-devtools-border);
      border-radius: 14px;
      background: var(--ilokesto-devtools-bg);
      box-shadow: 0 18px 60px rgb(0 0 0 / 45%);
    }

    :host([position^='top']) .panel {
      order: 2;
      margin-top: 10px;
      margin-bottom: 0;
    }

    :host([position^='top']) .launcher {
      order: 1;
    }

    .header,
    .tabs,
    .summary {
      display: flex;
      align-items: center;
    }

    .header {
      justify-content: space-between;
      padding: 12px 14px;
      border-bottom: 1px solid var(--ilokesto-devtools-border);
    }

    .title {
      font-weight: 800;
      letter-spacing: -0.02em;
    }

    .close {
      border: 0;
      background: transparent;
      cursor: pointer;
    }

    .tabs {
      gap: 4px;
      padding: 8px;
      border-bottom: 1px solid var(--ilokesto-devtools-border);
    }

    .tab {
      padding: 6px 10px;
      border: 0;
      border-radius: 7px;
      background: transparent;
      cursor: pointer;
      color: var(--ilokesto-devtools-muted);
    }

    .tab[aria-pressed='true'] {
      background: var(--ilokesto-devtools-panel);
      color: var(--ilokesto-devtools-text);
    }

    .content {
      max-height: min(600px, calc(100vh - 178px));
      overflow: auto;
      padding: 12px;
    }

    .summary {
      flex-wrap: wrap;
      gap: 8px;
    }

    .badge {
      padding: 5px 8px;
      border: 1px solid var(--ilokesto-devtools-border);
      border-radius: 999px;
      background: var(--ilokesto-devtools-panel);
    }

    .badge[data-active='true'] {
      border-color: color-mix(in srgb, var(--ilokesto-devtools-accent) 75%, white);
      color: #c4b5fd;
    }

    .empty {
      padding: 28px 16px;
      color: var(--ilokesto-devtools-muted);
      text-align: center;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }

    th,
    td {
      padding: 8px;
      overflow-wrap: anywhere;
      border-bottom: 1px solid var(--ilokesto-devtools-border);
      text-align: left;
      vertical-align: top;
    }

    th {
      position: sticky;
      top: 0;
      background: var(--ilokesto-devtools-bg);
      color: var(--ilokesto-devtools-muted);
      font-weight: 600;
    }

    .path { width: 24%; }
    .value { width: 32%; }
    .flags { width: 22%; }
    .errors { width: 22%; }

    .flag {
      display: inline-block;
      margin: 0 4px 4px 0;
      padding: 2px 5px;
      border-radius: 4px;
      background: var(--ilokesto-devtools-panel);
      color: var(--ilokesto-devtools-muted);
    }

    .flag[data-active='true'] {
      color: #c4b5fd;
    }

    pre {
      margin: 0;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .section + .section {
      margin-top: 16px;
    }

    .section h3 {
      margin: 0 0 8px;
      font: inherit;
      font-weight: 800;
    }
  `;

  /** Lit reactive accessors를 framework wrapper가 검사하기 전에 준비한다. */
  public static prepareProperties(): void {
    this.finalize();
  }

  public override connectedCallback(): void {
    super.connectedCallback();

    if (this.hasUpdated) {
      this.connectForm();
    }
  }

  public override disconnectedCallback(): void {
    this.disconnectForm();
    super.disconnectedCallback();
  }

  protected override willUpdate(changedProperties: PropertyValues<this>): void {
    if (changedProperties.has('form')) {
      this.connectForm();
    }
  }

  protected override render(): TemplateResult {
    return html`
      ${this.open ? this.renderPanel() : nothing}
      <button class="launcher" type="button" aria-label=${this.open ? 'Close ilokesto Form Devtools' : 'Open ilokesto Form Devtools'} @click=${this.toggleOpen}>
        iF
      </button>
    `;
  }

  private renderPanel(): TemplateResult {
    return html`
      <section class="panel" aria-label="ilokesto Form Devtools">
        <header class="header">
          <span class="title">ilokesto Form Devtools</span>
          <button class="close" type="button" aria-label="Close" @click=${this.toggleOpen}>×</button>
        </header>
        <nav class="tabs" aria-label="Devtools views">
          ${(['overview', 'fields', 'values'] as const).map(tab => html`
            <button
              class="tab"
              type="button"
              aria-pressed=${this.activeTab === tab}
              @click=${() => { this.activeTab = tab; }}
            >${tab}</button>
          `)}
        </nav>
        <div class="content">
          ${this.snapshot ? this.renderActiveTab(this.snapshot) : html`<p class="empty">Connect a form instance to inspect its state.</p>`}
        </div>
      </section>
    `;
  }

  private renderActiveTab(snapshot: FormSnapshot): TemplateResult {
    if (this.activeTab === 'fields') {
      return this.renderFields(snapshot);
    }

    if (this.activeTab === 'values') {
      return this.renderValues(snapshot);
    }

    const fields = Object.values(snapshot.fields);
    const invalidFields = fields.filter(field => field.errors.length > 0).length;
    const dirtyFields = fields.filter(field => field.dirty).length;
    const touchedFields = fields.filter(field => field.touched).length;
    const focusedFields = fields.filter(field => field.isFocused).length;

    return html`
      <div class="summary">
        ${this.renderBadge('dirty', dirtyFields, dirtyFields > 0)}
        ${this.renderBadge('touched', touchedFields, touchedFields > 0)}
        ${this.renderBadge('invalid', invalidFields, invalidFields > 0)}
        ${this.renderBadge('focused', focusedFields, focusedFields > 0)}
        ${this.renderBadge('submitCount', snapshot.submitCount, snapshot.submitCount > 0)}
        ${this.renderBadge('submitting', snapshot.isSubmitting, snapshot.isSubmitting)}
        ${this.renderBadge('submitted', snapshot.isSubmitted, snapshot.isSubmitted)}
        ${this.renderBadge('successful', snapshot.isSubmitSuccessful, snapshot.isSubmitSuccessful)}
      </div>
    `;
  }

  private renderBadge(label: string, value: string | number | boolean, active: boolean): TemplateResult {
    return html`<span class="badge" data-active=${active}>${label}: ${String(value)}</span>`;
  }

  private renderFields(snapshot: FormSnapshot): TemplateResult {
    const entries = Object.entries(snapshot.fields);

    if (entries.length === 0) {
      return html`<p class="empty">No fields have been registered.</p>`;
    }

    return html`
      <table>
        <thead>
          <tr>
            <th class="path">Path</th>
            <th class="value">Value</th>
            <th class="flags">Flags</th>
            <th class="errors">Errors</th>
          </tr>
        </thead>
        <tbody>
          ${entries.map(([pathKey, field]) => this.renderField(pathKey, field))}
        </tbody>
      </table>
    `;
  }

  private renderField(pathKey: string, field: FieldSnapshot): TemplateResult {
    const pathSegments = parsePathKey(pathKey);
    const path = formatPath(pathKey, pathSegments);
    const masked = pathSegments !== undefined && this.isMasked(pathSegments);
    const value = masked ? MASKED_VALUE : stringify(field.value);

    return html`
      <tr>
        <td><code>${path}</code></td>
        <td><pre>${value}</pre></td>
        <td>
          ${this.renderFlag('dirty', field.dirty)}
          ${this.renderFlag('touched', field.touched)}
          ${this.renderFlag('modified', field.modified)}
          ${this.renderFlag('focused', field.isFocused)}
        </td>
        <td>${masked
          ? MASKED_VALUE
          : field.errors.length > 0
            ? field.errors.map(error => html`<div>${error.message}</div>`)
            : '—'}</td>
      </tr>
    `;
  }

  private renderFlag(label: string, active: boolean): TemplateResult {
    return html`<span class="flag" data-active=${active}>${label}</span>`;
  }

  private renderValues(snapshot: FormSnapshot): TemplateResult {
    const values = this.form?.getValues();

    return html`
      <section class="section">
        <h3>Current values</h3>
        <pre>${stringify(redact(values, this.maskPaths))}</pre>
      </section>
      <section class="section">
        <h3>Default values</h3>
        <pre>${stringify(redact(snapshot.defaultValues, this.maskPaths))}</pre>
      </section>
      <section class="section">
        <h3>Array keys</h3>
        <pre>${stringify(snapshot.arrayKeys)}</pre>
      </section>
    `;
  }

  private isMasked(path: PathSegments): boolean {
    return this.maskPaths.some(maskPath => pathsEqual(normalizePath(maskPath), path));
  }

  private readonly toggleOpen = (): void => {
    this.open = !this.open;
    this.dispatchEvent(new CustomEvent('open-change', {
      bubbles: true,
      composed: true,
      detail: { open: this.open },
    }));
  };

  private connectForm(): void {
    this.disconnectForm();

    if (!this.isConnected || !this.form) {
      this.snapshot = undefined;
      return;
    }

    const form = this.form;
    const readSnapshot = (): void => {
      this.snapshot = form.getState();
    };

    readSnapshot();
    this.unsubscribe = form.subscribe(readSnapshot);
  }

  private disconnectForm(): void {
    this.unsubscribe?.();
    this.unsubscribe = undefined;
  }
}

function parsePathKey(pathKey: string): PathSegments | undefined {
  if (pathKey === '$') {
    return [];
  }

  try {
    const path: unknown = JSON.parse(pathKey);
    if (!Array.isArray(path) || !path.every(segment => typeof segment === 'string' || typeof segment === 'number')) {
      return undefined;
    }

    return path;
  } catch {
    return undefined;
  }
}

function formatPath(pathKey: string, path = parsePathKey(pathKey)): string {
  if (path === undefined) {
    return pathKey;
  }

  return path.reduce<string>((result, segment) => {
    if (typeof segment === 'number') {
      return `${result}[${segment}]`;
    }

    return /^[A-Za-z_$][\w$]*$/.test(segment)
      ? `${result}.${segment}`
      : `${result}[${JSON.stringify(segment)}]`;
  }, '$');
}

function stringify(value: unknown): string {
  if (value === undefined) {
    return 'undefined';
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function redact(value: unknown, maskPaths: readonly FieldPathInput[], path: PathSegments = []): unknown {
  if (maskPaths.some(maskPath => pathsEqual(normalizePath(maskPath), path))) {
    return MASKED_VALUE;
  }

  if (Array.isArray(value)) {
    return value.map((item, index) => redact(item, maskPaths, [...path, index]));
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, redact(item, maskPaths, [...path, key])]),
    );
  }

  return value;
}

function normalizePath(path: FieldPathInput): PathSegments {
  return typeof path === 'string' ? [path] : path;
}

function pathsEqual(left: PathSegments, right: PathSegments): boolean {
  return left.length === right.length && left.every((segment, index) => segment === right[index]);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
