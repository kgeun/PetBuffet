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

const {
    NoPermissionError
} = require('../configs/errors')

const ADMIN_LEVEL = 2;

router.post('/write', auth, (req, res, next) => {
    let data = req.data;

    pool.getConnection()
    .then(conn => {
        connection = conn;
        return connection.query(INSERT_COMMENT,
            [data.session.user_num, req.body.review_comment_content,
                req.body.petfood_review_id]);
    })
    .then(result => {
        connection.release();
        return res.redirect(`/review/content/${req.body.petfood_review_id}`);
    })
    .catch(err => {
        return next(err);
    });
});

router.post('/delete', auth, (req, res, next) => {
    let data = req.data;

    if (data.session && req.body.user_num != data.session.user_num
                        && data.session.user_level != ADMIN_LEVEL){
        return next(new NoPermissionError());
    }

    pool.getConnection()
    .then(conn => {
        connection = conn;
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
        return next(err);
    });
});

router.post('/update', auth, (req, res, next) => {
    let data = req.data;

    if (data.session && req.body.user_num != data.session.user_num
                        && data.session.user_level != ADMIN_LEVEL){
        return next(new NoPermissionError());
    }

    pool.getConnection()
    .then(conn => {
        connection = conn;
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
        return next(err);
    });
});

module.exports = router;
