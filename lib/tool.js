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

const FUNC_NAME_REG = /function +(\w+)/;

export function getFuncName(fn) {
  if (fn.name) return fn.name;
  let m = fn.toString().match(FUNC_NAME_REG);
  return m ? m[1] : '';
}

export function getTag(value) {
  return TO_STR.call(value);
}

const TYPE_REG = /\[object ([^\]]+)\]/;

export function typeOf(obj) {
  let tp = obj === null ? 'null' : typeof obj;
  if (tp == 'object')
    tp = TO_STR.call(obj)
      .match(TYPE_REG)[1]
      .toLowerCase();
  if (tp == 'object' && obj.constructor && typeof obj.constructor == 'function')
    tp = getFuncName(obj.constructor).toLowerCase() || tp;
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

export function identity(value) {
  return value;
}

export function iteratee(value) {
  switch (typeOf(value)) {
    case 'function':
      return value;
    case 'string':
    case 'number':
      return property(value);
    case 'array':
      return properties(value);
    case 'object':
      return matches(value);
    default:
      return identity;
  }
}

// #endregion

// #region Collection

export function each(obj, fn) {
  let en, i, key, len;
  if (isArrayLike(obj)) {
    for (i = 0, len = obj.length; i < len; i++) {
      if (fn(obj[i], i, obj) === false) break;
    }
  } else if (obj && !obj.constructor && 'Item' in obj) {
    en = new Enumerator(obj);
    for (i = 0; !en.atEnd(); en.moveNext(), i++) {
      if (fn(en.item(), i, obj) === false) break;
    }
  } else if (isLength(obj)) {
    for (i = 0; i < obj; i++) {
      if (fn(i, i, obj) === false) break;
    }
  } else if (isObject(obj)) {
    for (key in obj) {
      if (has(obj, key)) {
        if (fn(obj[key], key, obj) === false) break;
      }
    }
  }
  return obj;
}

export let forEach = each;

export function map(obj, fn) {
  let result = [],
    ite = iteratee(fn);
  each(obj, (v, k, o) => {
    result.push(ite(v, k, o));
  });
  return result;
}

export let select = map;

export function reduce(obj, fn, memo) {
  each(obj, function(v, k, o) {
    memo = fn(memo, v, k, o);
  });
  return memo;
}

export function filter(obj, fn) {
  let result = [],
    ite = iteratee(fn);
  each(obj, (v, k, o) => {
    if (ite(v, k, o)) result.push(v);
  });
  return result;
}

export let where = filter;

export function toArray(obj) {
  let i, len, arr;
  if (isArray(obj)) return obj;
  if (isArrayLike(obj)) {
    i = -1;
    len = obj.length;
    arr = Array(len);
    while (++i < len) arr[i] = obj[i];
    return arr;
  }
  if (isObject(obj)) return map(obj);
  return [];
}

function baseFind(arr, fn, _this) {
  let i = -1,
    len = arr.length,
    it;
  if (_this) {
    while (++i < len) {
      it = arr[i];
      if (fn.call(_this, it, i, arr)) {
        return [it, i];
      }
    }
  } else {
    while (++i < len) {
      it = arr[i];
      if (fn(it, i, arr)) {
        return [it, i];
      }
    }
  }
  return [null, -1];
}

export function find(arr, fn) {
  return baseFind(arr, fn)[0];
}

export function findIndex(arr, fn) {
  return baseFind(arr, fn)[1];
}

export function fill(arr, val, start, end) {
  let len = arr.length;
  if (start == null) start = 0;
  if (end == null) end = len;
  if (end < 0) end = Math.max(end + len, len);
  while (start < end) {
    arr[start] = val;
    start++;
  }
  return arr;
}

export function groupBy(obj, fn) {
  let result = {},
    ite = iteratee(fn);
  each(obj, function(v, k, o) {
    let key = ite(v, k, o);
    has(result, key) ? result[key].push(v) : (result[key] = [v]);
  });
  return result;
}

export function countBy(obj, fn) {
  let ite = iteratee(fn);
  return reduce(
    obj,
    (result, value, key) => {
      key = ite(value);
      has(result, key) ? result[key]++ : (result[key] = 1);
      return result;
    },
    {}
  );
}

export function size(obj) {
  return isArrayLike(obj) ? obj.length : Object.keys(obj).length;
}

export let len = size;

// #endregion

// #region Array

export function uniqBy(arr, fn) {
  let ite = iteratee(fn),
    result = [],
    memo = new Set(),
    i = -1,
    len = arr.length,
    item,
    computed;
  while (++i < len) {
    item = arr[i];
    computed = ite(item);
    if (!memo.has(computed)) {
      result.push(item);
      memo.add(computed);
    }
  }
  memo.clear();
  return result;
}

export function uniq(arr) {
  return uniqBy(arr, identity);
}

export let distinct = uniq;

export let distinctBy = uniqBy;

export function chunk(arr, n) {
  if (n == null || n < 1) return [];
  let result = [],
    tmp = Array(n),
    i = -1,
    len = arr.length,
    off = 0;
  while (++i < len) {
    tmp[off++] = arr[i];
    if (off == 1) {
      result.push(tmp);
    } else if (off == n) {
      off = 0;
      tmp = Array(n);
    }
  }
  return result;
}

export function concat() {
  let i = -1,
    len = arguments.length,
    result = [],
    arr,
    ii,
    len2;
  while (++i < len) {
    arr = arguments[i];
    ii = -1;
    len2 = arr && arr.length;
    if (len2 == null) {
      result.push(arr);
    } else {
      while (++ii < len2) result.push(arr[ii]);
    }
  }
  return result;
}

export function slice(arr, start, end) {
  let i = -1,
    len = (arr && arr.length) || 0,
    result;
  if (!len) return [];
  if (start == null) start = 0;
  if (end == null) end = len;
  if (start < 0) start = -start > len ? 0 : len + start;
  if (end < 0) end += len;
  else if (end > len) end = len;
  len = start > end ? 0 : end - start;
  result = new Array(len);
  while (++i < len) result[i] = arr[i + start];
  return result;
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
  return slice(arr, 0, Math.max(0, arr.length - 1));
}

// take([1, 2, 3, 4, 5], 2) => [1, 2]
export function take(arr, n) {
  return slice(arr, 0, n);
}

export function takeRight(arr, n) {
  return slice(arr, -n);
}

export function contains(obj, val, pos) {
  return obj.indexOf(val, pos || 0) != -1;
}

export let include = contains;

export let includes = contains;

export function first(arr) {
  return arr && arr[0];
}

export let head = first;

export function last(arr) {
  return (arr && arr.length > 0 && arr[arr.length - 1]) || void 0;
}

export function nth(arr, n) {
  return arr && (n < 0 ? arr[arr.length + n] : arr[n]);
}

export function pullAll(arr, values) {
  if (!isArray(values)) return arr;
  let i = arr.length;
  while (i--) {
    if (values.includes(arr[i])) arr.splice(i, 1);
  }
  return arr;
}

export function pull(arr) {
  return pullAll(arr, tail(arguments));
}

export function remove(arr, fn) {
  let i = arr.length,
    ite = iteratee(fn);
  while (i--) {
    if (ite(arr[i], i, arr)) arr.splice(i, 1);
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
  return reduce(
    arr,
    (rst, it) => {
      if (isArray(it)) rst = rst.concat(it);
      else rst.push(it);
      return rst;
    },
    []
  );
}

// #endregion

// #region Object

export function keys(obj) {
  return obj ? Object.keys(obj) : [];
}

export function values(obj) {
  return obj ? keys(obj).map(propertyOf(obj)) : [];
}

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

// object([ ['a', 1], ['b', 2], ['c', 3] ])
// => { a: 1, b: 2, c: 3}
export function fromPairs(pairs) {
  let result = {},
    i = -1,
    len = pairs.length;
  while (++i < len) result[pairs[i][0]] = pairs[i][1];
  return result;
}

export function object(arr1, arr2) {
  return arr2 ? zipObject(arr1, arr2) : fromPairs(arr1);
}

export function get(obj, pth, defVal) {
  let i = -1,
    _pth = toPath(pth),
    len = _pth.length;
  while (++i < len) {
    if (obj == null) return defVal;
    obj = obj[_pth[i]];
  }
  return obj;
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

export function assign(obj) {
  let key,
    src,
    i = 0,
    args = arguments,
    len = args.length;
  obj || (obj = {});
  while (++i < len) {
    src = args[i];
    for (key in src) {
      if (has(src, key)) {
        obj[key] = src[key];
      }
    }
  }
  return obj;
}

export function assignIn(obj) {
  let key,
    src,
    i = 0,
    args = arguments,
    len = args.length;
  obj || (obj = {});
  while (++i < len) {
    src = args[i];
    for (key in src) {
      if (has(src, key)) {
        obj[key] = src[key];
      }
    }
  }
  return obj;
}

export let extend = assignIn;

export function defaults(obj) {
  let key,
    src,
    i = 0,
    args = arguments,
    len = args.length;
  obj || (obj = {});
  while (++i < len) {
    src = args[i];
    for (key in src) {
      if (!has(obj, key)) {
        obj[key] = src[key];
      }
    }
  }
  return obj;
}

export function entries(obj) {
  return obj ? map(obj, (v, k) => [k, v]) : [];
}

export let toPairs = entries;

// #endregion

// #region Function

export function memoize(fn, resolver) {
  let memoized = function(key) {
    let cache = memoized.cache,
      args = arguments,
      addr = resolver ? apply(resolver, this, args) : key;
    if (!cache.has(addr)) {
      cache.set(addr, apply(fn, this, args));
    }
    return cache.get(addr);
  };
  memoized.cache = new Map();
  return memoized;
}

export function partial(fn, boundArgs) {
  boundArgs = toArray(arguments).slice(1);

  return function() {
    let _args = toArray(arguments),
      i = 0;
    let args = boundArgs.map(arg => (arg === partial._ ? _args[i++] : arg));
    args = args.concat(_args.slice(i));
    return apply(fn, this, args);
  };
}
partial._ = {};

export function curry(fn) {
  let argsLen = fn.length,
    args = [];
  let curried = function() {
    args = concat(args, arguments);
    if (argsLen === args.length) return apply(fn, this, args);
    else return curried;
  };
  return argsLen < 2 ? fn : curried;
}

export function ary(fn, n) {
  return n == null
    ? fn
    : function() {
        let args = slice(arguments, 0, n);
        return apply(fn, this, args);
      };
}

export function wrap(fn, wrapper) {
  wrapper || (wrapper = identity);
  return function() {
    return apply(wrapper, this, concat([fn], arguments));
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

export function toUpper(x) {
  return x.toUpperCase();
}

export function toLower(x) {
  return x.toLowerCase();
}

export function trim(x) {
  return x.trim();
}

export function repeat(str, n) {
  let rst = '';
  if (!isString(str)) str = String(str);
  if (n < 1 || !isFinite(n)) return rst;
  do {
    if (n % 2) rst += str;
    n = Math.floor(n / 2);
    if (n) str += str;
  } while (n);
  return rst;
}

function createPadding(len, chrs) {
  chrs || (chrs = ' ');
  let pad = chrs.repeat(Math.ceil(len / chrs.length));
  return pad.length > len ? pad.slice(0, len) : pad;
}

export function padStart(str, len, chrs) {
  if (!isString(str)) str = String(str);
  let strLen = str.length;
  if (len == null || len <= strLen) return str;
  return createPadding(len - strLen, chrs) + str;
}

export function padEnd(str, len, chrs) {
  if (!isString(str)) str = String(str);
  let strLen = str.length;
  if (len == null || len <= strLen) return str;
  return str + createPadding(len - strLen, chrs);
}

export function startsWith(str, target, pos) {
  return str.substr(!pos || pos < 0 ? 0 : +pos, target.length) == target;
}

export function endsWith(str, target, this_len) {
  if (this_len == null || this_len > str.length) this_len = str.length;
  return str.substring(this_len - target.length, this_len) == target;
}

export function eachMatch(str, pattern, fn) {
  if (!isString(str) || !isRegExp(pattern)) {
    throw new TypeError('invalid arguments');
  }
  if (!pattern.global) {
    pattern = RegExp(pattern.source, 'g');
  }
  let match;
  for (;;) {
    match = pattern.exec(str);
    if (!match) break;
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
// #endregion
