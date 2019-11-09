import typescript from 'rollup-plugin-typescript2';
import pkg from './package.json';

export default [
  // CommonJS
  {
    input: 'src/index.ts',
    output: { file: 'lib/redux-electron-store.js', format: 'cjs', indent: false },
    external: [
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.peerDependencies || {}),
    ],
    plugins: [typescript()],
  },
];