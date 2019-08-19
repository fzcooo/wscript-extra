import { isFunction, isArray, tail, identity } from './tool';

const PLACE_HOLDER = {};

export default function pipe(...args) {
  args = args
    .map(it => {
      if (isFunction(it)) return [it, PLACE_HOLDER];
      if (isArray(it)) return it;
      return [];
    })
    .filter(it => isFunction(it[0]));
  if (args.length === 0) return identity;
  return function(init) {
    return args.reduce(function(result, fn_args) {
      let fn = fn_args[0];
      let _args = tail(fn_args).map(_arg =>
        _arg === PLACE_HOLDER ? result : _arg
      );
      return fn(..._args);
    }, init);
  };
}

pipe.__ = PLACE_HOLDER;
