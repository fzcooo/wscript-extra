import { default as jsTokens, matchToToken } from 'js-tokens';

function getTokens(src) {
  let tokens = [],
    match,
    token;
  for (;;) {
    match = jsTokens.exec(src);
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
  str = str.replace(SUB_REG, (g0, g1) => {
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

function rmComment(token) {
  if (token.type == 'comment') {
    token.value = '';
    return true;
  }
  return false;
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

export default function transpile(code) {
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
