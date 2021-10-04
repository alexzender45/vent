const multer = require("multer"),
  path = require("path");
//multer.diskStorage() creates a storage space for storing files.
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (["image/jpeg", "image/png", "image/jpg", "image/gif", "video/mp4"].includes(file.mimetype)) {
      cb(null, path.join(__dirname, ".././files"));
    } else {
      cb({ message: "This file is not an image file" }, false);
    }
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const storageManyImage = multer.diskStorage({
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "-" + Date.now());
  },
});

module.exports = {
  imageUpload: multer({ storage: imageStorage }),
  manyImageUpload: multer({ storage: storageManyImage }),
};