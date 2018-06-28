/* 초기화 */
const express = require("express");
const router = express.Router();

/* 데이터베이스 */
const pool = require("../configs/mysql");

/* 미들웨어 (인증) */
const auth = require("../middleware/auth");

/* 쿼리 */
const {
    INSERT_COMMENT,
    DELETE_COMMENT,
    UPDATE_COMMENT
} = require("../queries/comment");

/* 에러처리 */
const {
    NoPermissionError
} = require("../configs/errors")

/* user 중 어드민 레벨 */
const ADMIN_LEVEL = 2;

// 댓글 작성
router.post("/write", auth, (req, res, next) => {
    let data = req.data;

    pool.getConnection()
    .then(conn => {
        connection = conn;
        let params = [data.session.user_num, req.body.review_comment_content,
            req.body.petfood_review_id];
        return connection.query(INSERT_COMMENT, params);
    })
    .then(result => {
        // 댓글 작성하고 보고있었던 페이지로 돌아가기
        connection.release();
        return res.redirect(`/review/content/${req.body.petfood_review_id}`);
    })
    .catch(err => {
        return next(err);
    });
});

//댓글 삭제 - ajax 비동기로 처리
router.post("/delete", auth, (req, res, next) => {
    let data = req.data;

    //권한 검사
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

//댓글 수정
router.post("/update", auth, (req, res, next) => {
    let data = req.data;

    //권한 검사
    if (data.session && req.body.user_num != data.session.user_num
                        && data.session.user_level != ADMIN_LEVEL){
        return next(new NoPermissionError());
    }

    pool.getConnection()
    .then(conn => {
        connection = conn;
        let params = [req.body.review_comment_content, req.body.review_comment_id];
        return connection.query(UPDATE_COMMENT, params);
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
