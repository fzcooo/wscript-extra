import 'core-js/modules/es.object.assign';
import 'core-js/modules/es.object.entries';
import 'core-js/modules/es.object.get-own-property-descriptors';
import 'core-js/modules/es.object.is';
import 'core-js/modules/es.object.values';

import 'core-js/modules/es.array.copy-within';
import 'core-js/modules/es.array.fill';
import 'core-js/modules/es.array.find-index';
import 'core-js/modules/es.array.find';
import 'core-js/modules/es.array.flat-map';
import 'core-js/modules/es.array.flat';
import 'core-js/modules/es.array.from';
import 'core-js/modules/es.array.includes';
import 'core-js/modules/es.array.of';

import 'core-js/modules/es.function.name';

import 'core-js/modules/es.number.is-integer';
import 'core-js/modules/es.number.is-nan';
import 'core-js/modules/es.number.is-safe-integer';
import 'core-js/modules/es.number.parse-float';
import 'core-js/modules/es.number.parse-int';
import 'core-js/modules/es.number.to-precision';

import 'core-js/modules/es.regexp.flags';

import 'core-js/modules/es.string.code-point-at';
import 'core-js/modules/es.string.includes';
import 'core-js/modules/es.string.pad-start';
import 'core-js/modules/es.string.pad-end';
import 'core-js/modules/es.string.raw';
import 'core-js/modules/es.string.repeat';
import 'core-js/modules/es.string.starts-with';
import 'core-js/modules/es.string.ends-with';
import 'core-js/modules/es.string.trim-start';
import 'core-js/modules/es.string.trim-end';

import 'core-js/modules/es.promise';
import 'core-js/modules/es.promise.finally';

import 'core-js/es/reflect';

import './timers';
import './enumerator';

import { isdir } from './fso';
import { outputFileSync, mkdirsSync } from './fs';
import { basename, join } from './path';

this.__filename = WScript.ScriptFullName;
this.__dirname = __filename.match(/(.*)[\\/]/)[1];

function defineGetter(target, funcDict) {
  let props = {};
  for (let key in funcDict) {
    if (!target[key]) {
      props[key] = {
        get: funcDict[key],
      };
    }
  }
  Object.defineProperties(target, props);
}

let _vbs, _shell, _fso, _shell_app;

defineGetter(this, {
  global: () => window,
  __VBS() {
    if (!_vbs) {
      _vbs = new ActiveXObject('ScriptControl');
      _vbs.Language = 'VBScript';
    }
    return _vbs;
  },
  __WShell() {
    return _shell || (_shell = new ActiveXObject('WScript.Shell'));
  },
  __FSO() {
    return _fso || (_fso = new ActiveXObject('Scripting.FileSystemObject'));
  },
  __ShellApp() {
    return _shell_app || (_shell_app = new ActiveXObject('Shell.Application'));
  },
});

window.addEventListener('error', () => {
  let scripts = document.scripts;
  let i = -1,
    len = scripts.length;
  let name = basename(__filename).replace(/\.[^.]+$/, '');
  let file, folder;
  folder = join(__dirname, name + '_src');
  if (!isdir(folder)) mkdirsSync(folder);
  WScript.Echo('');
  while (++i < len) {
    file = join(folder, i + '.js');
    outputFileSync(file, scripts[i].text);
    WScript.Echo(`source ${i}: ${file}`);
  }
});
