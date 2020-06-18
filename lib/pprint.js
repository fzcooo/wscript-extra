import { typeOf, jsonStringEscape, defaults } from './tool';

function getKeys(input, showHidden = false) {
  return showHidden ? Object.getOwnPropertyNames(input) : Object.keys(input);
}

class Json {
  static renderSimpleData(input) {
    switch (typeOf(input)) {
      case 'string':
        return "'" + jsonStringEscape(input) + "'";
      case 'number':
      case 'boolean':
      case 'regexp':
      case 'buffer':
      case 'undefined':
      case 'null':
        return input + '';
      case 'date':
        return input.toJSON();
      case 'function': {
        let name = input.name;
        return name ? '[Function: ' + name + ']' : '[Function]';
      }
      case 'error':
        return '[' + input + ']';
      default:
        return false;
    }
  }

  static renderToString(input, options, depth = 0) {
    let output = Json.renderSimpleData(input);
    if (typeof output === 'string') return output;

    if (depth > options.depth) {
      return Object.prototype.toString.call(input);
    }

    if (options.seen.includes(input)) {
      return '[Circular]';
    }

    let type = typeOf(input);
    output = Json.renderToArray(input, type, options, depth);

    let braces;
    let len = output.length;
    let count = 0;
    let i = -1;
    let breakLine = false;
    let indentation = ' '.repeat((depth + 1) * options.defaultIndent);

    if (type === 'array') braces = ['[', ']'];
    else if (type == 'map') braces = ['Map {', '}'];
    else if (type == 'set') braces = ['Set {', '}'];
    else if (type == 'arguments') braces = ['[Arguments] {', '}'];
    else braces = ['{', '}'];

    if (len === 0) return braces[0] + braces[1];

    while (++i < len) {
      count += output[i].length + 2;
      if (count > options.breakLength) {
        breakLine = true;
        break;
      }
    }

    let leftBrace = braces[0] + ' ';
    let rightBrace = ' ' + braces[1];
    let sep = breakLine ? ',\r\n' + indentation : ', ';

    if (breakLine) {
      if (leftBrace.length < options.defaultIndent) {
        leftBrace += ' '.repeat(options.defaultIndent - leftBrace.length);
      } else if (leftBrace.length > options.defaultIndent) {
        leftBrace += '\r\n' + indentation;
      }
    }

    return leftBrace + output.join(sep) + rightBrace;
  }

  static renderToArray(data, type, options, depth = 0) {
    let outputArr = [];
    let i = 0,
      len;
    options.seen.push(data);
    if (type === 'array') {
      len = data.length;
      for (; i < len; i++) {
        if (i >= options.maxArrayLength) {
          outputArr.push(
            '... ' + (len - options.maxArrayLength) + ' more items'
          );
          break;
        }
        outputArr.push(Json.renderToString(data[i], options, depth + 1));
      }
    } else if (type === 'map') {
      data.forEach((val, key) => {
        outputArr.push(
          key + ' => ' + Json.renderToString(val, options, depth + 1)
        );
      });
    } else if (type === 'set') {
      data.forEach((val) => {
        outputArr.push(Json.renderToString(val, options, depth + 1));
      });
    } else {
      getKeys(data, options.showHidden).forEach((key) => {
        outputArr.push(
          key + ': ' + Json.renderToString(data[key], options, depth + 1)
        );
      });
    }

    options.seen.pop();
    return outputArr;
  }

  static render(input, options = {}) {
    defaults(options, {
      seen: [],
      showHidden: false,
      depth: 2,
      customInspect: false,
      maxArrayLength: 100,
      breakLength: 60,
      defaultIndent: 2,
    });
    return Json.renderToString(input, options, 0);
  }
}

export let printJson = Json.render;

function getMaxIndexLength(input, showHidden = false) {
  return getKeys(input, showHidden).reduce(
    (maxLen, key) => Math.max(maxLen, key.length),
    0
  );
}

class Yaml {
  static renderSimpleData(input) {
    switch (typeOf(input)) {
      case 'string':
        if (input.indexOf('\n') === -1) return input;
        else return false;
      case 'number':
      case 'boolean':
      case 'regexp':
      case 'buffer':
      case 'undefined':
      case 'null':
        return input + '';
      case 'date':
        return input.toJSON();
      case 'function': {
        let name = input.name;
        return name ? '[Function: ' + name + ']' : '[Function]';
      }
      case 'error':
        return '[' + input + ']';
      default:
        return false;
    }
  }

  static renderToArray(data, options, indent = 0, depth = 0) {
    let output = Yaml.renderSimpleData(data);
    let indentation = ' '.repeat(indent);

    if (typeof output === 'string') return [indentation + output];
    if (typeof data === 'string') {
      return [
        indentation + '"""',
        ...data.split(/\r?\n/).map((it) => indentation + it),
        indentation + '"""',
      ];
    }

    if (depth > options.depth) {
      return [indentation + Object.prototype.toString.call(data)];
    }

    let outputArr = [];
    options.seen.push(data);
    if (Array.isArray(data)) {
      if (data.length === 0) {
        return [indentation + options.emptyArrayMsg];
      }

      data.forEach((el) => {
        let line = indentation + '- ';
        let val = Yaml.renderSimpleData(el);

        if (typeof val === 'string') {
          outputArr.push(line + val);
        } else {
          outputArr.push(line);
          outputArr.push(
            ...Yaml.renderToArray(
              el,
              options,
              indent + options.defaultIndent,
              depth + 1
            )
          );
        }
      });
    } else {
      let maxIndexLen = getMaxIndexLength(data);

      getKeys(data, options.showHidden).forEach((key) => {
        let val = Yaml.renderSimpleData(data[key]);
        let spacePadding = ' '.repeat(maxIndexLen - key.length);
        if (typeof val === 'string') {
          if (val === '') {
            outputArr.push(indentation + key + ': ');
          } else {
            outputArr.push(indentation + key + ': ' + spacePadding + val);
          }
        } else if (options.seen.includes(data[key])) {
          outputArr.push(
            indentation + key + ': ' + spacePadding + '[Circular]'
          );
        } else {
          outputArr.push(key);
          outputArr.push(
            ...Yaml.renderToArray(
              data[key],
              options,
              indent + options.defaultIndent,
              depth + 1
            )
          );
        }
      });
    }

    options.seen.pop();
    return outputArr;
  }

  static render(data, options = {}) {
    defaults(options, {
      seen: [],
      emptyArrayMsg: '(empty array)',
      defaultIndent: 2,
      depth: 2,
      showHidden: false,
    });
    return Yaml.renderToArray(data, options).join('\r\n');
  }
}

export let printYaml = Yaml.render;
