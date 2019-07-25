import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import bat from './rollup-plugin-bat';
import buble from 'rollup-plugin-buble';
import inject from 'rollup-plugin-inject';
import progress from 'rollup-plugin-progress';
import { uglify } from 'rollup-plugin-uglify';
import { resolve as resolve_path } from 'path';

let config = {
  input: './runtime.js',
  context: 'window',
  output: {
    file: './dist/runtime.bat',
    format: 'iife',
    sourceMap: false
  },
  plugins: [
    nodeResolve(),
    commonjs({
      include: 'node_modules/**',
      sourceMap: false
    }),
    bat(),
    inject({
      include: '**/*.js',
      exclude: 'node_modules/**',
      modules: {
        process: resolve_path('lib/process'),
        Buffer: resolve_path('lib/buffer'),
        console: resolve_path('lib/console')
      }
    }),
    buble({
      target: {
        ie: 11
      },
      exclude: 'node_modules/**',
      transforms: {
        arrow: true,
        modules: false,
        dangerousForOf: true
      }
    }),
    progress({
      clearLine: true
    })
  ]
};

if (process.env.ROLLUP_INPUT) {
  let input = process.env.ROLLUP_INPUT;
  config.input = input;
  config.output.file = input.replace(/[.]js$/, '.bat');
}

if (process.env.ROLLUP_MIN) {
  config.plugins.push(uglify());
}

export default config;
