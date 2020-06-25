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

export function bin2hex(bytes) {
  return value2text('bin.hex', bytes);
}

export function hex2bin(hex) {
  return text2value('bin.hex', hex);
}

export function bin2base64(bytes) {
  return value2text('bin.base64', bytes);
}

export function base642bin(base64) {
  return text2value('bin.base64', base64);
}

function resolveEncoding(name) {
  name = name && name.replace(/[_-]/g, '').toLowerCase();
  switch (name) {
    case 'ascii':
      return 'us-ascii';
    case 'eucjs':
      return 'euc-jp';
    case 'shiftjis':
      return 'Shift_JIS';
    case 'utf8':
      return 'UTF-8';
    case 'utf16':
      return 'UTF-16';
    default:
      return name;
  }
}

export function bin2str(bytes, encoding) {
  let st = new ActiveXObject('ADODB.Stream');
  let str;
  encoding = resolveEncoding(encoding || 'utf8');
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

export function str2bin(str, encoding) {
  let st = new ActiveXObject('ADODB.Stream');
  let bin;
  encoding = resolveEncoding(encoding || 'utf8');
  try {
    st.Open();
    st.Type = 2;
    st.Charset = encoding;
    st.WriteText(str);
    st.Position = 0;
    st.Type = 1;
    if (encoding == 'utf-8') {
      st.Position = 3;
    } else if (encoding == 'uft-16') {
      st.Position = 2;
    }
    bin = st.Read();
  } finally {
    st.Close();
  }
  return bin;
}

export function bin2buf(bytes) {
  let len = bytes.ubound() + 1;
  let arr = new Uint8Array(len);
  let i = -1;
  while (++i < len) arr[i] = bytes.getItem(i);
  return Buffer.from(arr);
}

export function buf2bin(buf) {
  return base642bin(buf.toString('base64'));
}

export function toBinary(data, encoding) {
  switch (encoding) {
    case 'hex':
      return hex2bin(data);
    case 'base64':
      return base642bin(data);
    case 'buffer':
      return buf2bin(data);
    default:
      return str2bin(data, encoding);
  }
}

export function fromBinary(data, encoding) {
  switch (encoding) {
    case 'hex':
      return bin2hex(data);
    case 'base64':
      return bin2base64(data);
    case 'binary':
      return data;
    case 'buffer':
      return data.toString(encoding);
    default:
      return bin2str(data, encoding);
  }
}
