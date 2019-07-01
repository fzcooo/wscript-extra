import { each, has } from './tool';

export function getWindows() {
  let wins = [];
  each(GetShellApp().Windows(), app => {
    if (app && app.Name === 'Internet Explorer') {
      wins.push(app);
    }
  });
  return wins;
}

export function getActive() {
  let ie;
  each(GetShellApp().Windows(), app => {
    if (app && app.Name === 'Internet Explorer' && !app.Document.hidden) {
      ie = app;
      return false;
    }
  });
  return ie;
}

export function getIE() {
  let ie;
  each(GetShellApp().Windows(), app => {
    if (app && app.Name === 'Internet Explorer') {
      ie = app;
      return false;
    }
  });
  return ie;
}

export function wait(ie, timeout) {
  let elapsed = 0;
  timeout || (timeout = 5000);
  while (ie.Busy || ie.ReadyState !== 4) {
    if (elapsed >= timeout) {
      throw new Error('IE timeout');
    }
    elapsed += 100;
    process.sleep(100);
  }
}

const IE_OPTIONS = [
  'AddressBar',
  'FullScreen',
  'Width',
  'Height',
  'Top',
  'Left',
  'MenuBar',
  'Resizable',
  'Silent',
  'StatusBar',
  'ToolBar',
  'Visible'
].reduce((memo, it) => {
  memo[it] = it;
  memo[it.toLowerCase()] = it;
  return memo;
}, {});

export function open(url, options) {
  let ie = new ActiveXObject('InternetExplorer.Application');
  options || (options = {});
  each(options, (v, k) => {
    let prop = IE_OPTIONS[k];
    if (prop) ie[prop] = v;
  });
  if (!has(options, 'visible') && !has(options, 'Visible')) {
    ie.Visible = true;
  }
  ie.Navigate(url || 'about:blank');
  wait(ie, options.timeout);
  return ie;
}
