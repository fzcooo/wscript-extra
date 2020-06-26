let __Enumerator = this.Enumerator;

class Enumerator {
  constructor(collection) {
    this.origin = new __Enumerator(collection);
  }

  item() {
    return this.origin.item();
  }

  moveFirst() {
    return this.origin.moveFirst();
  }

  moveNext() {
    return this.origin.moveNext();
  }

  atEnd() {
    return this.origin.atEnd();
  }

  forEach(fn) {
    let origin = this.origin;
    for (let i = 0; !origin.atEnd(); origin.moveNext(), i++) {
        fn(origin.item(), i);
    }
    return this;
  }

  map(fn) {
    let arr = [], origin = this.origin;
    for (let i = 0; !origin.atEnd(); origin.moveNext(), i++) {
      arr.push(fn(origin.item(), i));
    }
    return arr;
  }

  reduce(fn, init) {
    let acc = init || [], origin = this.origin;
    for (let i = 0; !origin.atEnd(); origin.moveNext(), i++) {
      acc = fn(acc, origin.item(), i);
    }
    return acc;
  }

  filter(fn) {
    let item, arr = [], origin = this.origin;
    for (let i = 0; !origin.atEnd(); origin.moveNext(), i++) {
      item = origin.item();
      if (fn(item, i)) arr.push(item);
    }
    return arr;
  }

  find() {
    let item, origin = this.origin;
    for (let i = 0; !origin.atEnd(); origin.moveNext(), i++) {
      item = origin.item();
      if (fn(item, i)) return item;
    }
  }

  any(fn) {
    let origin = this.origin;
    for (let i = 0; !origin.atEnd(); origin.moveNext(), i++) {
        if (fn(origin.item(), i)) return true;
    }
    return false;
  }

  every(fn) {
    let origin = this.origin;
    for (let i = 0; !origin.atEnd(); origin.moveNext(), i++) {
        if (fn(origin.item(), i) === false) return false;
    }
    return true;
  }
}

this.Enumerator = Enumerator;
