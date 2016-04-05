import Bouchon from '../bouchon';
import superagent from 'superagent';
import fakeResponse from '../../data/profils.json';

export function getProfiles(start, size) {

  return new Promise((resolve, reject) => {
    if(!Bouchon.isBouchon){
      superagent
       .get('/getProfils')
       .query({
         start: start,
         size: size
       })
       .end(function(err, res){
         if(err){
           return reject(err);
         }
         return resolve(JSON.parse(res.text));
       });
    } else {
      resolve(fakeResponse);
    }
  });
}
