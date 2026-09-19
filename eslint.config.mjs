import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  // `next lint` only scanned source directories; the bare ESLint CLI walks the
  // whole project, so keep vendored bundles out of it.
  { ignores: ['public/**', 'lib/graphql/generated.ts'] },
];

export default eslintConfig;
