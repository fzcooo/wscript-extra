const TO_STR = {}.toString;
const HAS_OWN = {}.hasOwnProperty;

// #region Util

export function chr(n) {
  return String.fromCharCode(n);
}

export function ord(c) {
  return c.charCodeAt(0);
}

export function hex(x) {
  return Number(x).toString(16);
}

export function bin(x) {
  return Number(x).toString(2);
}

export function oct(x) {
  return Number(x).toString(8);
}

export function int(x, base) {
  return parseInt(x, base);
}

export function getTag(value) {
  return TO_STR.call(value);
}

const TYPE_REG = /\[object (\w+)\]/;

export function typeOf(obj) {
  let tp = TO_STR.call(obj)
    .match(TYPE_REG)[1]
    .toLowerCase();
  if (
    tp === 'object' &&
    obj.constructor &&
    typeof obj.constructor === 'function'
  ) {
    tp = obj.constructor.name.toLowerCase() || tp;
  }
  return tp;
}

export let type = typeOf;

export function has(obj, key) {
  return obj != null && HAS_OWN.call(obj, key);
}

export function isArray(obj) {
  return Array.isArray(obj);
}

export function isObject(obj) {
  let type = typeof obj;
  return obj != null && (type == 'object' || type == 'function');
}

export function isFunction(obj) {
  return typeof obj == 'function';
}

export function isString(obj) {
  return typeof obj == 'string';
}

export function isNumber(obj) {
  return typeof obj == 'number';
}

export function isBoolean(obj) {
  return obj === true || obj === false;
}

export function isDate(obj) {
  return TO_STR.call(obj) == '[object Date]';
}

export function isRegExp(obj) {
  return TO_STR.call(obj) == '[object RegExp]';
}

export function isError(obj) {
  return TO_STR.call(obj) == '[object Error]';
}

export function isMap(obj) {
  return obj instanceof Map;
}

export function isSet(obj) {
  return obj instanceof Set;
}

export function isWeakMap(obj) {
  return obj instanceof WeakMap;
}

export function isInteger(value) {
  return typeof value == 'number' && value % 1 == 0;
}

export function isArguments(obj) {
  return TO_STR.call(obj) == '[object Arguments]';
}

export function isObjectLike(value) {
  return typeof value == 'object' && value != null;
}

export function isLength(value) {
  return isInteger(value) && value > -1 && value < 9007199254740992;
}

export function isArrayLike(obj) {
  return obj != null && typeof obj != 'function' && isLength(obj.length);
}

export function isEmpty(obj) {
  if (obj == null) return true;
  if (isArrayLike(obj)) return !obj.length;
  if (isMap(obj) || isSet(obj)) return !obj.size;
  for (let key in obj) {
    if (HAS_OWN.call(obj, key)) return false;
  }
  return true;
}

export function isBuffer(obj) {
  return Buffer.isBuffer(obj);
}

export function apply(fn, thisArg, args) {
  let argCnt = (args && args.length) || 0,
    hasThis = thisArg == null;
  switch (argCnt) {
    case 0:
      return hasThis ? fn() : fn.call(thisArg);
    case 1:
      return hasThis ? fn(args[0]) : fn.call(thisArg, args[0]);
    case 2:
      return hasThis
        ? fn(args[0], args[1])
        : fn.call(thisArg, args[0], args[1]);
    case 3:
      return hasThis
        ? fn(args[0], args[1], args[2])
        : fn.call(thisArg, args[0], args[1], args[2]);
    default:
      return fn.apply(thisArg, args);
  }
}

export function range(start, end, step) {
  let i = -1,
    len,
    result = [];
  if (start == null) return result;
  if (end == null) (end = start), (start = 0);
  if (step == null) step = 1;
  step = Math.abs(step);
  if (start > end) step = -step;
  len = Math.max(Math.ceil((end - start) / step), 0);
  result = new Array(len);
  while (++i < len) (result[i] = start), (start += step);
  return result;
}

export function toPath(pth) {
  if (isString(pth)) pth = pth.split(/[.[\]]/).filter(identity);
  else if (isNumber(pth)) pth = [pth];
  return isArray(pth) ? pth : [];
}

export function identity(x) {
  return x;
}

export function iteratee(x) {
  switch (typeOf(x)) {
    case 'function':
      return x;
    case 'string':
    case 'number':
      return property(x);
    case 'array':
      return properties(x);
    case 'object':
      return matches(x);
    default:
      return identity;
  }
}

// #endregion

// #region Collection

export function each(x, fn = identity) {
  let i, key, len;
  if (isArrayLike(x)) {
    for (i = 0, len = x.length; i < len; i++) {
      if (fn(x[i], i) === false) break;
    }
  } else if (x instanceof Enumerator) {
    for (i = 0; !x.atEnd(); x.moveNext(), i++) {
      if (fn(x.item(), i) === false) break;
    }
  } else if (isLength(x)) {
    for (i = 0; i < x; i++) {
      if (fn(i, i) === false) break;
    }
  } else if (isObject(x)) {
    for (key in x) {
      if (has(x, key)) {
        if (fn(x[key], key) === false) break;
      }
    }
  }
  return x;
}

export let forEach = each;

export function map(x, fn) {
  let result = [];
  fn = iteratee(fn);
  each(x, (v, k) => {
    result.push(fn(v, k));
  });
  return result;
}

export let select = map;

export function reduce(x, fn, accumulator) {
  each(x, (v, k) => {
    accumulator = fn(accumulator, v, k);
  });
  return accumulator;
}

export function filter(x, fn) {
  let filtered = [];
  fn = iteratee(fn);
  each(x, (v, k) => {
    if (fn(v, k)) filtered.push(v);
  });
  return filtered;
}

export let where = filter;

export function toArray(x) {
  let i, len, arr;
  if (isArray(x)) return x;
  if (isArrayLike(x)) {
    i = -1;
    len = x.length;
    arr = Array(len);
    while (++i < len) arr[i] = x[i];
    return arr;
  }
  if (isObject(x)) return map(x);
  return [];
}

function baseFind(x, fn) {
  let found = null,
    i = -1;
  fn = iteratee(fn);
  each(x, (v, k) => {
    if (fn(v)) {
      i = k;
      return false;
    }
  });
  return [found, i];
}

export function find(x, fn) {
  return baseFind(x, fn)[0];
}

export function findIndex(x, fn) {
  return baseFind(x, fn)[1];
}

export function groupBy(obj, fn) {
  let result = {};
  fn = iteratee(fn);
  each(obj, (v, k) => {
    let key = fn(v, k);
    has(result, key) ? result[key].push(v) : (result[key] = [v]);
  });
  return result;
}

export function countBy(x, fn) {
  fn = iteratee(fn);
  return toArray(x).reduce((result, v, k) => {
    let key = fn(v, k);
    has(result, key) ? result[key]++ : (result[key] = 1);
    return result;
  }, {});
}

export function size(obj) {
  return isArrayLike(obj) ? obj.length : Object.keys(obj).length;
}

export let len = size;

// #endregion

// #region Array

export function uniqBy(x, fn) {
  let result = [],
    memo = new Set();
  fn = iteratee(fn);
  each(x, (v, k) => {
    let key = fn(v, k);
    if (!memo.has(key)) {
      result.push(v);
      memo.add(key);
    }
  });
  memo.clear();
  return result;
}

export function uniq(arr) {
  return uniqBy(arr, identity);
}

export let distinct = uniq;

export let distinctBy = uniqBy;

export function chunk(x, n) {
  if (n == null || !isInteger(n) || n < 1) return [];
  let result = [],
    tmp = Array(n),
    off = 0;
  each(x, v => {
    tmp[off++] = v;
    if (off == 1) {
      result.push(tmp);
    } else if (off == n) {
      off = 0;
      tmp = Array(n);
    }
  });
  return result;
}

export function concat(...args) {
  return args.map(toArray).reduce((result, arg) => {
    return result.concat(toArray(arg));
  }, []);
}

export function slice(x, begin, end) {
  return toArray(x).slice(begin, end);
}

// drop([1, 2, 3, 4, 5], 2) => [3, 4, 5]
export function drop(arr, n) {
  return slice(arr, n || 1);
}

// tail([1, 2, 3, 4]) => [2, 3, 4]
export function tail(arr) {
  return drop(arr, 1);
}

// initail([1, 2, 3, 4]) => [1, 2, 3]
export function initial(arr) {
  return slice(arr, 0, -1);
}

// take([1, 2, 3, 4, 5], 2) => [1, 2]
export function take(arr, n) {
  return slice(arr, 0, n);
}

export function takeRight(arr, n) {
  return slice(arr, -n);
}

export function contains(x, val, pos = 0) {
  return toArray(x).indexOf(val, pos) != -1;
}

export let include = contains;

export let includes = contains;

export function first(x) {
  return toArray(x)[0];
}

export let head = first;

export function last(x) {
  let arr = toArray(x);
  return arr[arr.length - 1];
}

export function nth(x, n) {
  let arr = toArray(x);
  return n < 0 ? arr[arr.length + n] : arr[n];
}

export function pullAll(arr, values) {
  let i = arr.length;
  while (i--) {
    if (values.includes(arr[i])) arr.splice(i, 1);
  }
  return arr;
}

export function pull(x, ...args) {
  return pullAll(x, args);
}

export function remove(arr, fn) {
  let i = arr.length;
  fn = iteratee(fn);
  while (i--) {
    if (fn(arr[i], i)) arr.splice(i, 1);
  }
  return arr;
}

export function difference(arr, values) {
  return filter(arr, it => !includes(values, it));
}

export function unzip(arr) {
  if (arr == null || !arr.length) {
    return [];
  }
  let len = 0;
  arr = filter(arr, it => {
    if (has(it, 'length')) {
      len = Math.max(it.length, len);
      return true;
    }
  });
  let i = -1,
    result = Array(len);
  while (++i < len) {
    result[i] = map(arr, i);
  }
  return result;
}

export function zip() {
  return unzip(arguments);
}

export function flatten(arr) {
  return arr.reduce((rst, it) => {
    if (isArray(it)) rst = rst.concat(it);
    else rst.push(it);
    return rst;
  }, []);
}

// #endregion

// #region Object

export function keysIn(obj) {
  let arr = [];
  if (obj) {
    for (let k in obj) {
      arr.push(k);
    }
  }
  return arr;
}

export function valuesIn(obj) {
  return obj ? keysIn(obj).map(propertyOf(obj)) : [];
}

// zipObject(['a', 'b', 'c'], [1, 2, 3])
// => { a: 1, b: 2, c: 3}
export function zipObject(props, values) {
  let i = -1,
    len = props.length,
    vLen = values.length,
    result = {};
  while (++i < len) {
    result[props[i]] = i < vLen ? values[i] : void 0;
  }
  return result;
}

export function toPairs(obj) {
  return Object.keys(obj).map(key => [key, obj[key]]);
}

export let entries = toPairs;

export function toPairsIn(obj) {
  let result = [];
  for (let key in obj) result.push([key, obj[key]]);
  return result;
}

export let entriesIn = toPairsIn;

// object([ ['a', 1], ['b', 2], ['c', 3] ])
// => { a: 1, b: 2, c: 3}
export function fromPairs(pairs) {
  return pairs.reduce((result, it) => {
    result[it[0]] = it[1];
    return result;
  }, {});
}

export function object(arr1, arr2) {
  return arr2 ? zipObject(arr1, arr2) : fromPairs(arr1);
}

export function get(obj, pth, defVal) {
  let i = -1,
    _pth = toPath(pth),
    len = _pth.length,
    val = obj;
  while (++i < len) {
    if (val == null) return defVal;
    val = val[_pth[i]];
  }
  return val;
}

export function at(obj, pths) {
  return pths.map(pth => get(obj, pth));
}

export function propertyOf(obj) {
  return pth => get(obj, pth);
}

export function property(pth) {
  return obj => get(obj, pth);
}

export function properties(pths) {
  return obj => at(obj, pths);
}

export function set(obj, pth, value) {
  let _pth = toPath(pth),
    key = last(_pth),
    _obj = get(obj, initial(_pth));
  if (_obj != null) {
    _obj[key] = value;
  }
  return obj;
}

export function unset(obj, pth) {
  let _pth = toPath(pth),
    key = last(_pth),
    _obj = get(obj, initial(_pth));
  if (_obj != null && has(_obj, key)) {
    delete _obj[key];
  }
  return obj;
}

export function update(obj, pth, fn) {
  let _pth = toPath(pth),
    key = last(_pth),
    _obj = get(obj, initial(_pth));
  if (_obj != null) {
    _obj[key] = fn(_obj[key]);
  }
  return obj;
}

export function pick(obj, pths) {
  let _pths = pths.map(it => toPath(it));
  return _pths.reduce((result, pth) => {
    let value = get(obj, pth);
    if (value) result[last(pth)] = value;
    return result;
  }, {});
}

export function pickBy(obj = {}, predicate = identity) {
  return fromPairs(Object.entries(obj).filter(it => predicate(it[1])));
}

export function omitBy(obj = {}, predicate = identity) {
  return fromPairs(Object.entries(obj).filter(it => !predicate(it[1])));
}

// isMatch({a: 1, b: 2}, { b: 2 }) => true
// isMatch({a: 1, b: 2}, { b: 1 }) => false
export function isMatch(obj, attrs) {
  if (obj == null || attrs == null) return false;
  for (let key in attrs) {
    if (!has(attrs, key)) continue;
    if (!has(obj, key) || attrs[key] !== obj[key]) return false;
  }
  return true;
}

// matches({b: 2})({ a: 1, b: 2}) => true
export function matches(attrs) {
  return obj => isMatch(obj, attrs);
}

export let matcher = matches;

export function assign(target = {}, ...sources) {
  return sources.reduce((result, src) => {
    Object.keys(src).forEach(key => (result[key] = src[key]));
    return result;
  }, target);
}

export function assignIn(target = {}, ...sources) {
  return Object.assign(target, ...sources);
}

export let extend = assignIn;

export function defaults(target = {}, ...sources) {
  return sources.reduce((result, src) => {
    Object.keys(src)
      .filter(key => !has(result, key))
      .forEach(key => (result[key] = src[key]));
    return result;
  }, target);
}

// #endregion

// #region Function

export function memoize(fn, resolver) {
  let memoized = function(...args) {
    let cache = memoized.cache,
      addr = resolver ? resolver(...args) : args[0];
    if (!cache.has(addr)) {
      cache.set(addr, apply(fn, this, args));
    }
    return cache.get(addr);
  };
  memoized.cache = new Map();
  return memoized;
}

export function partial(fn, ...boundArgs) {
  return function(..._args) {
    let i = 0;
    let args = boundArgs.map(arg => (arg === partial._ ? _args[i++] : arg));
    args = args.concat(_args.slice(i));
    return apply(fn, this, args);
  };
}
partial._ = {};

export function ary(fn, n) {
  if (n == null || !isNumber(n)) return fn;
  if (n <= 0) return () => fn.call(this);
  if (n >= fn.length) return fn;
  if (n == 1) return arg => fn.call(this, arg);
  return function(...args) {
    return apply(fn, this, args.slice(0, n));
  };
}

export function unary(fn) {
  return arg => fn.call(this, arg);
}

export function wrap(fn, wrapper = identity) {
  return function(...args) {
    return apply(wrapper, this, [fn, ...args]);
  };
}

// #endregion

// #region Math

export function random(lower, upper) {
  if (lower == null) return Math.random();
  if (upper == null) {
    upper = lower;
    lower = 0;
  }
  if (lower > upper) {
    let temp = lower;
    lower = upper;
    upper = temp;
  }
  return lower + Math.floor(Math.random() * (upper - lower + 1));
}

export function sum() {
  let arr = arguments.length === 1 ? arguments[0] : arguments;
  return reduce(arr, (result, it) => (result += it), 0);
}

export function average() {
  let arr = arguments.length === 1 ? arguments[0] : arguments;
  let len = arr.length;
  return len === 0 ? 0 : sum(arr) / len;
}

export let avg = average;

function decimalAdjust(methodName, number, precision) {
  if (precision) {
    let value = Math[methodName](number + 'e' + precision);
    return +(value + 'e' + -precision);
  }
  return Math[methodName](number);
}

export function round(num, precision) {
  return decimalAdjust('round', num, precision);
}

export function floor(num, precision) {
  return decimalAdjust('floor', num, precision);
}

export function ceil(num, precision) {
  return decimalAdjust('ceil', num, precision);
}

export function radians(x) {
  return (Math.PI / 180) * x;
}

// #endregion

// #region String

export function eachMatch(str, pattern, fn) {
  if (!isString(str) || !isRegExp(pattern)) {
    throw new TypeError('eachMatch: pattern must be regexp or string');
  }
  if (!pattern.global) {
    pattern = RegExp(pattern.source, 'g');
  }
  let match;
  while ((match = pattern.exec(str))) {
    if (apply(fn, null, match) === false) break;
  }
}

export function findAll(str, pattern) {
  let rst = [];
  eachMatch(str, pattern, () => {
    rst.push(arguments.length == 1 ? arguments[0] : arguments);
  });
  return rst;
}

const RE_REGEXP_CHAR = /[\\^$.*+?()[\]{}|]/g;
const RE_HAS_REGEXP_CHAR = RegExp(RE_REGEXP_CHAR.source);

export function escapeRegExp(str) {
  str += '';
  return str && RE_HAS_REGEXP_CHAR.test(str) ? str.replace(str, '\\$&') : str;
}

const RE_JSON_ESCAPE_CHAR = /'|\\|\r|\n|\u2028|\u2029]/g;

export function jsonStringEscape(input) {
  if (typeof input !== 'string') {
    input = input + '';
  }

  return input.replace(RE_JSON_ESCAPE_CHAR, c => {
    switch (c) {
      case "'":
      case '\\':
        return '\\' + c;
      case '\r':
        return '\\r';
      case '\n':
        return '\\n';
      case '\u2028':
        return '\\u2028';
      case '\u2029':
        return '\\u2029';
      default:
        return c;
    }
  });
}
// #endregion
