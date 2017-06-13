const electron = require( 'electron' )
    // Module to control application life.
const app = electron.app
const ipcMain = electron.ipcMain
    // Module to create native browser window.
const BrowserWindow = electron.BrowserWindow


const widevine = require( 'electron-widevinecdm' );
widevine.load( app );


// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow( {
        width: 1190,
        height: 680,
        webPreferences: {
            // The `plugins` have to be enabled.
            plugins: true
        }
    } )

    // remove menu bar
    mainWindow.setMenu( null );

    // and load the index.html of the app.
    mainWindow.loadURL( 'file://' + __dirname + '/app/index.html' )

    // Open the DevTools.
    mainWindow.webContents.openDevTools( { detach: true } )

    // Emitted when the window is closed.
    mainWindow.on( 'closed', function() {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null
    } )
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on( 'ready', createWindow )

// Quit when all windows are closed.
app.on( 'window-all-closed', function() {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if ( process.platform !== 'darwin' ) {
        app.quit()
    }
} )

app.on( 'activate', function() {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if ( mainWindow === null ) {
        createWindow()
    }
} )

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
ipcMain.on( 'get-hash', ( event, arg ) => {
    if ( !is_valid_rect( arg.rect ) ){
      console.log("Unable to capture page (check rect)")
      return
    } 
    mainWindow.capturePage( function handleCapture( img ) {
        img = img.crop( arg.rect ).resize( { width: 16, height: 9, quality: "good" } )
        var hash = bitmap_to_hash( img.getBitmap() )
        img = null
        event.sender.send( 'hash-ready', { 'hash': hash, 'time': arg.time } )
    } )
} )

function bitmap_to_hash( data ) {
    var base64 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+-";
    var hash = ""
    for ( var i = 4; i < data.length - 20; i += 24 ) {
        var n = ( data[ i - 4 ] > data[ i ] ) * 1
        n += ( data[ i - 4 + 4 ] > data[ i + 4 ] ) * 2
        n += ( data[ i - 4 + 8 ] > data[ i + 8 ] ) * 4
        n += ( data[ i - 4 + 12 ] > data[ i + 12 ] ) * 8
        n += ( data[ i - 4 + 16 ] > data[ i + 16 ] ) * 16
        n += ( data[ i - 4 + 20 ] > data[ i + 20 ] ) * 32
        hash += base64.charAt( n )
    };
    return hash;
}


/**
 * Improves the quality of the rect (croping black borders)
 */
ipcMain.on( 'improve-rect', ( event, arg ) => {
    console.log('improve-rect',arg)
    return
    if ( !is_valid_rect( arg.orect ) ) return
    mainWindow.capturePage( function handleCapture( img ) {
        console.log( "improve rect, don't do this too often" )
        var orect = arg.orect
        img = img.crop( orect )//.resize( { width: Math.floor(orect.width/4), height: orect.height, quality: "good" } )
        
        var bitmap = img.getBitmap()
        var columns = img.getSize().width
        var rows = img.getSize().height
        console.log( columns, orect.width, rows, orect.height )
        img = null
        var j = 0;
        for ( j = 0; j < rows; j++ ) {
            var sum = 0;
            for ( var i = 1; i < columns - 1; i++ ) {
                var r = bitmap[ ( j * columns + i ) * 4 ]
                var g = bitmap[ ( j * columns + i ) * 4 + 1 ]
                var b = bitmap[ ( j * columns + i ) * 4 + 2 ]
                sum += ( r + g + b ) + 10 * Math.abs( r - g ) + 10 * Math.abs( b - g )
            }
            console.log( sum / columns )
            if ( sum / columns > 5000 ) break;
        }
        var first = j - 1;
        var usual_ratios = [ 1.33, 1.77, 1.85, 2.39 ]
        var our_ratio  = columns / ( rows - 2*first ) // assume symmetric
        var dmin = Infinity;
        var imin = 0;
        for ( var i = 0; i < usual_ratios.length; i++ ) {
            var d = Math.abs( usual_ratios[ i ] - our_ratio )
            if ( d < dmin ) {
                dmin = d;
                imin = i;
            }
        }
        var rect = {}
        rect.height = Math.round( orect-(2*first) )
        rect.width  = Math.round( rect.height*usual_ratios[ imin ] )
        rect.y      = Math.round( orect.y + (orect.height-rect.height)/2 )
        rect.x      = Math.round( orect.x + (orect.width-rect.width)/2 )
        console.log( first, usual_ratios[ imin ], our_ratio )
        if ( is_valid_rect( rect ) ) {
          event.sender.send( 'improved-rect-ready', { 'orect': orect, 'rect': rect } )  
        } else {
          console.log("unable to get a valid a rect", rect )
        }
        
    } )
} )

function is_valid_rect( rect ) {
  if ( !rect.x || rect.x <=0 || !Number.isInteger(rect.x) ) return false
  if ( !rect.y || rect.y <=0 || !Number.isInteger(rect.y) ) return false
  if ( !rect.width || rect.width <=0 || !Number.isInteger(rect.width) ) return false
  if ( !rect.height || rect.height <=0 || !Number.isInteger(rect.height) ) return false
  return true
}
