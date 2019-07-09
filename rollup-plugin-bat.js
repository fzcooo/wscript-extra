import { resolve, basename } from 'path';
import { readFileSync } from 'fs';

export default function() {
  let entry = null;

  return {
    name: 'bat',

    buildStart: function(inputOption) {
      entry = resolve(inputOption.input);
    },

    load: function(id) {
      if (id == entry) {
        let polyfill = resolve('lib/polyfill').replace(/\\/g, '/');
        return `import '${polyfill}';\r\n` + readFileSync(id, 'utf-8');
      }
      return null;
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