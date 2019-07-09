import { isAbsolute, normalize } from './path';
import { isfile } from './fso';
import { Adodb } from './adodb';

export class AccDB extends Adodb {
  constructor(path) {
    if (!isAbsolute(path)) {
      path = normalize(path);
    }
    if (!isfile(path)) {
      let app = new ActiveXObject('Access.Application');
      app.NewCurrentDatabase(path);
    }
    super();
    this.conn.ConnectionString = `Provider=Microsoft.Ace.OLEDB.12.0;Data Source=${path}`;
    this.conn.Open();
  }
}

export default function accdb(pth) {
  return new AccDB(pth);
}
