const ROOT_REGEXP = /^([A-z]:|)[/\\]/;
const SEP_REGEXP = /[/\\]+/;
const SEP_REGEXP_END = /[/\\]$/;
const LNK_REGEXP = /(\.lnk|\.url)$/;

export const SEP = '\\';
export const sep = SEP;

export function isabs(pth) {
  return pth && ROOT_REGEXP.test(pth);
}

export let isAbsolute = isabs;

export function dirname(pth) {
  return GetFSO().GetParentFolderName(pth);
}

export function basename(pth, ext) {
  return ext ? GetFSO().GetBaseName(pth) : GetFSO().GetFileName(pth);
}

export function extname(pth) {
  return GetFSO().GetExtensionName(pth);
}

export function abspath(pth) {
  if (!isabs(pth)) pth = __dirname + SEP + pth;
  return GetFSO().GetAbsolutePathName(pth);
}

export function normpath(pth) {
  let parts = pth.split(SEP_REGEXP),
    normParts = [],
    len = parts.length,
    part;
  for (let i = 0; i < len; i++) {
    part = parts[i];
    if (part === '..') normParts.pop();
    else if (part === '.') continue;
    else normParts.push(part);
  }
  return normParts.join(SEP);
}

export let normalize = normpath;

export function join() {
  let p,
    len = arguments.length,
    parts = [];
  for (let i = 0; i < len; i++) {
    p = arguments[i];
    if (typeof p === 'string') parts.push(p);
  }
  return normpath(parts.join(SEP));
}

export function resolve() {
  let p,
    len = arguments.length,
    parts = [];
  for (let i = 0; i < len; i++) {
    p = arguments[i];
    if (typeof p === 'string') {
      if (ROOT_REGEXP.test(p)) {
        parts.length = 0;
        parts[0] = p;
      } else {
        parts.push(p);
      }
    }
  }
  return abspath(parts.join(SEP));
}

export function relative(from, to) {
  let from_ = abspath(from).toLowerCase(),
    to_ = abspath(to).toLowerCase(),
    fromParts = from_.split(SEP_REGEXP),
    toParts = to_.split(SEP_REGEXP),
    len = Math.min(fromParts.length, toParts.length),
    samePartsLen = len,
    i = -1;

  while (++i < len) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLen = i;
      break;
    }
  }

  if (samePartsLen == 0) return to;

  let outputParts = [];
  for (i = samePartsLen; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLen));

  return outputParts.join(SEP);
}

export function relpath(pth, start) {
  start || (start = __dirname);
  return relative(start, pth);
}

export function isfile(pth) {
  return GetFSO().FileExists(pth);
}

export let isFile = isfile;

export function isdir(pth) {
  return GetFSO().FolderExists(pth);
}

export function exists(pth) {
  return isfile(pth) || isdir(pth);
}

export function isShortcut(pth) {
  return isfile(pth) && LNK_REGEXP.test(pth);
}

export function createShortcut(pth, options) {
  let shortcut = GetShell().CreateShortcut(pth);
  if (options.target) shortcut.TargetPath = options.target;
  if (options.runStyle) shortcut.WindowStyle = options.runStyle; //NORMAL(1),MAX(3),MIN(7)
  if (options.desc) shortcut.Description = options.desc;
  shortcut.Save();
}

export function getShortcutTarget(pth) {
  let shortcut = GetShell().CreateShortcut(pth);
  return shortcut.TargetPath;
}

export function getcwd() {
  return __dirname;
}

export let cwd = getcwd;

const FILE_PROTO = {
  isfile: function() {
    return (this._file.Attributes & 16) == 0;
  },
  isFile: function() {
    return (this._file.Attributes & 16) == 0;
  },
  isdir: function() {
    return (this._file.Attributes & 16) == 16;
  },
  isDirectory: function() {
    return (this._file.Attributes & 16) == 16;
  },
  isShortcut: function() {
    return this.isFile() && LNK_REGEXP.test(this.path);
  },
  createShortcut: function(pth, options) {
    options.target = this.path;
    createShortcut(pth, options);
  },
  copy: function(dst, ow) {
    if (!isabs(dst)) dst = abspath(dst);
    if (!SEP_REGEXP_END.test(dst)) dst += SEP;
    if (!isdir(dst)) mkdirs(dst);
    return this._file.Copy(dst, ow == null ? true : !!ow);
  },
  delete: function(force) {
    return this._file.Delete(!!force);
  },
  move: function(dst) {
    if (!isabs(dst)) dst = abspath(dst);
    if (!SEP_REGEXP_END.test(dst)) dst += SEP;
    if (!isdir(dst)) mkdirs(dst);
    return this._file.Move(dst);
  }
};

const FILE_PROPS = {
  _file: {
    value: null,
    writable: true
  },
  name: {
    enumerable: true,
    get: function() {
      return this._file.Name;
    },
    set: function(v) {
      this._file.Name = v;
    }
  },
  path: {
    enumerable: true,
    get: function() {
      return this._file.Path;
    }
  },
  dirname: {
    enumerable: true,
    get: function() {
      return this._file.ParentFolder.Path;
    }
  },
  size: {
    enumerable: true,
    get: function() {
      return this._file.Size;
    }
  },
  type: {
    enumerable: true,
    get: function() {
      return this._file.Type;
    }
  },
  target: {
    enumerable: true,
    get: function() {
      return this.isShortcut() ? getShortcutTarget(this.path) : null;
    }
  },
  atime: {
    enumerable: true,
    get: function() {
      return new Date(this._file.DateLastAccessed);
    }
  },
  mtime: {
    enumerable: true,
    get: function() {
      return new Date(this._file.DateLastModified);
    }
  },
  ctime: {
    enumerable: true,
    get: function() {
      return new Date(this._file.DateCreated);
    }
  },
  atimeMs: {
    enumerable: true,
    get: function() {
      return this.atime.getTime();
    }
  },
  mtimeMs: {
    enumerable: true,
    get: function() {
      return this.mtime.getTime();
    }
  },
  ctimeMs: {
    enumerable: true,
    get: function() {
      return this.ctime.getTime();
    }
  },
  readonly: {
    enumerable: true,
    get: function() {
      return !!(this._file.Attributes & 1);
    }
  },
  hidden: {
    enumerable: true,
    get: function() {
      return !!(this._file.Attributes & 2);
    }
  },
  system: {
    enumerable: true,
    get: function() {
      return !!(this._file.Attributes & 4);
    }
  },
  children: {
    enumerable: false,
    get: function() {
      let self = this.isShortcut() ? FileStats(this.target) : this;
      if (self.isFile()) return null;
      let _enum = new Enumerator(self._file.Files);
      let rst = [];
      for (; !_enum.atEnd(); _enum.moveNext()) {
        rst.push(FileStats(_enum.item()));
      }
      _enum = new Enumerator(self._file.SubFolders);
      for (; !_enum.atEnd(); _enum.moveNext()) {
        rst.push(FileStats(_enum.item()));
      }
      return rst;
    }
  }
};

export function FileStats(pth) {
  let f,
    instance = Object.create(FILE_PROTO, FILE_PROPS);
  if (typeof pth == 'object') {
    f = pth;
  } else if (typeof pth == 'string') {
    if (!isabs(pth)) pth = abspath(pth);
    if (isfile(pth)) {
      f = GetFSO().GetFile(pth);
    } else if (isdir(pth)) {
      f = GetFSO().GetFolder(pth);
    }
  }
  if (!f) throw new Error(`ENOENT, no such file or directory (${pth})`);
  instance._file = f;
  return instance;
}

export function scandir(pth) {
  return FileStats(pth).children;
}

export function walk(pth, fn) {
  if (!isdir(pth)) return;
  let dir,
    items,
    item,
    i,
    len,
    buf = [FileStats(pth)];
  while (buf.length > 0) {
    dir = buf.shift();
    items = dir.children;
    i = -1;
    len = items.length;
    while (++i < len) {
      item = items[i];
      if (item.isDirectory()) buf.push(item);
      if (fn(item) === false) return;
    }
  }
}

export function mkdir(pth) {
  return GetFSO().CreateFolder(pth);
}

export function mkdirs(pth) {
  let dir = pth,
    dirs = [];
  while (dir) {
    if (isdir(dir)) break;
    dirs.push(dir);
    dir = dirname(dir);
  }
  let i = dirs.length;
  while (i--) mkdir(dirs[i]);
}

export function rmdir(pth) {
  return isdir(pth) && GetFSO().DeleteFolder(pth);
}

export function remove(pth) {
  return isfile(pth) && GetFSO().DeleteFile(pth);
}

export function copyfile(pth, dst, ow) {
  if (!isabs(dst)) dst = abspath(dirname(pth) + SEP + dst);
  if (!SEP_REGEXP_END.test(dst)) dst += SEP;
  if (!isdir(dst)) mkdirs(dst);
  GetFSO().CopyFile(pth, dst, ow || false);
}

export function copydirs(pth, dst, ow) {
  if (!isabs(dst)) dst = abspath(dirname(pth) + SEP + dst);
  if (!SEP_REGEXP_END.test(dst)) dst += SEP;
  if (!isdir(dst)) mkdirs(dst);
  GetFSO().CopyFolder(pth, dst, ow || false);
}

export let copytree = copydirs;

export function mvfile(pth, dst) {
  if (!isabs(dst)) dst = abspath(dirname(pth) + SEP + dst);
  if (!dst.endsWith(SEP)) dst += SEP;
  if (!isdir(dst)) mkdirs(dst);
  GetFSO().MoveFile(pth, dst);
}

export function mvdir(pth, dst) {
  if (!isabs(dst)) dst = abspath(dirname(pth) + SEP + dst);
  if (!dst.endsWith(SEP)) dst += SEP;
  if (!isdir(dst)) mkdirs(dst);
  GetFSO().MoveFolder(pth, dst);
}

export function repl(pth, dst) {
  if (!isabs(dst)) dst = abspath(dirname(pth) + SEP + dst);
  let dir = dirname(dst);
  let name = basename(dst);
  if (isfile(dst)) throw new Error(dst + ' is exists. repl faid.');
  if (!isdir(dir)) mkdirs(dir);
  else if (isdir(dst)) rmdir(dst);
  let f = FileStats(pth);
  if (f.name != name) f.name = name;
  if (f.dirname != dir) f.move(dir);
}

export function open(pth, flg) {
  if (flg === 'r') flg = 1;
  else if (flg === 'w') flg = 2;
  else if (flg === 'a') flg = 8;
  else flg = 1;
  return GetFSO().OpenTextFile(pth, flg, true);
}

export function eachLine(pth, cb) {
  let stm = open(pth);
  try {
    while (!stm.AtEndOfStream) {
      if (cb(stm.ReadLine()) === false) break;
    }
  } finally {
    stm.Close();
  }
}

export function readLines(pth) {
  let buf = [];
  eachLine(pth, function(line) {
    buf.push(line);
  });
  return buf;
}

export let readlines = readLines;

export function read(pth) {
  let stm = open(pth);
  try {
    return stm.ReadAll();
  } finally {
    stm.Close();
  }
}
