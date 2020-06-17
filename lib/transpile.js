import { default as jsTokens, matchToToken } from 'js-tokens';

class Scanner {
  constructor(src) {
    let match,
      token,
      tokens = [];
    for (;;) {
      match = jsTokens.exec(src);
      if (!match) break;
      token = matchToToken(match);
      tokens.push(token);
    }
    this.tokens = tokens;
    this.pos = -1;
    this.length = tokens.length;
    this.current = null;
  }

  next() {
    this.pos++;
    if (this.pos >= this.length) {
      return false;
    }
    this.current = this.tokens[this.pos];
    return this.current;
  }

  previous() {
    return this.tokens[this.pos - 1];
  }

  lookAhead(fn) {
    let i = this.pos;
    while (i++ < this.length) {
      if (fn(this.tokens[i]) === false) {
        break;
      }
    }
  }

  lookBehind(fn) {
    let i = this.pos;
    while (i--) {
      if (fn(this.tokens[i]) === false) {
        break;
      }
    }
  }

  list() {
    return this.tokens;
  }
}

const ESCAPSE_MAP = {
  "'": "'",
  '"': '"',
  '\r': 'r',
  '\n': 'n',
  '\t': 't',
  '\u2028': 'u2028',
  '\u2029': 'u2029',
};

const ESCAPSE_REG = /'|"|\r|\n|\t|\u2028|\u2029]/g;

function escapeChar(c) {
  return '\\' + ESCAPSE_MAP[c];
}

const SUB_REG = /\${((?:[^{}]|{[^}]*})+)}/g;
const SUB_SEP = '{TMP}';
const SUB_SEP_REG = /{TMP}/g;

function replTmpStr(scanner) {
  let token = scanner.current;
  let v = token.value;
  if (token.type != 'string' || v[0] != '`') return false;
  let raw_args = [null];
  v = v.slice(1, -1);
  v = v.replace(SUB_REG, (g0, g1) => {
    raw_args.push(g1);
    return SUB_SEP;
  });
  if (scanner.previous() == 'raw') {
    raw_args[0] = JSON.stringify({ raw: v.split(SUB_SEP) });
    token.value = '(' + raw_args.join() + ')';
  } else {
    v = v.replace(ESCAPSE_REG, escapeChar);
    raw_args[0] = "{raw: ['" + v.replace(SUB_SEP_REG, "','") + "']}";
    token.value = 'String.raw(' + raw_args.join() + ')';
  }
  return true;
}

function replArrow(scanner) {
  let token = scanner.current;
  if (token.type != 'punctuator' || token.value != '=>') return false;
  let depth = 0,
    hasBracket = false,
    hasThis = false;
  scanner.lookBehind((it) => {
    if (it.type === 'punctuator') {
      switch (it.value) {
        case ')':
          hasBracket = true;
          depth++;
          break;
        case '(':
          depth--;
          break;
        default:
          if (depth == 0) depth--;
          break;
      }
    } else if (it.type == 'name' && it.value == 'return') {
      depth--;
    }
    if (depth < 0) {
      if (hasBracket) {
        it.value += ' function';
        token.value = '';
      } else {
        it.value += ' function(';
        token.value = ')';
      }
      return false;
    }
  });

  scanner.lookAhead((it) => {
    if (it.type != 'whitespace') {
      hasBracket = it.value === '{';
      depth = 0;
      scanner.lookAhead((it) => {
        if (it.type == 'punctuator') {
          switch (it.value) {
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
              if (depth == 0) {
                depth--;
              }
              break;
          }
        } else if (it.type === 'whitespace') {
          if (depth == 0 && it.value.includes('\n')) {
            depth--;
          }
        } else if (it.type === 'name') {
          if (it.value === 'this') {
            hasThis = true;
          }
        }
        if (depth < 0) {
          if (hasBracket) {
            if (hasThis) {
              it.value = '.bind(this)' + it.value;
            }
          } else {
            token.value += '{return ';
            if (hasThis) {
              it.value = '}.bind(this)' + it.value;
            } else {
              it.value = '}' + it.value;
            }
          }
          return false;
        }
      });
      return false;
    }
  });
  return true;
}

function rmComment(scanner) {
  let token = scanner.current;
  if (token.type == 'comment') {
    token.value = '';
    return true;
  }
  return false;
}

function replImport(scanner) {
  let token = scanner.current,
    importMap = {},
    buf = [],
    inside,
    bAlias,
    type,
    value,
    name,
    moduleName,
    moduleAlias;
  if (token.type !== 'name' || token.value !== 'import') {
    return false;
  }
  scanner.lookAhead((it) => {
    type = it.type;
    value = it.value;
    it.value = '';
    if (type === 'name') {
      if (value === 'from') {
        return;
      } else if (value === 'as') {
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
    } else if (type === 'punctuator') {
      if (value === '*') {
        name = '*';
        importMap['*'] = 0;
      } else if (value === '{') {
        inside = true;
      } else if (value === '}') {
        inside = false;
      }
    } else if (type === 'string') {
      moduleName = value.slice(1, -1);
      return false;
    }
  });

  moduleAlias = moduleName.replace(/[\\/.-@]/g, '_');
  moduleAlias += Math.random().toString(16).slice(2);
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
  token.value = 'let ' + buf.join();
  return true;
}

export default function transpile(code) {
  let scanner = new Scanner(code);
  while (scanner.next()) {
    if (replTmpStr(scanner)) continue;
    if (replArrow(scanner)) continue;
    if (replImport(scanner)) continue;
    rmComment(scanner);
  }
  return scanner
    .list()
    .map((it) => it.value)
    .join('');
}
