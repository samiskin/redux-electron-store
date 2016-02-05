import { compose, createStore, applyMiddleware } from 'redux';
import createLogger from 'redux-logger';
import thunk from 'redux-thunk';
import { electronEnhancer } from 'redux-electron-store';
import React from 'react';
import shallowEqual from 'utils/shallowEqual';
import rootReducer from '../reducers';

let logger = createLogger({
  level: 'info',
  duration: true
});

let storeEnhancers = compose(
  applyMiddleware(thunk, logger),
  electronEnhancer()
);

if (process.type === 'renderer' && !process.guestInstanceId) {
  storeEnhancers = compose(
    storeEnhancers,
    require('DevTools').default.instrument()
  );
}

let store = storeEnhancers(createStore)(rootReducer);

export default store;

/*export function connect(mapStateToProps) {

  return (WrappedComponent) => {
    class Connect extends React.Component {

      constructor(props) {
        super(props);
        this.store = store;
        this.state = mapStateToProps(store.getState());
        this.unsubscribe = store.subscribe(() => {
          this.setState(mapStateToProps(this.store.getState()));
        });
      }

      shouldComponentUpdate(nextProps, nextState) {
        return !shallowEqual(this.props, nextProps) ||
               !shallowEqual(this.state, nextState);
      }

      computeMergedProps() {
        return {
          ...this.props,
          ...this.state
        };
      }

      componentWillUnmount() {
        this.unsubscribe();
      }

      render() {
        return React.createElement(WrappedComponent, this.computeMergedProps());
      }
    }

    Connect.displayName = `Connect(${WrappedComponent.displayName})`;

    return Connect;
  }

}*/
