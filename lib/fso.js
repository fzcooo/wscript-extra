const ROOT_REGEXP = /^([A-z]:|)[/\\]/;
const SEP_REGEXP = /[/\\]+/;
const SEP_REGEXP_END = /[/\\]$/;
const LNK_REGEXP = /(\.lnk|\.url)$/;

// StreamTypeEnum
export const adTypeBinary = 1;
export const adTypeText = 2;
// ConnectModeEnum
export const adModeUnknown = 0;
export const adModeRead = 1;
export const adModeWrite = 2;
export const adModeReadWrite = 3;
export const adModeShareDenyRead = 4;
export const adModeShareDenyWrite = 8;
export const adModeShareExclusive = 12;
export const adModeShareDenyNone = 16;
// StreamReadEnum
export const adReadAll = -1;
export const adReadLine = -2;
// StreamWriteEnum
export const adWriteChar = 0;
export const adWriteLine = 1;
// SaveOptionsEnum
export const adSaveCreateNotExist = 1;
export const adSaveCreateOverWrite = 2;
// LineSeparatorsEnum
export const adCRLF = -1;
export const adLF = 10;
export const adCR = 13;
// OpenTextFileIomode
export const ForReading = 1;
export const ForWriting = 2;
export const ForAppending = 8;
// FileAttributes
export const Normal = 0;
export const ReadOnly = 1;
export const Hidden = 2;
export const System = 4;
export const Volume = 8;
export const Directory = 16;
export const Archive = 32;
export const Alias = 64;
export const Compressed = 128;

export const SEP = '\\';
export const sep = SEP;

export function isabs(pth) {
  return pth && ROOT_REGEXP.test(pth);
}

export let isAbsolute = isabs;

export function dirname(pth) {
  return __FSO.GetParentFolderName(pth);
}

export function basename(pth, ext) {
  return ext ? __FSO.GetBaseName(pth) : __FSO.GetFileName(pth);
}

export function extname(pth) {
  return __FSO.GetExtensionName(pth);
}

export function abspath(pth) {
  if (!isabs(pth)) pth = __dirname + SEP + pth;
  return __FSO.GetAbsolutePathName(pth);
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

export function join(...args) {
  let p,
    len = args.length,
    parts = [];
  for (let i = 0; i < len; i++) {
    p = args[i];
    if (typeof p === 'string') parts.push(p);
  }
  return normpath(parts.join(SEP));
}

export function resolve(...args) {
  let p,
    len = args.length,
    parts = [];
  for (let i = 0; i < len; i++) {
    p = args[i];
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
  return __FSO.FileExists(pth);
}

export let isFile = isfile;

export function isdir(pth) {
  return __FSO.FolderExists(pth);
}

export function exists(pth) {
  return isfile(pth) || isdir(pth);
}

export function isShortcut(pth) {
  return isfile(pth) && LNK_REGEXP.test(pth);
}

export function createShortcut(pth, options) {
  let shortcut = __WShell.CreateShortcut(pth);
  if (options.target) shortcut.TargetPath = options.target;
  if (options.runStyle) shortcut.WindowStyle = options.runStyle; //NORMAL(1),MAX(3),MIN(7)
  if (options.desc) shortcut.Description = options.desc;
  shortcut.Save();
}

export function getShortcutTarget(pth) {
  let shortcut = __WShell.CreateShortcut(pth);
  return shortcut.TargetPath;
}

export function getcwd() {
  return __dirname;
}

export let cwd = getcwd;

export class File {
  constructor(pth) {
    let f;
    if (typeof pth == 'object') {
      f = pth;
    } else if (typeof pth == 'string') {
      if (!isabs(pth)) pth = abspath(pth);
      if (isfile(pth)) {
        f = __FSO.GetFile(pth);
      } else if (isdir(pth)) {
        f = __FSO.GetFolder(pth);
      }
    }
    if (!f) throw new Error(`ENOENT, no such file or directory (${pth})`);
    this._file = f;
  }

  isfile() {
    return !(this._file.Attributes & Directory);
  }
  isFile() {
    return !(this._file.Attributes & Directory);
  }
  isdir() {
    return !!(this._file.Attributes & Directory);
  }
  isDirectory() {
    return !!(this._file.Attributes & Directory);
  }
  isShortcut() {
    return this.isFile() && LNK_REGEXP.test(this.path);
  }
  createShortcut(pth, options) {
    options.target = this.path;
    createShortcut(pth, options);
  }
  copy(dst, ow) {
    if (!isabs(dst)) dst = abspath(dst);
    if (!SEP_REGEXP_END.test(dst)) dst += SEP;
    if (!isdir(dst)) mkdirs(dst);
    return this._file.Copy(dst, ow == null ? true : !!ow);
  }
  delete(force) {
    return this._file.Delete(!!force);
  }
  move(dst) {
    if (!isabs(dst)) dst = abspath(dst);
    if (!SEP_REGEXP_END.test(dst)) dst += SEP;
    if (!isdir(dst)) mkdirs(dst);
    return this._file.Move(dst);
  }
  getChildren() {
    let self = this.isShortcut() ? getStats(this.target) : this;
    if (self.isFile()) return null;
    let _enum = new Enumerator(self._file.Files);
    let rst = [];
    for (; !_enum.atEnd(); _enum.moveNext()) {
      rst.push(getStats(_enum.item()));
    }
    _enum = new Enumerator(self._file.SubFolders);
    for (; !_enum.atEnd(); _enum.moveNext()) {
      rst.push(getStats(_enum.item()));
    }
    return rst;
  }
  get name() {
    return this._file.Name;
  }
  set name(v) {
    this._file.Name = v;
  }
  get path() {
    return this._file.Path;
  }
  get dirname() {
    return this._file.ParentFolder.Path;
  }
  get size() {
    return this._file.Size;
  }
  get type() {
    return this._file.Type;
  }
  get target() {
    return this.isShortcut() ? getShortcutTarget(this.path) : null;
  }
  get atime() {
    return new Date(this._file.DateLastAccessed);
  }
  get mtime() {
    return new Date(this._file.DateLastModified);
  }
  get ctime() {
    return new Date(this._file.DateCreated);
  }
  get atimeMs() {
    return this.atime.getTime();
  }
  get mtimeMs() {
    return this.mtime.getTime();
  }
  get ctimeMs() {
    return this.ctime.getTime();
  }
  get readonly() {
    return !!(this._file.Attributes & ReadOnly);
  }
  get hidden() {
    return !!(this._file.Attributes & Hidden);
  }
  get system() {
    return !!(this._file.Attributes & System);
  }
}

export function getStats(pth) {
  return new File(pth);
}

export function scandir(pth) {
  return getStats(pth).getChildren();
}

export function walk(pth, fn) {
  if (!isdir(pth)) return;
  let dir,
    items,
    item,
    i,
    len,
    buf = [getStats(pth)];
  while (buf.length > 0) {
    dir = buf.shift();
    items = dir.getChildren();
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
  return __FSO.CreateFolder(pth);
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
  return isdir(pth) && __FSO.DeleteFolder(pth);
}

export function remove(pth) {
  return isfile(pth) && __FSO.DeleteFile(pth);
}

export function copyfile(pth, dst, ow) {
  if (!isabs(dst)) dst = abspath(dirname(pth) + SEP + dst);
  if (!SEP_REGEXP_END.test(dst)) dst += SEP;
  if (!isdir(dst)) mkdirs(dst);
  __FSO.CopyFile(pth, dst, ow || false);
}

export function copydirs(pth, dst, ow) {
  if (!isabs(dst)) dst = abspath(dirname(pth) + SEP + dst);
  if (!SEP_REGEXP_END.test(dst)) dst += SEP;
  if (!isdir(dst)) mkdirs(dst);
  __FSO.CopyFolder(pth, dst, ow || false);
}

export let copytree = copydirs;

export function mvfile(pth, dst) {
  if (!isabs(dst)) dst = abspath(dirname(pth) + SEP + dst);
  if (!dst.endsWith(SEP)) dst += SEP;
  if (!isdir(dst)) mkdirs(dst);
  __FSO.MoveFile(pth, dst);
}

export function mvdir(pth, dst) {
  if (!isabs(dst)) dst = abspath(dirname(pth) + SEP + dst);
  if (!dst.endsWith(SEP)) dst += SEP;
  if (!isdir(dst)) mkdirs(dst);
  __FSO.MoveFolder(pth, dst);
}

export function repl(pth, dst) {
  if (!isabs(dst)) dst = abspath(dirname(pth) + SEP + dst);
  let dir = dirname(dst);
  let name = basename(dst);
  if (isfile(dst)) throw new Error(dst + ' is exists. repl faid.');
  if (!isdir(dir)) mkdirs(dir);
  else if (isdir(dst)) rmdir(dst);
  let f = getStats(pth);
  if (f.name != name) f.name = name;
  if (f.dirname != dir) f.move(dir);
}
