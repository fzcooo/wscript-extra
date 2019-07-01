import {
  scandir,
  isabs,
  FileStats,
  mkdir,
  mkdirs,
  dirname,
  abspath,
  isdir,
  isfile
} from './fso';

export {
  exists as existsSync,
  repl as renameSync,
  rmdir as rmdirSync,
  remove as unlinkSync
} from './fso';

export function statSync(pth) {
  return FileStats(pth);
}

export function readdirSync(pth) {
  return scandir(pth).map(it => it.name);
}

function withStream(options, fn) {
  let st = new ActiveXObject('ADODB.Stream'),
    file = options.file,
    encoding = options.encoding,
    flag = options.flag,
    rst;
  try {
    if (encoding == 'binary') st.Type = 1;
    else st.Charset = encoding;
    st.Open();
    if (flag == 'r' || flag == 'a') {
      if (!isfile(file))
        throw new Error(`withStream: file not exists. (${file})`);
      st.LoadFromFile(file);
    }
    if (flag == 'a') st.Position = st.Size;
    rst = fn(st);
  } catch (e) {
    throw e;
  } finally {
    st && st.State == 1 && st.close();
  }
  return rst;
}

function saveStream(st, options) {
  let skipLen = 0,
    file = options.file,
    encoding = options.encoding.replace('-', '').toLowerCase();
  if (encoding == 'utf8' || encoding == 'unicode') skipLen = 3;
  else if (encoding == 'uft16') skipLen = 2;
  st.SetEOS();
  if (skipLen) {
    st.Position = 0;
    st.Type = 1;
    st.Position = skipLen;
    let binData = st.Read(-1);
    st.Position = 0;
    st.Write(binData);
    st.SetEOS();
  }
  st.SaveToFile(file, 2);
}

function initArgs(file, options) {
  let tp, encoding, flag;
  if (!isabs(file)) throw new Error('fs: relative path is not supported');
  tp = typeof options;
  if (tp == 'string') {
    encoding = options;
  } else if (tp == 'object') {
    if (options.encoding) encoding = options.encoding;
    if (options.flag) flag = options.flag;
    else if (options.flags) flag = options.flags;
  }
  if (flag && flag.length > 1) flag = flag.charAt(0);
  return { file: file, encoding: encoding, flag: flag };
}

export function readFileSync(file, options) {
  let opts = initArgs(file, options);
  opts.flag = 'r';
  if (!opts.encoding) opts.encoding = 'binary';
  return withStream(opts, function(st) {
    return opts.encoding == 'binary'
      ? Buffer.from(st.Read(-1))
      : st.ReadText(-1);
  });
}

export function writeFileSync(file, data, options) {
  let opts = initArgs(file, options),
    isBuffer = Buffer.isBuffer(data);
  opts.flag = 'w';
  if (isBuffer) opts.encoding = 'binary';
  else if (!opts.encoding) opts.encoding = 'UTF-8';
  withStream(opts, st => {
    isBuffer ? st.Write(data.buffer) : st.WriteText(data);
    saveStream(st, opts);
  });
}

export function appendFileSync(file, data, options) {
  let opts = initArgs(file, options),
    isBuffer = Buffer.isBuffer(data);
  opts.flag = 'a';
  if (isBuffer) opts.encoding = 'binary';
  else if (!opts.encoding) opts.encoding = 'UTF-8';
  withStream(opts, st => {
    isBuffer ? st.Write(data.buffer) : st.WriteText(data);
    saveStream(st, opts);
  });
}

export function mkdirSync(pth, options) {
  if (options && options.recursive) mkdirs(pth);
  mkdir(pth);
}

// fs-extra

export function mkdirsSync(pth) {
  mkdirs(pth);
}

export function ensureDirSync(pth) {
  if (!isdir(pth)) mkdirs(pth);
}

export function ensureFileSync(file) {
  if (!isabs(file)) file = abspath(file);
  let dir = dirname(file);
  if (!isdir(dir)) mkdirs(dir);
}

export function outputFileSync(file, data, options) {
  if (!isabs(file)) file = abspath(file);
  ensureFileSync(file);
  writeFileSync(file, data, options);
}

export function outputJsonSync(file, obj, options) {
  if (!isabs(file)) file = abspath(file);
  ensureFileSync(file);
  writeFileSync(file, JSON.stringify(obj), options);
}

export let outputJSONSync = outputJsonSync;

export function readJsonSync(file, options) {
  if (!isabs(file)) file = abspath(file);
  if (!options || (typeof options == 'object' && !options.encoding))
    options = 'UTF-8';
  let data = readFileSync(file, options);
  return JSON.parse(data);
}

export let readJSONSync = readJsonSync;

export function emptyDirSync(dir) {
  scandir(dir).forEach(it => it.delete(true));
}

export function readLinesSync(file, options) {
  if (!isabs(file)) file = abspath(file);
  let opts = initArgs(file, options);
  opts.flag = 'r';
  if (!opts.encoding) opts.encoding = 'UTF-8';
  return withStream(opts, function(st) {
    let lines = [];
    while (!st.EOS) lines.push(st.ReadText(-2));
    return lines;
  });
}
