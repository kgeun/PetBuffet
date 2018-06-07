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
  UPDATE_REVIEW
} = require('../queries/review.js')

const REVIEW_ITEMS_PER_PAGE = 10;


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
    if(!req.query.page){
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
        data.review_item = result[0];
        return connection.query(SELECT_CURRENT_PETFOOD,[result[0].petfood_id]);
    })
    .then(result => {
        data.petfood_info = result[0];
    })
    .then(() => {
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

    if(!req.session.userid){
        return res.redirect("/user/login?required=true");
    }

    let page;
    if(!req.query.page){
        data.page = 1;
    } else {
        data.page = req.query.page;
    }

    data.modify = true;

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

router.post('/modify/:petfood_review_id', auth, function(req, res) {
    console.log("UPDATE하는 내용 : " + JSON.stringify(req.body));

    let data = req.data;

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

module.exports = router;