import { str2bin, bin2buf, toBinary, fromBinary } from './encoding';

function _cipher(enc, password, data) {
  let crypt = new ActiveXObject('System.Security.Cryptography.RijndaelManaged');
  let keyHash = new ActiveXObject('System.Security.Cryptography.SHA256Managed');
  keyHash.ComputeHash_2(password);
  crypt.Key = keyHash.Hash;
  keyHash.Clear();

  let ivHash = new ActiveXObject(
    'System.Security.Cryptography.MD5CryptoServiceProvider'
  );
  ivHash.ComputeHash_2(password);
  crypt.IV = ivHash.Hash;
  ivHash.Clear();

  let dst = null;
  let ts = enc ? crypt.CreateEncryptor() : crypt.CreateDecryptor();
  try {
    dst = ts.TransformFinalBlock(data, 0, data);
  } finally {
    crypt.Clear();
  }
  return dst;
}

export class Cipher {
  constructor(algorithm, password, isEncode) {
    this.algorithm = algorithm;
    this.password = password;
    this.isEncode = isEncode;
    this.data = null;
    this.inputEncoding = null;
    this.outputEncoding = null;
  }

  update(data, inputEncoding, outputEncoding) {
    this.data = data;
    if (inputEncoding) this.inputEncoding = inputEncoding;
    if (outputEncoding) this.outputEncoding = outputEncoding;
    return this;
  }

  final(outputEncoding) {
    if (outputEncoding) this.outputEncoding = outputEncoding;
    let bytes = _cipher(
      this.isEncode,
      str2bin(this.password),
      toBinary(this.data, this.inputEncoding)
    );
    if (this.outputEncoding == null || this.outputEncoding == 'binary') {
      return bin2buf(bytes);
    } else {
      return bin2buf(bytes).toString(this.outputEncoding);
    }
  }
}

function _hash(objname, data, encoding) {
  let provider = new ActiveXObject(objname);
  provider.ComputeHash_2(data);
  let hashs = provider.Hash;
  provider.Clear();
  return fromBinary(hashs, encoding || 'hex');
}

class Hash {
  constructor(algorithm) {
    this.algorithm = algorithm;
    this.data = null;
    this.inputEncoding = null;
  }

  update(data, inputEncoding = 'utf-8') {
    this.inputEncoding = inputEncoding;
    this.data = data;
    return this;
  }

  digest(encoding) {
    if (this.algorithm == 'md5') {
      return _hash(
        'System.Security.Cryptography.MD5CryptoServiceProvider',
        toBinary(this.data, this.inputEncoding),
        encoding
      );
    } else if (this.algorithm == 'sha1') {
      return _hash(
        'System.Security.Cryptography.SHA1CryptoServiceProvider',
        toBinary(this.data, this.inputEncoding),
        encoding
      );
    }
  }
}

export default {
  createCipher(algorithm, password) {
    return new Cipher(algorithm, password, true);
  },

  createDeCipher(algorithm, password) {
    return new Cipher(algorithm, password, false);
  },

  createHash(algorithm) {
    return new Hash(algorithm);
  },
};
