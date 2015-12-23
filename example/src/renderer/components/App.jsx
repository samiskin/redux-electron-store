import React from 'react';
import Component from 'Component';
import DevTools from 'DevTools.jsx';
import Store from 'Store';
import { Provider } from 'react-redux';

export default class App extends Component {

  render() {
    return (
      <div>
        {this.props.children}
        <Provider store={Store.store}>
          <DevTools />
        </Provider>
      </div>
    );
  }

}
