import Bouchon from '../bouchon';
import superagent from 'superagent';
import fakeResponse from '../../data/documents.json';

export function getDocuments(start, size) {

  return new Promise((resolve, reject) => {
    if(!Bouchon.isBouchon){
      superagent
       .get('/getDocuments')
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
