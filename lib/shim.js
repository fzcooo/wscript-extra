import './process';
import './buffer';
import './console';
import {
  includes,
  find,
  findIndex,
  fill,
  assignIn,
  apply,
  values,
  repeat,
  startsWith,
  endsWith,
  padStart,
  padEnd
} from './tool';
import { isdir } from './fso';
import { outputFileSync, mkdirsSync } from './fs';
import { basename, join } from './path';

if (!Object.assign) {
  Object.assign = function() {
    return apply(assignIn, null, arguments);
  };
}

if (!Object.values) {
  Object.values = values;
}

function defineProps(obj, props) {
  let _props = {},
    isEmpty = true;
  for (let key in props) {
    if (!obj[key]) {
      _props[key] = {
        enumerable: false,
        value: props[key]
      };
      isEmpty = false;
    }
  }
  if (!isEmpty) Object.defineProperties(obj, _props);
}

defineProps(Array.prototype, {
  includes: function(val, start) {
    return includes(this, val, start);
  },
  find: function(fn, _this) {
    return find(this, fn, _this)[0];
  },
  findIndex: function(fn, _this) {
    return findIndex(this, fn, _this)[1];
  },
  fill: function(val, start, end) {
    return fill(this, val, start, end);
  }
});

defineProps(String.prototype, {
  repeat: function(n) {
    return repeat(this, n);
  },
  startsWith: function(target, pos) {
    return startsWith(this, target, pos);
  },
  endsWith: function(target, this_len) {
    return endsWith(this, target, this_len);
  },
  includes: function(target, pos) {
    return includes(this, target, pos);
  },
  padStart: function(len, chrs) {
    return padStart(this, len, chrs);
  },
  padEnd: function(len, chrs) {
    return padEnd(this, len, chrs);
  }
});

if (!String.raw) {
  String.raw = function(callSite) {
    let i = 0,
      buf = [],
      strs = callSite.raw,
      len = strs.length,
      argsCnt = arguments.length;
    while (i < len) {
      buf.push(strs[i++]);
      if (i < argsCnt && i < len) {
        buf.push(arguments[i]);
      }
    }
    return buf.join('');
  };
}

this.__filename = WScript.ScriptFullName;
this.__dirname = __filename.slice(0, __filename.lastIndexOf('\\'));

let _vbs, _shell, _fso, _shell_app;

this.GetVBScript = function() {
  if (!_vbs) {
    _vbs = new ActiveXObject('ScriptControl');
    _vbs.Language = 'VBScript';
  }
  return _vbs;
};

this.GetShell = function() {
  return _shell || (_shell = new ActiveXObject('WScript.Shell'));
};

this.GetFSO = function() {
  return _fso || (_fso = new ActiveXObject('Scripting.FileSystemObject'));
};

this.GetShellApp = function() {
  return _shell_app || (_shell_app = new ActiveXObject('Shell.Application'));
};

window.addEventListener('error', function() {
  let scripts = document.scripts;
  let i = -1,
    len = scripts.length;
  let name = basename(__filename).replace(/\.[^.]+$/, '');
  let file, folder;
  folder = join(__dirname, name + '_src');
  if (!isdir(folder)) mkdirsSync(folder);
  console.log('');
  while (++i < len) {
    file = join(folder, i + '.js');
    outputFileSync(file, scripts[i].text);
    console.log('source %d: %s', i, file);
  }
});
