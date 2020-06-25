import { isString, isNumber } from './util';

let _service;

function getService() {
  if (!_service) {
    let locator = new ActiveXObject('WbemScripting.SWbemLocator');
    _service = locator.ConnectServer('.', 'root\\CIMV2');
  }
  return _service;
}

export function get(cmd) {
  return getService().Get(cmd);
}

export function exec(wql) {
  return getService().ExecQuery(wql);
}

export function query(wql) {
  let rs = exec(wql);
  let rows = new Enumerator(rs).map(record => {
    return new Enumerator(record.Properties_).reduce(
      (rowData, prop) => {
        if (prop.Value != null) {
          rowData[prop.name] = prop.IsArray
            ? new VBArray(prop.Value).toArray()
            : prop.Value;
        }
        return rowData;
      },
      {}
    );
  });
  rs = null;
  return rows;
}

export function eachRow(wql, cb) {
  let rs = exec(wql);
  new Enumerator(rs).forEach(it => cb(it));
  rs = null;
}

export function firstRow(wql) {
  let obj;
  let rs = exec(wql);
  new Enumerator(rs).forEach(it => {
    obj = it;
    return false;
  });
  rs = null;
  return obj;
}

export function cpu() {
  return query('select * from Win32_Processor')[0];
}

export function sys() {
  return query('select * from Win32_ComputerSystem')[0];
}

export function os() {
  return query('select * from Win32_OperatingSystem')[0];
}

export function shutdown(forced) {
  return firstRow('select * from Win32_OperatingSystem').Win32Shutdown(
    1 + (forced ? 4 : 0)
  );
}

export function logoff(forced) {
  return firstRow('select * from Win32_OperatingSystem').Win32Shutdown(
    0 + (forced ? 4 : 0)
  );
}

export function restart(forced) {
  return firstRow('select * from Win32_OperatingSystem').Win32Shutdown(
    2 + (forced ? 4 : 0)
  );
}

export function poweroff(forced) {
  return firstRow('select * from Win32_OperatingSystem').Win32Shutdown(
    8 + (forced ? 4 : 0)
  );
}

export function ps(l) {
  let props = ['ProcessId', 'Caption'];
  if (l) props.push('ParentProcessId', 'CreationDate', 'CommandLine');
  let rs = exec('select * from Win32_Process');
  return new Enumerator(rs).map(it => {
    return props.reduce((row, name) => ((row[name] = it[name]), row), {});
  });
}

export function kill(arg) {
  let wql = 'select * from Win32_Process';
  if (isString(arg)) wql += ` where Caption='${arg}'`;
  else if (isNumber(arg)) wql += ` where ProcessId=${arg}`;
  else return -1;
  return firstRow(wql).Terminate();
}

export function env() {
  let rs = exec('select * from Win32_Environment');
  return new Enumerator(rs).reduce(
    (result, it) => ((result[it.Name] = it.VariableValue), result),
    {}
  );
}
