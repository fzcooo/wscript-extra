import { inherits } from './util';
import { isfile } from './fso';
import { isAbsolute, normalize, dirname } from './path';
import { Adodb } from './adodb';

export function CsvDB(path, hasHeader) {
  if (!isAbsolute(path)) {
    path = normalize(path);
  }
  if (isfile(path)) path = dirname(path);
  let hdr =
    hasHeader == null || hasHeader == true || hasHeader == 'YES' ? 'YES' : 'NO';
  Adodb.call(this);
  this.conn.ConnectionString = `Provider=Microsoft.Ace.OLEDB.12.0;Data Source=${path};Extended Properties="Text;HDR=${hdr};FMT=Delimited"`;
  this.conn.Open();
}

inherits(CsvDB, Adodb);

export default function csvdb(path, hasHeader) {
  return new CsvDB(path, hasHeader);
}
