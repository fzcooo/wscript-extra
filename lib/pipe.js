import { isFunction } from './tool';

export default class Pipe {
  constructor(target) {
    if (this instanceof Pipe) {
      this._target = target;
      this._ = this.pipe;
    } else {
      return new Pipe(target);
    }
  }

  pipe(func, ...args) {
    if (isFunction(func)) {
      if (args.length == 0) {
        this._target = func(this._target);
      } else {
        let _args = args.map(it => (it === Pipe ? this._target : it));
        this._target = func(..._args);
      }
    } else {
      this._target = func;
    }
    return this;
  }

  value() {
    return this._target;
  }

  log(msg) {
    msg ? console.log(msg, this._target) : console.log(this._target);
    return this;
  }
}

Pipe.create = Pipe.__ = function(target) {
  return new Pipe(target);
};
