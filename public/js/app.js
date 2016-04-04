
// Import all the third party stuff
import React from 'react';
import ReactDOM from 'react-dom';
import store from './store';
import Root from './containers/Root/Root';
import { browserHistory } from 'react-router'

ReactDOM.render(
  <Root store={store} history={browserHistory} />,
  document.getElementById('root')
);
