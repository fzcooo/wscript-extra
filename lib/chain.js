import * as _ from './tool';
import { scandir, walk, isabs, abspath } from './fso';
import {
  readFileSync,
  readdirSync,
  readLinesSync,
  outputFileSync,
  outputJsonSync,
  readJsonSync
} from './fs';
import { parse as csv_parse, stringify as csv_stringify } from './csv';
import { inspect } from './util';

const CHAIN_API = `
Collection
 each(forEach)
 map(select)
 reduce
 filter(where)
 toArray
 find
 findIndex
 groupBy
 countBy
 size(len)
Array
 uniqBy(distinctBy)
 uniq(distinct)
 chunk
 concat
 slice
 drop
 tail
 initial
 take
 contains(include,includes)
 first(head)
 last
 nth
 pullAll
 pull
 remove
 difference
 unzip
 zip
 flatten
Object
 keys
 values
 zipObject
 fromPairs
 object
 get
 set
 unset
 update
 pick
 extend(assignIn)
 defaults
 entries(toPairs)
Math
 sum
 average(avg)
String
 eachMatch
 findAll
`;

function chain_init(obj) {
  this._obj = obj;
}

export default function Chain(obj) {
  return new chain_init(obj);
}

const CHAIN_PROTO = (chain_init.prototype = Chain.prototype);

_.extend(Chain, _);

_.eachMatch(CHAIN_API, / +(\w+)(?:\((.+)\))?/g, (m0, name, alias) => {
  let fn = _[name];
  if (!fn) throw new Error(`${name} not exits in tool`);
  let wrapped = function() {
    this._obj = _.apply(fn, null, _.concat([this._obj], arguments));
    return this;
  };
  CHAIN_PROTO[name] = wrapped;
  if (alias) {
    alias.split(',').forEach(_name => {
      CHAIN_PROTO[_name] = wrapped;
    });
  }
});

_.extend(CHAIN_PROTO, {
  value: function() {
    return this._obj;
  },

  tap: function(fn) {
    fn(this._obj);
    return this;
  },

  thru: function(fn) {
    this._obj = fn(this._obj);
    return this;
  },

  log: function(msg) {
    msg ? console.log(msg, this._obj) : console.log(this._obj);
    return this;
  },

  toFile: function(pth, options) {
    let data = this._obj;
    if (_.isObject(data)) {
      data = inspect(data, options);
    }
    outputFileSync(pth, data, options);
    return this;
  },

  toJSON: function(pth, options) {
    outputJsonSync(pth, this._obj, options);
    return this;
  },

  toJson: function(pth, options) {
    return this.toJSON(pth, options);
  },

  toCSV: function(pth, options) {
    let data = csv_stringify(this._obj, options);
    outputFileSync(pth, data, options);
    return this;
  },

  toCsv: function(pth, options) {
    return this.toCSV(pth, options);
  }
});

Chain.range = function() {
  let data = _.apply(_.range, null, arguments);
  return Chain(data);
};

Chain.text = function(pth, encoding) {
  if (!isabs(pth)) pth = abspath(pth);
  let data = readFileSync(pth, encoding || 'UTF-8');
  return Chain(data);
};

Chain.lines = function(pth) {
  if (!isabs(pth)) pth = abspath(pth);
  let data = readLinesSync(pth);
  return Chain(data);
};

Chain.json = function(pth) {
  let data = readJsonSync(pth);
  return Chain(data);
};

Chain.csv = function(pth, encoding) {
  if (!isabs(pth)) pth = abspath(pth);
  let data = readFileSync(pth, encoding || 'UTF-8');
  return Chain(csv_parse(data));
};

Chain.readdir = function(pth) {
  if (!isabs(pth)) pth = abspath(pth);
  let data = readdirSync(pth);
  return Chain(data);
};

Chain.scandir = function(pth) {
  if (!isabs(pth)) pth = abspath(pth);
  let data = scandir(pth);
  return Chain(data);
};

Chain.walk = function(pth, select) {
  let data = [];
  if (!select) select = it => it.path;
  walk(pth, it => {
    data.push(select(it));
  });
  return Chain(data);
};

Chain.match = function(str, pattern) {
  let matches = [];
  _.eachMatch(str, pattern, () => {
    matches.push(arguments);
  });
  return Chain(matches);
};

Chain.api = CHAIN_API;
