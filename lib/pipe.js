import { isFunction, tail } from './tool';

const PLACE_HOLDER = {};

export default function pipe(target) {
  const next = function(tasklist) {
    return function(...args) {
      if (args.length > 0) {
        tasklist.push(args);
        return next(tasklist);
      } else {
        return tasklist
          .filter(it => isFunction(it[0]))
          .map(it => {
            if (!it.includes(PLACE_HOLDER)) {
              it.splice(1, 0, PLACE_HOLDER);
            }
            return it;
          })
          .reduce(function(result, it) {
            const fn = it[0];
            const _args = tail(it).map(_arg =>
              _arg === PLACE_HOLDER ? result : _arg
            );
            return fn(..._args);
          }, target);
      }
    };
  };
  return next([]);
}

pipe.__ = PLACE_HOLDER;
