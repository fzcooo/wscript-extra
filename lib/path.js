const PARSE_REG = /^([A-Za-z]:[/\\]|[/\\]|)(?:([^?#]*)[/\\]|)([^/\\?#]*?)([.][^.?#]+|)$/;
const CAPTURE = ['path', 'root', 'dir', 'name', 'ext'];

export function parse(pth) {
  pth || (pth = '');
  let match = pth.match(PARSE_REG);
  let result = CAPTURE.reduce(function(memo, name, index) {
    memo[name] = match[index];
    return memo;
  }, {});
  result.base = result.name + result.ext;
  result.dirname = result.root + result.dir;
  return result;
}

export const delimiter = ';';

export {
  sep,
  dirname,
  basename,
  extname,
  isAbsolute,
  normalize,
  join,
  resolve,
  relative
} from './fso';
