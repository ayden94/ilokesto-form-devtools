export { IlokestoFormDevtoolsElement } from './IlokestoFormDevtoolsElement';
export { defineIlokestoFormDevtools, ILOKESTO_FORM_DEVTOOLS_TAG } from './define';
export type {
  FormDevtoolsOpenChangeDetail,
  FormDevtoolsOpenChangeEvent,
  FormDevtoolsPosition,
  FormDevtoolsSource,
  FormDevtoolsTab,
} from './types';

declare global {
  interface HTMLElementTagNameMap {
    'ilokesto-form-devtools': import('./IlokestoFormDevtoolsElement').IlokestoFormDevtoolsElement;
  }
}
