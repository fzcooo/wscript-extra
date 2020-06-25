import { each, typeOf } from './tool';
import { isArray } from './util'
import {
  Adodb,
  adVariant,
  adInteger,
  adNumeric,
  adBoolean,
  adDBTimeStamp,
  adBinary,
} from './adodb';
import { bin2buf } from './encoding';

export class OracleDB extends Adodb {
  constructor(ds, usr, pass) {
    try {
      super();
      this.conn.ConnectionString =
        // = `Provider=OraOLEDB.Oracle;Data Source=${ds};User ID=${usr};Password=${pass}`;
        `Provider=MSDAORA;Data Source=${ds};User ID=${usr};Password=${pass}`;
      this.conn.Open();
    } catch (e) {
      console.log('Database connect failed.');
      console.log(
        'datasource: %s\n    userid: %s\n  password: %s',
        ds,
        usr,
        pass
      );
      throw e;
    }
  }

  getDataTypeMapping() {
    return {
      string: adVariant,
      int: adInteger,
      decimal: adNumeric,
      boolean: adBoolean,
      date: adDBTimeStamp,
      buffer: adBinary,
      null: adVariant,
      undefined: adVariant,
    };
  }

  tableExists(tableName) {
    let row = this.firstRow('select 1 from user_tables where table_name = ?', [
      tableName,
    ]);
    return row != null;
  }

  getTables() {
    let rows = this.rows('select table_name from user_tables');
    return rows.map((it) => it.TABLE_NAME);
  }
}

export default function oracledb(ds, usr, pass) {
  return new OracleDB(ds, usr, pass);
}

// OraOLEDB

let _vbs, _session;

export class Oo4o extends Adodb {
  get vbs() {
    if (!_vbs) {
      _vbs = __VBS;
      _vbs.AddCode(`
Function ReadBlob(field)
  Dim buf()
  field.GetChunkByteEx buf, 0, field.FieldSize()
  ReadBlob = buf
End Function

Function ReadClob(field)
  Dim buf
  field.Value.Read buf
  ReadClob = buf
End Function
      `);
    }
    return _vbs.CodeObject;
  }

  get session() {
    if (!_session) {
      _session = new ActiveXObject('OracleInProcServer.XOraSession');
    }
    return _session;
  }

  constructor(ds, user, pass) {
    super();
    this.dataBase = this.session.OpenDatabase(ds, user + '/' + pass, 0);
  }

  close() {
    this.dataBase.Close();
    this.dataBase = null;
    _session = null;
  }

  begin() {
    this.session.BeginTrans();
  }

  commit() {
    this.session.CommitTrans();
  }

  rollback() {
    this.session.Rollback();
  }

  getDataTypeMapping() {
    return {
      string: 1,
      int: 2,
      decimal: 2,
      number: 2,
      boolean: 1,
      date: 12,
      buffer: 113,
      null: 1,
      undefined: 1,
    };
  }

  createParams(opts) {
    let params = opts.params,
      self = this;
    if (!params) return;
    let dtmap = this.getDataTypeMapping();
    each(params, (v, k) => {
      let type = dtmap[typeOf(v)] || 1;
      self.dataBase.Parameters.Add(String(k), v, 1, type);

      if (isArray(params) && opts.sql.includes('?')) {
        let index = 0;
        opts.sql = opts.sql.replace(/\?/g, () => {
          return ':' + index++;
        });
      }
    });
  }

  removeParams(opts) {
    let params = opts.params,
      self = this;
    if (!params) return;
    each(params, (v, k) => {
      self.dataBase.Parameters.Remove(String(k));
    });
  }

  execute(...args) {
    let opts = this.getOptions(args);
    try {
      this.createParams(opts);
      return this.dataBase.ExecuteSQL(opts.sql);
    } catch (e) {
      e.sql = opts.sql;
      throw e;
    } finally {
      this.removeParams(opts);
    }
  }

  select(...args) {
    let rs,
      row,
      i,
      len,
      opts = this.getOptions(args);
    try {
      this.createParams(opts);
      rs = this.dataBase.CreateDynaset(opts.sql, 0);
      while (!rs.EOF) {
        row = {};
        if (len == null) len = rs.Fields.Count;
        for (i = 0; i < len; i++) {
          row[rs.Fields(i).Name] = this.getFieldValue(rs.Fields(i));
        }
        if (opts.callback(row) === false) break;
        rs.MoveNext();
      }
    } catch (e) {
      e.sql = opts.sql;
      throw e;
    } finally {
      this.removeParams(opts);
      rs && rs.Close();
    }
  }

  getFieldValue(field) {
    switch (field.OraIDataType) {
      case 2:
      case 8:
        return Number(field.value);
      case 112:
        return this.vbs.ReadClob(field);
      case 113:
        return bin2buf(this.vbs.ReadBlob(field));
      case 12:
      case 187:
      case 188:
      case 232:
        return new Date(field.value);
      default:
        return field.value;
    }
  }

  batch() {}

  batch_insert(cmd, rows) {
    let self = this;
    let rs = this.dataBase.CreateDynaset(cmd, 0);
    try {
      this.begin();
      each(rows, (row) => {
        rs.AddNew();
        each(row, (v, k) => {
          self.setFieldValue(rs.Fields(k), v);
        });
        rs.Update();
      });
      this.commit();
    } catch (e) {
      this.rollback();
      throw e;
    } finally {
      rs && rs.Close();
    }
  }
}

export function oo4o(ds, user, pass) {
  return new Oo4o(ds, user, pass);
}
