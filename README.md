# nokia_bell_labs Deploy

This project is for an install that was deployed at Nokia Bell Labs Museum during October 2018.  

The experience include 3 transparent touch screens ([Hypebox](https://hypebox.io/)) and another dual sided screen hanging from the ceiling.  
Each of the screens is connected to it's own computer ([Intel NUC](https://www.bhphotovideo.com/c/product/1327194-REG/intel_boxnuc7i7bnh_nuc_bnh_7th_gen.html)).  

All computers are connected to the same router and communicate through web sockets.  
Each of the 3 computers connected to the transparent screens is also connected to a ultrasonic [distance sensor](https://www.maxbotix.com/Ultrasonic_Sensors/MB1403.htm)(MB1403 HRUSB-MaxSonar-EZ0) mounted on the table.

## Interface / Experience / User Flow

The three Hypeboxes on the table each present one theme related to Bell Lab's research and history, and showcasing physical objects related the content.
All the screens are playing a screen saver of particles, the all "wake up" when one of the distance sensors is triggered of it one of the screens is tapped.

Each screen has a number of topics that the user can tap to learn more about. Tapping a topic name will open a content box with text and related media. If there is also a related physical artifact it will be revealed through a white aperture on the screen.
The over hang screen is showing the content box currently being interacted with. The change topics the user can close the current content box with the "x" button on the top left or select another topic from the menu on the bottom.

## Code Structure
All the content is in `shared/config/content.json`. The `screens` object contains the data for each of the touch screens. 
Each computer should have a local version of `shared/config/touch_server_config.json` following the format of `touch_server_config.sample.json` in that same folder.
The `name` field have to match one of the keys in the `screens` object in `content.json` (for example `"touchtable_1"`).

[Handlebars.js](https://handlebarsjs.com/) is used as a template language to compile templates into html
JQuery is used throughout the code to control specific elements

Some images and files are too big so we are using git LFS to store them.
To make sure you have all the files:
Download and install [Git LFS](https://help.github.com/articles/installing-git-large-file-storage/#platform-linux)
cd into `workspace/nokia_bell_labs_deploy` and run `git lfs fetch --all`

```angular2html
├── overhang_screen
│   ├── js
│   │   └── index.js                # code to control overhang logic
│   ├── overhang_app.js             # express serve to serve overhang interface
│   ├── static                      # files built from npm run build:overhang command go in here
│   └── styles                      # less (CSS) styles for overhang interface (compiled into static folder)
├── service_scripts                 # all the scripts to start up the various services using systemd
├── shared                          # files shared between overhang and touch tables interfaces
│   ├── assets                      # static assets like images fonts etc.
│   ├── config                      # static content and local config file go in here
│   ├── fl_custom_particle_system   # custom particle system running in the background
│   ├── js                          # shared javascript files like animations and web sockets definitions
│   ├── styles                      # shared styles including colors and typography definitions
│   └── templates                   # Handlebars templates that are compiled to html during build time
├── touch_table
│   ├── js                          # touch table interface logic
│   ├── sensor_server               # all code related to distance sensor
│   ├── static                      # files built from npm run build:touch command go in here
│   ├── styles                      # less (CSS) styles for touch interface (compiled into static folder)
│   └── touch_app.js                # express serve to serve touch interface
└── update_nokia.sh                 # script to update the computer to run the latest version on master

```


## Updates and Troubleshooting

To update the code running in the Museum:
- on each computer open a terminal (meta button on the keyboard + pageDown to minimize the kiosk screen)
```angular2html
cd workspace
cd nokia_bell_labs_deploy
git pull

./update_nokia.sh
# type the computer password when prompted

reboot # this will reboot the computer and re-start the updated version after startup
```

All 4 computers have TeamViewer installed on them. If there is a need to troubleshoot remotely, a Nokia Bell Labs team member will have to open the TeamViewer interface and send us the temporary IDs and passwords




## Setting up computer and environment
**Computer SetUp**

1.0 Bios(NUC7i7BNH)
-none

1.1 Ubuntu Install
- 17.04 from usb

**SetUp Enviornment**

2.0 Ubuntu Gnome

Install gnome (desktop evnvironmnet)
```
sudo apt-get install gnome-shell
```
logout and login with gnome(Default)

```
sudo apt-get install gnome-tweak-tool
```
go to https://extensions.gnome.org with chrome
Search for "Disable Gesture" and install it


-Software & Updates -> on Updates tap, set "Notify me of a new ubuntu version" to "Never"

-Settings -> Privacy
   - set "Screen Lock" to "OFF"
   - set "Show Notification" to "OFF"
   
-Settings -> Power
   - set "Dim screen when inactive" to "OFF"
   - set "Blank screen" to " Never"
   
-System Settings -> security & privacy -> Locking and unlocking
   - set "Sleep when idle" to "Never" 
    

2.1 Git
register sshkey to github account
https://help.github.com/articles/connecting-to-github-with-ssh/

```
sudo apt-get update
sudo apt-get install git
mkdir ~/workspace && cd ~/workspace
git clone https://github.com/fakelove/nokia_bell_labs_deploy
```
2.2 Node
```
curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
sudo apt-get install -y nodejs
```
2.3 Node lib
```
sudo apt install libsystemd-dev  (support for systemd)
```
2.4 xdotool
```
sudo apt install xdotool  (to refresh kiosk after startup)
```
  for overhang
```
cd ~/workspace/nokia_bell_labs_deploy/ && npm install
```
   for touch table
```
cd ~/workspace/nokia_bell_labs_deploy/ && npm install
cd ~/workspace/nokia_bell_labs_deploy/ && npm run build
cd ~/workspace/nokia_bell_labs_deploy/backend/touch_table/sensor_server && npm install


```
```
vi ~/workspace/nokia_bell_labs_deploy/backend/touch_table/touch_server/touch_server_config.json
```
change name to 'touchatable_1~3', hangoverip to 'http://IP_OF_HANGOVER_SCREEN_NUC:3000"

2.4 USB sensor 
   after pluing sensor usb
```
sudo adduser $USER dialout 
sudo chown $USER /dev/ttyUSB0
sudo apt-get remove modemmanager
sudo apt-get purge modemmanager
sudo usermod -a -G dialout $USER
```
2.5 other helpful debug
```
sudo apt-get install net-tools
sudo apt-get install vim
sudo npm install forever --global
sudo apt-get install openssh-server
```
2.6 Chrome
```
sudo apt-get install libxss1 libappindicator1 libindicator7
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome*.deb
sudo apt-get install -f
```
navigate to chrome://flags/#overscroll-history-navigation -> Disable it

settings -> Languages -> Language -> offer to translate pages that aren't in a language you read -> off

2.7 Auto reboot
```
sudo crontab -e
```
add a line at the end
```
0 4 * * * /sbin/shutdown -r +5
```
restart the service
```
sudo systemctl restart cron
```
2.8 Remove Internal Error Window
```
sudo vi /etc/default/apport
```
edit 'enabled=1' to 
```
enabled=0
```
2.9 stop Chrome auto update
```
sudo rm /etc/apt/sources.list.d/google-chrome.list
```
2.10 disable Notification with NoNotification
```
sudo add-apt-repository ppa:vlijm/nonotifs
sudo apt-get update
sudo apt-get install nonotifs
```
Open NoNotifications using the spotlight search bar. You should see a small green icon appear on the top right menu bar. Click the icon and select "Don't disturb". Next select preferences and check "Run on startup".

3.1 Systemd
```
sudo mv nokia_bell_labs_deploy /usr/local/bin/     (finished the prep)
sudo cp /usr/local/bin/nokia_bell_labs_deploy/service_scripts/* /etc/systemd/system
```
   for overhang
```
sudo systemctl start overhangnodeserver.service
sudo systemctl enable overhangnodeserver.serivce
```
   for touch table
```
sudo systemctl start touchnodeserver.service
sudo systemctl enable touchnodeserver.service
sudo systemctl start sensornodeserver.serivce
sudo systemctl enable sensornodeserver.serivce
```
   for Chrome Kiosk
```
sudo vi startup_nokia_kiosk_1.service (Edit 'User=nokia-nuc' to 'User=USER_NAME')
sudo systemctl start startup_nokia_kiosk_1.service
sudo systemctl enable startup_nokia_kiosk_1.service
```
   to view status
```
sudo systemctl status SERVICE_NAME   
```
   to view logs
```
journctl -f -u SERVICE_NAME
```

4.1 Update Software
```
cd ~/workspace/nokia_bell_labs_deploy
./update_nokia.sh
```
this will update, build and install new version of the app.
```
sudo vi /etc/systemd/system/startup_nokia_kiosk_1.service
```
under [Service] edit "User=nokia-touch-1" to "User=nokia-touch-XX" (correct computer name, eg "User=nokia-touch-3")

*only for overhang
```
sudo vi /usr/local/bin/nokia_bell_labs_deploy/service_scripts/start_kiosk.sh
```
edit "http://localhost:3001" to "http://localhost:3000"
```
sudo reboot
```


## Content Character count limits:

Act Title [Future of Networked Intelligence] : 32
Chapter Title [Augmented Intelligence] : 25
Up to 4 chapters
Chapter Intro [In 1950, ....] : 310
Artifact caption [Original printing of Claude Shannon’s 1948 paper on Information Theory]: 70

The rest of the content in scrollable to there is no limit




