import { basename } from './path';
import { isfile } from './fso';
import { map, isString, isRegExp, isFunction, isArray, each } from './tool';

const APP_ID = 'Excel.Application';

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

export default class Excel {
  constructor(pth = '') {
    let app;
    try {
      app = WScript.GetObject(pth, APP_ID);
    } catch (e) {
      app = new ActiveXObject(APP_ID);
    }
    if (!app.Visible) app.Visible = true;
    if (app.Workbooks.Count === 0) app.Workbooks.Add();
    this.app = app;
  }

  get activeBook() {
    return this.app.ActiveWorkBook;
  }

  get activeSheet() {
    return this.app.ActiveSheet;
  }

  get activeCell() {
    return this.app.ActiveCell;
  }

  get selection() {
    return this.app.Selection;
  }

  get books() {
    return this.app.WorkBooks;
  }

  close() {
    this.app && this.app.Quit();
    this.app = null;
  }

  getBook(name) {
    return name ? this.app.WorkBooks(name) : this.activeBook;
  }

  getSheet(sheetName, bookName) {
    return sheetName
      ? this.getBook(bookName).Sheets(sheetName)
      : this.activeSheet;
  }

  range(addr) {
    return addr ? this.app.Range(addr) : this.selection;
  }

  getRange(strRange, sheetName, bookName) {
    return strRange
      ? this.getSheet(sheetName, bookName).Range(strRange)
      : this.selection;
  }

  cell(row, col) {
    return row && col ? this.app.Cells(row, col) : this.activeCell;
  }

  getCell(row, col, sheetName, bookName) {
    return row && col
      ? this.getSheet(sheetName, bookName).Cells(row, col)
      : this.activeCell;
  }

  getBooks() {
    return map(this.books);
  }

  openBook(path) {
    if (!isfile(path)) return null;
    let target = find(this.books, book => book.Name == basename(path));
    return target ? target : this.books.Open(path);
  }

  newBook() {
    return this.books.add();
  }

  getSheets(book) {
    return map(this.getBook(book).Sheets);
  }

  findBook(pattern) {
    let isMatch = matcher(pattern);
    return isMatch && find(this.books, isMatch);
  }

  findSheet(pattern, _book) {
    let book, isMatch;
    if (_book) {
      book = this.findBook(_book);
      if (!book) book = _book;
    } else {
      book = this.activeBook;
    }
    isMatch = matcher(pattern);
    return isMatch && find(book.Sheets, isMatch);
  }

  getValues(range) {
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
  }

  setValues(range, vals) {
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
  }

  no_update(cb) {
    try {
      this.app.ScreenUpdating = false;
      cb();
    } finally {
      this.app.ScreenUpdating = true;
    }
  }

  update(cb) {
    try {
      this.app.ScreenUpdating = true;
      cb();
    } finally {
      this.app.ScreenUpdating = false;
    }
  }
}

Excel.xldown = -4121;
Excel.xlToLeft = -4159;
Excel.xlToRight = -4161;
Excel.xlup = -4162;
