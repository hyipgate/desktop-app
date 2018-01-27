
  //handle setupevents as quickly as possible
 const setupEvents = require('./installers/setupEvents')
 if (setupEvents.handleSquirrelEvent()) {
    // squirrel event handled and app will exit in 1000ms, so don't do anything else
    return;
 }

const electron = require('electron')
// Module to control application life.
const app = electron.app;
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
            // The `plugins` have to be enabled.
            plugins: true
        }
    })

    // remove menu bar
    mainWindow.setMenu(null);

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
ipcMain.on('get-hash', (event, arg) => {
    if (!is_valid_rect(arg.rect)) {
        console.log("[get-hash] (ERROR) invalid rect ", arg.rect)
        return
    }
    mainWindow.capturePage(function handleCapture(img) {
        var img2 = img.crop(arg.rect).resize({ width: 16, height: 9, quality: "good" })
        img = null // this is an attempt to avoid memory leakages

        if (img2.isEmpty()) return console.log('[get-hash] (ERROR) Empty image')
        var hash = bitmap_to_hash(img2.getBitmap())

        img2 = null // this is an attempt to avoid memory leakages
        event.sender.send('hash-ready', { 'hash': hash, 'time': arg.time })
    })
})


ipcMain.on('exit-fullscreen', (event, arg) => {
    if( mainWindow.isFullScreen() ) mainWindow.setFullScreen( false );
})


/**
 * Improves the quality of the rect (croping black borders)
 */
ipcMain.on('improve-rect', (event, arg) => {
    if (!is_valid_rect(arg.orect)) {
        console.log("[improve-rect] (ERROR) invaled rect...", arg.orect)
        return
    }
    console.log('[improve-rect] got a valid rect...', arg.orect)
    mainWindow.capturePage(function handleCapture(img) {
        var orect = arg.orect
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

        var rect = orect
        rect.y = Math.round(orect.y + trim / 2);
        rect.height = Math.round(orect.height - trim);


        if (is_valid_rect(rect)) {
            console.log("got new improved rect ", rect)
            event.sender.send('improved-rect-ready', { 'orect': orect, 'rect': rect })
        } else {
            console.log("[improve-rect] (ERROR) got invalied rect", rect)
        }

    })
})

function is_valid_rect(rect) {
    if (rect.x === undefined || rect.x < 0 || !Number.isInteger(rect.x)) return false
    if (rect.y === undefined || rect.y < 0 || !Number.isInteger(rect.y)) return false
    if (!rect.width || rect.width <= 0 || !Number.isInteger(rect.width)) return false
    if (!rect.height || rect.height <= 0 || !Number.isInteger(rect.height)) return false
    return true
}

function bitmap_to_hash(data) {
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
}