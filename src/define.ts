import { IlokestoFormDevtoolsElement } from './IlokestoFormDevtoolsElement';

export const ILOKESTO_FORM_DEVTOOLS_TAG = 'ilokesto-form-devtools';

/** Custom Element를 한 번만 등록하고 생성자를 반환한다. */
export function defineIlokestoFormDevtools(tagName = ILOKESTO_FORM_DEVTOOLS_TAG): typeof IlokestoFormDevtoolsElement {
  const existing = customElements.get(tagName);

  if (existing) {
    if (existing === IlokestoFormDevtoolsElement || existing.prototype instanceof IlokestoFormDevtoolsElement) {
      return existing as typeof IlokestoFormDevtoolsElement;
    }

    throw new Error(`Cannot register ${tagName}: the tag is already registered by another Custom Element.`);
  }

  if (tagName === ILOKESTO_FORM_DEVTOOLS_TAG) {
    customElements.define(tagName, IlokestoFormDevtoolsElement);
    return IlokestoFormDevtoolsElement;
  }

  class AliasedIlokestoFormDevtoolsElement extends IlokestoFormDevtoolsElement {}
  customElements.define(tagName, AliasedIlokestoFormDevtoolsElement);
  return AliasedIlokestoFormDevtoolsElement;
}
