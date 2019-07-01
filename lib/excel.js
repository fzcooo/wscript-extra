import { basename } from './path';
import { isfile } from './fso';
import {
  map,
  extend,
  isString,
  isRegExp,
  isFunction,
  isArray,
  each
} from './tool';

const APP_ID = 'Excel.Application';

const EXCEL_PROTO = {
  close: function() {
    this.app && this.app.Quit();
    this.app = null;
  },
  getBook: function(name) {
    return name ? this.app.WorkBooks(name) : this.activeBook;
  },
  getSheet: function(sheetName, bookName) {
    return sheetName
      ? this.getBook(bookName).Sheets(sheetName)
      : this.activeSheet;
  },
  range: function(addr) {
    return addr ? this.app.Range(addr) : this.selection;
  },
  getRange: function(strRange, sheetName, bookName) {
    return strRange
      ? this.getSheet(sheetName, bookName).Range(strRange)
      : this.selection;
  },
  cell: function(row, col) {
    return row && col ? this.app.Cells(row, col) : this.activeCell;
  },
  getCell: function(row, col, sheetName, bookName) {
    return row && col
      ? this.getSheet(sheetName, bookName).Cells(row, col)
      : this.activeCell;
  },
  getBooks: function() {
    return map(this.books);
  },
  openBook: function(path) {
    if (!isfile(path)) return null;
    let target = find(this.books, book => book.Name == basename(path));
    return target ? target : this.books.Open(path);
  },
  newBook: function() {
    return this.books.add();
  },
  getSheets: function(book) {
    return map(this.getBook(book).Sheets);
  },
  findBook: function(pattern) {
    let isMatch = matcher(pattern);
    return isMatch && find(this.books, isMatch);
  },
  findSheet: function(pattern, _book) {
    let book, isMatch;
    if (_book) {
      book = this.findBook(_book);
      if (!book) book = _book;
    } else {
      book = this.activeBook;
    }
    isMatch = matcher(pattern);
    return isMatch && find(book.Sheets, isMatch);
  },
  getValues: function(range) {
    let rowNo,
      tbl = [],
      rowData;
    each(range, r => {
      if (rowNo != r.Row) {
        if (rowData) tbl.push(rowData);
        rowData = [];
        rowNo = r.Row;
      }
      rowData.push(r.value);
    });
    if (rowData) tbl.push(rowData);
    return tbl;
  },
  setValues: function(range, vals) {
    if (isArray(vals)) {
      each(vals, val => {
        if (isArray(val)) {
          each(val, (it, i) => {
            range.offset(0, i).value = it;
          });
        } else {
          range.value = val;
        }
        range = range.offset(1, 0);
      });
    }
  },
  no_update: function(cb) {
    try {
      this.app.ScreenUpdating = false;
      cb();
    } finally {
      this.app.ScreenUpdating = true;
    }
  },
  update: function(cb) {
    try {
      this.app.ScreenUpdating = true;
      cb();
    } finally {
      this.app.ScreenUpdating = false;
    }
  }
};

const EXCEL_PROPS = {
  activeBook: {
    get: function() {
      return this.app.ActiveWorkBook;
    }
  },
  activeSheet: {
    get: function() {
      return this.app.ActiveSheet;
    }
  },
  activeCell: {
    get: function() {
      return this.app.ActiveCell;
    }
  },
  selection: {
    get: function() {
      return this.app.Selection;
    }
  },
  books: {
    get: function() {
      return this.app.WorkBooks;
    }
  }
};

export default function Excel(pth) {
  let app, xl;
  try {
    app = GetObject(pth || '', APP_ID);
  } catch (e) {
    app = new ActiveXObject(APP_ID);
  }
  if (!app.Visible) app.Visible = true;
  if (app.Workbooks.Count === 0) app.Workbooks.Add();
  xl = Object.create(EXCEL_PROTO, EXCEL_PROPS);
  xl.app = app;
  return xl;
}

extend(Excel, {
  xldown: -4121,
  xlToLeft: -4159,
  xlToRight: -4161,
  xlup: -4162
});

function find(items, fn) {
  let en = new Enumerator(items);
  let item;
  for (let i = 0; !en.atEnd(); en.moveNext(), i++) {
    item = en.item();
    if (fn(item, i) === true) return item;
  }
  return null;
}

function matcher(pattern) {
  let isMatch;
  if (isFunction(pattern)) isMatch = pattern;
  else if (isString(pattern)) isMatch = it => it.Name.includes(pattern);
  else if (isRegExp(pattern)) isMatch = it => pattern.test(it.Name);
  else isMatch = null;
  return isMatch;
}
