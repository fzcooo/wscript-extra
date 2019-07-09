import { isfile } from './fso';
import { isAbsolute, normalize, dirname } from './path';
import { Adodb } from './adodb';

export class CsvDB extends Adodb {
  constructor(path, hasHeader) {
    if (!isAbsolute(path)) {
      path = normalize(path);
    }
    if (isfile(path)) path = dirname(path);
    let hdr =
      hasHeader == null || hasHeader == true || hasHeader == 'YES'
        ? 'YES'
        : 'NO';
    super();
    this.conn.ConnectionString = `Provider=Microsoft.Ace.OLEDB.12.0;Data Source=${path};Extended Properties="Text;HDR=${hdr};FMT=Delimited"`;
    this.conn.Open();
  }
}

export default function csvdb(path, hasHeader) {
  return new CsvDB(path, hasHeader);
}
