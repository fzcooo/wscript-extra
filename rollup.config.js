import bat from './rollup-plugin-bat';
import bubel from 'rollup-plugin-buble';
import inject from 'rollup-plugin-inject';
import progress from 'rollup-plugin-progress';
import { uglify } from 'rollup-plugin-uglify';
import { resolve as resolve_path } from 'path';

let config = {
  input: './runtime.js',
  context: 'window',
  output: {
    file: './runtime.bat',
    format: 'iife',
    sourceMap: false
  },
  plugins: [
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

    bubel({
      target: {
        ie: 11
      },
      transforms: {
        arrow: true,
        modules: false,
        dangerousForOf: true
      }
    }),

    progress({
      clearLine: false
    })
  ]
};

if (process.env.ROLLUP_INPUT) {
  let input = process.env.ROLLUP_INPUT;
  config.input = input;
  config.output.file = input.replace(/[.]js$/, '.bat');
}

if (process.env.ROLLUP_MINI) {
  config.plugins.push(uglify());
}

export default config;
