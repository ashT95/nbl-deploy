#!/bin/sh
# start kiosk mode then refresh to get full screen

(/opt/google/chrome/google-chrome --kiosk --disable-pinch --no-first-run --profile-directory=Default --app-id=afhcomalholahplbjhnmahkoekoijban http://localhost:3001/) &
sleep 2
xdotool search --onlyvisible --class "Chrome" windowfocus key 'ctrl+r'