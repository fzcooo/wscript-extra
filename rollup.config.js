import bb from './rollup-plugin-build-bat';
import { uglify } from 'rollup-plugin-uglify';

let config = {
  input: './runtime.js',
  context: 'window',
  output: {
    file: './runtime.bat',
    format: 'iife',
    sourceMap: false /*,
    intro: 'var __START_PROCESS = new Date;',
    outro: `print(Array(81).join('='));print('Process time:', new Date-__START_PROCESS, 'ms');`
    */
  },
  plugins: [bb()]
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
