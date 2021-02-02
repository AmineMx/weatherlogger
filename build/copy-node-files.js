let fs = require('fs');
let path = require('path');
let dir = './package';

if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
}
fs.copyFileSync(path.resolve(__dirname, '../sLogger.exe'), path.resolve(__dirname, '.././package/sLogger.exe'));
//copy all node file
let nodeDir = path.resolve(__dirname, '../node_modules');


function copyFiles(startPath, filter) {
    if (!fs.existsSync(startPath)) {
        console.log("no dir ", startPath);
        return;
    }

    const files = fs.readdirSync(startPath);
    for (let i = 0; i < files.length; i++) {
        const filename = path.join(startPath, files[i]);
        const stat = fs.lstatSync(filename);
        if (stat.isDirectory()) {
            copyFiles(filename, filter); //recurse
        }
        else if (filename.indexOf(filter) >= 0) {
            console.log(`Copy file ${filename}`);
            fs.copyFileSync(filename, path.resolve(__dirname, '../package/' + path.basename(filename)));
        }
    }
}

copyFiles(nodeDir, '.node');
