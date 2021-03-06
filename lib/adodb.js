import { each, typeOf, has } from './tool';

/* CursorLocationEnum */
export let adUseClient = 3;
export let adUseNone = 1;
export let adUseServer = 2;
/* LockTypeEnum */
export let adLockUnspecified = -1;
export let adLockReadOnly = 1;
export let adLockPessimistic = 2;
export let adLockOptimistic = 3;
export let adLockBatchOptimistic = 4;
/* CursorTypeEnum */
export let adOpenUnspecified = -1;
export let adOpenForwardOnly = 0;
export let adOpenKeyset = 1;
export let adOpenDynamic = 2;
export let adOpenStatic = 3;
/* DataTypeEnum */
export let adBigInt = 20;
export let adBinary = 128;
export let adBoolean = 11;
export let adChar = 129;
export let adCurrency = 6;
export let adDate = 7;
export let adDBDate = 133;
export let adDBTime = 134;
export let adDBTimeStamp = 135;
export let adDecimal = 14;
export let adDouble = 5;
export let adGUID = 72;
export let adIDispatch = 9;
export let adInteger = 3;
export let adLongVarBinary = 205;
export let adLongVarChar = 201;
export let adLongVarWChar = 203;
export let adNumeric = 131;
export let adSingle = 4;
export let adSmallInt = 2;
export let adUnsignedTinyInt = 17;
export let adVarBinary = 204;
export let adVarChar = 200;
export let adVariant = 12;
export let adVarWChar = 202;
export let adWChar = 130;
/* ParameterDirectionEnum */
export let adParamUnknown = 0;
export let adParamInput = 1;
export let adParamOutput = 2;
export let adParamInputOutput = 3;
export let adParamReturnValue = 4;
/* SchemaEnum */
export let adSchemaTables = 20;
export let adSchemaColumns = 4;

export class Adodb {
  constructor() {
    this.conn = new ActiveXObject('ADODB.Connection');
  }

  close() {
    this.conn && this.conn.State != 0 && this.conn.Close();
    this.conn = null;
  }

  begin() {
    this.conn.BeginTrans();
  }

  commit() {
    this.conn.CommitTrans();
  }

  rollback() {
    this.conn.RollbackTrans();
  }

  getOptions(args) {
    if (typeof args[0] === 'object' && args[0]._is_options) return args[0];
    let i = -1,
      len = args.length,
      arg,
      op = { _is_options: true };
    while (++i < len) {
      arg = args[i];
      switch (typeOf(arg)) {
        case 'string':
          op.sql = arg;
          break;
        case 'array':
        case 'object':
          op.params = arg;
          break;
        case 'boolean':
          op.prepared = arg;
          break;
        case 'function':
          op.callback = arg;
          break;
      }
    }
    return op;
  }

  getDataTypeMapping() {
    return {
      string: adVarWChar,
      int: adSmallInt,
      decimal: adDouble,
      boolean: adBoolean,
      date: adDate,
      buffer: adBinary,
      null: adVarWChar,
      undefined: adVarWChar
    };
  }

  createParams(opts) {
    let cmdobj = opts.cmd,
      params = opts.params;
    if (!cmdobj || !params) return;
    let jsType,
      tp,
      size = 10,
      dtmap = this.getDataTypeMapping();
    each(params, (value, name) => {
      jsType = typeOf(value);
      if (jsType == 'string') {
        tp = dtmap['string'];
        size = tp === adVariant ? value.length * 2 : value.length;
      } else if (jsType == 'number') {
        tp = Number.isInteger(value) ? dtmap['int'] : dtmap['decimal'];
      } else if (has(dtmap, jsType)) {
        tp = dtmap[jsType];
      } else {
        throw new Error('Adodb.createParams: unexpected type ' + jsType);
      }
      let paramobj = cmdobj.CreateParameter(
        name,
        tp,
        adParamInput,
        size,
        value
      );
      cmdobj.Parameters.Append(paramobj);
    });
  }

  execute(...args) {
    let op = this.getOptions(args);
    try {
      let cmd = new ActiveXObject('ADODB.Command');
      cmd.ActiveConnection = this.conn;
      cmd.CommandType = 1; /*text*/
      cmd.Prepared = op.prepared || false;
      cmd.CommandText = op.sql;
      op.cmd = cmd;
      this.createParams(op);
      return cmd.Execute();
    } catch (e) {
      e.sql = op.sql;
      throw e;
    }
  }

  select(...args) {
    let rs,
      row,
      i,
      len,
      op = this.getOptions(args);
    try {
      rs = this.execute(op);
      while (!rs.EOF) {
        row = {};
        if (len == null) len = rs.Fields.Count;
        for (i = 0; i < len; i++) {
          row[rs.Fields(i).Name] = this.getFieldValue(rs.Fields(i));
        }
        if (op.callback(row) === false) break;
        rs.MoveNext();
      }
    } catch (e) {
      e.sql = op.sql;
      throw e;
    } finally {
      rs && rs.State != 0 && rs.Close();
    }
  }

  getFieldValue(field) {
    switch (field.Type) {
      case adBinary:
      case adVarBinary:
        return '[LOB]';
      case adDate:
      case adDBDate:
      case adDBTime:
      case adDBTimeStamp:
        return new Date(field.value);
      default:
        return field.value;
    }
  }

  eachRow(...args) {
    let op = this.getOptions(args);
    this.select(op);
  }

  firstRow(...args) {
    let op = this.getOptions(args),
      _row;
    op.callback = row => ((_row = row), false);
    this.select(op);
    return _row;
  }

  rows(...args) {
    let op = this.getOptions(args),
      rows = [];
    op.callback = row => {
      rows.push(row);
    };
    this.select(op);
    return rows;
  }

  batch(cmd, fn) {
    let conn, rs;
    try {
      conn = this.conn;
      rs = new ActiveXObject('ADODB.Recordset');
      rs.CursorLocation = adUseClient;
      rs.LockType = adLockBatchOptimistic;
      rs.CursorType = adOpenDynamic;
      rs.Open(cmd, conn);
      fn(rs);
    } finally {
      rs && rs.State != 0 && rs.Close();
    }
  }

  setFieldValue(field, value) {
    switch (typeOf(value)) {
      case 'date':
        field.Value = formatDate(value);
        break;
      case 'string':
      case 'number':
        field.Value = value;
        break;
      default:
        field.Value = String(value);
        break;
    }
  }

  batch_insert(cmd, rows) {
    let self = this;
    this.batch(cmd, rs => {
      each(rows, row => {
        rs.AddNew();
        each(row, (v, k) => {
          self.setFieldValue(rs.Fields(k), v);
        });
      });
      rs.UpdateBatch();
    });
  }

  tableExists(tableName) {
    let conn,
      rs,
      result = false,
      params = [null, null, tableName, 'TABLE'];
    try {
      conn = this.conn;
      rs = conn.OpenSchema(adSchemaTables, params);
      if (!rs.EOF) result = true;
    } catch (e) {
      throw e;
    } finally {
      rs && rs.State != 0 && rs.Close();
    }
    return result;
  }

  getTables() {
    let conn,
      rs,
      result = [],
      count = 0;
    try {
      conn = this.conn;
      rs = conn.OpenSchema(adSchemaTables);
      while (!rs.EOF) {
        if (rs.Fields('TABLE_TYPE').Value === 'TABLE') {
          result[count++] = rs.Fields('TABLE_NAME').Value;
        }
        rs.MoveNext();
      }
    } catch (e) {
      throw e;
    } finally {
      rs && rs.State != 0 && rs.Close();
    }
    return result;
  }
}

function formatDate(d) {
  return (
    d.getFullYear() +
    '/' +
    (d.getMonth() + 1) +
    '/' +
    d.getDate() +
    ' ' +
    d.getHours() +
    ':' +
    d.getMinutes() +
    ':' +
    d.getSeconds()
  );
}
