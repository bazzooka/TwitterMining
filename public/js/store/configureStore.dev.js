import { createStore, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';
import reducers from '../reducers';
import DevTools from '../containers/DevTools';

const finalCreateStore = compose(
  applyMiddleware(thunk),
  DevTools.instrument()
)(createStore);

function configureStore(initialState) {
  const store = finalCreateStore(
    reducers,
    initialState
  );

  if (module.hot) {
    // Enable Webpack hot module replacement for reducers
    module.hot.accept('../reducers', () => {
      const nextRootReducer = require('../reducers');
      store.replaceReducer(nextRootReducer);
    });
  }

  return store;
}

export default configureStore();
