let multer = require('multer');

let Storage = multer.diskStorage({
    destination: function(req, file, callback) {
        callback(null, "./public/petfood_images");
    },
    filename: function(req, file, callback) {
        callback(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
    }
});

exports.middle_upload = multer({
    storage: Storage
}).single("petfood_image"); //Field name and max count
