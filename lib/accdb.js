import { inherits } from './util';
import { isAbsolute, normalize } from './path';
import { isfile } from './fso';
import { Adodb } from './adodb';

export function AccDB(path) {
  if (!isAbsolute(path)) {
    path = normalize(path);
  }
  if (!isfile(path)) {
    let app = new ActiveXObject('Access.Application');
    app.NewCurrentDatabase(path);
  }
  Adodb.call(this);
  this.conn.ConnectionString = `Provider=Microsoft.Ace.OLEDB.12.0;Data Source=${path}`;
  this.conn.Open();
}

inherits(AccDB, Adodb);

export default function accdb(pth) {
  return new AccDB(pth);
}
