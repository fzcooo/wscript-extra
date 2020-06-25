import console from './console';
import process from './process';
import {Buffer} from 'buffer/';

let builtins = {
  console,
  process,
  Buffer
};

for (let name in builtins) {
  Object.defineProperty(this, name, {
    get: () => builtins[name]
  });
}
