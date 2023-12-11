#!/bin/bash

function script(){
    xdotool search --onlyvisible --class Chrome windowfocus key ctrl+r &
}

if true
then
    script
fi
