import { join, resolve, basename } from 'path';
import { existsSync, readFileSync } from 'fs';

const JS_TOKENS = /((['"])(?:(?!\2|\\).|\\(?:\r\n|[\s\S]))*(\2)?|`(?:[^`\\$]|\\[\s\S]|\$(?!\{)|\$\{(?:[^{}]|\{[^}]*\}?)*\}?)*(`)?)|(\/\/.*)|(\/\*(?:[^*]|\*(?!\/))*(\*\/)?)|(\/(?!\*)(?:\[(?:(?![\]\\]).|\\.)*\]|(?![/\]\\]).|\\.)+\/(?:(?!\s*(?:\b|[\u0080-\uFFFF$\\'"~({]|[+\-!](?!=)|\.?\d))|[gmiyus]{1,6}\b(?![\u0080-\uFFFF$\\]|\s*(?:[+\-*%&|^<>!=?({]|\/(?![/*])))))|(0[xX][\da-fA-F]+|0[oO][0-7]+|0[bB][01]+|(?:\d*\.\d+|\d+\.?)(?:[eE][+-]?\d+)?)|((?!\d)(?:(?!\s)[$\w\u0080-\uFFFF]|\\u[\da-fA-F]{4}|\\u\{[\da-fA-F]+\})+)|(--|\+\+|&&|\|\||=>|\.{3}|(?:[+\-/%&|^]|\*{1,2}|<{1,2}|>{1,3}|!=?|={1,2})=?|[?~.,:;[\](){}])|(\s+)|(^$|[\s\S])/g;

function matchToToken(match) {
  var token = { type: 'invalid', value: match[0], closed: undefined };
  if (match[1])
    (token.type = 'string'), (token.closed = !!(match[3] || match[4]));
  else if (match[5]) token.type = 'comment';
  else if (match[6]) (token.type = 'comment'), (token.closed = !!match[7]);
  else if (match[8]) token.type = 'regex';
  else if (match[9]) token.type = 'number';
  else if (match[10]) token.type = 'name';
  else if (match[11]) token.type = 'punctuator';
  else if (match[12]) token.type = 'whitespace';
  return token;
}

function getTokens(src) {
  let tokens = [],
    match,
    token;
  for (;;) {
    match = JS_TOKENS.exec(src);
    if (!match) break;
    token = matchToToken(match);
    tokens.push(token);
  }
  return tokens;
}

const ESCAPSE_MAP = {
  "'": "'",
  '"': '"',
  '\r': 'r',
  '\n': 'n',
  '\t': 't',
  '\u2028': 'u2028',
  '\u2029': 'u2029'
};

const ESCAPSE_REG = /'|"|\r|\n|\t|\u2028|\u2029]/g;

function escapeChar(c) {
  return '\\' + ESCAPSE_MAP[c];
}

const SUB_REG = /\$\{((?:[^{}]|\{[^}]*\}?)*)\}?/g;
const SUB_SEP = '$TMP$';
const SUB_SEP_REG = /\$TMP\$/g;

function replTmpStr(token, tokens, index) {
  let str = token.value;
  if (token.type != 'string' || str[0] != '`') return false;
  let raw_args = [null];
  str = str.slice(1, str.length - 1);
  str = str.replace(SUB_REG, function(g0, g1) {
    raw_args.push(g1);
    return SUB_SEP;
  });
  let strRaw = index > 2 && tokens[index - 1].value;
  if (strRaw == 'raw') {
    raw_args[0] = JSON.stringify({ raw: str.split(SUB_SEP) });
    token.value = '(' + raw_args.join() + ')';
  } else {
    str = str.replace(ESCAPSE_REG, escapeChar);
    raw_args[0] = "{raw: ['" + str.replace(SUB_SEP_REG, "','") + "']}";
    token.value = 'String.raw(' + raw_args.join() + ')';
  }
  return true;
}

function replArrow(token, tokens, index) {
  if (token.type != 'punctuator' || token.value != '=>') return false;
  let i = index,
    len = tokens.length,
    depth = 0,
    hasBracket = false,
    hasThis = false,
    tokenIt;
  while (--i) {
    tokenIt = tokens[i];
    if (tokenIt.type == 'punctuator') {
      switch (tokenIt.value) {
        case ')':
          hasBracket = true;
          depth++;
          break;
        case '(':
          depth--;
          break;
        default:
          if (depth == 0) depth--;
      }
    } else if (tokenIt.type == 'name' && tokenIt.value == 'return') {
      depth--;
    }
    if (depth < 0) {
      if (hasBracket) {
        tokenIt.value += ' function';
        token.value = '';
      } else {
        tokenIt.value += ' function(';
        token.value = ')';
      }
      break;
    }
  }
  i = index;
  while (++i < len) {
    tokenIt = tokens[i];
    if (tokenIt.type != 'whitespace') break;
  }
  hasBracket = false;
  if (tokenIt.value == '{') hasBracket = true;
  i--;
  depth = 0;
  while (++i < len) {
    tokenIt = tokens[i];
    if (tokenIt.type == 'punctuator') {
      switch (tokenIt.value) {
        case '{':
        case '(':
        case '[':
          depth++;
          break;
        case '}':
        case ')':
        case ']':
          depth--;
          break;
        case ',':
        case ';':
          if (depth == 0) depth--;
          break;
      }
    } else if (tokenIt.type == 'whitespace') {
      if (depth == 0 && tokenIt.value.includes('\r\n')) {
        depth--;
      }
    } else if (tokenIt.type == 'name') {
      if (tokenIt.value == 'this') hasThis = true;
    }
    if (depth < 0) {
      if (hasBracket) {
        if (hasThis) tokenIt.value = '.bind(this)' + tokenIt.value;
      } else {
        token.value += '{return ';
        if (hasThis) tokenIt.value = '}.bind(this)' + tokenIt.value;
        else tokenIt.value = '}' + tokenIt.value;
      }
      break;
    }
  }
  return true;
}

function replVar(token) {
  if (
    token.type == 'name' &&
    (token.value == 'let' || token.value == 'const')
  ) {
    token.value = 'var';
    return true;
  }
  return false;
}

function rmComment(token) {
  if (token.type == 'comment') {
    token.value = '';
    return true;
  }
  return false;
}

export default function() {
  const libDir = join(__dirname, 'lib');
  let entry = null;

  return {
    name: 'transpile',

    resolveId: function(importee, importer) {
      if (importer == null) {
        entry = resolve(importee);
      } else if (!importee.match(/[\\/]/)) {
        let pth = join(libDir, importee);
        if (!pth.endsWith('.js')) {
          let file = pth + '.js';
          if (existsSync(file)) return file;
          file = join(pth, 'index.js');
          if (existsSync(file)) return file;
          file = join(pth, importee + '.js');
          if (existsSync(file)) return file;
        }
      }
      return null;
    },

    transform: function(code, id) {
      let tokens = getTokens(code),
        token,
        source;
      for (let i = 0, len = tokens.length; i < len; i++) {
        token = tokens[i];
        if (replTmpStr(token, tokens, i)) continue;
        if (replVar(token)) continue;
        if (replArrow(token, tokens, i)) continue;
        rmComment(token);
      }
      source = tokens.map(it => it.value).join('');
      if (entry === id) {
        source = "import 'shim';\r\n" + source;
      }
      return {
        code: source,
        map: { mapping: '' }
      };
    },

    generateBundle: function(outputOptions, bundle, isWrite) {
      if (!isWrite) return;
      let name = basename(outputOptions.file);
      let source = Buffer.from(bundle[name].code).toString('base64');
      let src_tmp = readFileSync(resolve('./temp.js'), 'utf-8');
      bundle[name].code = src_tmp.replace('{{source}}', source);
    }
  };
}

// eslint-disable-next-line no-unused-vars
function compress(src) {
  let WORD_REG = /\w{3,}/g;
  let mc,
    key,
    cache = new Map();
  for (;;) {
    mc = WORD_REG.exec(src);
    if (!mc) break;
    key = mc[0];
    if (cache.has(key)) {
      cache.set(key, cache.get(key) + 1);
    } else {
      cache.set(key, 1);
    }
  }

  let arr = [],
    len;
  for (let [word, count] of cache) {
    if (count > 1) {
      len = word.length * count;
      if (len > 20) {
        arr.push({ word, len });
      }
    }
  }

  arr.sort((a, b) => b.len - a.len);

  let _src = src;

  arr
    .map((it, i) => ((it.code = i + 256), it))
    .forEach(it => {
      _src = _src.replace(RegExp(it.word, 'g'), String.fromCharCode(it.code));
    });

  return {
    source: _src,
    keywords: arr.map(it => it.word)
  };
}

function replImport(token, tokens, index) {
  let importMap = {},
    buf = [],
    inside,
    bAlias,
    type,
    value,
    i,
    len,
    tokenIt,
    name,
    moduleName,
    moduleAlias;
  if (token.type != 'name' || token.value != 'import') return false;
  token.value = '';
  i = index;
  len = tokens.length;
  tokenIt = token;
  while (++i < len) {
    tokenIt.value = '';
    tokenIt = tokens[i];
    type = tokenIt.type;
    value = tokenIt.value;
    if (type == 'name') {
      if (value == 'from') {
        continue;
      } else if (value == 'as') {
        bAlias = true;
      } else {
        if (bAlias) {
          importMap[name] = value;
          bAlias = false;
        } else {
          name = value;
          if (inside) {
            importMap[name] = name;
          } else {
            importMap['default'] = name;
          }
        }
      }
    } else if (type == 'punctuator') {
      if (value == '*') {
        name = '*';
        importMap['*'] = 0;
      } else if (value == '{') {
        inside = true;
      } else if (value == '}') {
        inside = false;
      }
    } else if (type == 'string') {
      moduleName = value.slice(1, value.length - 1);
      break;
    }
  }

  moduleAlias = moduleName.replace(/[\\/.-@]/g, '_');
  moduleAlias +=
    '_' +
    Math.random()
      .toString(16)
      .slice(2);
  buf.push(moduleAlias + "=require('" + moduleName + "')");
  if (importMap['*']) {
    buf.push(importMap['*'] + '=' + moduleAlias);
    delete importMap['*'];
  }
  if (importMap['default']) {
    buf.push(importMap['default'] + '=' + moduleAlias + "['default']");
    delete importMap['default'];
  }
  for (name in importMap) {
    buf.push(importMap[name] + '=' + moduleAlias + '.' + name);
  }
  tokenIt.value = 'let ' + buf.join();
  return true;
}

export function transform(code) {
  let tokens = getTokens(code),
    token,
    source;
  for (let i = 0, len = tokens.length; i < len; i++) {
    token = tokens[i];
    if (replTmpStr(token, tokens, i)) continue;
    if (replArrow(token, tokens, i)) continue;
    if (replImport(token, tokens, i)) continue;
    rmComment(token);
  }
  source = tokens.map(it => it.value).join('');

  return source;
}
