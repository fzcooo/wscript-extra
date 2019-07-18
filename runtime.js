import { isfile } from './lib/fso';
import transpile from './lib/transpile';
import * as tool from './lib/tool';
import * as util from './lib/util';
import * as Path from './lib/path';
import * as fs from './lib/fs';
import * as child_process from './lib/child_process';
import qs from 'qs';
import * as http from './lib/http';
import * as crypto from './lib/crypto';
import * as csv from './lib/csv';
import * as excel from './lib/excel';
import * as ie from './lib/ie';
import * as outlook from './lib/outlook';
import * as accdb from './lib/accdb';
import * as adodb from './lib/adodb';
import * as csvdb from './lib/csvdb';
import * as exceldb from './lib/exceldb';
import * as oracledb from './lib/oracledb';
import * as wmi from './lib/wmi';
import dayjs from 'dayjs';
import * as pipe from './lib/pipe';

const InternalModules = {
  accdb,
  adodb,
  child_process,
  crypto,
  csv,
  csvdb,
  dayjs: { default: dayjs },
  excel,
  exceldb,
  fs,
  http,
  ie,
  oracledb,
  outlook,
  path: Path,
  qs: { default: qs },
  tool,
  util,
  wmi,
  pipe
};

window.require = function(name) {
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
    Buffer,
    console
  });

  src = transpile(src);
  let script = document.createElement('script');
  script.text = src;
  document.head.appendChild(script);
}
