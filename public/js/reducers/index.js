import { combineReducers } from 'redux';
import { routeReducer } from 'redux-simple-router';
import {
  REQUEST_PROFILES, RECEIVE_PROFILES, REJECT_PROFILES,
  REQUEST_DOCUMENTS, RECEIVE_DOCUMENTS, REJECT_DOCUMENTS } from '../actions';


function profiles(state = { isLoading: false, items: []}, action) {
  switch (action.type) {
    case REQUEST_PROFILES:
      return Object.assign({}, state, { isLoading: true });
    case RECEIVE_PROFILES:
      return Object.assign({}, state,{ isLoading: false, items: action.profiles });
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
      return Object.assign({}, state,{ isLoading: false, items: action.documents });
    case REJECT_DOCUMENTS:
      return { isLoading: false, items: [], error: action.error };
    default:
      return state;
  }
}

export default combineReducers({
  routing: routeReducer, profiles, documents
});
