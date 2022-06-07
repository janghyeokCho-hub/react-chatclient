var fs = require('fs');
var fse = require('fs-extra');

var sourceDir = './lib/node-notifier';
var destDir = './node_modules/node-notifier';


// if folder doesn't exists create it
console.log('???', fs.existsSync(destDir))
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
} else {
  fs.rmdir(destDir, {
    recursive: true,
  }, (error) => {
    if (error) {
      console.log(error);
    }
    else {
      console.log("Recursive: Directories Deleted!");
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
      // Get the current filenames
      // in the directory to verify
      // getCurrentFilenames();
    }
  });
}