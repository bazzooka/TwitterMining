import React, { PropTypes } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

// import * as TodoActions from '../../actions/todos';
require('./App.css');

const App = ({ children }) => (
  <div className="app-container">
    {children}
  </div>
);

App.propTypes = {
  children: PropTypes.object,
};
export default App;
// export default connect(
//   state => ({ todos: state.todos }),
//   dispatch => ({ actions: bindActionCreators(TodoActions, dispatch) })
// )(App);
