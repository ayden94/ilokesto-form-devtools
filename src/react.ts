import React from 'react';
import { createComponent, type EventName } from '@lit/react';

import { IlokestoFormDevtoolsElement } from './IlokestoFormDevtoolsElement';
import { defineIlokestoFormDevtools, ILOKESTO_FORM_DEVTOOLS_TAG } from './define';
import type { FormDevtoolsOpenChangeEvent } from './types';

defineIlokestoFormDevtools();
IlokestoFormDevtoolsElement.prepareProperties();

export const FormDevtools = createComponent({
  tagName: ILOKESTO_FORM_DEVTOOLS_TAG,
  elementClass: IlokestoFormDevtoolsElement,
  react: React,
  events: {
    onOpenChange: 'open-change' as EventName<FormDevtoolsOpenChangeEvent>,
  },
});
