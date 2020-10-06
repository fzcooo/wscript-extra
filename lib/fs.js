import {
  scandir,
  isabs,
  getStats,
  mkdir,
  mkdirs,
  dirname,
  abspath,
  isdir,
  isfile,
  copyfile,
} from './fso';

import { buf2bin, bin2buf } from './encoding';

export {
  exists as existsSync,
  repl as renameSync,
  rmdir as rmdirSync,
  remove as unlinkSync,
} from './fso';

export function statSync(pth) {
  return getStats(pth);
}

export function readdirSync(pth) {
  return scandir(pth).map((it) => it.name);
}

function initArgs(file, options) {
  let opts = {
    file: abspath(file),
    encoding: null,
    flag: 'r',
    flags: 'r',
    autoClose: true,
    emitClose: false,
    start: 0,
    end: Infinity,
    highWaterMark: 64 * 1024,
  };
  switch (typeof options) {
    case 'string':
      opts.encoding = options;
      break;
    case 'object':
      Object.assign(opts, options);
      break;
  }
  opts.encoding = resolveEncoding(opts.encoding);
  return opts;
}

function resolveEncoding(name) {
  name = name && name.replace(/[_-]/g, '').toLowerCase();
  switch (name) {
    case 'ascii':
      return 'us-ascii';
    case 'eucjs':
      return 'euc-jp';
    case 'shiftjis':
      return 'Shift_JIS';
    case 'utf8':
      return 'UTF-8';
    case 'utf16':
      return 'UTF-16';
    default:
      return name;
  }
}

function loadFile({ file, encoding }) {
  let asBinary = encoding === 'binary';
  let data = null;
  let stm = new ActiveXObject('ADODB.Stream');
  try {
    if (asBinary) {
      stm.Type = 1;
    } else {
      stm.Charset = encoding;
    }
    stm.Open();
    stm.LoadFromFile(file);
    if (stm.Size == 0) {
      return asBinary ? null : '';
    }
    if (asBinary) {
      data = bin2buf(stm.Read(-1));
    } else {
      data = stm.ReadText(-1);
    }
  } finally {
    stm && stm.State == 1 && stm.close();
  }
  return data;
}

function storeFile({ file, data, encoding, flag }) {
  let asBinary = encoding === 'binary';
  let binData = null;
  let skip = 0;
  let stm = new ActiveXObject('ADODB.Stream');
  try {
    if (asBinary) {
      stm.Type = 1;
    } else {
      stm.Charset = encoding;
    }
    stm.Open();
    if (flag.includes('a')) {
      stm.LoadFromFile(file);
      stm.Position = stm.Size;
    }
    if (asBinary) {
      stm.Write(buf2bin(data));
    } else {
      stm.WriteText(data);
    }
    stm.SetEOS();
    if (encoding === 'UTF-8') {
      skip = 3;
    } else if (encoding === 'UTF-16') {
      skip = 2;
    }
    if (skip) {
      stm.Position = 0;
      stm.Type = 1;
      stm.Position = skip;
      binData = stm.Read(-1);
      stm.Position = 0;
      stm.Write(binData);
      stm.SetEOS();
    }
    stm.SaveToFile(file, 2);
  } finally {
    stm && stm.State == 1 && stm.close();
  }
}

export function readFileSync(file, options) {
  if (!isfile(file)) {
    throw new Error(`file not exists. (${file})`);
  }
  options = initArgs(file, options);
  options.flag = 'r';
  if (!options.encoding) {
    options.encoding = 'binary';
  }
  return loadFile(options);
}

export function writeFileSync(file, data, options) {
  options = initArgs(file, options);
  options.flag = 'w';
  if (Buffer.isBuffer(data)) {
    options.encoding = 'binary';
  } else if (!options.encoding) {
    options.encoding = 'UTF-8';
  }
  options.data = data;
  storeFile(options);
}

export function appendFileSync(file, data, options) {
  options = initArgs(file, options);
  options.flag = 'a';
  if (Buffer.isBuffer(data)) {
    options.encoding = 'binary';
  } else if (!options.encoding) {
    options.encoding = 'UTF-8';
  }
  options.data = data;
  storeFile(options);
}

export function mkdirSync(pth, options) {
  if (options && options.recursive) mkdirs(pth);
  mkdir(pth);
}

export function copyFileSync(src, dest) {
  copyfile(src, dest, true);
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
  ensureFileSync(file);
  writeFileSync(file, data, options);
}

export function outputJsonSync(file, obj, options) {
  ensureFileSync(file);
  writeFileSync(file, JSON.stringify(obj), options);
}

export let outputJSONSync = outputJsonSync;

export function readJsonSync(file, options) {
  if (!options || (typeof options == 'object' && !options.encoding)) {
    options = 'UTF-8';
  }
  let data = readFileSync(file, options);
  return JSON.parse(data);
}

export let readJSONSync = readJsonSync;

export function emptyDirSync(dir) {
  scandir(dir).forEach((it) => it.delete(true));
}
