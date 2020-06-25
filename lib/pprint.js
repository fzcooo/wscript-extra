import { typeOf, jsonStringEscape, defaults } from './tool';
import { stringify as printYaml } from 'json2yaml';

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

export { printYaml };

export default {
  printJson,
  printYaml
};
