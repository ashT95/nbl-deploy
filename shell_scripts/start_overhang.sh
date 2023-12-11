#!/bin/bash

function script(){
    (pkill -f chrome || true) && (/opt/google/chrome/google-chrome --kiosk --disable-pinch --no-first-run --profile-directory=Default --app-id=afhcomalholahplbjhnmahkoekoijban http://localhost:3000/) &
	sleep 2
    cd ~/workspace/nokia_bell_labs_deploy && (node ./overhang_screen/overhang_app.js &) && sleep 1
	xdotool search --onlyvisible --class Chrome windowfocus key ctrl+r
}

if true
then
    script
fi
