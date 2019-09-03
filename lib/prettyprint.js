import { typeOf } from './tool';

function getKeys(input, showHidden = false) {
  return showHidden ? Object.getOwnPropertyNames(input) : Object.keys(input);
}

function getMaxIndexLength(input, showHidden = false) {
  return getKeys(input, showHidden).reduce(
    (maxLen, key) => Math.max(maxLen, key.length),
    0
  );
}

class Yaml {
  static renderToString(input) {
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
      default:
        return false;
    }
  }

  static renderToArray(data, options, indent, depth = 0) {
    let output = Yaml.renderToString(data);
    let indentation = ' '.repeat(indent);

    if (typeof output === 'string') return [indentation + output];

    if (typeof data === 'string') {
      return [
        indentation + '"""',
        ...data.split(/\r?\n/).map(it => indentation + it),
        indentation + '"""'
      ];
    }

    if (depth > options.depth) {
      return [indentation + Object.prototype.toString.call(data)];
    }

    if (data instanceof Error) {
      return Yaml.renderToArray(
        {
          message: data.message,
          stack: data.stack.split(/\r?\n/)
        },
        options,
        indent,
        depth
      );
    }

    options.seen.push(data);
    let outputArr = [];

    if (Array.isArray(data)) {
      if (data.length === 0) {
        return [indentation + options.emptyArrayMsg];
      }

      data.forEach(el => {
        let line = indentation + '- ';
        let val = Yaml.renderToString(el);

        if (typeof val === 'string') {
          outputArr.push(line + val);
        } else {
          outputArr.push(line);
          outputArr.push.apply(
            outputArr,
            Yaml.renderToArray(
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

      getKeys(data, options.showHidden).forEach(i => {
        let key = indentation + i + ': ';
        let val = Yaml.renderToString(data[i]);

        let nextIndent = maxIndexLen - i.length;
        if (typeof val === 'string') {
          outputArr.push(key + Yaml.renderToArray(val, options, nextIndent));
        } else if (options.seen.includes(data[i])) {
          outputArr.push(key + ' '.repeat(nextIndent) + '[Circular]');
        } else {
          outputArr.push(key);
          outputArr.push.apply(
            outputArr,
            Yaml.renderToArray(
              data[i],
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

  static print(data, options = {}, indent = 0) {
    options.emptyArrayMsg = options.emptyArrayMsg || '(empty array)';
    options.defaultIndent = options.defaultIndent || 2;
    options.depth = options.depth || 2;
    options.showHidden = options.showHidden || false;
    options.seen = [];
    return Yaml.renderToArray(data, options, indent).join('\r\n');
  }
}

export let printYaml = Yaml.print;
