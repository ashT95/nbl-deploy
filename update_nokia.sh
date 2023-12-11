#!/bin/bash
git pull
npm install
npm run build
cd touch_table/sensor_server && npm install
cd ~/workspace/nokia_bell_labs_deploy
sudo rm -rf /usr/local/bin/nokia_bell_labs_deploy
sudo cp -r ../nokia_bell_labs_deploy /usr/local/bin
sudo cp service_scripts/*.service /etc/systemd/system
sudo systemctl daemon-reload
cd /usr/local/bin/nokia_bell_labs_deploy/touch_table/sensor_server &&
echo '{"serverport":3001,"name":"'$USER'", "overhangip":"http://192.168.1.122:3000"}' | sudo tee touch_server_config.json >> /dev/null
