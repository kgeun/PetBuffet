const express = require('express');

let app = express();

let handlebars = require('express-handlebars')
	.create({ defaultLayout:'main' });

let mysql = require('mysql');
let multer = require('multer');
let hbs = require('handlebars');
let bcrypt = require('bcrypt');
var cookieParser = require('cookie-parser');
var session = require('express-session');
let saltRounds = 10;

hbs.registerHelper('ifCond', function (v1, operator, v2, options) {
    switch (operator) {
        case '==':
            return (v1 == v2) ? options.fn(this) : options.inverse(this);
        case '===':
            return (v1 === v2) ? options.fn(this) : options.inverse(this);
        case '!=':
            return (v1 != v2) ? options.fn(this) : options.inverse(this);
        case '!==':
            return (v1 !== v2) ? options.fn(this) : options.inverse(this);
        case '<':
            return (v1 < v2) ? options.fn(this) : options.inverse(this);
        case '<=':
            return (v1 <= v2) ? options.fn(this) : options.inverse(this);
        case '>':
            return (v1 > v2) ? options.fn(this) : options.inverse(this);
        case '>=':
            return (v1 >= v2) ? options.fn(this) : options.inverse(this);
        case '&&':
            return (v1 && v2) ? options.fn(this) : options.inverse(this);
        case '||':
            return (v1 || v2) ? options.fn(this) : options.inverse(this);
        default:
            return options.inverse(this);
    }
});

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('port', 80);

app.use(express.static(__dirname + '/public'));
app.use(require("body-parser").urlencoded({extended: true}));
app.use(cookieParser());
app.use(session({
  key: 'sid', // 세션키
  secret: 'secret', // 비밀키
  cookie: {
    maxAge: 1000 * 60 * 60 // 쿠키 유효기간 1시간
  }
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
	  client.query("SELECT petfood_photo_addr,petfood_id,petfood_name,nutrition_score,customer_score FROM petfood ORDER BY petfood_id DESC LIMIT 5 OFFSET " + (req.params.page-1)*5, function (err, result, fields) {
			if (err) throw err;
			client.query("SELECT COUNT(*) as amount FROM petfood ORDER BY petfood_id DESC", function (err2, result2, fields2) {
				if (err2) throw err2;

				let data = {};

				if(req.session.userid) {
					data.session = req.session;
					console.log("LOGED SES : " + JSON.stringify(req.session));
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
					console.log("LOGED SES : " + JSON.stringify(req.session));
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

});

app.get('/user/login',	function(req, res) {
	res.render("login_and_register");
});

app.post('/user/login',	function(req, res) {
	let userid = req.body.userid;
	let password = req.body.password;

	if(!userid || !password) {
		return res.json({
			statusCode: 401,
			message: "아이디나 패스워드를 입력하지 않았습니다."
		});
	}

	client.query(`SELECT username, userid, password, user_level FROM user_info WHERE userid='${userid}'`, function (err, result, fields) {
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
