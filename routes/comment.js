/** INITIALIZE */
const express = require('express');
const router = express.Router();

/** DATABASE */
const pool = require('../configs/mysql');

/** MIDDLEWARE */
const auth = require('../middleware/auth');

/** QUERIES */
const {
    INSERT_COMMENT,
    DELETE_COMMENT,
    UPDATE_COMMENT
} = require('../queries/comment');

const ADMIN_LEVEL = 2;

router.post('/write', auth, function(req, res) {
    let data = req.data;

    pool.getConnection()
    .then(conn => {
        connection = conn;
        return;
    })
    .then(() => {
        return connection.query(INSERT_COMMENT,
            [data.session.user_num, req.body.review_comment_content,
                req.body.petfood_review_id]);
    })
    .then(result => {
        connection.release();
        return res.redirect(`/review/content/${req.body.petfood_review_id}`);
    })
    .catch(err => {
        console.log(err);
        return;
    });
});

router.post('/delete', auth, function(req, res) {
    let data = req.data;

    if( data.session && req.body.user_num != data.session.user_num && data.session.user_level != ADMIN_LEVEL ){
        return res.json({
            status : "ERROR",
            message : "Forbidden"
        })
    }

    pool.getConnection()
    .then(conn => {
        connection = conn;
        return;
    })
    .then(() => {
        return connection.query(DELETE_COMMENT,[req.body.review_comment_id]);
    })
    .then(result => {
        connection.release();
        return res.json({
            status : "OK",
            message : "댓글이 삭제되었습니다."
        });
    })
    .catch(err => {
        console.log(err);
        return;
    });
});

router.post('/update', auth, function(req, res) {
    let data = req.data;

    if( data.session && req.body.user_num != data.session.user_num && data.session.user_level != ADMIN_LEVEL ){
        return res.json({
            status : "ERROR",
            message : "Forbidden"
        })
    }

    pool.getConnection()
    .then(conn => {
        connection = conn;
        return;
    })
    .then(() => {
        return connection.query(UPDATE_COMMENT,[req.body.review_comment_content, req.body.review_comment_id]);
    })
    .then(result => {
        connection.release();
        return res.json({
            status : "OK",
            message : "댓글이 수정되었습니다."
        });
    })
    .catch(err => {
        console.log(err);
        return;
    });
});

module.exports = router;
