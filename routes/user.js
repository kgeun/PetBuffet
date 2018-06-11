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

/** UTILS */
const bcrypt = require('bcryptjs');
const saltRounds = 10;

router.get('/login', function(req, res) {
    if(req.session.userid) {
        return res.redirect("/");
    }

    var data = {};
    if(req.query.required == 'true') {
        data.required = true;
        data.login_message = "로그인이 필요한 기능입니다.";
    } else if (req.query.required == 'admin') {
        data.required = true;
        data.login_message = "관리자 권한이 필요한 기능입니다.";
    }
    data.referer = req.headers.referer;
    return res.render("login_and_register",data);
});

//REST API
router.post('/login', function(req, res) {

    const {userid, password} = req.body;

    if (!userid || !password) {
        return res.json({
            status: "ERROR",
            message: "아이디나 패스워드를 입력하지 않았습니다."
        });
    }

    let connection;
    let login_success = false;

    pool.getConnection()
    .then(conn => {
        connection = conn;
        return;
    })
    .then(() => {
      return connection.query(FIND_USER_BY_ID,[userid]);
    })
    .then(result => {
        let user = result[0];
        if(!user || !user.hasOwnProperty('password')) {
            connection.release();
            return res.json({
                status: "ERROR",
                message: "존재하지 않는 아이디 입니다."
            });
        }
        bcrypt.compare(password, user.password, function(err, hash_result) {
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
              return res.json({
                  status : "ERROR",
                  message : '비밀번호가 틀렸습니다.'
              });
          }
          return;
        });
    })
    .catch(err => {
        console.log(err);
        return;
    });
});

//REST API
router.post('/register', function(req, res) {

    const {userid, username, password} = req.body;
    if(!userid || !username || !password) {
        return res.json({
            status : "ERROR",
            message : '모든 항목이 입력되지 않았습니다.'
        });
    }

    let connection;

    pool.getConnection()
    .then(conn => {
      connection = conn;
      return;
    })
    .then(() => {
      return connection.query(COUNT_USER,[userid]);
    })
    .then(result => {
        if(!result[0].count) {
            bcrypt.hash(password, saltRounds, function(err, hash) {
                return connection.query(INSERT_USER,[userid, hash, username, 1]);
            });
        } else {
            connection.release();
            return res.json({
                status : "ERROR",
                message : 'id가 중복되었습니다.'
            });
            // 에러처리를 따로 해줘야함
            // throw new error
        }
    })
    .then(result => {
        connection.release();
        return res.json({
            status : "ERROR",
            message : '가입에 성공했습니다.'
        });
    })
    .catch(err => {
        console.log(err);
        return;
    });
});

router.get('/logout', function(req, res) {
    req.session.destroy();  // 세션 삭제
    res.clearCookie('sid'); // 세션 쿠키 삭제
    return res.redirect("/");
});

module.exports = router;
