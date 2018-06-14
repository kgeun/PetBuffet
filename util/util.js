const hbs = require('handlebars');
const nutrition = require('./nutrition');

const GOOD_HTML = `<td style="background-color:rgb(252, 255, 245);color:#2C662D;"><h5><i class="fas fa-check"></i> 적당</h5></td>`;
const LACK_HTML = `<td style="background-color:rgb(255, 246, 246);color:#9F3A38;"><h5><i class="fas fa-exclamation-triangle"></i> 부족</h5></td>`;
const EXCESS_HTML = `<td style="background-color:rgb(255, 246, 246);color:#9F3A38;"><h5><i class="fas fa-exclamation-triangle"></i> 과다</h5></td>`;

const GOOD_COLOR = `#00a65a`;
const LACK_OR_EXCESS_COLOR = `#f56954`;

module.exports.registerPartial = (err, data) => {
        if (err) throw err; //이부분 괄호 처리
        hbs.registerPartial('review_petfood_item', data.toString());
}

module.exports.inject_paging_information_data = (data, posts_amount, num_of_posts_per_one_page) => {
    data.number_of_page = parseInt((posts_amount/num_of_posts_per_one_page)+1);
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
}

module.exports.give_html_and_color_by_eval_nutrition = data => {

    //switch 덩어리쪽에서 함수 하나씩으로 빼기
    switch(data.eval_protein) {
        // 주석 달기
        //
        case nutrition.NUTRITION_GOOD:
            data.eval_protein_html = GOOD_HTML;
            data.eval_protein_color = GOOD_COLOR;
        break;
        case nutrition.NUTRITION_LACK:
            data.eval_protein_html = LACK_HTML;
            data.eval_protein_color = LACK_OR_EXCESS_COLOR;
        break;
        case nutrition.NUTRITION_EXCESS:
            data.eval_protein_html = EXCESS_HTML;
            data.eval_protein_color = LACK_OR_EXCESS_COLOR;
        break;
    }

    switch(data.eval_fat) {
        case nutrition.NUTRITION_GOOD:
            data.eval_fat_html = GOOD_HTML;
            data.eval_fat_color = GOOD_COLOR;
        break;
        case nutrition.NUTRITION_LACK:
            data.eval_fat_html = LACK_HTML;
            data.eval_fat_color = LACK_OR_EXCESS_COLOR;
        break;
        case nutrition.NUTRITION_EXCESS:
            data.eval_fat_html = EXCESS_HTML;
            data.eval_fat_color = LACK_OR_EXCESS_COLOR;
        break;
    }

    switch(data.eval_calcium) {
        case nutrition.NUTRITION_GOOD:
            data.eval_calcium_html = GOOD_HTML;
            data.eval_calcium_color = GOOD_COLOR;
        break;
        case nutrition.NUTRITION_LACK:
            data.eval_calcium_html = LACK_HTML;
            data.eval_calcium_color = LACK_OR_EXCESS_COLOR;
        break;
        case nutrition.NUTRITION_EXCESS:
            data.eval_calcium_html = EXCESS_HTML;
            data.eval_calcium_color = LACK_OR_EXCESS_COLOR;
        break;
    }

    switch(data.eval_phosphorus) {
        case nutrition.NUTRITION_GOOD:
            data.eval_phosphorus_html = GOOD_HTML;
            data.eval_phosphorus_color = GOOD_COLOR;
        break;
        case nutrition.NUTRITION_LACK:
            data.eval_phosphorus_html = LACK_HTML;
            data.eval_phosphorus_color = LACK_OR_EXCESS_COLOR;
        break;
        case nutrition.NUTRITION_EXCESS:
            data.eval_phosphorus_html = EXCESS_HTML;
            data.eval_phosphorus_color = LACK_OR_EXCESS_COLOR;
        break;
    }
}

module.exports.give_html_and_color_by_eval_protein = eval_protein => {

    let protein = {};
    switch(eval_protein) {
        // 주석
        case nutrition.NUTRITION_GOOD:
            protein.eval_protein_html = GOOD_HTML;
            protein.eval_protein_color = GOOD_COLOR;
        break;
        case nutrition.NUTRITION_LACK:
            protein.eval_protein_html = LACK_HTML;
            protein.eval_protein_color = LACK_OR_EXCESS_COLOR;
        break;
        case nutrition.NUTRITION_EXCESS:
            protein.eval_protein_html = EXCESS_HTML;
            protein.eval_protein_color = LACK_OR_EXCESS_COLOR;
        break;
    }

    return protein;
}

module.exports.give_html_and_color_by_eval_fat = eval_fat => {

    let fat = {};
    switch(eval_fat) {
        case nutrition.NUTRITION_GOOD:
            fat.eval_fat_html = GOOD_HTML;
            fat.eval_fat_color = GOOD_COLOR;
        break;
        case nutrition.NUTRITION_LACK:
            fat.eval_fat_html = LACK_HTML;
            fat.eval_fat_color = LACK_OR_EXCESS_COLOR;
        break;
        case nutrition.NUTRITION_EXCESS:
            fat.eval_fat_html = EXCESS_HTML;
            fat.eval_fat_color = LACK_OR_EXCESS_COLOR;
        break;
    }

    return fat;

}

module.exports.give_html_and_color_by_eval_calcium = eval_calcium => {

    let calcium = {};
    switch(eval_calcium) {
        case nutrition.NUTRITION_GOOD:
            calcium.eval_calcium_html = GOOD_HTML;
            calcium.eval_calcium_color = GOOD_COLOR;
        break;
        case nutrition.NUTRITION_LACK:
            calcium.eval_calcium_html = LACK_HTML;
            calcium.eval_calcium_color = LACK_OR_EXCESS_COLOR;
        break;
        case nutrition.NUTRITION_EXCESS:
            calcium.eval_calcium_html = EXCESS_HTML;
            calcium.eval_calcium_color = LACK_OR_EXCESS_COLOR;
        break;
    }
    return calcium;
}

module.exports.give_html_and_color_by_eval_phosphorus = eval_phosphorus => {

    let phosphorus = {};
    switch(eval_phosphorus) {
        case nutrition.NUTRITION_GOOD:
            phosphorus.eval_phosphorus_html = GOOD_HTML;
            phosphorus.eval_phosphorus_color = GOOD_COLOR;
        break;
        case nutrition.NUTRITION_LACK:
            phosphorus.eval_phosphorus_html = LACK_HTML;
            phosphorus.eval_phosphorus_color = LACK_OR_EXCESS_COLOR;
        break;
        case nutrition.NUTRITION_EXCESS:
            phosphorus.eval_phosphorus_html = EXCESS_HTML;
            phosphorus.eval_phosphorus_color = LACK_OR_EXCESS_COLOR;
        break;
    }

    return phosphorus;

}





module.exports.process_recent_review_content = recent_reviews => {
    for (s of recent_reviews) {
        s.petfood_review_content = s.petfood_review_content.replace(/<\/?[^>]+(>|$)/g, "");
        if(s.petfood_review_content.length > 200) {
            s.petfood_review_content = s.petfood_review_content.substr(0,200);
            s.petfood_review_content += "...";
        }
    }
}

module.exports.serialize_get_parameter = query => {
    return `query=${query.query}&petfood_company_id=${query.petfood_company_id}
    &main_ingredient_id=${query.main_ingredient_id}
    &target_age_id=${query.target_age_id}&protein_content_id=${query.protein_content_id}`;
}
