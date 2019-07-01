import { each } from './tool';

const APP_ID = 'Outlook.Application';
const olMailItem = 0;

const OUTLOOK_PROTO = {
  createMail: function(options) {
    let item = this.app.CreateItem(olMailItem);
    if (options) {
      each(options, (value, key) => {
        item[key] = value;
      });
    }
    item.Display();
    return item;
  }
};

const OUTLOOK_PROPS = {
  app: { value: null, writable: true }
};

export default function Outlook() {
  let app;
  try {
    app = GetObject('', APP_ID);
  } catch (e) {
    app = new ActiveXObject(APP_ID);
  }
  let ol = Object.create(OUTLOOK_PROTO, OUTLOOK_PROPS);
  ol.app = app;
  return ol;
}
