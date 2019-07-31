import { each } from './tool';

const APP_ID = 'Outlook.Application';
const olMailItem = 0;

export default class Outlook {
  constructor() {
    let app;
    try {
      app = GetObject('', APP_ID);
    } catch (e) {
      app = new ActiveXObject(APP_ID);
    }
    this.app = app;
  }

  createMail(options) {
    let item = this.app.CreateItem(olMailItem);
    if (options) {
      each(options, (value, key) => {
        item[key] = value;
      });
    }
    item.Display();
    return item;
  }
}
