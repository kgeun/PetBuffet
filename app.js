const express = require('express');

let app = express();

let handlebars = require('express-handlebars')
	.create({ defaultLayout:'main' });

let mysql = require('mysql');
let multer = require('multer');
let hbs = require('handlebars');
let bcrypt = require('bcrypt');
let cookieParser = require('cookie-parser');
let session = require('express-session');
let fs = require("fs");
let redis = require("redis");
let redisStore = require("connect-redis")(session);
let saltRounds = 10;

hbs.registerHelper('ifCond', require('./helper'));

fs.readFile("./partial/review_petfood_item_partial.handlebars", function (err, data) {
    if (err) throw err;
    hbs.registerPartial('review_petfood_item', data.toString())
});

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('port', 80);

app.use(express.static(__dirname + '/public'));
app.use(require("body-parser").urlencoded({extended: true}));
app.use(cookieParser());

//var redisClient = redis.createClient(6379, 'localhost');

app.use(session({
  key: 'sid', // 세션키
  secret: 'secret', // 비밀키
	saveUninitialized : false,
	resave : false
}));

let Storage = multer.diskStorage({
     destination: function(req, file, callback) {
         callback(null, "./public/petfood_images");
     },
     filename: function(req, file, callback) {
         callback(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
     }
 });

let upload = multer({
		storage: Storage
}).single("petfood_image"); //Field name and max count

let client = mysql.createConnection({
  host: '10.105.185.181',
  user: 'root',
  database: 'petbuffet',
  password: 'dlrudrms',
	port: '13306'
});

client.connect(function(err) {
  if (err) {
  	console.log('mysql connection error');
    throw err;
  } else {
  	console.log("연결에 성공하였습니다.");
  }
});

app.get('/', function(req, res) {
		return res.redirect('/petfood/list/1');
});

app.get('/petfood/list/:page', function(req, res) {
	  client.query(`SELECT
										petfood_photo_addr,petfood_id,petfood_name,nutrition_score,customer_score
									FROM
										petfood
									ORDER BY
										petfood_id
									DESC LIMIT 5 OFFSET ${(req.params.page-1)*5}`
									, function (err, result, fields) {
			if (err) throw err;
			client.query(`SELECT
				 							COUNT(*) as amount
										FROM
											petfood
										ORDER BY
											petfood_id
										DESC`
										, function (err2, result2, fields2) {
				if (err2) throw err2;

				let data = {};

				if(req.session.userid) {
					data.session = req.session;
				}

				data.result = result;
				data.number_of_page = parseInt((result2[0]['amount']/5)+1);
				data.current_page = req.params.page;
				data.first_page = (data.current_page == 1);
				data.last_page = (data.current_page == data.number_of_page);
				data.prev_page = parseInt(data.current_page) - 1;
				data.next_page = parseInt(data.current_page) + 1;

				let paging = [];

				for(let i = 1 ; i <= data.number_of_page ; i++) {
					let page = {};
					page.paging_page = i;
					if(i == data.current_page){
						page.paging_currentpage = true;
					} else {
						page.paging_currentpage = false;
					}
					paging.push(page);
				}

				data.paging = paging;
				return res.render('home',data);
			});
			});
});

app.get('/petfood/info/:petfood_id', function(req, res) {
	  client.query("SELECT * FROM petfood,petfood_company,petfood_target_age WHERE petfood_target_age.target_age_id = petfood.target_age_id AND petfood.petfood_company_id = petfood_company.petfood_company_id AND petfood_id = " + req.params.petfood_id, function (err, result, fields) {
				if (err) throw err;
				let data = {};
				data = result[0];
				if(req.session.userid) {
					data.session = req.session;
				}
				if(req.query.current_page) {
					data.current_page = req.query.current_page;
				} else {
					data.current_page = 1;
				}
				//let data = {};
				//data.result = result;
				return res.render('petfood_info',data);
			});
});

app.get('/petfood/modify/:petfood_id', function(req, res) {
		if(req.session.user_level != 2) {
			return res.redirect("/");
		}
	  client.query("SELECT * FROM petfood WHERE petfood_id = " + req.params.petfood_id, function (err, result, fields) {
				if (err) throw err;
				client.query("SELECT * FROM petfood_company", function (err2, result2, fields2) {
					client.query("SELECT * FROM petfood_target_age", function (err3, result3, fields3) {
						if (err) throw err;
						let data = {};
						if(req.session.userid) {
							data.session = req.session;
						}
						data.petfood_data = result[0];
						data.petfood_company = result2;
						data.petfood_target_age = result3;

						return res.render('upload_petfood',data);
						});
					});
			});
});

app.get('/petfood/upload', function(req, res) {
	if(req.session.user_level != 2) {
		return res.redirect("/");
	}
	client.query("SELECT * FROM petfood_company", function (err, result, fields) {
		client.query("SELECT * FROM petfood_target_age", function (err, result2, fields) {
			if (err) throw err;
			let data = {};
			if(req.session.userid) {
				data.session = req.session;
			}
			data.petfood_company = result;
			data.petfood_target_age = result2;
			return res.render('upload_petfood',data);
			});
		});
});

app.post('/petfood/upload', function(req, res) {

	let protein = req.body.protein;
	let fat = req.body.fat;
	let calcium = req.body.calcium;
	let phosphorus = req.body.phosphorus;
	let target_age_id = req.body.target_age_id;
	let nutrition_info = calculate_nutrition(target_age_id,protein,fat,calcium,phosphorus);
	let main_ingredient = req.body.ingredients.split(',')[0];

	client.query("INSERT INTO petfood (petfood_company_id, petfood_name, protein, fat, "
	+ "calcium, phosphorus, ingredients, target_age_id, nutrition_score, customer_score, "
	+ "petfood_photo_addr, eval_protein, eval_fat, eval_calcium, eval_phosphorus, main_ingredient"
	+ ") VALUES (" + req.body.petfood_company_id + ",'" + req.body.petfood_name + "',"
	+ req.body.protein + "," + req.body.fat + "," + req.body.calcium + ","
	+ req.body.phosphorus + ",'" + req.body.ingredients + "',"
	+ req.body.target_age_id + "," + nutrition_info.nutrition_score + ","
	+ "0" + ",'" + req.body.petfood_photo_addr + "'," + nutrition_info.eval_protein + "," +
	nutrition_info.eval_fat + "," + nutrition_info.eval_calcium + "," +
	nutrition_info.eval_phosphorus + ",'" + main_ingredient + "')"
	, function (err, result, fields) {
			if (err) throw err;
			res.redirect("/");
		});
});

app.post('/petfood/modify', function(req, res) {
	if(req.session.user_level != 2){
		return res.redirect("/");
	}

	let protein = req.body.protein;
	let fat = req.body.fat;
	let calcium = req.body.calcium;
	let phosphorus = req.body.phosphorus;
	let target_age_id = req.body.target_age_id;
	let nutrition_info = calculate_nutrition(target_age_id,protein,fat,calcium,phosphorus);
	let main_ingredient = req.body.ingredients.split(',')[0];

	let updating_query = "UPDATE petfood SET petfood_company_id=" + req.body.petfood_company_id + ", "
	+ "petfood_name='" + req.body.petfood_name + "', protein="+ req.body.protein + ", "
	+ "fat=" + req.body.fat + ", calcium=" + req.body.calcium + ", phosphorus="+ req.body.phosphorus  + ", "
	+ "ingredients='" + req.body.ingredients + "', target_age_id=" + req.body.target_age_id + ", "
	+ "nutrition_score=" + nutrition_info.nutrition_score + ", customer_score=0, ";
	if(req.body.petfood_photo_addr != ''){
		updating_query += "petfood_photo_addr='" + req.body.petfood_photo_addr + "'," ;
	}
	updating_query += "eval_protein=" + nutrition_info.eval_protein + ", eval_fat=" + nutrition_info.eval_fat
	+ ", eval_calcium=" + nutrition_info.eval_calcium + ", eval_phosphorus=" + nutrition_info.eval_phosphorus
	+ ", main_ingredient='" + main_ingredient + "' WHERE petfood_id=" + req.body.petfood_id;

	client.query(updating_query, function (err, result, fields) {
			if (err) throw err;
			res.redirect("/petfood/info/" + req.body.petfood_id);
		});
});

app.get('/petfood/delete/:petfood_id', function(req, res) {

	if(req.session.user_level != 2){
		return res.redirect("/");
	}
	let deleting_query = "DELETE FROM petfood WHERE petfood_id=" + req.params.petfood_id;

	client.query(deleting_query, function (err, result, fields) {
			if (err) throw err;
			res.redirect("/");
	});
});

function calculate_nutrition(target_age_id,protein,fat,calcium,phosphorus) {
	let nutrition_info = {};
	let nutrition_score = 0;

	if(target_age_id == 1) {
			// protein
			if(protein < 22.5){
				nutrition_info.eval_protein = -1;
			} else if(protein >= 50){
				nutrition_info.eval_protein = 1;
			} else {
				nutrition_info.eval_protein = 0;
				nutrition_score++;
			}

			// fat
			if(fat < 8.5){
				nutrition_info.eval_fat = -1;
			} else if(fat >= 50){
				nutrition_info.eval_fat = 1;
			} else {
				nutrition_info.eval_fat = 0;
				nutrition_score++;
			}

			//calcium
			if(calcium < 1.2){
				nutrition_info.eval_calcium = -1;
			} else if(calcium >= 2.5){
				nutrition_info.eval_calcium = 1;
			} else {
				nutrition_info.eval_calcium = 0;
				nutrition_score++;
			}

			//phosphorus
			if(phosphorus < 1.0){
				nutrition_info.eval_phosphorus = -1;
			} else if(phosphorus >= 1.6){
				nutrition_info.eval_phosphorus = 1;
			} else {
				nutrition_info.eval_phosphorus = 0;
				nutrition_score++;
			}

	} else if(target_age_id == 2 || target_age_id == 3) {
		// protein
		if(protein < 18){
			nutrition_info.eval_protein = -1;
		} else if(protein >= 50){
			nutrition_info.eval_protein = 1;
		} else {
			nutrition_info.eval_protein = 0;
			nutrition_score++;
		}

		// fat
		if(fat < 5.5){
			nutrition_info.eval_fat = -1;
		} else if(fat >= 50){
			nutrition_info.eval_fat = 1;
		} else {
			nutrition_info.eval_fat = 0;
			nutrition_score++;
		}

		//calcium
		if(calcium < 0.5){
			nutrition_info.eval_calcium = -1;
		} else if(calcium >= 2.5){
			nutrition_info.eval_calcium = 1;
		} else {
			nutrition_info.eval_calcium = 0;
			nutrition_score++;
		}

		//phosphorus
		if(phosphorus < 0.4){
			nutrition_info.eval_phosphorus = -1;
		} else if(phosphorus >= 1.6){
			nutrition_info.eval_phosphorus = 1;
		} else {
			nutrition_info.eval_phosphorus = 0;
			nutrition_score++;
		}
	}
	nutrition_info.nutrition_score = nutrition_score;

	return nutrition_info;
}

app.post('/petfood/upload_image',	upload, function(req, res) {
	let data = {};
	data.filename = req.file.filename;
	data.status = "OK";
	res.json(data);
});

app.get('/review/list/:petfood_id',	function(req, res) {
	let page;
	if(!req.query.page){
		page = 1;
	} else {
		page = req.query.page;
	}

	client.query(`SELECT
									*
								FROM
									petfood,petfood_company
								WHERE
									petfood.petfood_company_id = petfood_company.petfood_company_id
								AND
									petfood_id = ` + req.params.petfood_id
								,function (err, result, fields) {
		client.query(`SELECT
										petfood_review_id, petfood_review_title, username, petfood_rcmd_value,
										DATE_FORMAT(creation_datetime, '%Y-%m-%d') as creation_datetime
									FROM
										petfood_review,user_info,petfood_rcmd
									WHERE
										petfood_review.user_pk = user_info.user_pk
									AND
										petfood_review.petfood_rcmd_id = petfood_rcmd.petfood_rcmd_id
									ORDER BY
										petfood_review_id
									DESC LIMIT 10 OFFSET ` + (page-1)*10
									, function (err2, result2, fields2) {
			let data = {};
			data.session = req.session;
			data.petfood_info = result[0];
			data.review_list = result2;
			console.log("DATA :" + JSON.stringify(data));
			res.render("review_list",data);
		});
	});

});


app.get('/review/content/:petfood_review_id',	function(req, res) {

	client.query(`SELECT
									*, DATE_FORMAT(creation_datetime, '%Y-%m-%d') as creation_date
								FROM
									petfood_review,user_info,petfood_rcmd
								WHERE
									petfood_review.user_pk = user_info.user_pk
								AND
									petfood_review.petfood_rcmd_id = petfood_rcmd.petfood_rcmd_id
								AND
									petfood_review_id=${req.params.petfood_review_id}`
								,function (err, result, fields) {
									client.query(`SELECT
																	*
																FROM
																	petfood,petfood_company
																WHERE
																	petfood.petfood_company_id = petfood_company.petfood_company_id
																AND
																	petfood_id = ${result[0].petfood_id}`
																, function (err2, result2, fields2) {
																	let data = {};
																	data.session = req.session;
																	data.review_item = result[0];
																	data.petfood_info = result2[0];
																	res.render("review_content",data);
									});
	});
});

app.get('/review/write/:petfood_id',	function(req, res) {
	client.query(`SELECT
									*
								FROM
									petfood,petfood_company
								WHERE
									petfood.petfood_company_id = petfood_company.petfood_company_id
								AND
									petfood_id = ` + req.params.petfood_id
								,function (err, result, fields) {
									let data = {};
									data.petfood_info = result[0];
									data.session = req.session;
									console.log("DATA : " + JSON.stringify(data));
									res.render("review_write",data);
	});
});

app.post('/review/write/:petfood_id',	function(req, res) {
	//console.log("잘 올라왔나 : " + req.body);
	let review_item = req.body;
	console.log("review item : " + JSON.stringify(req.body));

	console.log("review item22 : " + review_item.petfood_id);

	let query = `INSERT INTO
									petfood_rcmd
								VALUES
									(NULL, ${req.session.user_pk}, ${review_item.petfood_id}, ${review_item.petfood_rcmd_value})`;

	console.log("Q : " + query);

	client.query(`INSERT INTO
									petfood_rcmd
								VALUES
									(NULL, ${req.session.user_pk}, ${review_item.petfood_id}, ${review_item.petfood_rcmd_value})`
								,function (err, result, fields) {
									console.log("result : " + JSON.stringify(result));
									return res.redirect("/review/write/" + review_item.petfood_id );
									/*
									console.log("insertID1 : " + JSON.stringify(result));
									client.query(`INSERT INTO
																	petfood_review
																VALUES
																	(NULL, ${review_item.petfood_review_title}, ${review_item.petfood_review_content}, ${req.session.user_pk}, ${review_item.petfood_id},${result.insertId}, now())`
																,function (err2, result2, fields2) {
																	res.redirect("/review/content/" + result2.insertId );
									});*/
	});

/*
	client.query(`SELECT
									*
								FROM
									petfood,petfood_company
								WHERE
									petfood.petfood_company_id = petfood_company.petfood_company_id
								AND
									petfood_id = ` + req.params.petfood_id
								,function (err, result, fields) {
									return res.json(req.body);
	});
	*/
});

app.get('/user/login',	function(req, res) {
	res.render("login_and_register");
});

app.post('/user/login',	function(req, res) {
	let userid = req.body.userid;
	let password = req.body.password;

	if (!userid || !password) {
		return res.json({
			statusCode: 401,
			message: "아이디나 패스워드를 입력하지 않았습니다."
		});
	}

	client.query(`SELECT
									username, userid, password, user_level, user_pk
								FROM
									user_info
								WHERE
									userid='${userid}'`
									, function (err, result, fields) {
		let user = result[0];
    if(!user || !user.hasOwnProperty('password')) {
    	return res.json({
      	statusCode: 401,
        message: "존재하지 않는 아이디 입니다."
      });
    }

		bcrypt.compare(password, user.password, function(err, r) {
    	if(r) {
				req.session.userid = user.userid;
				req.session.user_level = user.user_level;
				req.session.username = user.username;
				req.session.user_pk = user.user_pk;
				return res.json({
					status : 200,
					message : '로그인에 성공했습니다.'
				});
			}
      else {
				return res.json({
					status : 400,
					message : '비밀번호가 틀렸습니다.'
				});
    	}
		});
	});

});

app.post('/user/register', function(req, res) {
	//const {userid, username, password} = req.body;
	let user = req.body;
	if(!user || !user.userid || !user.username || !user.password) {
		return res.json({
			status : 400,
			message : '모든 항목이 입력되지 않았습니다.'
		});
	}
  bcrypt.hash(user.password, saltRounds, function(err, hash) {
		client.query(`SELECT count(*) as count FROM user_info WHERE userid = '${user.userid}'`, function (err, result, fields) {
			if(!result[0].count) { // No Duplicated
	    	client.query(
					`INSERT INTO user_info VALUES (NULL, '${user.userid}', '${hash}', '${user.username}', 1)`, function (err2, result2, fields2) {
					return res.json({
						status : 200,
						message : '가입에 성공했습니다.'
					});
				});
			} else {
				return res.json({
					status : 400,
					message : 'id가 중복되었습니다.'
				})
			}
		});
	});
});

app.get('/user/logout', function(req, res) {
	req.session.destroy();  // 세션 삭제
	res.clearCookie('sid'); // 세션 쿠키 삭제
	return res.redirect("/");
});

// 404 catch-all handler (middleware)
app.use(function(req, res, next){
	res.status(404);
	return res.render('404');
});

// 500 error handler (middleware)
app.use(function(err, req, res, next){
	console.error(err.stack);
	res.status(500);
	return res.render('500');
});

app.listen(app.get('port'), function(){
  console.log( 'Express started on http://localhost:' +
    app.get('port') + '; press Ctrl-C to terminate.' );
});
