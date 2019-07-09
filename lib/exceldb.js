import { isAbsolute, normalize, extname } from './path';
import { Adodb } from './adodb';

const EXCEL_TYPE = {
  xls: 'Excel 8.0',
  xlsx: 'Excel 12.0 Xml',
  xlsb: 'Excel 12.0',
  xlsm: 'Excel 12.0 Macro'
};

export class ExcelDB extends Adodb {
  constructor(path, hasHeader) {
    if (!isAbsolute(path)) {
      path = normalize(path);
    }
    let ext = extname(path).toLowerCase();
    let hdr =
      hasHeader == null || hasHeader == true || hasHeader == 'YES'
        ? 'YES'
        : 'NO';
    if (!EXCEL_TYPE[ext]) throw new Error(ext + ' file is not supported');
    super();
    this.conn.ConnectionString = `Provider=Microsoft.Ace.OLEDB.12.0;Data Source=${path};Extended Properties="${EXCEL_TYPE[ext]};HDR=${hdr}"`;
    this.conn.Open();
  }
}

export default function exceldb(path, hasHeader) {
  return new ExcelDB(path, hasHeader);
}
