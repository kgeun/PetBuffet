/** INITIALIZE */
const express = require('express');
const router = express.Router();
const rp = require('request-promise');

/** DATABASE */
const pool = require('../configs/mysql');
const file_upload = require('../configs/file_upload');

/** MIDDLEWARE */
const auth = require('../middleware/auth');

/** UTILITY */
const utils = require('../util/util');
const nutrition = require('../util/nutrition');

/** API KEY **/
const naver_api_key = require('../configs/naver_api_key');

// Quries
const {
    SELECT_PETFOOD_TITLE,
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
    search_petfood_query,
    count_search_petfood_query
} = require('../queries/petfood');

const {
    COUNT_AND_SELECT_RCMD,
    INSERT_RCMD
} = require('../queries/review');

const {
    RcmdAlreadyExistError
} = require('../configs/errors');

const ADMIN_LEVEL = 2;
const PETFOOD_ITEMS_PER_PAGE = 5;

router.get('/list/:page', auth, (req, res, next) => {

    let connection;
    let data = req.data;
    let query_where;
    data.current_page = req.params.page;

    if (data.session && data.session.user_level == ADMIN_LEVEL) {
        data.is_user_admin = true;
    }

    if(req.query.petfood_company_id) {
        data.search = true;
        data = Object.assign(data, req.query);
        data.query_string = utils.serialize_get_parameter_petfood(req.query);
    } else {
        data.query = '';
    }

    pool.getConnection()
        .then(conn => {
            connection = conn;
            return connection.query(SELECT_MAIN_INGREDIENT);
        })
        .then(result => {
            data.main_ingredient = result;

            for(s of data.main_ingredient) {
                s.current_main_ingredient = (s.main_ingredient_id == data.main_ingredient_id)? true : false;
            }

            return connection.query(SELECT_TARGET_AGE);
        })
        .then(result => {
            data.target_age = result;

            for(s of data.target_age) {
                s.current_target_age = (s.target_age_id == data.target_age_id)? true : false;
            }

            return connection.query(SELECT_PETFOOD_COMPANY);
        })
        .then(result => {
            data.petfood_company = result;

            for(s of data.petfood_company) {
                s.current_petfood_company = (s.petfood_company_id == data.petfood_company_id)? true : false;
            }

            return connection.query(SELECT_PROTEIN_CONTENT);
        })
        .then(result => {
            data.protein_content = result;

            for(s of data.protein_content) {
                s.current_protein_content = (s.protein_content_id == data.protein_content_id)? true : false;
            }

            return connection.query(search_petfood_query(data,PETFOOD_ITEMS_PER_PAGE));
        })
        .then(result => {
            data.result = result;

            return connection.query(count_search_petfood_query(data));
        })
        .then(result => {
            // 페이징 작업
            utils.inject_paging_information_data(data, result[0].count, PETFOOD_ITEMS_PER_PAGE);

            connection.release();
            return res.render('home', data);
        })
        .catch(err => {
            return next(err);
        });
});


router.get('/info/:petfood_id', auth, (req, res, next) => {
    let data = req.data;

    //목록을 누르면 돌아갈 페이지를 설정. get parameter인 current_page에 저장되어있음
    if (req.query.current_page) {
        data.current_page = req.query.current_page;
    } else {
        data.current_page = 1;
    }

    if (data.session && data.session.user_level == ADMIN_LEVEL) {
        data.is_user_admin = true;
    }

    if(req.query.petfood_company_id) {
        data.query_string = utils.serialize_get_parameter_petfood(req.query);
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
            //utils.give_html_and_color_by_eval_nutrition(data.petfood_item);
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
            let shopping_info_api_url = 'https://openapi.naver.com/v1/search/shop.json?display=5&query=' + encodeURI(data.petfood_item.petfood_name);

            let shopping_info_options = {
                uri: shopping_info_api_url,
                headers: {
                    'X-Naver-Client-Id': naver_api_key.CLIENT_ID,
                    'X-Naver-Client-Secret': naver_api_key.CLIENT_SECRET
                },
                json: true
             };

             rp(shopping_info_options)
                .then( shopping_info => {
                    if(shopping_info.items.length > 0) {
                        data.shopping_info = shopping_info.items;
                        for(s of data.shopping_info) {
                            s.title = s.title.replace(/<\/?[^>]+(>|$)/g, "");
                        }
                        let lowest_cost_api_url = 'https://openapi.naver.com/v1/search/shop.json?display=1&sort=asc&query=' + encodeURI(data.shopping_info[0].title);

                        let lowest_cost_options = {
                            uri: lowest_cost_api_url,
                            headers: {
                                'X-Naver-Client-Id': naver_api_key.CLIENT_ID,
                                'X-Naver-Client-Secret': naver_api_key.CLIENT_SECRET
                            },
                            json: true
                         };

                        rp(lowest_cost_options)
                           .then( low_cost_info => {
                               if(low_cost_info.items) {
                                   data.low_cost_info = low_cost_info.items[0];
                                   data.low_cost_info.title = data.low_cost_info.title.replace(/<\/?[^>]+(>|$)/g, "");
                                   connection.release();
                                   return res.render('petfood_info', data);
                               }
                           })
                           .catch( err => {
                               return next(err);
                           });

                    }
                    else {
                        connection.release();
                        return res.render('petfood_info', data);
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

router.get('/modify/:petfood_id', auth, (req, res, next) => {
    if (req.session.user_level != ADMIN_LEVEL) {
        return res.redirect("/user/login?required=admin");
    }

    let data = req.data;
    let connection;

    //data = Object.assign(data, )

    pool.getConnection()
        .then(conn => {
            connection = conn;
            return connection.query(SELECT_PETFOOD_MODIFY_INFO, [req.params.petfood_id]);
        })
        .then(result => {
            data.petfood_data = result[0];
            return connection.query(SELECT_PETFOOD_COMPANY);
        })
        .then(result => {
            for (s of result) {
                s.current_company = (data.petfood_data.petfood_company_id == s.petfood_company_id)? true : false;
            }
            data.petfood_company = result;
            return connection.query(SELECT_TARGET_AGE);
        })
        .then(result => {
            // 사료 대상 연령 리스트에서 현재 사료의 대상 연령을 구분하는 부분
            for (s of result) {
                s.current_target_age = (data.petfood_data.target_age_id == s.target_age_id)? true : false;
            }
            data.petfood_target_age = result;
            return;
        })
        .then(() => {
            connection.release();
            return res.render('upload_petfood', data);
        })
        .catch(err => {
            return next(err);
        });
});

router.get('/upload', auth, (req, res, next) => {
    if (req.session.user_level != ADMIN_LEVEL) {
        return res.redirect("/user/login?required=admin");
    }

    let data = req.data;
    let connection;

    pool.getConnection()
        .then(conn => {
            connection = conn;
            return connection.query(SELECT_PETFOOD_COMPANY);
        })
        .then(result => {
            data.petfood_company = result;
            return connection.query(SELECT_TARGET_AGE);
        })
        .then(result => {
            data.petfood_target_age = result;
            return;
        })
        .then(() => {
            connection.release();
            return res.render('upload_petfood', data);
        })
        .catch(err => {
            return next(err);
        });
});

router.post('/upload', (req, res, next) => {

    let nutrition_info = nutrition.assess_nutrition(req.body);
    let main_ingredient = req.body.ingredients.split(',')[0];

    let connection;

    pool.getConnection()
        .then(conn => {
            // 펼침연산자로 한번에 넣기 *** 종한쓰 HELP NEED
            connection = conn;
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

router.post('/modify', (req, res, next) => {
    if (req.session.user_level != ADMIN_LEVEL) {
        return res.redirect("/user/login?required=admin");
    }

    let nutrition_info = nutrition.assess_nutrition(req.body);
    let main_ingredient = req.body.ingredients.split(',')[0];

    pool.getConnection()
        .then(conn => {
            connection = conn;
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

router.post('/delete', (req, res, next) => {

    if (req.session.user_level != ADMIN_LEVEL) {
        return res.status(403).json({
            status: "ERROR",
            message : "권한이 없습니다."
        });
    }
    /* 이미 삭제된 것에 대해서 alert을 줄것인가
     *********** 관리자가 유저의 권한을 설정하는 페이지도 있으면 good
     */
    pool.getConnection()
        .then(conn => {
            connection = conn;
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

router.post('/upload_image', file_upload.middle_upload, (req, res) => {
    let data = {};
    data.filename = req.file.filename;
    data.status = "OK";
    return res.json(data);
});

router.post('/rcmd', auth, (req, res, next) => {

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

router.get('/petfood_name_list', (req, res, next) => {
    pool.getConnection()
    .then(conn => {
        connection = conn;
        // 평점 테이블에서 이 유저가 이 사료에 대해 평가한 평점 row가 있나 검색
        return connection.query(SELECT_PETFOOD_NAME);
    })
    .then(result =>{
        connection.release();
        result = result.map(obj => obj.petfood_name);
        res.json(result);
    })
    .catch(err => {
        return next(err);
    });
});

module.exports = router;
