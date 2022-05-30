var fs = require('fs');
var fse = require('fs-extra');

var sourceDir = './lib/node-notifier';
var destDir = './node_modules/node-notifier';


// if folder doesn't exists create it
if (!fs.existsSync(destDir)){
    fs.mkdirSync(destDir, { recursive: true });
    //copy directory content including subfolders
    fse.copy(sourceDir, destDir, function (err) {
      if (err) {
        console.error(err);
    } else {
          // const child_process = require('child_process');
          // child_process.execSync('cd ./node_modules/node-notifier && npm install',{stdio:[0,1,2]});
          // exec('cd ./node_modules/node-notifier && npm install');
        console.log("success!");
      }
    });
}

