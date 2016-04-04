import { createStore, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';
import reducers from '../reducers';

const finalCreateStore = compose(
  applyMiddleware(thunk)
)(createStore);

function configureStore(initialState) {
  return finalCreateStore(reducers, initialState);
}

export default configureStore();
