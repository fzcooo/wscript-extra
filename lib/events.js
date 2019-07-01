import { apply, tail, has } from './tool';

export function EventEmitter() {
  this.__events = {};
}
const proto = EventEmitter.prototype;
proto.on = function(evtName, func) {
  let events = this.__events;
  if (has(events, evtName)) {
    events[evtName].push(func);
  } else {
    events[evtName] = [func];
  }
  return this;
};
proto.once = function(evtName, func) {
  let onceFunc = function() {
    this.off(evtName, onceFunc);
    return apply(func, this, arguments);
  };
  this.on(evtName, onceFunc);
  return this;
};
proto.prepend = function(evtName, func) {
  let events = this.__events;
  if (has(events, evtName)) {
    events[evtName].unshift(func);
  } else {
    events[evtName] = [func];
  }
  return this;
};
proto.prependOnce = function(evtName, func) {
  let onceFunc = function() {
    this.off(evtName, onceFunc);
    return apply(func, this, arguments);
  };
  this.prepend(evtName, onceFunc);
  return this;
};
proto.off = function(evtName, func) {
  let events = this.__events;
  if (evtName == null) {
    this.__events = {};
  } else if (func == null) {
    if (has(events, evtName)) delete events[evtName];
  } else {
    if (has(events, evtName)) {
      let idx = events[evtName].indexOf(func);
      events[evtName].splice(idx, 1);
    }
  }
  return this;
};
let emit = (proto.emit = function(evtName) {
  let args = tail(arguments);
  let events = this.__events;
  let listeners, i, len;
  if (has(events, evtName)) {
    listeners = events[evtName];
    len = listeners.length;
    for (i = 0; i < len; i++) {
      if (apply(listeners[i], this, args) === false) break;
    }
  }
  return this;
});
proto.fire = emit;

export default EventEmitter;
