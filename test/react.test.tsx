import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { CreateForm } from '@ilokesto/form';

import { ILOKESTO_FORM_DEVTOOLS_TAG } from '../src/define';
import { FormDevtools } from '../src/react';
import type { IlokestoFormDevtoolsElement } from '../src/IlokestoFormDevtoolsElement';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('React wrapper', () => {
  it('passes the form instance to the same custom element', async () => {
    const container = document.createElement('div');
    document.body.append(container);
    const root = createRoot(container);
    const form = new CreateForm({ defaultValues: { email: '' } });

    await act(async () => {
      root.render(<FormDevtools form={form} open />);
    });

    const element = container.querySelector(ILOKESTO_FORM_DEVTOOLS_TAG) as IlokestoFormDevtoolsElement | null;
    expect(element).not.toBeNull();
    expect(element?.form).toBe(form);

    await act(async () => {
      form.setValue('email', 'react@example.com', { source: 'user' });
    });
    await element?.updateComplete;

    const overview = element?.shadowRoot?.textContent ?? '';
    expect(overview).toContain('dirty: 1');

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it('lets React 19 assign a non-primitive form prop directly to the custom element', async () => {
    const container = document.createElement('div');
    document.body.append(container);
    const root = createRoot(container);
    const form = new CreateForm({ defaultValues: { email: '' } });

    await act(async () => {
      root.render(React.createElement(ILOKESTO_FORM_DEVTOOLS_TAG, { form, open: true }));
    });

    const element = container.querySelector(ILOKESTO_FORM_DEVTOOLS_TAG) as IlokestoFormDevtoolsElement | null;
    expect(element?.form).toBe(form);

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it('maps open-change to onOpenChange and preserves array properties', async () => {
    const container = document.createElement('div');
    document.body.append(container);
    const root = createRoot(container);
    const form = new CreateForm({ defaultValues: { password: '' } });
    const maskPaths = ['password'] as const;
    const onOpenChange = vi.fn();

    await act(async () => {
      root.render(
        <FormDevtools form={form} maskPaths={maskPaths} onOpenChange={onOpenChange} />,
      );
    });

    const element = container.querySelector(ILOKESTO_FORM_DEVTOOLS_TAG) as IlokestoFormDevtoolsElement;
    const launcher = element.shadowRoot?.querySelector<HTMLButtonElement>('.launcher');
    expect(element.maskPaths).toBe(maskPaths);

    await act(async () => {
      launcher?.click();
    });

    expect(onOpenChange).toHaveBeenCalledOnce();
    expect(onOpenChange.mock.calls[0]?.[0].detail).toEqual({ open: true });

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});
