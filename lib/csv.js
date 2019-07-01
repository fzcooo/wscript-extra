import { isString, isArray, zipObject, map } from './tool';

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

const EMPTY_CHAR_REGEXP = /\s/;

function Parser(options) {
  Object.assign(this, DEFAULT_OPTIONS);
  if (options != null && typeof options == 'object') {
    Object.assign(this, options);
  }
}

const PP = Parser.prototype;

PP.init = function() {
  this.rows = [];
  this.row = [];
  this.cursor = 0;
  this.pos = 0;
  this.buf = [];
  this.bufLen = 0;
  this.escaping = false;
};

PP.parse = function fromString(str) {
  let i = 0,
    len = str.length;
  this.init();
  for (; i < len; i++) {
    this._char(str.charAt(i));
  }
  return this._getResult();
};

PP._getResult = function() {
  let result, headers, len;
  if (this.pos !== this.cursor) {
    this._row();
  }
  len = this.rows.length;
  result = this.rows;
  if (this.headers === true && len > 1) {
    headers = this.rows[0];
    this.rows.shift();
  } else if (isArray(this.headers) && len > 0) {
    headers = this.headers;
  }
  if (headers && headers.length > 0) {
    result = this.rows.map(row => zipObject(headers, row));
  }
  return result;
};

PP._char = function(c) {
  if (c === this.delimiter && !this.escaping) {
    this._cell();
  } else if (c === this.quote) {
    this._push(c);
    this._quote();
  } else if (c === this.escape) {
    this._push(c);
    this._escape();
  } else if (c === '\n' && !this.escaping) {
    this._row();
  } else {
    this._push(c);
  }

  this.cursor++;
};

PP._push = function(c) {
  if (this.bufLen === 0) {
    if ((this.trim || this.ltrim) && EMPTY_CHAR_REGEXP.test(c)) return;
    if (c === this.quote) return;
  }
  this.buf[this.bufLen] = c;
  this.bufLen++;
};

PP._cell = function() {
  let item = this._getValue();
  this.row.push(item);
};

PP._getValue = function() {
  let result, c, i;
  i = this.bufLen;
  while (i--) {
    c = this.buf[i];
    if (EMPTY_CHAR_REGEXP.test(c)) {
      if (this.trim || this.rtrim) {
        this.buf[i] = '';
      }
    } else {
      if (c === this.quote) {
        this.buf[i] = '';
        break;
      } else {
        break;
      }
    }
  }
  result = this.buf.join('');
  this.buf.length = 0;
  this.bufLen = 0;
  return result;
};

PP._row = function() {
  if (this.bufLen > 0 && this.buf[this.bufLen - 1] === '\r') {
    this.buf[this.bufLen - 1] = '';
  }
  this._cell();
  this.rows.push(this.row);
  this.row = [];
  this.pos = this.cursor;
};

PP._quote = function() {
  this.escaping = !this.escaping;
  if (this.bufLen > 1 && this.buf[this.bufLen - 2] === this.escape) {
    this.buf[this.bufLen - 2] = this.buf[this.bufLen - 1];
    this.buf[this.bufLen - 1] = '';
  }
};

PP._escape = function() {
  this.escaping = !this.escaping;
};

export function createParser(options) {
  return new Parser(options);
}

export function parse(str, options) {
  return new Parser(options).parse(str);
}

function Formatter(options) {
  Object.assign(this, DEFAULT_OPTIONS);
  if (options != null && typeof options == 'object')
    Object.assign(this, options);
}

const FP = Formatter.prototype;

FP.init = function() {
  this.rows = [];
};

FP.stringify = function(data) {
  let row, i, len, rowDataIsArray;
  this.init();
  if (isArray(this.headers)) {
    this._appendLine(this.headers);
  }
  len = isArray(data) && data.length;
  if (len && len > 0) {
    i = 0;
    row = data[0];
    rowDataIsArray = isArray(row);
    if (rowDataIsArray) {
      if (this.headers === true) {
        this.headers = row;
        this._appendLine(this.headers);
        i = 1;
      }
    } else {
      this.headers = Object.keys(row);
      this._appendLine(this.headers);
    }

    for (; i < len; i++) {
      row = data[i];
      if (rowDataIsArray) this._appendLine(row);
      else this._appendLine(map(row));
    }
  }
  return this._getResult();
};

FP._appendLine = function(row) {
  let quote = this.quote;
  let escape_quote = this.escape + quote;
  let quoteRegexp = /"/g;
  let line = row
    .map(item => {
      if (item == null) {
        return '';
      } else if (isString(item)) {
        if (item.includes(quote)) {
          return quote + item.replace(quoteRegexp, escape_quote) + quote;
        } else {
          return item;
        }
      } else {
        return item + '';
      }
    })
    .join(this.delimiter);
  this.rows.push(line);
};

FP._getResult = function() {
  return this.rows.join(this.newline);
};

export function createFormatter(options) {
  return new Formatter(options);
}

export function stringify(data, options) {
  return new Formatter(options).stringify(data);
}
