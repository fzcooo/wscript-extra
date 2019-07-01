import {
  isDate,
  isString,
  extend,
  each,
  fromPairs,
  padStart,
  isObjectLike,
  isFunction
} from './tool';

const REGEX_PARSE = /^(\d{4})[-/]?(\d{1,2})[-/]?(\d{1,2})[^0-9]*(\d{1,2})?:?(\d{1,2})?:?(\d{1,2})?\.?(\d{1,3})?$/;
const REGEX_FORMAT = /\[([^\]]+)]|Y{2,4}|M{1,4}|D{1,2}|d{1,4}|H{1,2}|h{1,2}|a|A|m{1,2}|s{1,2}|Z{1,2}|SSS/g;
const MS = 'millisecond';
const S = 'second';
const MIN = 'minute';
const H = 'hour';
const D = 'day';
const W = 'week';
const M = 'month';
const Q = 'quarter';
const Y = 'year';
const DATE = 'date';
const FORMAT_DEFAULT = 'YYYY-MM-DDTHH:mm:ssZ';
const INVALID_DATE_STRING = 'Invalid Date';

let Ls = {
  en: {
    name: 'en',
    weekdays: 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split(
      '_'
    ),
    months: 'January_February_March_April_May_June_July_August_September_October_November_December'.split(
      '_'
    )
  }
};
let L = 'en';

function parseLocale(preset, object, isLocal) {
  let l;
  if (!preset) return null;
  if (isString(preset)) {
    if (Ls[preset]) {
      l = preset;
    }
    if (object) {
      Ls[preset] = object;
      l = preset;
    }
  } else {
    let name = preset.name;
    Ls[name] = preset;
    l = name;
  }
  if (!isLocal) L = l;
  return l;
}

function isDayjs(date) {
  return date instanceof Dayjs;
}

function dayjs(date, cfg) {
  if (isDayjs(date)) return date.clone();
  let _cfg = { date: date };
  if (isString(cfg)) {
    _cfg.format = cfg;
  } else if (isObjectLike(cfg)) {
    extend(_cfg, cfg);
  }
  return new Dayjs(_cfg);
}

function Dayjs(cfg) {
  this.$L = parseLocale(cfg.locale, null, true) || L;
  this.parse(cfg);
}

let _proto = Dayjs.prototype;

_proto.parse = function(cfg) {
  this.$d = parseDate(cfg);
  this.init();
};

function parseDate(cfg) {
  let date = cfg.date,
    utc = cfg.utc;
  if (date == null) return new Date();
  if (isDate(date)) return new Date(date);
  if (isString(date) && !/Z$/i.test(date)) {
    let m = date.match(REGEX_PARSE);
    if (m) {
      if (utc) {
        return new Date(
          Date.UTC(
            m[1],
            m[2] - 1,
            m[3],
            m[4] || 0,
            m[5] || 0,
            m[6] || 0,
            m[7] || 0
          )
        );
      }
      return new Date(
        m[1],
        m[2] - 1,
        m[3],
        m[4] || 0,
        m[5] || 0,
        m[6] || 0,
        m[7] || 0
      );
    }
  }
  return new Date(date);
}

_proto.init = function() {
  let $d = this.$d;
  extend(this, {
    $y: $d.getFullYear(),
    $M: $d.getMonth(),
    $D: $d.getDate(),
    $W: $d.getDay(),
    $H: $d.getHours(),
    $m: $d.getMinutes(),
    $s: $d.getSeconds(),
    $ms: $d.getMilliseconds()
  });
};

_proto.isValid = function() {
  return this.$d.toString() !== INVALID_DATE_STRING;
};

_proto.isSame = function(that, units) {
  let other = dayjs(that);
  return this.startOf(units) <= other && other <= this.endOf(units);
};

_proto.isAfter = function(that, units) {
  return dayjs(that) < this.startOf(units);
};

_proto.isBefore = function(that, units) {
  return this.endOf(units) < dayjs(that);
};

each(
  {
    $y: Y,
    $M: M,
    $W: D,
    $D: DATE,
    $H: H,
    $m: MIN,
    $s: S,
    $ms: MS
  },
  (unit, prop) => {
    _proto[unit] = function(input) {
      return input == null ? this[prop] : this.clone().$set(unit, input);
    };
  }
);

_proto.valueOf = function() {
  return this.$d.getTime();
};

function prettyUnit(u) {
  let special = {
    M: M,
    y: Y,
    w: W,
    d: D,
    h: H,
    m: MIN,
    s: S,
    ms: MS,
    Q: Q
  };
  return (
    special[u] ||
    String(u || '')
      .toLowerCase()
      .replace(/s$/, '')
  );
}

_proto.startOf = function(units, _startOf) {
  // startOf -> endOf
  let isStartOf = _startOf == null ? true : _startOf;
  let unit = prettyUnit(units);
  let $M = this.$M,
    $W = this.$W,
    $D = this.$D;
  let clone = this.clone();

  switch (unit) {
    case Y:
      return clone.$$set(isStartOf ? { M: 0, date: 1 } : { M: 11, date: 31 });
    case M:
      return clone.$$set(
        isStartOf ? { M: $M, date: 1 } : { M: $M + 1, date: 0 }
      );
    case D:
    case DATE:
      return clone.$set(H, isStartOf ? 0 : 23);
    case H:
      return clone.$set(MIN, isStartOf ? 0 : 59);
    case MIN:
      return clone.$set(S, isStartOf ? 0 : 59);
    case S:
      return clone.$set(MS, isStartOf ? 0 : 999);
    case W: {
      let weekStart = this.$locale().weekStart || 0;
      let gap = ($W < weekStart ? $W + 7 : $W) - weekStart;
      return clone.$set(DATE, isStartOf ? $D - gap : $D + (6 - gap));
    }
    default:
      return clone;
  }
};

_proto.endOf = function(units) {
  return this.startOf(units, false);
};

const UNIT_METHOD = fromPairs([
  [D, 'Date'],
  [DATE, 'Date'],
  [M, 'Month'],
  [Y, 'FullYear'],
  [H, 'Hours'],
  [MIN, 'Minutes'],
  [S, 'Seconds'],
  [MS, 'Milliseconds']
]);

function _set(self, units, _int) {
  let unit = prettyUnit(units);
  let utcPad = 'set' + (self.$u ? 'UTC' : '');
  let name = UNIT_METHOD[unit];
  let arg = unit == D ? self.$D + (_int - self.$W) : _int;

  if (name) {
    if (unit == M || unit == Y) {
      let _d = self.toDate();
      _d.setDate(1);
      _d[utcPad + name](arg);
      _d.setMonth(_d.getMonth() + 1);
      _d.setDate(0);
      let _lastDate = _d.getDate();
      if (self.$D < _lastDate) {
        _d.setDate(self.$D);
      }
      self.$d = _d;
    } else {
      self.$d[utcPad + name](arg);
    }
  }
}

_proto.$set = function(units, _int) {
  _set(this, units, _int);
  this.init();
  return this;
};

_proto.$$set = function(options) {
  let self = this;
  each(options, (_int, units) => {
    _set(self, units, _int);
  });
  this.init();
  return this;
};

_proto.set = function(unit, _int) {
  let clone = this.clone();
  if (isString(unit)) {
    return clone.$set(unit, _int);
  } else if (isObjectLike(unit)) {
    return clone.$$set(unit);
  }
  return clone;
};

_proto.get = function(unit) {
  return this[prettyUnit(unit)]();
};

_proto.add = function(n, units) {
  let name = prettyUnit(units);
  let clone = this.clone();
  n = Number(n);
  if (name == W) return clone.$set(DATE, this.$D + Math.round(n * 7));
  else return clone.$set(name, this[name]() + n);
};

_proto.subtract = function(n, unit) {
  return this.add(n * -1, unit);
};

_proto.format = function(fmt) {
  if (!this.isValid()) return INVALID_DATE_STRING;
  fmt || (fmt = FORMAT_DEFAULT);
  let $y = this.$y,
    $M = this.$M,
    $D = this.$D,
    $W = this.$W,
    $H = this.$H,
    $m = this.$m,
    $s = this.$s,
    $MS = this.$MS;
  let locale = this.$locale();
  let weekdays = locale.weekdays,
    months = locale.months;
  let tzOffset = this.$d.getTimezoneOffset();
  let tzMinutes = Math.abs(tzOffset);
  let hourOffset = Math.floor(tzMinutes / 60);
  let minOffset = tzMinutes % 60;
  let zoneStr =
    (tzOffset < 0 ? '-' : '+') +
    padStart(hourOffset, 2, '0') +
    ':' +
    padStart(minOffset, 2, '0');
  let self = this;
  let getShort = function(arr, index, full, length) {
    return (
      (arr && (arr[index] || arr(self, fmt))) || full[index].substr(0, length)
    );
  };

  let matches = {
    YY: String($y).slice(-2),
    YYYY: $y,
    M: $M + 1,
    MM: padStart($M + 1, 2, '0'),
    MMM: getShort(locale.monthsShort, $M, months, 3),
    MMMM: months[$M] || (isFunction(months) && months(this, fmt)),
    D: $D,
    DD: padStart($D, 2, '0'),
    d: $W,
    dd: getShort(locale.weekdaysMin, $W, weekdays, 2),
    ddd: getShort(locale.weekdaysShort, $W, weekdays, 3),
    dddd: weekdays[$W],
    H: $H,
    HH: padStart($H, 2, '0'),
    h: $H % 12 || 12,
    hh: padStart($H % 12 || 12, 2, '0'),
    a: $H < 12 ? 'am' : 'pm',
    A: $H < 12 ? 'AM' : 'PM',
    m: $m,
    mm: padStart($m, 2, '0'),
    s: $s,
    ss: padStart($s, 2, '0'),
    SSS: padStart($MS, 3, '0'),
    Z: zoneStr
  };
  return fmt.replace(REGEX_FORMAT, function(m0, m1) {
    return m1 || matches[m0] || zoneStr.replace(':', '');
  });
};

_proto.utcOffset = function() {
  return -this.$d.getTimezoneOffset();
};

function monthDiff(a, b) {
  let diff = (a.year() - b.year()) * 12 + a.month() - b.month();
  let anchor = b.clone().add(diff, M);
  let c = a - anchor > 0;
  let anchor2 = b.clone().add(diff + (c ? 1 : -1), M);
  return diff + (a - anchor) / (c ? anchor2 - anchor : anchor - anchor2);
}

function milliSecondDiff(a, b) {
  return a - b + (a.utcOffset() - b.utcOffset()) * 60000;
}

function absFloor(n) {
  return n < 0 ? Math.ceil(n) : Math.floor(n);
}

_proto.diff = function(input, units, _float) {
  let unit = prettyUnit(units);
  let that = dayjs(input);
  let result;

  switch (unit) {
    case Y:
      result = monthDiff(this, that) / 12;
      break;
    case M:
      result = monthDiff(this, that);
      break;
    case Q:
      result = monthDiff(this, that) / 3;
      break;
    case W:
      result = milliSecondDiff(this, that) / 604800000;
      break;
    case D:
      result = milliSecondDiff(this, that) / 86400000;
      break;
    case H:
      result = milliSecondDiff(this, that) / 3600000;
      break;
    case MIN:
      result = milliSecondDiff(this, that) / 60000;
      break;
    case S:
      result = milliSecondDiff(this, that) / 1000;
      break;
    default:
      result = milliSecondDiff(this, that);
      break;
  }
  return _float ? result : absFloor(result);
};

_proto.daysInMonth = function() {
  return this.endOf(M).$D;
};

_proto.$locale = function() {
  return Ls[this.$L];
};

_proto.locale = function(preset, object) {
  if (!preset) return this.$L;
  let that = this.clone();
  that.$L = parseLocale(preset, object, true);
  return that;
};

_proto.clone = function() {
  return dayjs(this.toDate(), {
    locale: this.$L,
    utc: this.$u
  });
};

_proto.toDate = function() {
  return new Date(this.$d);
};

_proto.toJSON = function() {
  return this.toISOString();
};

_proto.toISOString = function() {
  return this.$d.toISOString();
};

_proto.toString = function() {
  return this.$d.toUTCString();
};

dayjs.prototype = Dayjs.prototype;
dayjs.isDayjs = isDayjs;
dayjs.locale = parseLocale;
dayjs.Ls = Ls;

dayjs.extend = function(plugin, option) {
  plugin(option, Dayjs, dayjs);
  return dayjs;
};

export default dayjs;
