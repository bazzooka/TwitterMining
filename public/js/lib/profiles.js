import Bouchon from '../bouchon';
import fakeResponse from '../../data/profils.json';

export function getProfiles(start, size) {

  return new Promise((resolve, reject) => {
    if(!Bouchon.isBouchon){
      // superagent
      //   .get(TOPICS_URL)
      //   .query({ twitter_account_id: account.id })
      //   .end((err, res) => {
      //     if (err) return reject(new Error(
      //       'Error loading topics'
      //     ));
      //     resolve((res.body || []).map(
      //       ({id, uuid, lang, pretty_name}) =>
      //       ({ id, uuid, lang, name: pretty_name })
      //     ));
      //   });
    } else {
      resolve(fakeResponse);
    }
  });
}
