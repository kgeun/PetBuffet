const nutrition = require('./nutrition');

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
    const good_html = `<td style="background-color:rgb(252, 255, 245);color:#2C662D;"><h5><i class="fas fa-check"></i> 적당</h5></td>`;
    const lack_html = `<td style="background-color:rgb(255, 246, 246);color:#9F3A38;"><h5><i class="fas fa-exclamation-triangle"></i> 부족</h5></td>`;
    const excess_html = `<td style="background-color:rgb(255, 246, 246);color:#9F3A38;"><h5><i class="fas fa-exclamation-triangle"></i> 과다</h5></td>`;

    const good_color = `#00a65a`;
    const lack_or_excess_color = `#f56954`;

    //switch 덩어리쪽에서 함수 하나씩으로 빼기
    switch(data.eval_protein) {
        // 주석 달기
        //
        case nutrition.NUTRITION_GOOD:
            data.eval_protein_html = good_html;
            data.eval_protein_color = good_color;
        break;
        case nutrition.NUTRITION_LACK:
            data.eval_protein_html = lack_html;
            data.eval_protein_color = lack_or_excess_color;
        break;
        case nutrition.NUTRITION_EXCESS:
            data.eval_protein_html = excess_html;
            data.eval_protein_color = lack_or_excess_color;
        break;
    }

    switch(data.eval_fat) {
        case nutrition.NUTRITION_GOOD:
            data.eval_fat_html = good_html;
            data.eval_fat_color = good_color;
        break;
        case nutrition.NUTRITION_LACK:
            data.eval_fat_html = lack_html;
            data.eval_fat_color = lack_or_excess_color;
        break;
        case nutrition.NUTRITION_EXCESS:
            data.eval_fat_html = excess_html;
            data.eval_fat_color = lack_or_excess_color;
        break;
    }

    switch(data.eval_calcium) {
        case nutrition.NUTRITION_GOOD:
            data.eval_calcium_html = good_html;
            data.eval_calcium_color = good_color;
        break;
        case nutrition.NUTRITION_LACK:
            data.eval_calcium_html = lack_html;
            data.eval_calcium_color = lack_or_excess_color;
        break;
        case nutrition.NUTRITION_EXCESS:
            data.eval_calcium_html = excess_html;
            data.eval_calcium_color = lack_or_excess_color;
        break;
    }

    switch(data.eval_phosphorus) {
        case nutrition.NUTRITION_GOOD:
            data.eval_phosphorus_html = good_html;
            data.eval_phosphorus_color = good_color;
        break;
        case nutrition.NUTRITION_LACK:
            data.eval_phosphorus_html = lack_html;
            data.eval_phosphorus_color = lack_or_excess_color;
        break;
        case nutrition.NUTRITION_EXCESS:
            data.eval_phosphorus_html = excess_html;
            data.eval_phosphorus_color = lack_or_excess_color;
        break;
    }
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

module.exports.inject_protein_content = data => {
    data.protein_content = [];

    for(let i = 0 ; i < 4 ; i++){
        var item = {};
        item.current_protein_content = (data.protein_content_id == i);
        data.protein_content.push(item);
    }
}
