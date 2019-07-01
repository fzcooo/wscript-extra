// NodeJS Runtime

function exit(status) {
  WScript.Quit(status || 0);
}

function sleep(millis) {
  WScript.Sleep(millis);
}

let _version;

function version_get() {
  return (
    _version ||
    (_version =
      // eslint-disable-next-line no-undef
      ScriptEngine() +
      ' ' +
      // eslint-disable-next-line no-undef
      ScriptEngineMajorVersion() +
      '.' +
      // eslint-disable-next-line no-undef
      ScriptEngineMinorVersion() +
      '.' +
      // eslint-disable-next-line no-undef
      ScriptEngineBuildVersion())
  );
}

let _argv;

function argv_get() {
  if (_argv) return _argv;
  _argv = [WScript.FullName];
  let en = new Enumerator(WScript.Arguments);
  for (; !en.atEnd(); en.moveNext()) _argv.push(en.item());
  return _argv;
}

let _env;

function env_get() {
  if (_env) return _env;
  let it, i;
  let en = new Enumerator(GetShell().Environment('PROCESS'));
  _env = {};
  for (; !en.atEnd(); en.moveNext()) {
    it = en.item();
    i = it.indexOf('=');
    if (i > 0) {
      _env[it.slice(0, i)] = it.slice(i + 1);
    }
  }
  return _env;
}

function createGetters(props) {
  let _props = {};
  for (let key in props) {
    _props[key] = {
      enumerable: true,
      get: props[key]
    };
  }
  return _props;
}

this.process = Object.create(
  {
    cwd: () => __dirname,
    exit: exit,
    stdin: WScript.StdIn,
    stdout: WScript.StdOut,
    stderr: WScript.StdErr,
    sleep: sleep,
    moduleLoadList: []
  },
  createGetters({
    version: version_get,
    argv: argv_get,
    env: env_get
  })
);
