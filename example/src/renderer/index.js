import React from 'react';
import { render } from 'react-dom';
import { Router, Route, IndexRoute } from 'react-router';
import App from 'App.jsx';
import Main from 'Main.jsx';
import Secondary from 'Secondary.jsx';
import url from 'url';
import createMemoryHistory from 'history/lib/createMemoryHistory';

const queryParams = url.parse(window.location.href, true).query;
global.windowSettings = queryParams.windowParams ? JSON.parse(queryParams.windowParams) : {};

const reactHost = global.document.createElement('span');
global.document.body.appendChild(reactHost);

let history = createMemoryHistory();
render((
    <Router history={history}>
      <Route path="/" component={App}>
        <Route path="/main" component={Main}/>
        <Route path="/secondary" component={Secondary}/>
      </Route>
    </Router>
), reactHost);

if (global.windowSettings.route) {
  history.pushState(null, global.windowSettings.route);
}
