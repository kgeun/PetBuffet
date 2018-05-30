//함수로 만들어 객체 app을 전달받음
	let express = require('express');
  let multer = require('multer');
	let router = express.Router();

  var Storage = multer.diskStorage({
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

  router.get('/list/:page', function(req, res) {
  	  client.query("SELECT petfood_photo_addr,petfood_id,petfood_name,nutrition_score,customer_score FROM petfood ORDER BY petfood_id DESC LIMIT 5 OFFSET " + (req.params.page-1)*5, function (err, result, fields) {
  			if (err) throw err;
  			client.query("SELECT COUNT(*) as amount FROM petfood ORDER BY petfood_id DESC", function (err2, result2, fields2) {
  				if (err2) throw err2;
  				let data = {};

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
  				console.log(data);
  				res.render('home',data);
  			});
  			});
  });

  router.get('/info/:petfood_id', function(req, res) {
  		console.log("petfoodid : " + req.params.petfood_id);
  	  client.query("SELECT * FROM petfood,petfood_company,petfood_target_age WHERE petfood_target_age.target_age_id = petfood.target_age_id AND petfood.petfood_company_id = petfood_company.petfood_company_id AND petfood_id = " + req.params.petfood_id, function (err, result, fields) {
  				if (err) throw err;
  				console.log(result);
  				let data;
  				data = result[0];
  				console.log("DTATA : " + result[0]);
  				if(req.query.current_page) {
  					data.current_page = req.query.current_page;
  				} else {
  					data.current_page = 1;
  				}
  				//let data = {};
  				//data.result = result;
  				res.render('petfood_info',data);
  			});
  });

  router.get('/modify/:petfood_id', function(req, res) {
  		console.log("petfoodid : " + req.params.petfood_id);
  	  client.query("SELECT * FROM petfood WHERE petfood_id = " + req.params.petfood_id, function (err, result, fields) {
  				if (err) throw err;
  				client.query("SELECT * FROM petfood_company", function (err2, result2, fields2) {
  					client.query("SELECT * FROM petfood_target_age", function (err3, result3, fields3) {
  						if (err) throw err;
  						let data = {};
  						data.petfood_data = result[0];
  						data.petfood_company = result2;
  						data.petfood_target_age = result3;

  						res.render('upload_petfood',data);
  						});
  					});
  				console.log(result);
  			});
  });


  router.get('/upload', function(req, res) {
  	client.query("SELECT * FROM petfood_company", function (err, result, fields) {
  		client.query("SELECT * FROM petfood_target_age", function (err, result2, fields) {
  			if (err) throw err;
  			let data = {};
  			data.petfood_company = result;
  			data.petfood_target_age = result2;
  			res.render('upload_petfood',data);
  			});
  		});
  });

  router.post('/upload', function(req, res) {

  	let protein = req.body.protein;
  	let fat = req.body.fat;
  	let calcium = req.body.calcium;
  	let phosphorus = req.body.phosphorus;
  	let target_age_id = req.body.target_age_id;
  	let nutrition_info = calculate_nutrition(target_age_id,protein,fat,calcium,phosphorus);
  	let main_ingredient = req.body.ingredients.split(',')[0];

  	console.log("INSERT INTO petfood (petfood_company_id, petfood_name, protein, fat, "
  	+ "calcium, phosphorus, ingredients, target_age_id, nutrition_score, customer_score, "
  	+ "petfood_photo_addr, eval_protein, eval_fat, eval_calcium, eval_phosphorus, main_ingredient"
  	+ ") VALUES (" + req.body.petfood_company_id + ",'" + req.body.petfood_name + "',"
  	+ req.body.protein + "," + req.body.fat + "," + req.body.calcium + ","
  	+ req.body.phosphorus + ",'" + req.body.ingredients + "',"
  	+ req.body.target_age_id + "," + nutrition_info.nutrition_score + ","
  	+ "0" + ",'" + req.body.petfood_photo_addr + "'," + nutrition_info.eval_protein + "," +
  	nutrition_info.eval_fat + "," + nutrition_info.eval_calcium + "," +
  	nutrition_info.eval_phosphorus + ",'" + main_ingredient + "')");

  	console.log(nutrition_info);

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

  router.post('/modify', function(req, res) {

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

  router.get('/delete/:petfood_id', function(req, res) {
  	let finding_name_query = "SELECT "
  	let deleting_query = "DELETE FROM petfood WHERE petfood_id=" + req.params.petfood_id;

  	client.query(deleting_query, function (err, result, fields) {
  			if (err) throw err;
  			res.redirect("/");
  	});
  });

  router.post('/upload_image',upload, function(req, res) {
  	let data = {};
  	data.filename = req.file.filename;
  	data.status = "OK";
  	res.json(data);
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

	module.exports = router;	//라우터를 리턴
