/** INITIALIZE */
const express = require('express');
const router = express.Router();

/** DATABASE */
const pool = require('../configs/mysql');

/** MIDDLEWARE */
const auth = require('../middleware/auth');

/** UTILITY */
const utils = require('../util/util');

const {
  SELECT_CURRENT_PETFOOD,
  SELECT_REVIEW_TITLE_INFO,
  SELECT_REVIEW_CONTENT,
  INSERT_RCMD,
  INSERT_REVIEW,
  COUNT_AND_SELECT_RCMD,
  COUNT_REVIEW,
  UPDATE_REVIEW,
  DELETE_REVIEW
} = require('../queries/review.js')

const {
  SELECT_COMMENTS_BY_REVIEW_ID
} = require('../queries/comment.js')

const REVIEW_ITEMS_PER_PAGE = 10;
const ADMIN_LEVEL = 2;


router.get('/list/:petfood_id', auth, function(req, res) {
    let data = req.data;
    let connection;

    // 현재 페이시가 명시적으로 들어오지 않았다면 1로 설정
    if(!req.query.page){
        data.current_page = 1;
    } else {
        data.current_page = req.query.page;
    }

    pool.getConnection()
    .then(conn => {
        connection = conn;
        return;
    })
    .then(() => {
        return connection.query(COUNT_REVIEW,[req.params.petfood_id]);
    })
    .then(result => {
        utils.inject_paging_information_data(data,result[0].count,REVIEW_ITEMS_PER_PAGE);
        return connection.query(SELECT_REVIEW_TITLE_INFO, [req.params.petfood_id, (data.current_page-1)*REVIEW_ITEMS_PER_PAGE]);
    })
    .then(result => {
        data.review_list = result;
        return connection.query(SELECT_CURRENT_PETFOOD, [req.params.petfood_id]);
    })
    .then(result => {
        data.petfood_info = result[0];
    })
    .then(() => {
        connection.release();
        return res.render("review_list",data);
    })
    .catch(err => {
        console.log(err);
        return;
    });
});

router.get('/content/:petfood_review_id', auth, function(req, res) {
    let data = req.data;
    let page;
    let connection;

    if(!req.query.page){
        data.page = 1;
    } else {
        data.page = req.query.page;
    }

    if(data.session) {
        data.is_loggedin = true;
        data.username = data.session.username
    } else {
        data.is_loggedin = false;
    }

    pool.getConnection()
    .then(conn => {
        connection = conn;
        return;
    })
    .then(() => {
        return connection.query(SELECT_REVIEW_CONTENT,[req.params.petfood_review_id]);
    })
    .then(result => {
        data.review_item = result[0];
        if(data.session) {
            if (data.review_item.user_num == req.session.user_num ||
                req.session.user_level == ADMIN_LEVEL) {
                data.my_item = true;
            } else {
                data.my_item = false;
            }
        }
        return connection.query(SELECT_CURRENT_PETFOOD,[result[0].petfood_id]);
    })
    .then(result => {
        data.petfood_info = result[0];
        return connection.query(SELECT_COMMENTS_BY_REVIEW_ID,[req.params.petfood_review_id]);
    })
    .then(result => {
        data.comments = result;
        if(data.session) {
            for (s of result) {
                if(data.session.user_level == ADMIN_LEVEL) {
                    s.my_item = true;
                } else {
                    s.my_item = (s.user_num == data.session.user_num);
                }
            }
        }

        connection.release();
        return res.render("review_content",data);
    })
    .catch(err => {
        console.log(err);
        return;
    });
});

router.get('/write/:petfood_id',	auth, function(req, res) {
    let data = req.data;

    if(!req.session.userid){
        return res.redirect("/user/login?required=true");
    }

    pool.getConnection()
    .then(conn => {
        connection = conn;
        return;
    })
    .then(() => {
        return connection.query(COUNT_AND_SELECT_RCMD, [req.params.petfood_id, data.session.user_num]);
    })
    .then(result => {
        if(result[0].count) {
            data.already_rcmded = true;
            data.petfood_rcmd_value = result[0].petfood_rcmd_value;
        } else {
            data.already_rcmded = false;
        }
        return connection.query(SELECT_CURRENT_PETFOOD,[req.params.petfood_id]);
    })
    .then(result =>{
        data.petfood_info = result[0];
        return;
    })
    .then(() => {
        connection.release();
        return res.render("review_write",data);
    })
    .catch(err => {
        console.log(err);
        return;
    });
});

router.post('/write/:petfood_id', auth, function(req, res) {
    let data = req.data;
    let review_item = req.body;
    let current_petfood_rcmd_id = 0;

//////**** 트랜잭션처리
    pool.getConnection()
    .then(conn => {
        connection = conn;
        return;
    })
    .then(() => {
        return connection.query(COUNT_AND_SELECT_RCMD, [req.params.petfood_id, data.session.user_num]);
    })
    .then(result => {
        if(result[0].count) {
            current_petfood_rcmd_id = result[0].petfood_rcmd_id;
            return;
        } else {
            return connection.query(INSERT_RCMD,
                [req.session.user_num, review_item.petfood_id, review_item.petfood_rcmd_value]);
        }
    })
    .then(result => {
        let petfood_rcmd_id;

        if(current_petfood_rcmd_id != 0) {
            petfood_rcmd_id = current_petfood_rcmd_id;
        } else {
            petfood_rcmd_id = result.insertId;
        }
        return connection.query(INSERT_REVIEW,
            [review_item.petfood_review_title, review_item.petfood_review_content,
                req.session.user_num, review_item.petfood_id, petfood_rcmd_id]);
    })
    .then(result => {
        connection.release();
        return res.redirect(`/review/content/${result.insertId}`);
    })
    .catch(err => {
        console.log(err);
        return;
    });
});

router.get('/modify/:petfood_review_id', auth, function(req, res) {
    let data = req.data;

    if (!req.session.userid) {
        return res.redirect("/user/login?required=true");
    }

    if (!req.query.page) {
        data.page = 1;
    } else {
        data.page = req.query.page;
    }

    pool.getConnection()
    .then(conn => {
        connection = conn;
        return;
    })
    .then(() => {
        return connection.query(SELECT_REVIEW_CONTENT,[req.params.petfood_review_id]);
    })
    .then(result => {
        if (result[0].user_num != req.session.user_num &&
            req.session.user_level != ADMIN_LEVEL) {
            connection.release();
            return res.redirect("/");
        }

        data.review_item = result[0];
        data.already_rcmded = true;
        data.petfood_rcmd_value = result[0].petfood_rcmd_value;

        return connection.query(SELECT_CURRENT_PETFOOD,[result[0].petfood_id]);
    })
    .then(result => {
        data.petfood_info = result[0];
    })
    .then(() => {
        connection.release();
        return res.render("review_write",data);
    })
    .catch(err => {
        console.log(err);
        return;
    });
});

router.post('/modify/:petfood_review_id', function(req, res) {

    let data = {};

    pool.getConnection()
    .then(conn => {
        connection = conn;
        return;
    })
    .then(() => {
        return connection.query(UPDATE_REVIEW,
            [req.body.petfood_review_title,req.body.petfood_review_content,
            req.params.petfood_review_id]);
    })
    .then(result => {
        connection.release();
        return res.redirect(`/review/content/${req.params.petfood_review_id}`);
    })
    .catch(err => {
        console.log(err);
        return;
    });
});

router.post('/delete', function(req, res) {
    // 권한검사 넣기
    pool.getConnection()
    .then(conn => {
        connection = conn;
        return;
    })
    .then(() => {
        return connection.query(DELETE_REVIEW,[req.body.petfood_review_id]);
    })
    .then(result => {
        connection.release();
        return res.json({status : "OK"});
    })
    .catch(err => {
        console.log(err);
        return;
    });
});

module.exports = router;
