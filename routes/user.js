/* 초기화 */
const express = require("express");
const router = express.Router();

/* 데이터베이스 */
const pool = require("../configs/mysql");

/* 쿼리 */
const {
    FIND_USER_BY_ID,
    COUNT_USER,
    INSERT_USER
} = require("../queries/user");

/* 에러처리 */
const {
    NoIdOrPasswordError,
    UserNotFoundError,
    WrongPasswordError,
    FormNotFilledError,
    IdDuplicateError
} = require("../configs/errors")

/* 유틸리티 */
const bcrypt = require("bcryptjs");
const saltRounds = 10;

// 로그인 페이지
router.get("/login", (req, res) => {

    var data = {};

    // 이미 로그인이 된 상태라면 첫 페이지로 redirect
    if(req.session.userid) {
        return res.redirect("/");
    }

    // required 파라미터에 따라서 표시하는 메시지가 달라짐
    switch (req.query.required) {
        case "true":
        data.required = true;
        data.login_message = "로그인이 필요한 기능입니다.";
        break;
        case "admin":
        data.required = true;
        data.login_message = "관리자 권한이 필요한 기능입니다.";
        break;
        case "register":
        data.required = true;
        data.login_message = "회원 가입이 완료되었습니다. <br>로그인해주세요.";
        break;
    }

    //로그인 완료 된 후 리퍼러로 돌아가기 위해 저장
    data.referer = req.headers.referer;

    return res.render("login_and_register",data);
});

//로그인 post request, rest
router.post("/login", (req, res, next) => {

    const {userid, password, hashed_password} = req.body;
    let connection;
    let login_success = false;

    // id와 password 둘중에 하나가 없다면 에러
    if (!userid || !password) {
        return next(new NoIdOrPasswordError());
    }

    pool.getConnection()
    .then(conn => {
        connection = conn;
        return connection.query(FIND_USER_BY_ID,[userid]);
    })
    .then(result => {
        let user = result[0];
        //유저가 없다면 에러
        if(!user || !user.hasOwnProperty("password")) {
            connection.release();
            throw new UserNotFoundError();
        }
        bcrypt.compare(hashed_password, user.password, function(err, hash_result) {
            connection.release();
            if(hash_result) {
                // 로그인 성공하면 session에 유저 정보 저장
                req.session.userid = user.userid;
                req.session.user_level = user.user_level;
                req.session.username = user.username;
                req.session.user_num = user.user_num;

                return res.json({
                  status : "OK",
                  message : "로그인에 성공했습니다.",
                  referer : req.body.referer
                });
            } else {
                //비밀번호가 틀렸다면 에러
                return next(new WrongPasswordError());
            }
        });
    })
    .catch(err => {
        return next(err);
    });
});

//가입 post request
router.post("/register", (req, res, next) => {

    const {userid, username, password, hashed_password} = req.body;
    let connection;

    //폼이 다 채워지지 않고 전송됐다면 에러
    if(!userid || !username || !password) {
        return next(new FormNotFilledError());
    }

    pool.getConnection()
    .then(conn => {
      connection = conn;
      return connection.query(COUNT_USER,[userid]);
    })
    .then(result => {
        //이미 있는 아이디인지 검사
        if(!result[0].count) {
            //없는 아이디라면 bcrypt로 hash해서 INSERT
            bcrypt.hash(hashed_password, saltRounds, function(err, hash) {
                let params = [userid, hash, username, 1];
                return connection.query(INSERT_USER, params);
            });
        } else {
            //이미 있는 아이디라면 에러
            connection.release();
            throw new IdDuplicateError();
        }
    })
    .then(result => {
        connection.release();
        return res.json({
            status : "OK",
            message : "가입에 성공했습니다."
        });
    })
    .catch(err => {
        return next(err);
    });
});

//로그아웃
router.get("/logout", function(req, res) {
    req.session.destroy();  // 세션 삭제
    res.clearCookie("sid"); // 세션 쿠키 삭제
    return res.redirect("/");
});

module.exports = router;
