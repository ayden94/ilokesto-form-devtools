import { beforeAll, describe, expect, it } from 'vitest';
import { CreateForm } from '@ilokesto/form';

import { defineIlokestoFormDevtools, ILOKESTO_FORM_DEVTOOLS_TAG } from '../src/define';
import { IlokestoFormDevtoolsElement } from '../src/IlokestoFormDevtoolsElement';
import type { FormDevtoolsSource } from '../src/types';

beforeAll(() => {
  defineIlokestoFormDevtools();
});

describe('ilokesto form devtools custom element', () => {
  it('subscribes to a form and renders updated field metadata', async () => {
    const form = new CreateForm({
      defaultValues: {
        email: '',
        password: '',
      },
    });
    const element = document.createElement(ILOKESTO_FORM_DEVTOOLS_TAG) as IlokestoFormDevtoolsElement;
    element.form = form;
    element.open = true;
    document.body.append(element);
    await element.updateComplete;

    form.setValue('email', 'ada@example.com', { source: 'user' });
    await element.updateComplete;

    const tabs = element.shadowRoot?.querySelectorAll<HTMLButtonElement>('.tab');
    tabs?.[1]?.click();
    await element.updateComplete;

    const text = element.shadowRoot?.textContent ?? '';
    expect(text).toContain('email');
    expect(text).toContain('ada@example.com');
    expect(text).toContain('dirty');
    expect(text).toContain('modified');

    element.remove();
  });

  it('masks configured field paths in field and values views', async () => {
    const form = new CreateForm({
      defaultValues: {
        password: 'initial-secret',
      },
    });
    const element = document.createElement(ILOKESTO_FORM_DEVTOOLS_TAG) as IlokestoFormDevtoolsElement;
    element.form = form;
    element.maskPaths = ['password'];
    element.open = true;
    document.body.append(element);
    await element.updateComplete;

    const tabs = element.shadowRoot?.querySelectorAll<HTMLButtonElement>('.tab');
    tabs?.[1]?.click();
    await element.updateComplete;
    expect(element.shadowRoot?.textContent).toContain('••••••');
    expect(element.shadowRoot?.textContent).not.toContain('initial-secret');

    tabs?.[2]?.click();
    await element.updateComplete;
    expect(element.shadowRoot?.textContent).toContain('••••••');
    expect(element.shadowRoot?.textContent).not.toContain('initial-secret');

    element.remove();
  });

  it('redacts validation messages for masked fields', async () => {
    const source = createSource(
      { password: 'initial-secret' },
      {
        '["password"]': {
          ...createField('initial-secret'),
          errors: [{ message: 'initial-secret is not accepted' }],
          touched: true,
          dirty: true,
          modified: true,
        },
      },
    );
    const element = document.createElement(ILOKESTO_FORM_DEVTOOLS_TAG) as IlokestoFormDevtoolsElement;
    element.form = source;
    element.maskPaths = ['password'];
    element.open = true;
    document.body.append(element);
    await element.updateComplete;

    element.shadowRoot?.querySelectorAll<HTMLButtonElement>('.tab')[1]?.click();
    await element.updateComplete;

    expect(element.shadowRoot?.textContent).toContain('••••••');
    expect(element.shadowRoot?.textContent).not.toContain('initial-secret');
    element.remove();
  });

  it('uses lossless field labels and segment-aware masking', async () => {
    const source = createSource(
      {
        'user.name': 'literal-secret',
        user: { name: 'nested-secret' },
      },
      {
        '["user.name"]': createField('literal-secret'),
        '["user","name"]': createField('nested-secret'),
      },
    );
    const element = document.createElement(ILOKESTO_FORM_DEVTOOLS_TAG) as IlokestoFormDevtoolsElement;
    element.form = source;
    element.maskPaths = ['user.name', ['user', 'name']];
    element.open = true;
    document.body.append(element);
    await element.updateComplete;

    const tabs = element.shadowRoot?.querySelectorAll<HTMLButtonElement>('.tab');
    tabs?.[1]?.click();
    await element.updateComplete;
    const fieldsText = element.shadowRoot?.textContent ?? '';
    expect(fieldsText).toContain('$["user.name"]');
    expect(fieldsText).toContain('$.user.name');
    expect(fieldsText).not.toContain('literal-secret');
    expect(fieldsText).not.toContain('nested-secret');

    tabs?.[2]?.click();
    await element.updateComplete;
    const valuesText = element.shadowRoot?.textContent ?? '';
    expect(valuesText).not.toContain('literal-secret');
    expect(valuesText).not.toContain('nested-secret');
    element.remove();
  });

  it('masks root values with the empty tuple path', async () => {
    const source = createSource('root-secret', { $: createField('root-secret') });
    const element = document.createElement(ILOKESTO_FORM_DEVTOOLS_TAG) as IlokestoFormDevtoolsElement;
    element.form = source;
    element.maskPaths = [[]];
    element.open = true;
    document.body.append(element);
    await element.updateComplete;

    const tabs = element.shadowRoot?.querySelectorAll<HTMLButtonElement>('.tab');
    tabs?.[1]?.click();
    await element.updateComplete;
    expect(element.shadowRoot?.textContent).not.toContain('root-secret');

    tabs?.[2]?.click();
    await element.updateComplete;
    expect(element.shadowRoot?.textContent).toContain('••••••');
    expect(element.shadowRoot?.textContent).not.toContain('root-secret');
    element.remove();
  });

  it('registers the default element idempotently', () => {
    const first = defineIlokestoFormDevtools();
    const second = defineIlokestoFormDevtools();

    expect(first).toBe(second);
    expect(customElements.get(ILOKESTO_FORM_DEVTOOLS_TAG)).toBe(first);
  });

  it('registers aliases with distinct constructors and detects unrelated collisions', () => {
    const alias = 'ilokesto-form-devtools-alias-test';
    const aliasConstructor = defineIlokestoFormDevtools(alias);

    expect(aliasConstructor).toBe(defineIlokestoFormDevtools(alias));
    expect(aliasConstructor).not.toBe(IlokestoFormDevtoolsElement);
    expect(aliasConstructor.prototype).toBeInstanceOf(IlokestoFormDevtoolsElement);

    const collision = 'ilokesto-form-devtools-collision-test';
    customElements.define(collision, class extends HTMLElement {});
    expect(() => defineIlokestoFormDevtools(collision)).toThrow(/already registered/i);
  });

  it('unsubscribes when the form source changes and when the element disconnects', async () => {
    const firstForm = new CreateForm({ defaultValues: { email: '' } });
    const secondForm = new CreateForm({ defaultValues: { email: '' } });
    let firstUnsubscribes = 0;
    let secondUnsubscribes = 0;
    const firstSource = {
      getState: () => firstForm.getState(),
      getValues: () => firstForm.getValues(),
      subscribe(listener: () => void) {
        const unsubscribe = firstForm.subscribe(listener);
        return () => {
          firstUnsubscribes += 1;
          unsubscribe();
        };
      },
    };
    const secondSource = {
      getState: () => secondForm.getState(),
      getValues: () => secondForm.getValues(),
      subscribe(listener: () => void) {
        const unsubscribe = secondForm.subscribe(listener);
        return () => {
          secondUnsubscribes += 1;
          unsubscribe();
        };
      },
    };
    const element = document.createElement(ILOKESTO_FORM_DEVTOOLS_TAG) as IlokestoFormDevtoolsElement;
    element.form = firstSource;
    document.body.append(element);
    await element.updateComplete;

    element.form = secondSource;
    await element.updateComplete;
    expect(firstUnsubscribes).toBe(1);

    element.remove();
    expect(secondUnsubscribes).toBe(1);
  });
});

function createField(value: unknown) {
  return {
    value,
    errors: [],
    touched: false,
    dirty: false,
    modified: false,
    isFocused: false,
  };
}

function createSource(values: unknown, fields: ReturnType<FormDevtoolsSource['getState']>['fields']): FormDevtoolsSource {
  const snapshot = {
    defaultValues: values,
    fields,
    submitCount: 0,
    isSubmitting: false,
    isSubmitted: false,
    isSubmitSuccessful: false,
    arrayKeys: {},
  };

  return {
    getState: () => snapshot,
    getValues: () => values,
    subscribe: () => () => undefined,
  };
}
