export function execSync(cmd) {
  let proc = __WShell.Exec(cmd);
  for (;;) {
    if (proc.States !== 0) break;
  }
  if (!proc.StdOut.AtEndOfStream) {
    return proc.StdOut.ReadAll();
  }
}

export function exec(cmd, func) {
  let proc, stdout, stderr;
  try {
    proc = __WShell.Exec(cmd);
    for (;;) {
      if (proc.States !== 0) break;
    }
    if (func && typeof func === 'function') {
      if (!proc.StdOut.AtEndOfStream) {
        stdout = proc.StdOut.ReadAll();
      }
      if (!proc.StdErr.AtEndOfStream) {
        stderr = proc.StdErr.ReadAll();
      }
      func(null, stdout, stderr);
    }
  } catch (e) {
    if (func && typeof func === 'function') {
      func(e, null, null);
    } else {
      throw e;
    }
  }
}

export function run(cmd, options) {
  let intWindowStyle = 1,
    bWaitOnReturn = true;
  options || (options = {});
  if (options.hide === false || options.hidden === false) intWindowStyle = 0;
  if (options.wait === false) bWaitOnReturn = false;
  return __WShell.Run(cmd, intWindowStyle, bWaitOnReturn);
}
