/* 초기화 */
const express = require("express");
const router = express.Router();

/* 데이터베이스 */
const pool = require("../configs/mysql");

/* 미들웨어 */
const auth = require("../middleware/auth");
const image_url = require("../middleware/image_url");

/* 유틸리티 */
const utils = require("../util/util");

/* 쿼리 */
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
  SELECT_REVIEW_RCMD,
  SELECT_REVIEW_NON_RCMD,
  COUNT_SELECT_REVIEW_RCMD,
  INSERT_REVIEW_RCMD
} = require("../queries/review.js")

const {
  SELECT_COMMENTS_BY_REVIEW_ID
} = require("../queries/comment.js")

/* 에러처리 */
const {
    NoPermissionRedirect,
    ReviewRcmdAlreadyExistError
} = require("../configs/errors")

// 사료 리뷰 페이지에서 한 페이지에서 보여줄 리뷰 갯수
const REVIEW_ITEMS_PER_PAGE = 10;
// 전체 리뷰 페이지에서 한 페이지에서 보여줄 리뷰 갯수
const ALL_REVIEW_ITEMS_PER_PAGE = 5;
// user 중 관리자 레벨
const ADMIN_LEVEL = 2;

// 사료 별 리뷰 리스트 페이지
router.get("/list/:petfood_id", auth, image_url, (req, res, next) => {
    let data = req.data;
    let connection;

    // 현재 페이시가 명시적으로 들어오지 않았다면 1로 설정
    if(!req.query.page){
        data.current_page = 1;
    } else {
        data.current_page = req.query.page;
    }

    // 검색중이라면 렌더링 할 데이터에 검색어를 설정해줌
    if(req.query.r_query) {
        data.r_query = req.query.r_query;
    }

    pool.getConnection()
    .then(conn => {
        connection = conn;
        // 검색중이 아니라면 검색어를 ""로 해줘서 "%%"로 모든 데이터가 다 나오게 함
        if (!data.r_query) {
            data.r_query = "";
        }

        let params = [req.params.petfood_id, "%" + data.r_query + "%", "%" + data.r_query + "%"];
        // 검색결과 갯수 찾기
        return connection.query(COUNT_REVIEW, params);
    })
    .then(result => {
        // 페이징 정보 주입
        utils.inject_paging_information_data(data,result[0].count,REVIEW_ITEMS_PER_PAGE);

        let params = [req.params.petfood_id, "%" + data.r_query + "%", "%" + data.r_query + "%",
        REVIEW_ITEMS_PER_PAGE, (data.current_page-1)*REVIEW_ITEMS_PER_PAGE];
        // 검색어로 검색
        return connection.query(SELECT_REVIEW_TITLE_INFO, params);
    })
    .then(result => {
        data.review_list = result;
        // 현재 보고 있는 사료 정보
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

// 사료 리뷰 내용 보기
router.get("/content/:petfood_review_id", auth, image_url, (req, res, next) => {
    let data = req.data;
    let page;
    let connection;

    //리뷰 리스트 중 몇번째 페이지였는지 저장
    if(!req.query.page){
        data.page = 1;
    } else {
        data.page = req.query.page;
    }

    //로그인 했는지 아닌지 파악하기
    if(data.session) {
        data.is_loggedin = true;
        data.username = data.session.username
    } else {
        data.is_loggedin = false;
    }

    pool.getConnection()
    .then(conn => {
        connection = conn;
        //리뷰 내용 가져오기
        return connection.query(SELECT_REVIEW_CONTENT,[req.params.petfood_review_id]);
    })
    .then(result => {
        data.review_item = result[0];
        //내가 쓴 리뷰거나 관리자인지 판단, 맞다면 수정 삭제 메뉴 노출
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
        // 리뷰에 해당하는 댓글 가져오기
        return connection.query(SELECT_COMMENTS_BY_REVIEW_ID,[req.params.petfood_review_id]);
    })
    .then(result => {
        data.comments = result;

        // 댓글에 대해서도 내가 쓴 댓글이나 관리자인지 판단해서 맞다면 수정 삭제메뉴 노출
        if(data.session) {
            for (s of result) {
                if(data.session.user_level == ADMIN_LEVEL) {
                    s.my_item = true;
                } else {
                    s.my_item = (s.user_num == data.session.user_num);
                }
            }
        }
        // 이 리뷰의 추천수 가져오기
        return connection.query(SELECT_REVIEW_RCMD,[req.params.petfood_review_id]);
    })
    .then(result => {
        data.rcmd_value = result[0].count;
        // 이 리뷰의 비추 수 가져오기
        return connection.query(SELECT_REVIEW_NON_RCMD,[req.params.petfood_review_id]);
    })
    .then(result => {
        data.non_rcmd_value = result[0].count;
        connection.release();
        return res.render("review_content",data);
    })
    .catch(err => {
        return next(err);
    });
});

//리뷰 올리기 페이지
router.get("/write/:petfood_id", auth, image_url, function(req, res) {
    let data = req.data;
    let connection;

    //로그인이 되어있지 않다면 로그인 페이지로 리다이렉트
    if(!req.session.userid){
        return res.redirect("/user/login?required=true");
    }

    pool.getConnection()
    .then(conn => {
        connection = conn;
        let params = [req.params.petfood_id, data.session.user_num];
        // 이미 평점을 준 적이 있는지 검색하고 평점을 준적이 있다면 그 값을 가져옴
        return connection.query(COUNT_AND_SELECT_RCMD, params);
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

//리뷰 쓰기 post 요청
router.post("/write/:petfood_id", auth, (req, res, next) => {
    let data = req.data;
    let review_item = req.body;
    let current_petfood_rcmd_id = 0;
    let petfood_review_id;
    let connection;

    pool.getConnection()
    .then(conn => {
        connection = conn;
        let params = [req.params.petfood_id, data.session.user_num];
        // 평점 테이블에서 이 유저가 이 사료에 대해 평가한 평점 row가 있나 검색
        return connection.query(COUNT_AND_SELECT_RCMD, params);
    })
    .then(result => {
        if(result[0].count) {
            // 이미 평점이 있는 경우 그 pk를 가져옴
            current_petfood_rcmd_id = result[0].petfood_rcmd_id;
            return;
        } else {
            let params = [req.session.user_num, review_item.petfood_id, review_item.petfood_rcmd_value];
            // 이미 평가된 평점이 없는 경우 평점 table에 insert
            return connection.query(INSERT_RCMD, params)
                    .catch(queryError => {
                            connection.rollback();
                            connection.release();
                            throw new Error();
                        });
        }
    })
    .then(result => {
        // insert된 평점의 pk를 가져옴
        if(!current_petfood_rcmd_id) {
            current_petfood_rcmd_id = result.insertId;
        }
        let params = [review_item.petfood_review_title, review_item.petfood_review_content,
            req.session.user_num, review_item.petfood_id, current_petfood_rcmd_id];
        // 검색되거나 추가된 평점 테이블 row의 pk를 새로운 리뷰 row에 insert함
        return connection.query(INSERT_REVIEW, params)
                .catch(queryError => {
                        connection.rollback();
                        connection.release();
                        throw new Error();
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

// 리뷰 수정 페이지
router.get("/modify/:petfood_review_id", auth, image_url, (req, res, next) => {

    let connection;
    let data = req.data;

    // 로그인하지 않았다면 로그인 페이지로 redirect 시킴
    if (!req.session.userid) {
        return res.redirect("/user/login?required=true");
    }

    // url 파라미터로 페이지가 명시되지 않았다면 1페이지로 설정
    if (!req.query.page) {
        data.page = 1;
    } else {
        data.page = req.query.page;
    }

    pool.getConnection()
    .then(conn => {
        connection = conn;
        // 평점 테이블에서 이 유저가 이 사료에 대해 평가한 평점 row가 있나 검색
        return connection.query(SELECT_REVIEW_CONTENT,[req.params.petfood_review_id]);
    })
    .then(result => {
        // 수정을 시도하는 사용자가 글을 쓴 사용자 혹은 ADMIN이 아니라면 권한이 없으므로 redirect
        // 에러처리 사용
        if (result[0].user_num != req.session.user_num &&
            req.session.user_level != ADMIN_LEVEL) {
            connection.release();
            throw new NoPermissionRedirect();
        }

        data.review_item = result[0];
        data.already_rcmded = true;

        //평가한 평점 ROW를 가져와서 저장
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

// 리뷰 수정 modify 요청
router.post("/modify/:petfood_review_id", (req, res, next) => {

    let connection;
    let data = {};

    pool.getConnection()
    .then(conn => {
        connection = conn;
        let params = [req.body.petfood_review_title,req.body.petfood_review_content,
        req.params.petfood_review_id];
        return connection.query(UPDATE_REVIEW, params);
    })
    .then(result => {
        connection.release();
        return res.redirect(`/review/content/${req.params.petfood_review_id}`);
    })
    .catch(err => {
        return next(err);
    });
});

// 리뷰 delete post 요청
router.post("/delete", (req, res, next) => {

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

//전체 리뷰 리스트
router.get("/all_list", auth, image_url, (req, res, next) => {

    let data = req.data;

    // get 파라미터에 page가 없다면 1페이지로 설정,
    if (!req.query.page) {
        data.current_page = 1;
    } else {
        data.current_page = req.query.page;
    }

    // 검색 중이라면 검색어를 view에서 render하기 위해 저장
    if (req.query.query) {
        data = Object.assign(data, req.query);
    }

    let connection;

    pool.getConnection()
    .then(conn => {
        connection = conn;

        //검색어가 없다면 ""를 넣어서 전체 검색 (LIKE "%%")
        if(!data.query) {
            data.query = "";
        }
        let params = ["%" + data.query + "%", "%" + data.query + "%",
        ALL_REVIEW_ITEMS_PER_PAGE, (data.current_page - 1) * ALL_REVIEW_ITEMS_PER_PAGE];
        return connection.query(SELECT_ALL_REVIEW, params);
    })
    .then(result => {
        data.all_review_item = result;
        //리뷰를 간단히 리스트로 보여주기 위해 html, &nbsp; 중간에 자르고 ...붙이기
        utils.process_recent_review_content(data.all_review_item);
        let params = ["%" + data.query + "%", "%" + data.query + "%"];
        return connection.query(COUNT_SELECT_ALL_REVIEW, params);
    })
    .then(result => {
        //페이징 정보 주입
        utils.inject_paging_information_data(data, result[0].count, ALL_REVIEW_ITEMS_PER_PAGE);
        connection.release();
        return res.render("all_review_list",data);
    })
    .catch(err => {
        return next(err);
    });

});

//리뷰 추천 post 요청, rest
router.post("/rcmd", (req, res, next) => {
    let connection;

    const { petfood_review_id, user_num, review_rcmd } = req.body;

    pool.getConnection()
    .then(conn => {
        connection = conn;
        let params = [Number(petfood_review_id), Number(user_num)];
        //이미 추천이나 비추천을 했는지 판단하기 위해 COUNT 찾기
        return connection.query(COUNT_SELECT_REVIEW_RCMD, params);
    })
    .then(result => {
        // 이미 추천이나 비추천 했다면 에러 날리기
        if(result[0].count != 0) {
            connection.release();
            throw new ReviewRcmdAlreadyExistError();
        }
        let params = [Number(review_rcmd), Number(petfood_review_id), Number(user_num)];
        return connection.query(INSERT_REVIEW_RCMD, params);
    })
    .then(result => {
        connection.release();
        return res.json({ status : "OK",
                        message : "이 리뷰를 평가했습니다."});
    })
    .catch(err => {
        return next(err);
    });
});

module.exports = router;
