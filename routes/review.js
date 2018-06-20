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
  DELETE_REVIEW,
  SELECT_ALL_REVIEW,
  COUNT_SELECT_ALL_REVIEW,
  search_all_review_query,
  count_search_all_review_query
} = require('../queries/review.js')

const {
  SELECT_COMMENTS_BY_REVIEW_ID
} = require('../queries/comment.js')

const REVIEW_ITEMS_PER_PAGE = 10;
const ALL_REVIEW_ITEMS_PER_PAGE = 5;
const ADMIN_LEVEL = 2;


router.get('/list/:petfood_id', auth, (req, res, next) => {
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
        return next(err);
    });
});

router.get('/content/:petfood_review_id', auth, (req, res, next) => {
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
        return next(err);
    });
});

router.get('/write/:petfood_id', auth, function(req, res) {
    let data = req.data;
    let connection;

    if(!req.session.userid){
        return res.redirect("/user/login?required=true");
    }

    pool.getConnection()
    .then(conn => {
        connection = conn;
        return connection.query(COUNT_AND_SELECT_RCMD, [req.params.petfood_id, data.session.user_num])
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

router.post('/write/:petfood_id', auth, (req, res, next) => {
    let data = req.data;
    let review_item = req.body;
    let current_petfood_rcmd_id = 0;
    let petfood_review_id;
    let connection;

    pool.getConnection()
    .then(conn => {
        connection = conn;
        // 평점 테이블에서 이 유저가 이 사료에 대해 평가한 평점 row가 있나 검색
        return connection.query(COUNT_AND_SELECT_RCMD, [req.params.petfood_id, data.session.user_num]);
    })
    .then(result => {
        if(result[0].count) {
            // 이미 평점이 있는 경우 그 pk를 가져옴
            current_petfood_rcmd_id = result[0].petfood_rcmd_id;
            return;
        } else {
            // 이미 평가된 평점이 없는 경우 평점 table에 insert
            return connection.query(INSERT_RCMD,
                [req.session.user_num, review_item.petfood_id, review_item.petfood_rcmd_value])
                    .catch(queryError => {
                            connection.rollback()
                            connection.release()
                            throw new Error()
                        });
        }
    })
    .then(result => {
        // insert된 평점의 pk를 가져옴
        if(!current_petfood_rcmd_id) {
            current_petfood_rcmd_id = result.insertId;
        }
        // 검색되거나 추가된 평점 테이블 row의 pk를 새로운 리뷰 row에 insert함
        return connection.query(INSERT_REVIEW,
            [review_item.petfood_review_title, review_item.petfood_review_content,
                req.session.user_num, review_item.petfood_id, current_petfood_rcmd_id])
                .catch(queryError => {
                        connection.rollback()
                        connection.release()
                        throw new Error()
                    });
    })
    .then(result => {
        //추가된 글로 redirect 시키기 위해 추가된 row의 pk를 받음
        connection.release();
        return res.redirect(`/review/content/${result.insertId}`);
    })
    .catch(err => {
        return next(err);
    });
});

router.get('/modify/:petfood_review_id', auth, (req, res, next) => {

    let connection;
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
        return next(err);
    });
});

router.post('/modify/:petfood_review_id', (req, res, next) => {

    let connection;
    let data = {};

    pool.getConnection()
    .then(conn => {
        connection = conn;
        return connection.query(UPDATE_REVIEW,
            [req.body.petfood_review_title,req.body.petfood_review_content,
            req.params.petfood_review_id]);
    })
    .then(result => {
        connection.release();
        return res.redirect(`/review/content/${req.params.petfood_review_id}`);
    })
    .catch(err => {
        return next(err);
    });
});

router.post('/delete', (req, res, next) => {

    let connection;
    // 권한검사 넣기
    pool.getConnection()
    .then(conn => {
        connection = conn;
        return connection.query(DELETE_REVIEW,[req.body.petfood_review_id]);
    })
    .then(result => {
        connection.release();
        return res.json({status : "OK"});
    })
    .catch(err => {
        return next(err);
    });
});

router.get('/all_list', auth, (req, res, next) => {

    let data = req.data;

    if (!req.query.page) {
        data.current_page = 1;
    } else {
        data.current_page = req.query.page;
    }

    if (req.query.query) {
        data.search = true;
        data = Object.assign(data, req.query);
        data.query_string = utils.serialize_get_parameter_review(req.query);
    }

    let connection;
    // 권한검사 넣기
    pool.getConnection()
    .then(conn => {
        connection = conn;
        if(data.search){
            return connection.query(search_all_review_query(data,ALL_REVIEW_ITEMS_PER_PAGE));
        } else {
            return connection.query(SELECT_ALL_REVIEW,[ALL_REVIEW_ITEMS_PER_PAGE, (data.current_page - 1) * ALL_REVIEW_ITEMS_PER_PAGE]);
        }
    })
    .then(result => {
        data.all_review_item = result;
        utils.process_recent_review_content(data.all_review_item);
        if(data.search) {
            return connection.query(count_search_all_review_query(data));
        } else {
            return connection.query(COUNT_SELECT_ALL_REVIEW);
        }
    })
    .then(result => {
        utils.inject_paging_information_data(data, result[0].count, ALL_REVIEW_ITEMS_PER_PAGE);
        connection.release();
        return res.render("all_review_list",data);
    })
    .catch(err => {
        return next(err);
    });

});

module.exports = router;
