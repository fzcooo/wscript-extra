export const escape = encodeURIComponent;

export const unescape = decodeURIComponent;

function formatValue(value) {
  switch (typeof value) {
    case 'string':
      return encodeURIComponent(value);
    case 'number':
    case 'boolean':
      return String(value);
    default:
      return '';
  }
}

export function stringify(obj, sep, eq) {
  if (!obj) return '';
  sep || (sep = '&');
  eq || (eq = '=');
  let buf = [],
    value,
    i,
    len;
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      value = obj[key];
      if (Array.isArray(value)) {
        (i = -1), (len = value.length);
        while (++i < len) {
          buf.push(key + eq + formatValue(value[i]));
        }
      } else {
        buf.push(key + eq + formatValue(value));
      }
    }
  }
  return buf.join(sep);
}

export function parse(str, sep, eq) {
  sep || (sep = '&');
  eq || (eq = '=');
  let buf = str.split(sep);
  let i = -1,
    len = buf.length,
    result = {},
    keyDict = {},
    pair,
    key,
    value;
  while (++i < len) {
    pair = buf[i].split(eq);
    key = pair[0];
    value = pair[1];
    if (keyDict[key]) {
      if (keyDict[key] === 1) {
        keyDict[key] = 2;
        result[key] = [result[key], value];
      } else {
        result[key].push(value);
      }
    } else {
      keyDict[key] = 1;
      result[key] = value;
    }
  }
  return result;
}
