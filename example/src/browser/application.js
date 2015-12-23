import url from 'url';
import BrowserWindow from 'browser-window';

export default class Application {

  constructor() {
    let mainWindow = new BrowserWindow({
      width: 1024,
      height: 728
    });

    let secondaryWindow = new BrowserWindow({
      width: 512,
      height: 512
    });

    this.loadFileUrl({
      wnd: mainWindow,
      params: { route: '/main' }
    });

    this.loadFileUrl({
      wnd: secondaryWindow,
      params: { route: '/secondary' }
    });
  }

  loadFileUrl({wnd, pathname, params: params = {}}) {

    if (!pathname) {
      let htmlFile = process.env.HOT ? `index-hot.html` : `index.html`;
      pathname = `${process.cwd()}/static/${htmlFile}`;
    }

    let targetUrl = url.format({
      protocol: 'file',
      pathname: pathname,
      slashes: true,
      query: {windowParams: JSON.stringify(params)}
    });

    wnd.loadURL(targetUrl);
  }

}
