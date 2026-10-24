import type { Form } from '@ilokesto/form';

/** Devtools가 form을 읽고 변경 알림을 받는 데 필요한 최소 계약이다. */
export type FormDevtoolsSource<TValues = unknown> = Pick<Form<TValues>, 'getState' | 'getValues' | 'subscribe'>;

export type FormDevtoolsPosition = 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';

export type FormDevtoolsTab = 'overview' | 'fields' | 'values';

export type FormDevtoolsOpenChangeDetail = {
  open: boolean;
};

export type FormDevtoolsOpenChangeEvent = CustomEvent<FormDevtoolsOpenChangeDetail>;
