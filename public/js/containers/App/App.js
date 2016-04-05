require('./App.scss');

import React, { PropTypes } from 'react';
import { connect } from 'react-redux';

import {
  REQUEST_PROFILES,
  RECEIVE_PROFILES,
  REJECT_PROFILES,

  REQUEST_DOCUMENTS,
  RECEIVE_DOCUMENTS,
  REJECT_DOCUMENTS,

  fetchProfiles,
  fetchDocuments
} from '../../actions/';


const mapStateToProps = state => ({
  profiles: state.profiles,
  documents: state.documents
});

const App = React.createClass({
  componentDidMount(){
    this.props.dispatch(fetchProfiles());
    this.props.dispatch(fetchDocuments());
  },

  requestProfiles(start, size){
    this.props.dispatch(fetchProfiles(start, size));
  },

  render() {
    return (
      <div className="app-container">
        {React.cloneElement(this.props.children, {
          profiles: this.props.profiles,
          documents: this.props.documents,
          fetchProfiles: this.requestProfiles
        })}
      </div>
    );
  }
});

export default connect(mapStateToProps)(App);
