
import path from 'path';
import { Application } from 'spectron';
import { Options } from '../../lib/types';

let app: Application;

describe('Counter', () => {

    afterEach(async () => {
        if (process.env.SHOW_LOGS) {
            app.client.getMainProcessLogs().then(logs => {
                if (logs.length) {
                    console.log('MAIN');
                    let str = '';
                    logs.forEach(function (log) {
                        if (log.indexOf("electron") === -1) {
                            str += log + '\n';
                        }
                    });
                    console.log(str + '\n');
                }
            });

            app.client.getRenderProcessLogs().then(function (logs) {
                if (logs.length) {
                    let str = '';
                    logs.forEach(function (log) {
                        if (log.level === 'WARNING') {
                            str += log.level + '|' + log.message + '\n';
                        }
                    });
                    if (str.length) {
                        console.log('RENDERER');
                        console.log(str + '\n');
                    }
                }
            });
        }

        if (app && app.isRunning()) {
            await app.stop();
        }
    });

    it('renderer - should be able to dispatch actions and send them to main process', async () => {
        const app = await getApp();

        expect(await app.browserWindow.getTitle()).toEqual('0');

        rendererDispatch('INCREMENT');

        expect(await app.browserWindow.getTitle()).toEqual('1');

        rendererDispatch('DECREMENT');

        expect(await app.browserWindow.getTitle()).toEqual('0');
    });

    describe('from MAIN', () => {

        it('should be able to send action to renderer', async () => {
            const app = await getApp();

            expect(await getValue(app)).toEqual({ "count": 0 });

            mainDispatch('INCREMENT');

            expect(await getValue(app)).toEqual({ "count": 1 });
        });

        it('should be able to add preDispatch function', async () => {
            const app = await getApp();

            mainDispatch('INCREMENT');

            expect(await getValue(app, '#preDispatchCallback')).toEqual({
                "type": "INCREMENT",
                "payload": { "updated": { "count": 1 }, "deleted": {} }
            });
        });

        it('should be able to add postDispatch function', async () => {
            const app = await getApp();

            mainDispatch('INCREMENT');

            expect(await getValue(app, '#postDispatchCallback')).toEqual({
                "type": "INCREMENT",
                "payload": { "updated": { "count": 1 }, "deleted": {} }
            });
        });

        it('should be able to use dispatchProxy function', async () => {
            const app = await getApp();

            mainDispatch('DISPATCH_PROXY');

            await app.client.waitForExist('#dispatchProxy')

            expect(await getValue(app, '#dispatchProxy')).toEqual({
                "type": "DISPATCH_PROXY",
                "payload": { "updated": {
                    "dispatchProxy": true
                }, "deleted": {} }
            });
        });

        it('should be able to filter out everything for renderer when dispatching `INCREMENT`', async () => {
            const app = await getApp<{ count: number; mainOnly?: number; }>({
                rendererOptions: {
                    filter: false
                }
            });

            expect(await getValue(app)).toEqual({ "count": 0 });

            mainDispatch('INCREMENT');

            expect(await getValue(app)).toEqual({ "count": 0 });
        });

        it('should be able to filter out "count" for renderer when dispatching "INCREMENT"', async () => {
            const app = await getApp<{ count: number; mainOnly?: number; }>({
                rendererOptions: {
                    filter: {
                        mainOnly: true
                    }
                }
            });

            expect(await getValue(app)).toEqual({ "count": 0 });

            mainDispatch('INCREMENT');

            expect(await getValue(app)).toEqual({ "count": 0 });
        });
    })
});


// Helpers
type AppOptions<T> = { rendererOptions?: Options<T>; mainOptions?: Options<T>; };

const mainDispatch = (type: string, payload?: any) => {
    app.electron.ipcRenderer.send('action', { type, payload });
}
const rendererDispatch = (type: string, payload?: any) => {
    app.webContents.send('action', { type, payload });
}

const getApp = async <T>({ rendererOptions = {}, mainOptions = {} }: AppOptions<T> = {}) => {
    jest.setTimeout(20000);
    app = new Application({
        path: './node_modules/.bin/electron',
        args: [path.resolve(__dirname, '..', 'main.js')],
        startTimeout: 20000,
        host: process.env.CHROMEDRIVER_HOST || 'localhost',
        port: process.env.CHROMEDRIVER_PORT ? parseInt(process.env.CHROMEDRIVER_PORT, 10) : 9515,
        env: {
            MAIN_OPTIONS: JSON.stringify(mainOptions),
            RENDERER_OPTIONS: JSON.stringify(rendererOptions),
        }
    });

    await app.start();
    await app.client.waitUntilWindowLoaded();

    return app;
}
const getValue = async (app: Application, id?: string) => {
    try {
        const elValue = await app.client.getText(id || '#value');

        if (!elValue || !elValue.length) {
            return null;
        }

        return JSON.parse(elValue);

    } catch (err) {
        throw err;
    }
}