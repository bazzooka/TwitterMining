import { getProfiles } from '../lib/profiles';
import { getDocuments } from '../lib/documents';


export const REQUEST_PROFILES = 'REQUEST_PROFILES';
export const RECEIVE_PROFILES = 'RECEIVE_PROFILES';
export const REJECT_PROFILES = 'REJECT_PROFILES';

export const REQUEST_DOCUMENTS = 'REQUEST_DOCUMENTS';
export const RECEIVE_DOCUMENTS = 'RECEIVE_DOCUMENTS';
export const REJECT_DOCUMENTS = 'REJECT_DOCUMENTS';

const requestProfiles = () => ({ type: REQUEST_PROFILES });
const receiveProfiles = profiles => ({ type: RECEIVE_PROFILES, profiles });
const rejectProfiles = error => ({ type: REJECT_PROFILES, error });

const requestDocuments = () => ({ type: REQUEST_DOCUMENTS });
const receiveDocuments = documents => ({ type: RECEIVE_DOCUMENTS, documents });
const rejectDocuments = error => ({ type: REJECT_DOCUMENTS, error });

export function fetchProfiles() {
  return (dispatch, getState) => {
    dispatch(requestProfiles());
    return getProfiles(0, 5)
      .then(profiles => dispatch(receiveProfiles(profiles)))
      .catch(err => dispatch(rejectProfiles(err)));
  };
}

export function fetchDocuments() {
  return (dispatch, getState) => {
    dispatch(requestDocuments());
    return getDocuments(0, 5)
      .then(documents => dispatch(receiveDocuments(documents)))
      .catch(err => dispatch(rejectDocuments(err)));
  };
}
