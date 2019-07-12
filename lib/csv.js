import { isArray, isObject, zipObject, map, escapeRegExp } from './tool';

const DEFAULT_OPTIONS = {
  headers: false,
  delimiter: ',',
  quote: '"',
  escape: '"',
  trim: false,
  rtrim: false,
  ltrim: false,
  newline: '\r\n'
};

// #region Parser

class Parser {
  constructor(options) {
    Object.assign(this, DEFAULT_OPTIONS);
    if (isObject(options)) {
      Object.assign(this, options);
    }
  }

  init() {
    this.rows = [];
    this.row = [];
    this.cursor = -1;
    this.cached = 0;
    this.buf = [];
    this.bufLen = 0;
    this.quoting = false;
  }

  parse(str) {
    let len = str.length,
      c,
      next;
    this.init();
    while (++this.cursor < len) {
      c = str[this.cursor];
      if (this.quoting) {
        next = str[this.cursor + 1];
        if (c === this.escape && next === this.quote) {
          this.cursor++;
          this._char(next);
        } else if (c === this.quote && next === this.delimiter) {
          this.quoting = false;
        } else {
          this._char(c);
        }
      } else {
        if (this.bufLen === 0 && c === this.quote) {
          this.quoting = true;
        } else if (c === this.delimiter) {
          this._cell();
        } else if (c === '\n') {
          this._row();
        } else {
          this._char(c);
        }
      }
    }
    return this._result();
  }

  _result() {
    let result, headers, len;
    if (this.cached !== this.cursor) {
      this._row();
    }
    len = this.rows.length;
    result = this.rows;
    if (this.headers === true && len > 1) {
      headers = this.rows.shift();
    } else if (isArray(this.headers) && len > 0) {
      headers = this.headers;
    }
    if (headers && headers.length > 0) {
      result = this.rows.map(row => zipObject(headers, row));
    }
    return result;
  }

  _char(c) {
    this.buf[this.bufLen] = c;
    this.bufLen++;
  }

  _cell() {
    let val, i;
    i = this.bufLen;
    if (i === 0) return;
    val = this.buf.join('');
    if (this.trim) val = val.trim();
    else if (this.ltrim) val = ltrim(val);
    else if (this.rtrim) val = rtrim(val);
    this.buf.length = 0;
    this.bufLen = 0;
    this.row.push(val);
  }

  _row() {
    if (this.bufLen > 0 && this.buf[this.bufLen - 1] === '\r') {
      this.buf[this.bufLen - 1] = '';
    }
    this._cell();
    if (this.row.length > 0) {
      this.rows.push(this.row);
      this.row = [];
      this.cached = this.cursor;
    }
  }
}

function ltrim(str) {
  return str.replace(/^\s+/, '');
}

function rtrim(str) {
  return str.replace(/\s+$/, '');
}

export function createParser(options) {
  return new Parser(options);
}

export function parse(str, options) {
  return new Parser(options).parse(str);
}

// #endregion

// #region Formatter

class Formatter {
  constructor(options) {
    Object.assign(this, DEFAULT_OPTIONS);
    if (isObject(options)) {
      Object.assign(this, options);
    }
  }

  init() {
    this.rows = [];
    this.ctrlCharPattern = RegExp(
      escapeRegExp([this.quote, this.delimiter, this.newline].join('|'))
    );
  }

  stringify(data) {
    let row, i, len, rowDataIsArray;
    this.init();
    if (isArray(this.headers)) {
      this._row(this.headers);
    }
    len = isArray(data) && data.length;
    if (len && len > 0) {
      i = 0;
      row = data[0];
      rowDataIsArray = isArray(row);
      if (rowDataIsArray) {
        if (this.headers === true) {
          this.headers = row;
          this._row(this.headers);
          i = 1;
        }
      } else {
        this.headers = Object.keys(row);
        this._row(this.headers);
      }

      for (; i < len; i++) {
        row = data[i];
        if (rowDataIsArray) this._row(row);
        else this._row(map(row));
      }
    }
    return this._result();
  }

  _row(row) {
    let quote = this.quote;
    let escape_quote = this.escape + quote;
    let quoteRegexp = RegExp(this.quote, 'g');
    let line = row
      .map(it => {
        let val = it + '';
        if (this.ctrlCharPattern.test(val)) {
          val = quote + val.replace(quoteRegexp, escape_quote) + quote;
        }
        return val;
      })
      .join(this.delimiter);
    this.rows.push(line);
  }

  _result() {
    return this.rows.join(this.newline);
  }
}

export function createFormatter(options) {
  return new Formatter(options);
}

export function stringify(data, options) {
  return new Formatter(options).stringify(data);
}

// #endregion
