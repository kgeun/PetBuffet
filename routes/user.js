/** INITIALIZE */
const express = require('express');
const router = express.Router();

/** DATABASE */
const pool = require('../configs/mysql');

/** QUERIES */
const {
    FIND_USER_BY_ID,
    COUNT_USER,
    INSERT_USER
} = require('../queries/user');

const {
    NoIdOrPasswordError,
    UserNotFoundError,
    WrongPasswordError,
    FormNotFilledError,
    IdDuplicateError,
    NonCharsInIdError,
    IdValidationError
} = require('../configs/errors')

/** UTILS */
const bcrypt = require('bcryptjs');
const saltRounds = 10;

router.get('/login', (req, res) => {

    var data = {};

    if(req.session.userid) {
        return res.redirect("/");
    }

    if(req.query.required == 'true') {
        data.required = true;
        data.login_message = "로그인이 필요한 기능입니다.";
    } else if (req.query.required == 'admin') {
        data.required = true;
        data.login_message = "관리자 권한이 필요한 기능입니다.";
    } else if (req.query.required == 'register') {
        data.required = true;
        data.login_message = "회원 가입이 완료되었습니다. <br>로그인해주세요.";
    }
    data.referer = req.headers.referer;

    return res.render("login_and_register",data);
});

//REST API
router.post('/login', (req, res, next) => {

    const {userid, password, hashed_password} = req.body;
    let connection;
    let login_success = false;


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
        if(!user || !user.hasOwnProperty('password')) {
            connection.release();
            throw new UserNotFoundError();
        }
        bcrypt.compare(hashed_password, user.password, function(err, hash_result) {
            connection.release();
            if(hash_result) {
                req.session.userid = user.userid;
                req.session.user_level = user.user_level;
                req.session.username = user.username;
                req.session.user_num = user.user_num;

                return res.json({
                  status : "OK",
                  message : '로그인에 성공했습니다.',
                  referer : req.body.referer
                });
            } else {
              next(new WrongPasswordError());
            }
          return;
        });
    })
    .catch(err => {
        return next(err);
    });
});

//REST API
router.post('/register', (req, res, next) => {

    const {userid, username, password, hashed_password} = req.body;
    let connection;

    if(!userid || !username || !password) {
        return next(new FormNotFilledError());
    }

    if (userid.search(/[^a-zA-Z0-9_.-]+/) != -1) {
        return next(new IdValidationError());
    }

    pool.getConnection()
    .then(conn => {
      connection = conn;
      return connection.query(COUNT_USER,[userid]);
    })
    .then(result => {
        if(!result[0].count) {
            bcrypt.hash(hashed_password, saltRounds, function(err, hash) {
                return connection.query(INSERT_USER,[userid, hash, username, 1]);
            });
        } else {
            connection.release();
            throw new IdDuplicateError();
        }
    })
    .then(result => {
        connection.release();
        return res.json({
            status : "OK",
            message : '가입에 성공했습니다.'
        });
    })
    .catch(err => {
        return next(err);
    });
});

router.get('/logout', function(req, res) {
    req.session.destroy();  // 세션 삭제
    res.clearCookie('sid'); // 세션 쿠키 삭제
    return res.redirect("/");
});

module.exports = router;
