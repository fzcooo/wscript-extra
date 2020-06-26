const _setTimeout = window.setTimeout;
const _setInterval = window.setInterval;
const _clearTimeout = window.clearTimeout;
const _clearInternal = window.clearInterval;

function setTimeout(fn, delay, ...args) {
  let id;
  if (args.length > 0) {
    id = _setTimeout(
      function (..._args) {
        delete window.__timers[id];
        fn(..._args);
      },
      delay,
      ...args
    );
  } else {
    id = _setTimeout(function () {
      delete window.__timers[id];
      fn();
    }, delay);
  }
  window.__timers[id] = id;
  return id;
}

function clearTimeout(id) {
  delete window.__timers[id];
  _clearTimeout(id);
}

function setInterval(fn, delay, ...args) {
  let id = args.length
    ? _setInterval(fn, delay, ...args)
    : _setInterval(fn, delay);
  window.__timers[id] = id;
  return id;
}

function clearInterval(id) {
  delete window.__timers[id];
  _clearInternal(id);
}

function setImmediate(fn, ...args) {
  return args.length ? setTimeout(fn, 0, ...args) : setTimeout(fn, 0);
}

function clearImmediate(id) {
  clearTimeout(id);
}

window.__timers = {};
window.setTimeout = setTimeout;
window.clearTimeout = clearTimeout;
window.setInterval = setInterval;
window.clearInterval = clearInterval;
window.setImmediate = setImmediate;
window.clearImmediate = clearImmediate;
