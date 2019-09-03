import {
  apply,
  map,
  typeOf,
  getTag,
  isString,
  isObject,
  isFunction,
  isBoolean,
  isNumber,
  jsonStringEscape
} from './tool';

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

/* obj, [ showHidden/options, depth, colors ] */
export function inspect(obj, showHidden, depth, colors) {
  // default options
  let ctx = {
    seen: [],
    // stylize: stylizeNoColor,
    showHidden: false,
    depth: 2,
    colors: false,
    customInspect: false,
    maxArrayLength: 100,
    breakLength: 60
  };
  if (isBoolean(showHidden)) ctx.showHidden = showHidden;
  if (isNumber(depth)) ctx.depth = depth;
  if (isBoolean(colors)) ctx.colors = colors;
  if (isObject(showHidden)) {
    // got an "options" object
    Object.assign(ctx, showHidden);
  }
  return formatValue(ctx, obj, 0);
}

function formatValue(ctx, value, recurseTimes) {
  let result;
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (
    ctx.customInspect &&
    value &&
    isFunction(value.inspect) &&
    // Filter out the util module, it's inspect function is special
    value.inspect !== inspect &&
    // Also filter out any prototype objects using the circular check.
    !(value.constructor && value.constructor.prototype === value)
  ) {
    result = value.inspect(recurseTimes, ctx);
    if (!isString(result)) {
      result = formatValue(ctx, result, recurseTimes);
    }
    return result;
  }

  // Primitive types cannot have properties
  result = formatValue_simple(value);
  if (result !== false) return result;

  // Look up the keys of the object.
  let keys = Object.keys(value);
  let visibleKeys = keys.reduce((memo, key) => ((memo[key] = true), memo), {});

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  if (recurseTimes > ctx.depth) return getTag(value);

  ctx.seen.push(value);

  let output,
    vType = typeOf(value);
  output = formatObject(ctx, value, recurseTimes, visibleKeys, keys, vType);
  ctx.seen.pop();

  return reduceToSingleString(ctx, output, recurseTimes, vType);
}

function formatValue_simple(value) {
  switch (typeOf(value)) {
    case 'string':
      return "'" + jsonStringEscape(value) + "'";
    case 'number':
    case 'boolean':
    case 'regexp':
    case 'buffer':
    case 'undefined':
    case 'null':
      return value + '';
    case 'date':
      return value.toJSON();
    case 'function': {
      let name = value.name;
      return name ? '[Function: ' + name + ']' : '[Function]';
    }
    case 'error':
      return '[' + value + ']';
    default:
      return false;
  }
}

function formatObject(ctx, obj, recurseTimes, visibleKeys, keys, vType) {
  let output = [],
    i = 0,
    len,
    key;
  if (vType == 'array') {
    len = obj.length;
    for (; i < len; i++) {
      if (i >= ctx.maxArrayLength) {
        output.push('... ' + (len - ctx.maxArrayLength) + ' more items');
        break;
      }
      output.push(formatProperty(ctx, obj[i], recurseTimes, null, true, null));
    }
    i = len;
  } else if (vType == 'map') {
    obj.forEach((value, key) => {
      output.push(formatProperty(ctx, value, recurseTimes, key, true, ' => '));
    });
  } else if (vType == 'set') {
    obj.forEach(value => {
      output.push(formatProperty(ctx, value, recurseTimes, null, true, null));
    });
  }

  for (len = keys.length; i < len; i++) {
    key = keys[i];
    output.push(
      formatProperty(ctx, obj[key], recurseTimes, key, visibleKeys[key], ': ')
    );
  }
  return output;
}

function formatProperty(ctx, value, recurseTimes, key, enumerable, sep) {
  let name, str;

  if (ctx.seen.indexOf(value) === -1) {
    str = formatValue(ctx, value, recurseTimes + 1);
  } else {
    str = '[Circular]';
  }

  if (key == null) return str;

  name = enumerable ? String(key) : '[' + key + ']';

  if (!/^\w+$/.test(name)) {
    name = "'" + name.replace(/'/g, "\\'") + "'";
  }

  return name + sep + str;
}

function reduceToSingleString(ctx, output, recurseTimes, vType) {
  let braces,
    indent,
    breakLine = false,
    len = output.length,
    i = -1,
    count = 0;
  if (vType == 'array') braces = ['[', ']'];
  else if (vType == 'map') braces = ['Map {', '}'];
  else if (vType == 'set') braces = ['Set {', '}'];
  else if (vType == 'arguments') braces = ['[Arguments] {', '}'];
  else braces = ['{', '}'];

  if (len == 0) return braces[0] + braces[1];

  while (++i < len) {
    count += output[i].length + 1;
    if (count > ctx.breakLength) {
      breakLine = true;
      break;
    }
  }

  indent = '  '.repeat(recurseTimes);
  if (breakLine) {
    return vType == 'array'
      ? braces[0] + ' ' + output.join(',\r\n  ' + indent) + ' ' + braces[1]
      : braces[0] +
          ' \r\n  ' +
          indent +
          output.join(',\r\n  ' + indent) +
          ' ' +
          braces[1];
  }
  return braces[0] + ' ' + output.join(', ') + ' ' + braces[1];
}

export function isPrimitive(value) {
  return !isObject(value);
}
