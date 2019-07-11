let _doc;

function getXmlDoc() {
  return _doc || (_doc = new ActiveXObject('MSXML2.DOMDocument.6.0'));
}

function text2value(type, text) {
  let el = getXmlDoc().createElement('tmp');
  el.dataType = type;
  el.text = text;
  return el.nodeTypedValue;
}

function value2text(type, value) {
  let el = getXmlDoc().createElement('tmp');
  el.dataType = type;
  el.nodeTypedValue = value;
  return el.text;
}

function bin2hex(bytes) {
  return value2text('bin.hex', bytes);
}

function hex2bin(hex) {
  return text2value('bin.hex', hex);
}

function bin2base64(bytes) {
  return value2text('bin.base64', bytes);
}

function base642bin(base64) {
  return text2value('bin.base64', base64);
}

function bin2str(bytes, encoding) {
  let st = new ActiveXObject('ADODB.Stream'),
    str;
  encoding || (encoding = 'UTF-8');
  try {
    st.Open();
    st.Type = 1;
    st.Write(bytes);
    st.Position = 0;
    st.Type = 2;
    st.Charset = encoding;
    str = st.ReadText();
  } finally {
    st.Close();
  }
  return str;
}

function str2bin(str, encoding) {
  let st = new ActiveXObject('ADODB.Stream'),
    bin;
  encoding || (encoding = 'UTF-8');
  try {
    st.Open();
    st.Type = 2;
    st.Charset = encoding;
    st.WriteText(str);
    st.Position = 0;
    st.Type = 1;
    encoding = encoding.replace('-', '').toLowerCase();
    if (encoding == 'utf8' || encoding == 'unicode') st.Position = 3;
    else if (encoding == 'uft16') st.Position = 2;
    bin = st.Read();
  } finally {
    st.Close();
  }
  return bin;
}

function encode(str, encoding) {
  switch (encoding) {
    case 'hex':
      return hex2bin(str);
    case 'base64':
      return base642bin(str);
    default:
      return str2bin(str, encoding);
  }
}

function decode(bytes, encoding) {
  switch (encoding) {
    case 'hex':
      return bin2hex(bytes);
    case 'base64':
      return bin2base64(bytes);
    case 'binary':
      return bytes;
    default:
      return bin2str(bytes, encoding);
  }
}

export default class Buffer {
  static isBuffer(obj) {
    return obj && obj instanceof Buffer;
  }

  static from(obj, encoding) {
    return new Buffer(obj, encoding);
  }

  constructor(obj, encoding) {
    this.buffer = null;
    if (obj == null || obj == '' || obj.length == 0) {
      this.buffer = new ActiveXObject('Scripting.Dictionary').Items();
    } else if (Buffer.isBuffer(obj)) {
      this.buffer = obj.buffer;
    } else if (typeof obj == 'string') {
      this.buffer = encode(obj, encoding);
    } else if (obj != null && obj.constructor && obj.constructor === VBArray) {
      this.buffer = obj;
    } else {
      throw new TypeError('Failed to create buffer.');
    }
  }

  toString(encoding) {
    return this.buffer.ubound() == -1 ? '' : decode(this.buffer, encoding);
  }

  get length() {
    return this.buffer.ubound() + 1;
  }
}
