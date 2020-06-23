import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import bat from './rollup-plugin-bat';
import buble from 'rollup-plugin-buble';
import inject from 'rollup-plugin-inject';
import progress from 'rollup-plugin-progress';
import includePaths from 'rollup-plugin-includepaths';
import { uglify } from 'rollup-plugin-uglify';
import { copyFileSync } from 'fs';
import { dirname, resolve as resolvePath } from 'path';

let config = {
  input: './runtime.js',
  context: 'window',
  output: {
    file: './dist/runtime.bat',
    format: 'iife',
    sourcemap: false,
  },
  plugins: [
    includePaths({
      paths: ['./lib'],
      extensions: ['.js'],
      external: [],
    }),
    nodeResolve(),
    commonjs({
      include: 'node_modules/**',
      sourceMap: false,
    }),
    bat(),
    inject({
      include: '**/*.js',
      exclude: 'node_modules/**',
      modules: {
        process: 'lib/process',
        Buffer: ['node_modules/buffer', 'Buffer'],
        console: 'lib/console',
      },
    }),
    buble({
      target: {
        ie: 11,
      },
      exclude: 'node_modules/**',
      transforms: {
        arrow: true,
        modules: false,
        dangerousForOf: true,
      },
    }),
    progress({
      clearLine: true,
    }),
  ],
};

if (process.env.ROLLUP_INPUT) {
  let input = process.env.ROLLUP_INPUT;
  let tmpFile = resolvePath(
    dirname(input),
    Math.random().toString(16).slice(2) + Date.now() + '.js'
  );
  copyFileSync(input, tmpFile);
  process.env.ROLLUP_INPUT_TMP = tmpFile;
  config.input = tmpFile;
  config.output.file = input.replace(/[.]js$/, '.bat');
}

if (process.env.ROLLUP_MIN) {
  config.plugins.push(uglify());
}

export default config;
