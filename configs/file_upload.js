let multer = require('multer');
/*
    파일 서버를 따로 만들어서 처리하기
    로컬이랑 배포랑 property를 따로 해서 따로 저장
    개발환경, 서버를 분리 
*/
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
