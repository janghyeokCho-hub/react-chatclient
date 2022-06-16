var fs = require('fs');
var fse = require('fs-extra');

var sourceDir = './lib/noti-prod/node-notifier';
var destDir = './node_modules/node-notifier';

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
  fse.copy(sourceDir, destDir, function (err) {
    if (err) {
      console.error(err);
    } else {
      console.log('success!');
    }
  });
} else {
  fs.rmdir(
    destDir,
    {
      recursive: true,
    },
    error => {
      if (error) {
        console.log(error);
      } else {
        console.log('Recursive: Directories Deleted!');
        fs.mkdirSync(destDir, { recursive: true });
        fse.copy(sourceDir, destDir, function (err) {
          if (err) {
            console.error(err);
          } else {
            console.log('success!');
          }
        });
      }
    },
  );
}