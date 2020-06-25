import { stringify } from './querystring';
import { bin2buf } from './encoding';

const BIN_TYPES = ['arraybuffer', 'blob'];

function request(options) {
  let http, uri, method, timeout;
  http = new ActiveXObject('WinHttp.WinHttpRequest.5.1');
  uri = options.uri || options.url || options.path;
  method = (options.method || 'GET').toUpperCase();
  timeout = options.timeout || 3000;
  http.setTimeouts(timeout, timeout, timeout, timeout);

  let data = options.form || options.data || null;
  if (data && typeof data !== 'string') data = stringify(data);
  if (data) {
    if (method === 'GET') {
      http.open(method, uri + '?' + data, false);
    } else {
      http.open(method, uri, false);
    }
  } else {
    http.open(method, uri, false);
  }
  applyOptions(http, options);
  http.send(data);

  return {
    statusCode: http.status,
    headers: parseHeaders(http.getAllResponseHeaders()),
    body: BIN_TYPES.includes(options.responseType)
      ? bin2buf(http.ResponseBody)
      : http.ResponseText,
  };
}

/*
enum WinHttpRequestOption {
  UserAgentString = 0,
  URL = 1,
  URLCodePage = 2,
  EscapePercentInURL = 3,
  SslErrorIgnoreFlags = 4,
  SelectCertificate = 5,
  EnableRedirects = 6,
  UrlEscapeDisable = 7,
  UrlEscapeDisableQuery = 8,
  SecureProtocols = 9,
  EnableTracing = 10,
  RevertImpersonationOverSsl = 11,
  EnableHttpsToHttpRedirects = 12,
  EnablePassportAuthentication = 13,
  MaxAutomaticRedirects = 14,
  MaxResponseHeaderSize = 15,
  MaxResponseDrainSize = 16,
  EnableHttp1_1 = 17,
  EnableCertificateRevocationCheck = 18
}
*/

let setReqOpts = Function(
  'http',
  `
http.Option(0) = 'Mozilla/5.0 (Windows NT 6.1; Trident/7.0; rv:11.0) like Gecko';
http.Option(4) = 13056;
http.Option(6) = false;`
);

function applyOptions(http, options) {
  if (options.proxy) {
    setReqOpts(http);
    http.setProxy('2', options.proxy);
    // http.SetClientCertificate("LOCAL_MACHINE\Personal\My Certificate")
    // http.SetCredentials('user', 'pass', 1);
  }

  if (options.method !== 'GET') {
    http.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  }

  let headers = options.headers;
  if (headers) {
    for (let key in headers) {
      if (key.toLowerCase() == 'cookie') {
        http.setRequestHeader('Cookie', 'string');
        http.setRequestHeader('Cookie', headers[key]);
      } else {
        http.setRequestHeader(key, headers[key]);
      }
    }
  }
}

function parseHeaders(str_headers) {
  let result = {},
    headers,
    i,
    k,
    v;
  headers = str_headers.trim().split(/\r?\n/);
  headers.forEach((header) => {
    i = header.indexOf(':');
    k = header.slice(0, i).trim();
    v = header.slice(i + 1).trim();
    if (k.toLowerCase() == 'set-cookie') {
      if (result[k]) result[k].push(v);
      else result[k] = [v];
    } else {
      result[k] = v;
    }
  });
  return result;
}

function getOption(args) {
  let options;
  if (typeof args[0] === 'string') {
    options = args[1] || {};
    options.uri = args[0];
  } else {
    options = args[0] || {};
  }
  return options;
}

export default {
  request: function () {
    return request(getOption(arguments));
  },
  get: function () {
    let options = getOption(arguments);
    options.method = 'GET';
    return request(options);
  },
  post: function () {
    let options = getOption(arguments);
    options.method = 'POST';
    return request(options);
  },
};
