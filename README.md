# YouTube Wall

On a recent trip to the YouTube offices I noticed their cool video wall playing popular YouTube videos in the lobby. We needed one of those in our office, but we didn't really think purchasing nine huge monitors as a cost effective solution at this time...but I figured I could make something pretty close using the YouTube API that would run on a single monitor.

## Requirements

* node.js
* node-static module

## If you don't already have a running web server...

### Installation

* Install node.js (http://howtonode.org/how-to-install-nodejs)
* Install npm

  curl https://npmjs.org/install.sh | sh

* Install the node-static module

  npm install node-static

### Usage

  ./bin/start.sh

## If you already have a running web server...

* Just point a host to ./index.html and load it up!