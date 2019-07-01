import './process';
import { apply, tail, has } from './tool';
import { format, inspect } from './util';

export function Console(stdout, stderr) {
  if (this.constructor !== Console) {
    return new Console(stdout, stderr);
  }
  if (!stdout || !('write' in stdout)) {
    throw new Error('Console expects a writable stream instance');
  }
  if (!stderr) {
    stderr = stdout;
  }

  this._stdout = stdout;
  this._stderr = stderr;
  this._times = {};

  // bind the prototype functions to this Console instance
  for (let key in Console.prototype) {
    if (has(Console.prototype, key)) {
      this[key] = this[key].bind(this);
    }
  }
}

Console.prototype.log = function() {
  this._stdout.writeLine(apply(format, null, arguments));
};

Console.prototype.info = Console.prototype.log;

Console.prototype.warn = function() {
  this._stderr.writeLine(apply(format, null, arguments));
};

Console.prototype.error = Console.prototype.warn;

Console.prototype.dir = function(object) {
  this._stdout.writeLine(
    inspect(object, {
      customInspect: false
    })
  );
};

Console.prototype.time = function(label) {
  this._times[label] = Date.now();
};

Console.prototype.timeEnd = function(label) {
  let time = this._times[label];
  if (!time) {
    throw new Error('No such label: ' + label);
  }
  let duration = Date.now() - time;
  this.log('%s: %dms', label, duration);
};

Console.prototype.assert = function(v /**, msg*/) {
  if (!v) throw new Error(apply(format, null, tail(arguments)));
};

this.console = new Console(process.stdout, process.stderr);
