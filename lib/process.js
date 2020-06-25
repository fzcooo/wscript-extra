import _process from 'process-es6';

export default {
  ..._process,
  exit: (status = 0) => WScript.Quit(status),
  sleep: (millis) => WScript.Sleep(millis),
  get version() {
    return ScriptEngine() + ' ' +
      ScriptEngineMajorVersion() + '.' +
      ScriptEngineMinorVersion() + '.' +
      ScriptEngineBuildVersion();
  },
  get argv() {
    return new Enumerator(WScript.Arguments).reduce((acc, it) => {
      return acc.push(it), acc;
    }, [WScript.FullName]);
  },
  get env() {
    return new Enumerator(__WShell.Environment('PROCESS')).reduce((acc, it) => {
      let i = it.indexOf('=');
      if (i > 0) {
        acc[it.slice(0, i)] = it.slice(i + 1);
      }
      return acc;
    }, {});
  }
}
