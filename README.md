# @ilokesto/form-devtools

A framework-independent, read-only inspector for `@ilokesto/form`.

The package exposes a Lit custom element that observes the public form contract (`getState`, `getValues`, and `subscribe`). Its UI runs inside Shadow DOM, so the same inspector can be mounted from vanilla JavaScript, Vue, Solid, Svelte, or React without sharing the host application's component tree.

## Vanilla and custom elements

```ts
import { CreateForm } from '@ilokesto/form';
import '@ilokesto/form-devtools/register';

const form = new CreateForm({
  defaultValues: {
    email: '',
    password: '',
  },
});

const devtools = document.createElement('ilokesto-form-devtools');
devtools.form = form;
devtools.maskPaths = ['password'];
document.body.append(devtools);
```

Importing the package root does not register a global tag. Use the `register` entrypoint for automatic registration or call `defineIlokestoFormDevtools()` explicitly.

## React

```tsx
import { useForm } from '@ilokesto/form/react';
import { FormDevtools } from '@ilokesto/form-devtools/react';

function LoginForm() {
  const { form } = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  return <FormDevtools form={form} maskPaths={['password']} />;
}
```

## Safety

The first release is intentionally read-only. It does not call `setValue`, `reset`, `trigger`, or `submit`. Form values can still contain credentials or personal information, so pass `maskPaths` for sensitive fields and load the package only in development builds.

`maskPaths` follows the `@ilokesto/form` path contract. A string names one literal top-level field, a tuple addresses a nested value, and an empty tuple addresses the root value.

```ts
devtools.maskPaths = [
  'password',
  ['profile', 'token'],
  [],
];
```

Masked fields hide validation messages as well as values because an error message can contain the submitted value.
