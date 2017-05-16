Family Cinema - Desktop App
===========================

Have you ever feel unease about some graphic/explicit content when watching a movie? Would you like to create your own personal version of your favourite movies without unwanted scenes? Then this is your project!!

We want to help user enjoy films, we are not the moral police. We will never tell want to watch and what not to. When watching a film, we provide users with a list of scenes tagged by content. Each user decides what to see and what to skip.

There are three main parts in this project a [website](https://www.fcinema.org), an [API](https://github.com/fcinema/api) and a [desktop app](https://github.com/fcinema/desktop-app). The API provides an online repository of filters, the desktop downloads the filters and apply the selected ones to users movies.

# Installation

This project is build on [electron](http://electron.atom.io/) and [node.js](https://nodejs.org/en/). After installing [Node](https://nodejs.org/en/download/) download/clone this project and on the command line execute 
```
npm install
bower install
```
to install dependencies, and 
```
electron .
```
to run the app.

# Guided tour

Check [utils.js](https://github.com/fcinema/desktop-app/blob/master/utils.js) for functions contacting the API

Check [stream.js](https://github.com/fcinema/desktop-app/blob/master/stream.js) for functions syncing and skiping streamed video

Check [file.js](https://github.com/fcinema/desktop-app/blob/develop/app/views/file.js) for functions syncing and skiping video from files

...


And please, don't' hesitate to contact us ([Ricardo](https://github.com/rjgarciam), [Miguel](https://github.com/arrietaeguren)) for any doubt or suggestion!
