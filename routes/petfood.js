/** INITIALIZE */
const express = require('express');
const router = express.Router();

/** DATABASE */
const pool = require('../configs/mysql');
const file_upload = require('../configs/file_upload');

/** MIDDLEWARE */
const auth = require('../middleware/auth');

/** UTILITY */
const utils = require('../util/util');
const nutrition = require('../util/nutrition');

// Quries
const {
    SELECT_PETFOOD_TITLE,
    COUNT_PETFOOD,
    SELECT_PETFOOD_ALL_INFO,
    SELECT_PETFOOD_SOME_INFO,
    SELECT_PETFOOD_COMPANY,
    SELECT_TARGET_AGE,
    INSERT_PETFOOD,
    UPDATE_PETFOOD_WITH_PHOTO,
    UPDATE_PETFOOD_WITHOUT_PHOTO,
    DELETE_PETFOOD,
    SELECT_REVIEW_RECENT_TWO,
    SELECT_MAIN_INGREDIENT,
    SELECT_PROTEIN_CONTENT,
    search_petfood_query,
    count_search_petfood_query
} = require('../queries/petfood');

const ADMIN_LEVEL = 2;
const PETFOOD_ITEMS_PER_PAGE = 5;

/*
router.get('/list/:page', auth, function(req, res) {

    let connection;
    let data = req.data;
    data.current_page = req.params.page;

    if (data.session && data.session.user_level == ADMIN_LEVEL) {
        data.is_user_admin = true;
    }

    pool.getConnection()
        .then(conn => {
            connection = conn;
            return;
        })
        .then(() => {
            return connection.query(SELECT_PETFOOD_TITLE, [(req.params.page - 1) * PETFOOD_ITEMS_PER_PAGE]);
        })
        .then(result => {
            data.result = result;
            return connection.query(COUNT_PETFOOD);
        })
        .then(result => {
            // 페이징 작업
            utils.inject_paging_information_data(data, result[0].count, PETFOOD_ITEMS_PER_PAGE);
            return connection.query(SELECT_MAIN_INGREDIENT);
        })
        .then(result => {
            data.main_ingredient = result;
            return connection.query(SELECT_TARGET_AGE);
        })
        .then(result => {
            data.target_age = result;
            return connection.query(SELECT_PETFOOD_COMPANY);
        })
        .then(result => {
            data.petfood_company = result;
            connection.release();
            return res.render('home', data);
        })
        .catch(err => {
            console.log(err);
            return;
        });
});
*/

router.get('/list/:page', auth, function(req, res) {

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
        data.query_string = utils.serialize_get_parameter(req.query);
    } else {
        data.query = '';
    }

    pool.getConnection()
        .then(conn => {
            connection = conn;
            return;
        })
        .then(() => {
            return connection.query(SELECT_MAIN_INGREDIENT);
        })
        .then(result => {
            data.main_ingredient = result;

            for(s of data.main_ingredient) {
                s.current_main_ingredient = (s.main_ingredient_id == data.main_ingredient_id);
            }

            return connection.query(SELECT_TARGET_AGE);
        })
        .then(result => {
            data.target_age = result;

            for(s of data.target_age) {
                s.current_target_age = (s.target_age_id == data.target_age_id);
            }

            return connection.query(SELECT_PETFOOD_COMPANY);
        })
        .then(result => {
            data.petfood_company = result;

            for(s of data.petfood_company) {
                s.current_petfood_company = (s.petfood_company_id == data.petfood_company_id);
            }

            return connection.query(SELECT_PROTEIN_CONTENT);
        })
        .then(result => {
            data.protein_content = result;

            for(s of data.protein_content) {
                s.current_protein_content = (s.protein_content_id == data.protein_content_id);
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
            console.log(err);
            return;
        });
});


router.get('/info/:petfood_id', auth, function(req, res) {
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
        data.query_string = utils.serialize_get_parameter(req.query);
    }

    let connection;
    pool.getConnection()
        .then(conn => {
            connection = conn;
            return;
        })
        .then(() => {
            return connection.query(SELECT_PETFOOD_ALL_INFO, [req.params.petfood_id]);
        })
        .then(result => {
            //주석 넣기.. 로대시
            result[0] = Object.assign(result[0], nutrition.assess_nutrition(result[0]));
            data = Object.assign(data, result[0]);
            utils.give_html_and_color_by_eval_nutrition(data);

            return connection.query(SELECT_REVIEW_RECENT_TWO, [req.params.petfood_id]);
        })
        .then(result => {
            data.recent_reviews = result;
            // 사료 정보 중 리뷰 미리보기에서 html코드 삭제 및 긴 문자열 생략처리
            utils.process_recent_review_content(data.recent_reviews);
        })
        .then(() => {
            connection.release();
            return res.render('petfood_info', data);
        })
        .catch(err => {
            console.log(err);
            return;
        });
});

router.get('/modify/:petfood_id', auth, function(req, res) {
    if (req.session.user_level != ADMIN_LEVEL) {
        return res.redirect("/user/login?required=admin");
    }

    let data = req.data;
    let connection;

    pool.getConnection()
        .then(conn => {
            connection = conn;
            return;
        })
        .then(() => {
            return connection.query(SELECT_PETFOOD_SOME_INFO, [req.params.petfood_id]);
        })
        .then(result => {
            data.petfood_data = result[0];
            return connection.query(SELECT_PETFOOD_COMPANY);
        })
        .then(result => {
            // 사료 회사 리스트에서 현재 사료회사가 어떤건지 확인하는 부분

            ///// map으로 바꾸면 더욱 간결해 질 것
            for (s of result) {
                s.current_company = (data.petfood_data.petfood_company_id == s.petfood_company_id);
            }
            data.petfood_company = result;
            return connection.query(SELECT_TARGET_AGE);
        })
        .then(result => {
            // 사료 대상 연령 리스트에서 현재 사료의 대상 연령을 구분하는 부분
            for (s of result) {
                s.current_target_age = (data.petfood_data.target_age_id == s.target_age_id);
            }
            data.petfood_target_age = result;
            return;
        })
        .then(() => {
            connection.release();
            return res.render('upload_petfood', data);
        })
        .catch(err => {
            console.log(err);
            return;
        });
});

router.get('/upload', auth, function(req, res) {
    if (req.session.user_level != ADMIN_LEVEL) {
        return res.redirect("/user/login?required=admin");
    }

    let data = req.data;
    let connection;

    pool.getConnection()
        .then(conn => {
            connection = conn;
            return;
        })
        .then(() => {
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
            console.log(err);
            return;
        });
});

router.post('/upload', function(req, res) {

    let nutrition_info = nutrition.assess_nutrition(req.body);
    let main_ingredient = req.body.ingredients.split(',')[0];

    let connection;

    pool.getConnection()
        .then(conn => {
            connection = conn;
            return;
        })
        .then(() => {
            // 펼침연산자로 한번에 넣기 *** 종한쓰 HELP NEED
            return connection.query(INSERT_PETFOOD, [req.body.petfood_company_id, req.body.petfood_name, req.body.protein,
                req.body.fat, req.body.calcium, req.body.phosphorus, req.body.ingredients,
                req.body.target_age_id, nutrition_info.nutrition_score, req.body.petfood_photo_addr,
                main_ingredient
            ]);
        })
        .then(result => {
            connection.release();
            return res.redirect("/");
        })
        .catch(err => {
            console.log(err);
            return;
        });

});

router.post('/modify', function(req, res) {
    if (req.session.user_level != ADMIN_LEVEL) {
        return res.redirect("/user/login?required=admin");
    }

    let nutrition_info = nutrition.assess_nutrition(req.body);
    let main_ingredient = req.body.ingredients.split(',')[0];

    pool.getConnection()
        .then(conn => {
            connection = conn;
            return;
        })
        .then(() => {
            // *** 원래 값 줘서 그냥 업로드 시키기. 굳이 나누지 말고
            if (req.body.petfood_photo_addr != '') {
                connection.query(UPDATE_PETFOOD_WITH_PHOTO, [req.body.petfood_company_id, req.body.petfood_name, req.body.protein,
                    req.body.fat, req.body.calcium, req.body.phosphorus, req.body.ingredients,
                    req.body.target_age_id, nutrition_info.nutrition_score, main_ingredient,
                    req.body.petfood_photo_addr, req.body.petfood_id
                ]);
            } else {
                connection.query(UPDATE_PETFOOD_WITHOUT_PHOTO, [req.body.petfood_company_id, req.body.petfood_name, req.body.protein,
                    req.body.fat, req.body.calcium, req.body.phosphorus, req.body.ingredients,
                    req.body.target_age_id, nutrition_info.nutrition_score, main_ingredient,
                    req.body.petfood_id
                ]);
            }
        })
        .then(result => {
            connection.release();
            return res.redirect("/petfood/info/" + req.body.petfood_id);
        })
        .catch(err => {
            console.log(err);
            return;
        });
});

router.post('/delete', function(req, res) {

    if (req.session.user_level != ADMIN_LEVEL) {
        return res.status(403).json({
            status: "ERROR"
        });
    }
    /* 이미 삭제된 것에 대해서 alert을 줄것인가
     *********** 관리자가 유저의 권한을 설정하는 페이지도 있으면 good
     */
    pool.getConnection()
        .then(conn => {
            connection = conn;
            return;
        })
        .then(() => {
            return connection.query(DELETE_PETFOOD, req.body.petfood_id);
        })
        .then(result => {
            connection.release();
            return res.json({
                status: "OK"
            });
        })
        .catch(err => {
            console.log(err);
            return;
        });
});

router.post('/upload_image', file_upload.middle_upload, function(req, res) {
    let data = {};
    data.filename = req.file.filename;
    data.status = "OK";
    return res.json(data);
});

module.exports = router;
