import './process';
import './buffer';
import './console';
import {
  includes,
  find,
  findIndex,
  fill,
  assign,
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
    return apply(assign, null, arguments);
  };
}

if (!Object.values) {
  Object.values = values;
}

function defineMethods(target, funcDict) {
  let props = {};
  for (let key in funcDict) {
    if (!target[key]) {
      props[key] = {
        enumerable: false,
        value: funcDict[key]
      };
    }
  }
  Object.defineProperties(target, props);
}

defineMethods(Array.prototype, {
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

defineMethods(String.prototype, {
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
this.__dirname = __filename.match(/(.*)[\\/]/)[1];

function defineGetter(target, funcDict) {
  let props = {};
  for (let key in funcDict) {
    if (!target[key]) {
      props[key] = {
        get: funcDict[key]
      };
    }
  }
  Object.defineProperties(target, props);
}

let _vbs, _shell, _fso, _shell_app;

defineGetter(this, {
  __VBS: function() {
    if (!_vbs) {
      _vbs = new ActiveXObject('ScriptControl');
      _vbs.Language = 'VBScript';
    }
    return _vbs;
  },
  __WShell: function() {
    return _shell || (_shell = new ActiveXObject('WScript.Shell'));
  },
  __FSO: function() {
    return _fso || (_fso = new ActiveXObject('Scripting.FileSystemObject'));
  },
  __ShellApp: function() {
    return _shell_app || (_shell_app = new ActiveXObject('Shell.Application'));
  }
});

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
