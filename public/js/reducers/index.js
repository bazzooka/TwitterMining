import { combineReducers } from 'redux';
import { routeReducer } from 'redux-simple-router';
import { uniq } from 'lodash';

import {
  REQUEST_PROFILES, RECEIVE_PROFILES, REJECT_PROFILES,
  REQUEST_DOCUMENTS, RECEIVE_DOCUMENTS, REJECT_DOCUMENTS } from '../actions';


function profiles(state = { isLoading: false, items: []}, action) {
  switch (action.type) {
    case REQUEST_PROFILES:
      return Object.assign({}, state, {
        isLoading: true
      });
    case RECEIVE_PROFILES:
      return Object.assign({}, state, {
        isLoading: false,
        nbResult: action.profiles.response.hits.total,
        items: uniq(state.items.concat(action.profiles.response.hits.hits))
      });
    case REJECT_PROFILES:
      return { isLoading: false, items: [], error: action.error };
    default:
      return state;
  }
}

function documents(state = { isLoading: false, items: []}, action) {
  switch (action.type) {
    case REQUEST_DOCUMENTS:
      return Object.assign({}, state, { isLoading: true });
    case RECEIVE_DOCUMENTS:
      return Object.assign({}, state, {
        isLoading: false,
        nbResult: action.documents.response.hits.total,
        items: uniq(state.items.concat(action.documents.response.hits.hits))
      });
    case REJECT_DOCUMENTS:
      return { isLoading: false, items: [], error: action.error };
    default:
      return state;
  }
}

export default combineReducers({
  routing: routeReducer, profiles, documents
});
