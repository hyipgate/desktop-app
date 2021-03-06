//handle setupevents as quickly as possible
const setupEvents = require('./installers/setupEvents')
if (setupEvents.handleSquirrelEvent()) {
    // squirrel event handled and app will exit in 1000ms, so don't do anything else
    return;
}

const electron = require('electron')
// Module to control application life.
const app = electron.app;
const Menu = electron.Menu;
const autoUpdater = electron.autoUpdater;
const dialog = electron.dialog;
const ipcMain = electron.ipcMain;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

const appVersion = require('./package.json').version;
const os = require('os').platform();

const isDev = require('electron-is-dev');


const widevine = require('electron-widevinecdm');
widevine.load(app);

// Add ffmpeg and ffprobe to PATH
const fcinemaPath = app.getAppPath();
if (process.platform === 'win32') {
    let ffmpegPath = fcinemaPath + '\\node_modules\\@ffmpeg-installer\\win32-x64\\ffmpeg.exe';
    let ffprobePath = fcinemaPath + '\\node_modules\\@ffprobe-installer\\win32-x64\\ffprobe.exe';
    process.env.FFMPEG_PATH = ffmpegPath;
    process.env.FFPROBE_PATH = ffprobePath;
}else if(process.platform === 'darwin'){
    let ffmpegPath = fcinemaPath + '/node_modules/@ffmpeg-installer/darwin-x64/ffmpeg';
    let ffprobePath = fcinemaPath + '/node_modules/@ffprobe-installer/darwin-x64/ffprobe';
    process.env.FFMPEG_PATH = ffmpegPath;
    process.env.FFPROBE_PATH = ffprobePath;
//console.log('fCinemaPath', fcinemaPath);
//console.log('ffmpegPath', ffmpegPath);
//console.log('ffprobePath', ffprobePath);
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 1190,
        height: 680,
        minHeight: 610,
        minWidth: 890,
        webPreferences: {
            plugins: true // The `plugins` have to be enabled.
        }
    })

    var template = [{
        label: "fCinema",
        submenu: [
            { label: "About fCinema", selector: "orderFrontStandardAboutPanel:" },
            { type: "separator" },
            { label: "Quit", accelerator: "Command+Q", click: function() { app.quit(); } }
        ]
    }, {
        label: "Edit",
        submenu: [
            { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
            { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
            { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
        ]
    }];

    if (process.platform === 'darwin') {
        const menu = Menu.buildFromTemplate(template)
        Menu.setApplicationMenu(menu)
    } else {
        Menu.setApplicationMenu(null);
    }


    // and load the index.html of the app.
    mainWindow.loadURL('file://' + __dirname + '/app/index.html')

    // Open the DevTools in development version
    if (isDev) {
        mainWindow.webContents.openDevTools({ detach: true });
    }

    // Emitted when the window is closed.
    mainWindow.on('closed', function() {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null
    })
    var url;
    if (!isDev) {
        const server = 'https://hazel-server-omngoodbmi.now.sh'
        url = `${server}/update/${process.platform}/${app.getVersion()}`
        const feed = url;
        autoUpdater.setFeedURL(feed);
        autoUpdater.checkForUpdates();
    }

    autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {
        const dialogOpts = {
            type: 'info',
            buttons: ['Restart', 'Later'],
            title: 'Application Update',
            message: process.platform === 'win32' ? releaseNotes : releaseName,
            detail: 'A new version has been downloaded. Restart the application to apply the updates.'
        }

        dialog.showMessageBox(dialogOpts, (response) => {
            if (response === 0) autoUpdater.quitAndInstall()
        })
    })

    global.gVar = {
        conversionProgress: 0,
    }
}


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)


// Quit when all windows are closed.
app.on('window-all-closed', function() {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', function() {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow()
    }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

var video_rect = {
    raw: false,
    trimmed: false,
    is_new_rect: function(a) {
        b = video_rect.raw
        return (!b || a.x !== b.x || a.y !== b.y || a.width !== b.width || a.height !== b.height)
    },

    is_valid_rect: function(rect) {
        if (rect.x === undefined || rect.x < 0 || !Number.isInteger(rect.x)) return false
        if (rect.y === undefined || rect.y < 0 || !Number.isInteger(rect.y)) return false
        if (!rect.width || rect.width <= 0 || !Number.isInteger(rect.width)) return false
        if (!rect.height || rect.height <= 0 || !Number.isInteger(rect.height)) return false
        return true
    },

    bitmap_to_hash: function(data) {
        var base64 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+-";
        var hash = ""
        for (var i = 4; i < data.length - 20; i += 24) {
            var n = (data[i - 4] > data[i]) * 1
            n += (data[i - 4 + 4] > data[i + 4]) * 2
            n += (data[i - 4 + 8] > data[i + 8]) * 4
            n += (data[i - 4 + 12] > data[i + 12]) * 8
            n += (data[i - 4 + 16] > data[i + 16]) * 16
            n += (data[i - 4 + 20] > data[i + 20]) * 32
            hash += base64.charAt(n)
        };
        return hash;
    },

    trim: function(orect) {
        if (!video_rect.is_valid_rect(orect)) return console.log("[improve-rect] (ERROR) invalid rect ", orect)
        if (!mainWindow.isVisible()) return console.log("[improve-rect] Window is not visible")
        mainWindow.capturePage(function handleCapture(img) {
            if (img.isEmpty()) return console.log('[get-hash] (ERROR) Empty image')
            var bitmap = img.getBitmap()
            var columns = img.getSize().width
            var rows = img.getSize().height

            function whiteness(i, j) {
                j += orect.y
                i += orect.x
                var r = bitmap[(j * columns + i) * 4]
                var g = bitmap[(j * columns + i) * 4 + 1]
                var b = bitmap[(j * columns + i) * 4 + 2]
                return (r + g + b) + 10 * Math.abs(r - g) + 10 * Math.abs(b - g)
            }

            function scanY() {
                for (var j = 0; j < orect.height; j++) {
                    var sum = 0;
                    for (var i = 0; i < orect.width - 1; i++) {
                        sum += whiteness(i, j)
                    }
                    console.log(sum / orect.width)
                    if (sum / orect.width > 100) return j
                }
            }

            function find_closest_ratio(our_ratio) {
                var usual_ratios = [1.33, 1.77, 1.85, 2.39]
                var dmin = Infinity;
                var amin = 0;
                for (var i = 0; i < usual_ratios.length; i++) {
                    var d = Math.abs(usual_ratios[i] - our_ratio)
                    if (d < dmin) {
                        dmin = d;
                        amin = i;
                    }
                }
                console.log(usual_ratios[amin], our_ratio)
                return usual_ratios[amin]

            }

            var trim_top = scanY()

            if (trim_top > orect.height / 2) return console.log("[improve-rect] (ERROR) screen is black :)")

            var ratio = find_closest_ratio(orect.width / (orect.height - 2 * trim_top))

            var trim = orect.height - orect.width / ratio;

            if (trim < 0) return console.log("[improve-rect] (ERROR) Negative trimming????")

            console.log("before ", orect)
            var rect = JSON.parse(JSON.stringify(orect));
            rect.y = Math.round(orect.y + trim / 2);
            rect.height = Math.round(orect.height - trim);


            if (!video_rect.is_valid_rect(rect)) return console.log("[improve-rect] (ERROR) got invalied rect", rect)

            console.log("got new improved rect ", rect)
            video_rect.trimmed = rect
            console.log("Saving orignal ", orect)
            video_rect.raw = orect
        })
    }
}

ipcMain.on('get-hash', (event, arg) => {
    if (!video_rect.trimmed || video_rect.is_new_rect(arg.rect)) {
        console.log("Improving video rect: ", !video_rect.trimmed, video_rect.is_new_rect(arg.rect))
        video_rect.trim(arg.rect)
        return
    }
    if (!mainWindow.isVisible()) return console.log("[get-hash] Window is not visible")
    mainWindow.capturePage(function handleCapture(img) {
        var img2 = img.crop(video_rect.trimmed).resize({ width: 16, height: 9, quality: "good" })
        img = null // this is an attempt to avoid memory leakages

        if (img2.isEmpty()) return console.log('[get-hash] (ERROR) Empty image')
        var hash = video_rect.bitmap_to_hash(img2.getBitmap())

        img2 = null // this is an attempt to avoid memory leakages
        event.sender.send('hash-ready', { 'hash': hash, 'time': arg.time })
    })
})


ipcMain.on('exit-fullscreen', (event, arg) => {
    if (mainWindow.isFullScreen()) mainWindow.setFullScreen(false);
})