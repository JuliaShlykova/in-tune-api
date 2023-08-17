const imageKit = require('../configs/storage.config');

exports.removeProfileImg = (file) => {
  imageKit.deleteFile(file, function(error, result) {
    if(error) console.log(error);
    else console.log(result);
  })
}

exports.uploadProfileImg = (file) => {
  return imageKit.upload({
    file: file.buffer.toString('base64'),
    fileName: file.originalname,
    useUniqueFileName: true
  })
}