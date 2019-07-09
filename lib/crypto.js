function _cipher(enc, buf_password, buf_data) {
  let crypt = new ActiveXObject('System.Security.Cryptography.RijndaelManaged');
  let keyHash = new ActiveXObject('System.Security.Cryptography.SHA256Managed');
  keyHash.ComputeHash_2(buf_password.buffer);
  crypt.Key = keyHash.Hash;
  keyHash.Clear();

  let ivHash = new ActiveXObject(
    'System.Security.Cryptography.MD5CryptoServiceProvider'
  );
  ivHash.ComputeHash_2(buf_password.buffer);
  crypt.IV = ivHash.Hash;
  ivHash.Clear();

  let dst = null;
  let ts = enc ? crypt.CreateEncryptor() : crypt.CreateDecryptor();
  try {
    dst = ts.TransformFinalBlock(buf_data.buffer, 0, buf_data.length);
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
      Buffer.from(this.password),
      Buffer.from(this.data, this.inputEncoding)
    );
    if (this.outputEncoding == null || this.outputEncoding == 'binary') {
      return Buffer.from(bytes);
    } else {
      return Buffer.from(bytes).toString(this.outputEncoding);
    }
  }
}

function _hash(objname, buf_data, opt_type) {
  let provider = new ActiveXObject(objname);
  provider.ComputeHash_2(buf_data.buffer);
  let hashs = provider.Hash;
  provider.Clear();
  return Buffer.from(hashs).toString(opt_type || 'hex');
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
        Buffer.from(this.data, this.inputEncoding),
        encoding
      );
    } else if (this.algorithm == 'sha1') {
      return _hash(
        'System.Security.Cryptography.SHA1CryptoServiceProvider',
        Buffer.from(this.data, this.inputEncoding),
        encoding
      );
    }
  }
}

export default {
  createCipher: function(algorithm, password) {
    return new Cipher(algorithm, password, true);
  },

  createDeCipher: function(algorithm, password) {
    return new Cipher(algorithm, password, false);
  },

  createHash: function(algorithm) {
    return new Hash(algorithm);
  }
};
