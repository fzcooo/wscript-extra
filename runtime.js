import dayjs from 'dayjs';
import { isfile } from './lib/fso';
import transpile from './lib/transpile';
import * as tool from './lib/tool';
import * as Path from './lib/path';
import * as fs from './lib/fs';
import * as csv from './lib/csv';
import * as excel from './lib/excel';
import * as pprint from './lib/pprint';
// import * as util from './lib/util';
// import * as crypto from './lib/crypto';
// import * as child_process from './lib/child_process';
// import * as http from './lib/http';
// import * as ie from './lib/ie';
// import * as outlook from './lib/outlook';
// import * as accdb from './lib/accdb';
// import * as adodb from './lib/adodb';
// import * as csvdb from './lib/csvdb';
// import * as exceldb from './lib/exceldb';
// import * as oracledb from './lib/oracledb';
// import * as wmi from './lib/wmi';

const InternalModules = {
  dayjs: { default: dayjs },
  csv,
  excel,
  fs, 
  path: Path,
  tool,
  pprint,
  // util,
  // crypto,
  // child_process,
  // http,
  // ie,
  // outlook,
  // accdb,
  // adodb,
  // csvdb,
  // exceldb,
  // oracledb,
  // wmi,
};

window.require = function (name) {
  return InternalModules[name];
};

if (process.argv.length === 3) {
  let pth = process.argv[2];
  if (!Path.isAbsolute(pth)) {
    pth = Path.resolve(pth);
  }
  if (!Path.extname(pth)) {
    pth += '.js';
  }
  if (!isfile(pth)) {
    throw new Error("Cannot load file '" + pth + "'");
  }
  let src = fs.readFileSync(pth, 'UTF-8');

  Object.assign(this, {
    __filename: pth,
    __dirname: Path.dirname(pth),
    process,
    console,
    Buffer,
  });

  src = transpile(src);
  let script = document.createElement('script');
  script.text = src;
  document.head.appendChild(script);
}
