#!/bin/bash

function script(){
    cd ~/workspace/nokia_bell_labs_deploy && git add "shared/config/content.json" && git commit -m "update content via CMS" && git push &
}

if true
then
    script
fi
