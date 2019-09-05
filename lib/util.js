import { apply, map, isString, isObject } from './tool';
import { printJson } from './pprint';

function log(msg = '') {
  WScript.Echo(msg);
}

export function inherits(ctor, superCtor) {
  ctor.super_ = superCtor;
  ctor.prototype = Object.create(superCtor.prototype, {
    constructor: ctor
  });
}

const FMT_REG = /%[sdifjoO%]/g;

export function format(f) {
  if (!isString(f)) {
    return map(arguments, arg => inspect(arg)).join(' ');
  }

  let i = 1,
    args = arguments,
    len = args.length,
    str = f.replace(FMT_REG, x => {
      if (x === '%%') return '%';
      if (i >= len) return x;
      switch (x) {
        case '%s':
        case '%d':
        case '%i':
        case '%f':
          return args[i++];
        case '%j':
          return JSON.stringify(args[i++]);
        case '%o':
        case '%O':
          return inspect(args[i++]);
        default:
          return x;
      }
    });
  for (let x = args[i]; i < len; x = args[++i]) {
    if (isPrimitive(x)) str += ' ' + x;
    else str += ' ' + inspect(x);
  }
  return str;
}

// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
export function deprecate(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (global.process === void 0) {
    return () => apply(deprecate(fn, msg), null, arguments);
  }

  if (process.noDeprecation === true) return fn;

  let warned = false;

  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) throw new Error(msg);
      else if (process.traceDeprecation) log(msg);
      else log(msg);
      warned = true;
    }
    return apply(fn, null, arguments);
  }

  return deprecated;
}

let debugs = {};
let debugEnviron;

export function debuglog(set) {
  if (debugEnviron == null) debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      let pid = process.pid;
      debugs[set] = () => {
        let msg = apply(format, null, arguments);
        log(`${set} ${pid}: ${msg}`);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
}

export function inspect(obj, showHidden, depth, colors) {
  let options = {
    seen: [],
    showHidden: false,
    depth: 2,
    colors: false,
    customInspect: false,
    maxArrayLength: 100,
    breakLength: 60
  };
  if (showHidden !== void 0) options.showHidden = showHidden;
  if (depth !== void 0) options.depth = depth;
  if (colors !== void 0) options.colors = colors;
  return printJson(obj, options);
}

export function isPrimitive(value) {
  return !isObject(value);
}
