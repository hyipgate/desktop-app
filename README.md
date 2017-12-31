Family Cinema - Desktop App
===========================

Have you ever feel unease about some graphic/explicit content when watching a movie? Would you like to "magically" remove those scenes from your favourite movies? Then this is your project!!

We want to help user enjoy films, we are not the moral police. We will never tell you what to watch and what not to. When watching a film, we provide users with a list of scenes tagged by content. Each user decides what to see and what to skip.

There are three main parts in this project a [website](https://github.com/fcinema/fcinema_web), an [API](https://github.com/fcinema/api) and a [desktop-app](https://github.com/fcinema/desktop-app). The website is our public image, the API provides an open repository of filters, the desktop-app downloads the filters and removes the scenes selected by the user.

# Installation

This project is build on [electron](http://electron.atom.io/) and [node.js](https://nodejs.org/en/). After installing [node.js](https://nodejs.org/en/download/) download/clone this project and install depencies by executing 
```
npm install
bower install
```
from the project folder. To run the app, execute
```
electron .
```

# Guided tour

Check [utils.js](https://github.com/fcinema/desktop-app/blob/develop/utils.js) for functions contacting the API

Check [stream.js](https://github.com/fcinema/desktop-app/blob/develop/stream.js) for functions syncing and skiping streamed video

Check [file.js](https://github.com/fcinema/desktop-app/blob/develop/app/views/file.js) for functions syncing and skiping video from files

...
