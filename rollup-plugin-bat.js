import { resolve, basename } from 'path';
import { readFile, unlink } from 'fs-extra';

export default function() {
  let entry = null;

  return {
    name: 'bat',

    buildStart(inputOption) {
      entry = resolve(inputOption.input[0]);
    },

    async load(id) {
      if (id == entry) {
        let source = await readFile(id, 'utf-8');
        let imports = ['polyfill', 'builtins'].map(name => {
          let pth = resolve('lib/' + name).replace(/\\/g, '/');
          return `import '${pth}';\r\n`;
        });
        return imports.join('') + source;
      }
      return null;
    },

    async generateBundle(outputOptions, bundle, isWrite) {
      if (!isWrite) return;
      let name = basename(outputOptions.file);
      let source = Buffer.from(bundle[name].code).toString('base64');
      let tmpSrc = await readFile(resolve('./temp.js'), 'utf-8');
      // eslint-disable-next-line require-atomic-updates
      bundle[name].code = tmpSrc.replace('{{source}}', source);
      if (process.env.ROLLUP_INPUT_TMP) {
        await unlink(process.env.ROLLUP_INPUT_TMP);
      }
    }
  };
}
