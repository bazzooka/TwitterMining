var Nightmare = require('nightmare');

var google = new Nightmare()
  .goto('http://google.com')
  .wait()
  .screenshot('google.png')
  .run(function(){ 
	console.log('Done!');
   });
