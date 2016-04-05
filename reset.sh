pm2 stop all
curl -XDELETE 'http://localhost:9200/twitter/'
pm2 flush
pm2 reset es_mining
pm2 reset es_profil
pm2 restart all
