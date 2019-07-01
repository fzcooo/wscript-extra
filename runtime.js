import * as tool from './lib/tool';
import * as util from './lib/util';
import * as Path from './lib/path';
import * as fs from './lib/fs';
import * as child_process from './lib/child_process';
import * as querystring from './lib/querystring';
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
import * as chain from './lib/chain';
import * as dayjs from './lib/dayjs';
import { isfile } from './lib/fso';
import { transform } from './lib/transpile';

const InternalModules = {
  accdb: accdb,
  adodb: adodb,
  child_process: child_process,
  crypto: crypto,
  csv: csv,
  csvdb: csvdb,
  dayjs: dayjs,
  excel: excel,
  exceldb: exceldb,
  fs: fs,
  http: http,
  ie: ie,
  oracledb: oracledb,
  outlook: outlook,
  path: Path,
  querystring: querystring,
  tool: tool,
  chain: chain,
  util: util,
  wmi: wmi
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
  this.__filename = pth;
  this.__dirname = Path.dirname(pth);
  src = transform(src);
  let script = document.createElement('script');
  script.text = src;
  document.head.appendChild(script);
}
