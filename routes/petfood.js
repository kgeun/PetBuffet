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
    DELETE_PETFOOD
} = require('../queries/petfood');

const ADMIN_LEVEL = 2;
const PETFOOD_ITEMS_PER_PAGE = 5;

router.get('/list/:page', auth, function(req, res) {

    let connection;
    let data = req.data;
    data.current_page = req.params.page;

    if(data.session && data.session.user_level == ADMIN_LEVEL) {
        data.is_user_admin = true;
    }

    pool.getConnection()
    .then(conn => {
        connection = conn;
        return;
    })
    .then(() => {
        return connection.query(SELECT_PETFOOD_TITLE, [(req.params.page-1)*PETFOOD_ITEMS_PER_PAGE]);
    })
    .then(result => {
        data.result = result;
        return connection.query(COUNT_PETFOOD);
    })
    .then(result => {
        // 페이징 작업
        utils.inject_paging_information_data(data,result[0].count,PETFOOD_ITEMS_PER_PAGE);
        return;
    })
    .then(() => {
        connection.release();
        return res.render('home',data);
    })
    .catch(err => {
        console.log(err);
        return;
    });

});

router.get('/info/:petfood_id', auth, function(req, res) {
    let data = req.data;

    //목록을 누르면 돌아갈 페이지를 설정. get parameter인 current_page에 저장되어있음
    if(req.query.current_page) {
        data.current_page = req.query.current_page;
    } else {
        data.current_page = 1;
    }

    if(data.session && data.session.user_level == ADMIN_LEVEL) {
        data.is_user_admin = true;
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
        result[0] = Object.assign(result[0], nutrition.assess_nutrition(result[0]));
        data = Object.assign(data, result[0]);
        return;
    })
    .then(() => {
        utils.give_html_and_color_by_eval_nutrition(data);
    })
    .then(() => {
        connection.release();
        return res.render('petfood_info',data);
    })
    .catch(err => {
        console.log(err);
        return;
    });
});

router.get('/modify/:petfood_id', auth, function(req, res) {
    if(req.session.user_level != ADMIN_LEVEL) {
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
        data.petfood_company = result;
        return connection.query(SELECT_TARGET_AGE);
    })
    .then(result => {
        data.petfood_target_age = result;
        return;
    })
    .then(() => {
        connection.release();
        return res.render('upload_petfood',data);
    })
    .catch(err => {
        console.log(err);
        return;
    });
});

router.get('/upload', auth, function(req, res) {
    if(req.session.user_level != ADMIN_LEVEL) {
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
        return res.render('upload_petfood',data);
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
        return connection.query(INSERT_PETFOOD,
            [req.body.petfood_company_id, req.body.petfood_name, req.body.protein,
            req.body.fat, req.body.calcium, req.body.phosphorus, req.body.ingredients,
            req.body.target_age_id, nutrition_info.nutrition_score, req.body.petfood_photo_addr,
            main_ingredient]);
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
    if(req.session.user_level != ADMIN_LEVEL){
        return res.redirect("/user/login?required=admin");
    }

    let nutrition_info = utils.calculate_nutrition(req.body);
    let main_ingredient = req.body.ingredients.split(',')[0];

    pool.getConnection()
    .then(conn => {
        connection = conn;
        return;
    })
    .then(() => {
        if(req.body.petfood_photo_addr != ''){
            connection.query(UPDATE_PETFOOD_WITH_PHOTO,
                [req.body.petfood_company_id, req.body.petfood_name, req.body.protein,
                req.body.fat, req.body.calcium, req.body.phosphorus, req.body.ingredients,
                req.body.target_age_id, nutrition_info.nutrition_score, main_ingredient,
                req.body.petfood_photo_addr, req.body.petfood_id]);
        } else {
            connection.query(UPDATE_PETFOOD_WITHOUT_PHOTO,
                [req.body.petfood_company_id, req.body.petfood_name, req.body.protein,
                req.body.fat, req.body.calcium, req.body.phosphorus, req.body.ingredients,
                req.body.target_age_id, nutrition_info.nutrition_score, main_ingredient,
                req.body.petfood_id]);
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

router.get('/delete/:petfood_id', function(req, res) {

    if(req.session.user_level != ADMIN_LEVEL){
        return res.redirect("/user/login?required=admin");
    }

    pool.getConnection()
    .then(conn => {
        connection = conn;
        return;
    })
    .then(() => {
        return connection.query(DELETE_PETFOOD, [req.params.petfood_id]);
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

router.post('/upload_image', file_upload.middle_upload, function(req, res) {
    let data = {};
    data.filename = req.file.filename;
    data.status = "OK";
    return res.json(data);
});

module.exports = router;
