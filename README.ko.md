# @ilokesto/form-devtools

`@ilokesto/form`의 상태를 프레임워크와 무관하게 관찰하는 읽기 전용 개발 도구다.

이 패키지는 `getState`, `getValues`, `subscribe`로 구성된 Form의 공개 계약만 사용한다. UI는 Lit으로 작성한 Custom Element이며 Shadow DOM 안에서 렌더링된다. 따라서 Vanilla JavaScript, Vue, Solid, Svelte, React가 같은 도구를 공유할 수 있다.

## Custom Element로 사용하기

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

루트 진입점은 전역 태그를 자동 등록하지 않는다. 자동 등록이 필요하면 `register` 진입점을 가져오고, 명시적으로 제어하려면 `defineIlokestoFormDevtools()`를 호출한다.

## React에서 사용하기

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

## 민감한 값

첫 버전은 `setValue`, `reset`, `trigger`, `submit`을 호출하지 않는 읽기 전용 도구다. 하지만 폼 값 자체에는 비밀번호나 개인정보가 들어갈 수 있다. 민감한 필드는 `maskPaths`로 가리고, 프로덕션 번들에는 포함하지 않는 편이 안전하다.

`maskPaths`는 `@ilokesto/form`의 경로 규칙을 그대로 따른다. 문자열은 점 경로가 아니라 하나의 최상위 필드 이름이고, 중첩 경로는 튜플로 적는다. 루트 값은 빈 튜플로 지정한다.

```ts
devtools.maskPaths = [
  'password',
  ['profile', 'token'],
  [],
];
```

마스킹된 필드는 값뿐 아니라 검증 오류 메시지도 감춘다. 오류 문구에 입력값이 포함될 수 있기 때문이다.
