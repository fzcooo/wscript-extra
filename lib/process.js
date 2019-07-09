// NodeJS Runtime

export class Process {
  constructor() {
    this._version = null;
    this._argv = null;
    this._env = null;
  }

  exit(status = 0) {
    WScript.Quit(status);
  }

  sleep(millis) {
    WScript.Sleep(millis);
  }

  get version() {
    if (this._version) return this._version;

    this._version =
      ScriptEngine() +
      ' ' +
      ScriptEngineMajorVersion() +
      '.' +
      ScriptEngineMinorVersion() +
      '.' +
      ScriptEngineBuildVersion();

    return this._version;
  }

  get argv() {
    if (this._argv) return this._argv;
    this._argv = [WScript.FullName];
    let en = new Enumerator(WScript.Arguments);
    for (; !en.atEnd(); en.moveNext()) this._argv.push(en.item());
    return this._argv;
  }

  get env() {
    if (this._env) return this._env;
    let it, i;
    let en = new Enumerator(__WShell.Environment('PROCESS'));
    this._env = {};
    for (; !en.atEnd(); en.moveNext()) {
      it = en.item();
      i = it.indexOf('=');
      if (i > 0) {
        this._env[it.slice(0, i)] = it.slice(i + 1);
      }
    }
    return this._env;
  }
}

export default new Process();
