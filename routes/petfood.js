/* 초기화 */
const express = require("express");
const router = express.Router();
const rp = require("request-promise");

/* 데이터베이스 */
const pool = require("../configs/mysql");
const file_upload = require("../configs/file_upload");

/* 미들웨어 (인증, 이미지 경로) */
const auth = require("../middleware/auth");
const image_url = require("../middleware/image_url");

/* 유틸리티 */
const utils = require("../util/util");
const nutrition = require("../util/nutrition");

/* 네이버 개발자 API 키 */
const naver_api_key = require("../configs/naver_api_key");

/* 쿼리 */
const {
    COUNT_PETFOOD,
    SELECT_PETFOOD_ALL_INFO,
    SELECT_PETFOOD_MODIFY_INFO,
    SELECT_PETFOOD_COMPANY,
    SELECT_TARGET_AGE,
    INSERT_PETFOOD,
    UPDATE_PETFOOD,
    DELETE_PETFOOD,
    SELECT_REVIEW_RECENT_TWO,
    SELECT_MAIN_INGREDIENT,
    SELECT_PROTEIN_CONTENT,
    SELECT_PETFOOD_NAME,
    SELECT_DELETING_PHOTO,
    search_petfood_query,
    count_search_petfood_query
} = require("../queries/petfood");

const {
    COUNT_AND_SELECT_RCMD,
    INSERT_RCMD
} = require("../queries/review");

/* 에러 */
const {
    RcmdAlreadyExistError
} = require("../configs/errors");

/* user 중 어드민 레벨 */
const ADMIN_LEVEL = 2;
/* 한 페이지에 보여줄 사료 갯수 */
const PETFOOD_ITEMS_PER_PAGE = 5;

// 사료 리스트 페이지
router.get("/list/:page", auth, image_url,  (req, res, next) => {

    let connection;
    let data = req.data;
    let query_where;

    // 현재 페이지를 view에 넘겨주기
    data.current_page = req.params.page;

    // 정렬 방법이 정해지지 않았따면 자동으로 1(최신순)으로 설정
    if(!req.query.order_method) {
        data.order_method = 1;
    } else{
        data.order_method = req.query.order_method;
    }

    // 사용자 레벨이 ADMIN_LEVEL이라면 관리자용 메뉴 보여주기
    if (data.session && data.session.user_level == ADMIN_LEVEL) {
        data.is_user_admin = true;
    }

    //쿼리 파라미터들이 있을때 검색모드 on
    if(req.query.petfood_company_id) {
        data.search = true;
        data = Object.assign(data, req.query);
    } else {
        data.query = "";
    }

    pool.getConnection()
        .then(conn => {
            connection = conn;
            return connection.query(SELECT_MAIN_INGREDIENT);
        })
        .then(result => {
            //table에서 주원료 리스트를 가져옴
            data.main_ingredient = result;

            //검색 중이라면 현재 검색중인 주원료를 보여주기 위해 iteration을 함
            for(s of data.main_ingredient) {
                s.current_main_ingredient = (s.main_ingredient_id == data.main_ingredient_id)? true : false;
            }

            return connection.query(SELECT_TARGET_AGE);
        })
        .then(result => {
            //table에서 연령대 리스트를 가져옴
            data.target_age = result;

            //검색 중이라면 현재 검색중인 연령대를 보여주기 위해 iteration을 함
            for(s of data.target_age) {
                s.current_target_age = (s.target_age_id == data.target_age_id)? true : false;
            }

            return connection.query(SELECT_PETFOOD_COMPANY);
        })
        .then(result => {
            //table에서 사료 제조사 리스트를 가져옴
            data.petfood_company = result;

            //검색 중이라면 현재 검색중인 제조사를 보여주기 위해 iteration을 함
            for(s of data.petfood_company) {
                s.current_petfood_company = (s.petfood_company_id == data.petfood_company_id)? true : false;
            }

            return connection.query(SELECT_PROTEIN_CONTENT);
        })
        .then(result => {
            //table에서 단백질 함량 리스트를 가져옴
            data.protein_content = result;

            //검색 중이라면 현재 검색중인 단백질 함량을 보여주기 위해 iteration을 함
            for(s of data.protein_content) {
                s.current_protein_content = (s.protein_content_id == data.protein_content_id)? true : false;
            }

            // 정보들을 가지고 동적으로 검색 쿼리를 만들어서 검색
            return connection.query(search_petfood_query(data,PETFOOD_ITEMS_PER_PAGE,data.order_method));
        })
        .then(result => {
            data.result = result;

            return connection.query(count_search_petfood_query(data));
        })
        .then(result => {
            // pagination을 위한 정보를 주입
            utils.inject_paging_information_data(data, result[0].count, PETFOOD_ITEMS_PER_PAGE);

            connection.release();
            return res.render("home", data);
        })
        .catch(err => {
            return next(err);
        });
});

// 사료 정보 페이지
router.get("/info/:petfood_id", auth, image_url, (req, res, next) => {
    let data = req.data;

    //목록을 누르면 돌아갈 페이지를 설정. get parameter인 current_page에 저장되어있음
    if (req.query.current_page) {
        data.current_page = req.query.current_page;
    } else {
        data.current_page = 1;
    }

    // 사용자 레벨이 ADMIN_LEVEL이라면 관리자용 메뉴 보여주기
    if (data.session && data.session.user_level == ADMIN_LEVEL) {
        data.is_user_admin = true;
    }

    let connection;

    pool.getConnection()
        .then(conn => {
            connection = conn;
            return connection.query(SELECT_PETFOOD_ALL_INFO, [req.params.petfood_id]);
        })
        .then(result => {
            // 각 사료 성분을 평가함
            result[0] = Object.assign(result[0], nutrition.assess_nutrition(result[0]));
            //사료정보 + 평가정보를 petfood_item object에 저장함
            data.petfood_item = result[0];
            //사료의 각 성분 별 적정량 받아오기
            data.nutrition_standard = nutrition.nutrition_standard(data.petfood_item.target_age_id);
            //사료 각 성분의 적정, 과다, 부족을 표시할 html 가져오기
            data.protein = utils.give_html_and_color_by_eval_protein(data.petfood_item.eval_protein);
            data.fat = utils.give_html_and_color_by_eval_fat(data.petfood_item.eval_fat);
            data.calcium = utils.give_html_and_color_by_eval_calcium(data.petfood_item.eval_calcium);
            data.phosphorus = utils.give_html_and_color_by_eval_phosphorus(data.petfood_item.eval_phosphorus);

            return connection.query(SELECT_REVIEW_RECENT_TWO, [req.params.petfood_id]);
        })
        .then(result => {
            data.recent_reviews = result;
            // 사료 정보 중 리뷰 미리보기에서 html코드 삭제 및 긴 문자열 생략처리
            utils.process_recent_review_content(data.recent_reviews);
        })
        .then(() => {
            let shopping_info_api_url = "https://openapi.naver.com/v1/search/shop.json?display=5&query=" + encodeURI(data.petfood_item.petfood_name);

            // API를 사용하기 위해 필요한 ID와 SECRET 값 header에 설정
            let shopping_info_options = {
                uri: shopping_info_api_url,
                headers: {
                    "X-Naver-Client-Id": naver_api_key.CLIENT_ID,
                    "X-Naver-Client-Secret": naver_api_key.CLIENT_SECRET
                },
                json: true
             };

             //request promise를 사용해서 네이버 쇼핑 api로 관련도 순으로 5개 가져오기
             rp(shopping_info_options)
                .then( shopping_info => {
                    // 결과 갯수가 있을 경우. 없을 경우는 무시
                    if(shopping_info.items.length > 0) {
                        // 결과 리스트를 view에 저장함
                        data.shopping_info = shopping_info.items;
                        // 제목에서 html 코드 제거
                        for(s of data.shopping_info) {
                            s.title = s.title.replace(/<\/?[^>]+(>|$)/g, "");
                        }
                        //최저가로 다시 검색 하기 위해 첫번째 결과값(가장 관련도 높은 이름)으로 다시 url에 get request
                        let lowest_cost_api_url = "https://openapi.naver.com/v1/search/shop.json?display=1&sort=asc&query=" + encodeURI(data.shopping_info[0].title);

                        let lowest_cost_options = {
                            uri: lowest_cost_api_url,
                            headers: {
                                "X-Naver-Client-Id": naver_api_key.CLIENT_ID,
                                "X-Naver-Client-Secret": naver_api_key.CLIENT_SECRET
                            },
                            json: true
                         };

                         //가장 관련도가 높은 이름으로 최저가 검색해서 가져오기
                        rp(lowest_cost_options)
                           .then( low_cost_info => {
                               //결과가 있을 경우에
                               if(low_cost_info.items) {
                                   //최저가 정보 하나를 저장함
                                   data.low_cost_info = low_cost_info.items[0];
                                   data.low_cost_info.title = data.low_cost_info.title.replace(/<\/?[^>]+(>|$)/g, "");
                                   connection.release();
                                   return res.render("petfood_info", data);
                               }
                           })
                           .catch( err => {
                               return next(err);
                           });

                    }
                    else {
                        connection.release();

                        //결과값이 없을경우 저장하지 않고 render
                        return res.render("petfood_info", data);
                    }
                })
                .catch( err => {
                    return next(err);
                });
        })
        .catch(err => {
            return next(err);
        });
});

//사료 정보 수정
router.get("/modify/:petfood_id", auth, image_url, (req, res, next) => {

    //관리자가 아닌 유저가 사료 정보 페이지에 접근하려고 하면 로그인 페이지로 리다이렉트
    if (req.session.user_level != ADMIN_LEVEL) {
        return res.redirect("/user/login?required=admin");
    }

    let data = req.data;
    let connection;

    pool.getConnection()
        .then(conn => {
            connection = conn;
            //선택된 사료에서 수정에 필요한 정보만 가져오기
            return connection.query(SELECT_PETFOOD_MODIFY_INFO, [req.params.petfood_id]);
        })
        .then(result => {
            data.petfood_data = result[0];
            //사료 제조사 리스트 가져오기
            return connection.query(SELECT_PETFOOD_COMPANY);
        })
        .then(result => {
            // 현재 사료의 사료 제조사를 선택시키기 위해 iteration
            for (s of result) {
                s.current_company = (data.petfood_data.petfood_company_id == s.petfood_company_id)? true : false;
            }
            data.petfood_company = result;
            // 대상 연령 리스트 가져오기
            return connection.query(SELECT_TARGET_AGE);
        })
        .then(result => {
            // 현재 사료의 대상 연령를 선택시키기 위해 iteration
            for (s of result) {
                s.current_target_age = (data.petfood_data.target_age_id == s.target_age_id)? true : false;
            }
            data.petfood_target_age = result;
            return;
        })
        .then(() => {
            connection.release();
            return res.render("upload_petfood", data);
        })
        .catch(err => {
            return next(err);
        });
});

//사료 정보 생성 페이지
router.get("/upload", auth, image_url, (req, res, next) => {

    // 관리자가 아니면 로그인 화면으로 redirect
    if (req.session.user_level != ADMIN_LEVEL) {
        return res.redirect("/user/login?required=admin");
    }

    let data = req.data;
    let connection;

    pool.getConnection()
        .then(conn => {
            connection = conn;
            // 제조사 리스트 가져오기
            return connection.query(SELECT_PETFOOD_COMPANY);
        })
        .then(result => {
            data.petfood_company = result;
            //대상 연령 리스트 가져오기
            return connection.query(SELECT_TARGET_AGE);
        })
        .then(result => {
            data.petfood_target_age = result;
            return;
        })
        .then(() => {
            connection.release();
            return res.render("upload_petfood", data);
        })
        .catch(err => {
            return next(err);
        });
});

//사료정보 업로드 post 요청
router.post("/upload", (req, res, next) => {

    // 업로드된 정보를 바탕으로 영양 점수를 평가
    let nutrition_info = nutrition.assess_nutrition(req.body);
    // ,로 구분된 원료 정보들 중 첫번째 원료를 저장
    let main_ingredient = req.body.ingredients.split(",")[0];

    let connection;

    pool.getConnection()
        .then(conn => {
            connection = conn;
            // 업로드 된 정보 insert
            return connection.query(INSERT_PETFOOD, [req.body.petfood_company_id, req.body.petfood_name, req.body.protein,
                req.body.fat, req.body.calcium, req.body.phosphorus, req.body.ingredients,
                req.body.target_age_id, nutrition_info.nutrition_score, req.body.petfood_photo_addr,
                main_ingredient]);
        })
        .then(result => {
            connection.release();
            return res.redirect("/");
        })
        .catch(err => {
            return next(err);
        });
});

//사료정보 수정 post 요청
router.post("/modify", (req, res, next) => {

    //권한 검사
    if (req.session.user_level != ADMIN_LEVEL) {
        return res.redirect("/user/login?required=admin");
    }

    //수정되어 업로드 된 정보를 바탕으로 다시 영양점수 평가
    let nutrition_info = nutrition.assess_nutrition(req.body);
    // ,로 구분된 원료 정보들 중 첫번째 원료를 저장
    let main_ingredient = req.body.ingredients.split(",")[0];

    pool.getConnection()
        .then(conn => {
            connection = conn;
            // UPDATE
            return connection.query(UPDATE_PETFOOD, [req.body.petfood_company_id, req.body.petfood_name, req.body.protein,
                req.body.fat, req.body.calcium, req.body.phosphorus, req.body.ingredients,
                req.body.target_age_id, nutrition_info.nutrition_score, main_ingredient,
                req.body.petfood_photo_addr, req.body.petfood_id]);
        })
        .then(result => {
            connection.release();
            return res.redirect("/petfood/info/" + req.body.petfood_id);
        })
        .catch(err => {
            return next(err);
        });
});

// 사료정보 삭제 post 요청
router.post("/delete", (req, res, next) => {

    // rest이기 때문에 json으로 정보 전달
    if (req.session.user_level != ADMIN_LEVEL) {
        return res.status(403).json({
            status: "ERROR",
            message : "권한이 없습니다."
        });
    }

    pool.getConnection()
        .then(conn => {
            // 삭제할 사료의 사진 이름을 가져옴
            connection = conn;
            return connection.query(SELECT_DELETING_PHOTO, [req.body.petfood_id]);
        })
        .then(result => {
            // 사진 이름으로 사진 삭제
            utils.remove_petfood_photo(result[0].petfood_photo_addr);

            //DB에서 해당하는 row 삭제
            return connection.query(DELETE_PETFOOD, [req.body.petfood_id]);
        })
        .then(result => {
            connection.release();
            return res.json({
                status: "OK"
            });
        })
        .catch(err => {
            return next(err);
        });
});

//사료정보 upload
router.post("/upload_image", file_upload.middle_upload, (req, res) => {
    let data = {};
    //파일 확장자가 jpg png gif가 아니면 에러 보내고 바로 삭제
    if (req.file.filename.endsWith(".jpg")
        || req.file.filename.endsWith(".png")
        || req.file.filename.endsWith(".gif")) {
            data.filename = req.file.filename;
            data.status = "OK";
    } else {
        data.status = "ERROR";
        utils.remove_petfood_photo(req.file.filename);
    }
    return res.json(data);
});

// 사료 사용자 평점 post 요청 (rest)
router.post("/rcmd", auth, (req, res, next) => {
    const { petfood_rcmd_value, petfood_id } = req.body;

    let data = req.data;

    pool.getConnection()
    .then(conn => {
        connection = conn;
        // 평점 테이블에서 이 유저가 이 사료에 대해 평가한 평점 row가 있나 검색
        return connection.query(COUNT_AND_SELECT_RCMD, [petfood_id, data.session.user_num]);
    })
    .then(result => {
        if(result[0].count) {
            // 이미 평점이 있는 경우 그 pk를 가져옴
            current_petfood_rcmd_id = result[0].petfood_rcmd_id;
            throw new RcmdAlreadyExistError();
        } else {
            // 이미 평가된 평점이 없는 경우 평점 table에 insert
            return connection.query(INSERT_RCMD,
                [data.session.user_num, petfood_id, petfood_rcmd_value]);
        }
    })
    .then(result => {
        return res.json({
            status : "OK",
            message : "별점 주기에 성공했습니다."
        });
    })
    .catch(err => {
        return next(err);
    });

});

//자동완성에 사용하기 위해 사료 이름 array 출력하는 곳
router.get("/petfood_name_list", (req, res, next) => {
    pool.getConnection()
    .then(conn => {
        connection = conn;
        // 평점 테이블에서 이 유저가 이 사료에 대해 평가한 평점 row가 있나 검색
        return connection.query(SELECT_PETFOOD_NAME);
    })
    .then(result =>{
        connection.release();
        // object array에서 사료 이름으로만 된 array로 바꾸기
        result = result.map(obj => obj.petfood_name);
        res.json(result);
    })
    .catch(err => {
        return next(err);
    });
});

module.exports = router;
