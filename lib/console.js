import { format, inspect } from './util';

export class Console {
  constructor(stdout, stderr) {
    if (!stdout || !('Write' in stdout)) {
      throw new Error('Console expects a writable stream instance');
    }
    if (!stderr) stderr = stdout;
    this._stdout = stdout;
    this._stderr = stderr;
    this._times = {};

    for (let key in Console.prototype) {
      this[key] = this[key].bind(this);
    }
  }

  log(...args) {
    this._stdout.WriteLine(format(...args));
  }

  info(...args) {
    this._stdout.WriteLine(format(...args));
  }

  warn(...args) {
    this._stderr.WriteLine(format(...args));
  }

  error(...args) {
    this._stderr.WriteLine(format(...args));
  }

  dir(object) {
    this._stdout.WriteLine(
      inspect(object, {
        customInspect: false
      })
    );
  }

  time(label) {
    this._times[label] = Date.now();
  }

  timeEnd(label) {
    let time = this._times[label];
    if (!time) {
      throw new Error('No such label: ' + label);
    }
    let duration = Date.now() - time;
    this.log('%s: %dms', label, duration);
  }

  assert(v, ...args) {
    if (!v) throw new Error(format(...args));
  }
}

export default new Console(WScript.StdOut, WScript.StdErr);
