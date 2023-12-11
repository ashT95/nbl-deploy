#!/bin/bash

function script(){
    (pkill -f chrome || true) && (/opt/google/chrome/google-chrome --kiosk --disable-pinch --no-first-run --password-store=basic --profile-directory=Default --app-id=afhcomalholahplbjhnmahkoekoijban http://localhost:3001/) &
	sleep 2
	cd ~/workspace/nokia_bell_labs_deploy && (node ./touch_table/touch_app.js &) && sleep 1
    cd ~/workspace/nokia_bell_labs_deploy && (node ./sensor_server/sensor_app.js &) && sleep 1
    cd ~/workspace/nbl-museum-cms && (node ./server.js &) && sleep 1
	xdotool search --onlyvisible --class Chrome windowfocus key ctrl+r
}

if true
then
    script
fi
