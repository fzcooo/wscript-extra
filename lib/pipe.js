import { isFunction, isArray, tail, identity } from './tool';

const PLACE_HOLDER = {};

export default function pipe(...args) {
  args = args
    .map(it => (isFunction(it) ? [it, PLACE_HOLDER] : it))
    .filter(it => isArray(it) && it.length > 0 && isFunction(it[0]))
    .map(it => (it.length === 1 ? [it[0], PLACE_HOLDER] : it));
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
