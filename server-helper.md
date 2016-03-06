# Start mongo
mongod --dbpath /srv/mongo/db

# start process
pm2 start ./mining.js
pm2 start ./profile.js
pm2 start ./document.js


# APPLI
https://github.com/erikras/react-redux-universal-hot-example

# MOUNT sshfs
sshfs root@91.121.160.152:/var/.. /Users/jonathan/...

# UNMOUNT sshfs
pgrep -lf sshfs
kill -9 <pid_of_sshfs_process>
sudo umount -f <mounted_dir>

# TODO
1. ES_PROFILE
1.1 Stop to crawl last 100 tweets. Just create profil on database if it doesn't exists
1.2 Try to get tweets with cheerio with another thread that constantly get last tweets of registered profiles

2. ES_DOCUMENT
2.1 Memory explodes ! Check promises and setInterval cohabitation
2.2 For each tweet.urls get document and increment profil score rank with nbDocument, % (score/nbDocument)x100

Dont do 1.2 and 2.2 they are incompatible. They both calculate profil ranking
