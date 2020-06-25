import _console from '../node_modules/rollup-plugin-node-builtins/src/es6/console';
import { format, inspect } from './util';

let stdout = WScript.StdOut;
let stderr = WScript.StdErr;
let times = {};

export default {
  ..._console,

  log(...args) {
    stdout.WriteLine(format(...args));
  },

  info(...args) {
    stdout.WriteLine(format(...args));
  },

  warn(...args) {
    stderr.WriteLine(format(...args));
  },

  error(...args) {
    stderr.WriteLine(format(...args));
  },

  dir(object) {
    stdout.WriteLine(
      inspect(object, {
        customInspect: false
      })
    );
  },

  time(label = 'default') {
    times[label] = Date.now();
  },

  timeEnd(label = 'default') {
    let time = times[label];
    if (!time) {
      throw new Error('No such label: ' + label);
    }
    let duration = Date.now() - time;
    stdout.WriteLine(format('%s: %dms', label, duration));
  },

  assert(v, ...args) {
    if (!v) throw new Error(format(...args));
  }
};
