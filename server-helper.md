# Start mongo
mongod --dbpath /srv/mongo/db

# start process
pm2 start ./mining.js
pm2 start ./profile.js
pm2 start ./document.js
