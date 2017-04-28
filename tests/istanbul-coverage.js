
if (process.type === 'browser') {

  const { app, ipcMain } = require('electron');
  const istanbulAPI = require('istanbul-api');
  const libCoverage = require('istanbul-lib-coverage');

  const mainReporter = istanbulAPI.createReporter();
  const coverageMap = libCoverage.createCoverageMap();

  ipcMain.on('renderer-coverage', (e, coverage) => coverageMap.merge(coverage));

  app.on('quit', () => {
      coverageMap.merge(global.__coverage__ || {});

      mainReporter.addAll(['text', 'html']);
      mainReporter.write(coverageMap, {});
  });

} else {
 
}
