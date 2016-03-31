# Start ElasticSearch

# start process
pm2 start ./es_mining.js
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
