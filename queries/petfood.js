const SELECT_PETFOOD_TITLE =
`SELECT
    petfood_photo_addr, petfood_id, petfood_name, nutrition_score,
    ROUND((SELECT AVG(petfood_rcmd_value) FROM petfood_rcmd WHERE petfood_id = petfood.petfood_id),1) AS customer_score,
    main_ingredient, target_age
FROM
    petfood
NATURAL JOIN
    petfood_target_age
ORDER BY
    petfood_id DESC
LIMIT 5 OFFSET ?`;
/////사용되지 않음

const COUNT_PETFOOD =
`SELECT
    COUNT(*) as count
FROM
    petfood`;

const SELECT_PETFOOD_ALL_INFO =
`SELECT
    petfood_id, petfood_company_id, petfood_name,
    protein, fat, calcium, phosphorus, ingredients,
    target_age_id, nutrition_score,
    ROUND((SELECT AVG(petfood_rcmd_value) FROM petfood_rcmd WHERE petfood_id = petfood.petfood_id),1) AS customer_score,
    petfood_photo_addr, main_ingredient, petfood_company_name, target_age
FROM
    petfood
NATURAL JOIN
    petfood_company
NATURAL JOIN
    petfood_target_age
WHERE
    petfood_id = ?`;

const SELECT_PETFOOD_MODIFY_INFO =
`SELECT
    petfood_id, petfood_company_id, petfood_name,
    protein, fat, calcium, phosphorus, ingredients,
    target_age_id, petfood_photo_addr
FROM
    petfood
WHERE
    petfood_id = ?`;

const SELECT_PETFOOD_COMPANY =
`SELECT
    petfood_company_id, petfood_company_name
FROM
    petfood_company`;

const SELECT_TARGET_AGE =
`SELECT
    target_age_id, target_age
FROM
    petfood_target_age`;

const INSERT_PETFOOD =
`INSERT INTO petfood
    ( petfood_company_id, petfood_name,
    protein, fat, calcium, phosphorus, ingredients,
    target_age_id, nutrition_score,
    petfood_photo_addr, main_ingredient )
VALUES
    ( ? , ? , ? , ? , ? ,
    ? , ? , ? , ? , ?, ? )`;

const UPDATE_PETFOOD =
`UPDATE
    petfood
SET
    petfood_company_id = ?,
    petfood_name = ?,
    protein = ?,
    fat = ?,
    calcium = ?,
    phosphorus = ?,
    ingredients = ?,
    target_age_id = ?,
    nutrition_score = ?,
    main_ingredient = ?,
    petfood_photo_addr = ?
WHERE
    petfood_id = ?`;

const DELETE_PETFOOD =
`DELETE FROM
    petfood
WHERE
    petfood_id = ?`;

const SELECT_REVIEW_RECENT_TWO =
`SELECT
    petfood_review_id, petfood_review_title, petfood_review_content
FROM
    petfood_review
WHERE
    petfood_id = ?
ORDER BY
    petfood_review_id DESC
LIMIT 2 OFFSET 0`;

const SELECT_MAIN_INGREDIENT =
`SELECT
    main_ingredient_id, main_ingredient_name
FROM
    petfood_main_ingredient`;

const SELECT_PROTEIN_CONTENT =
`SELECT
    protein_content_id, protein_content_name
FROM
    petfood_protein_content`;

let search_petfood_query = (data,petfood_items_per_page) => {
    let query =
    `SELECT
        petfood_photo_addr, petfood_id, petfood_name, nutrition_score,
        ROUND((SELECT AVG(petfood_rcmd_value) FROM petfood_rcmd WHERE petfood_id = petfood.petfood_id),1) AS customer_score,
        main_ingredient, target_age
    FROM
        petfood
    NATURAL JOIN
        petfood_target_age `;

    query += get_where_query_in_search(data);

    query += `ORDER BY
        petfood_id DESC
    LIMIT 5 OFFSET ${(data.current_page - 1) * petfood_items_per_page}`;

    return query;
}

let count_search_petfood_query = (data) => {
    let query =
    `SELECT
        COUNT(*) as count
    FROM
        petfood `;

    query += get_where_query_in_search(data);

    return query;
}

let get_where_query_in_search = data => {

    let query_where =
    `WHERE
        petfood_name LIKE '%${data.query}%' `;

    if(Number(data.petfood_company_id)) {
        query_where += `AND petfood_company_id = ${data.petfood_company_id} `;
    }
    if(Number(data.target_age_id)) {
        query_where += `AND target_age_id = ${data.target_age_id} `;
    }
    if(Number(data.main_ingredient_id)) {
        query_where += `AND main_ingredient LIKE '%${data.main_ingredient[data.main_ingredient_id-1].main_ingredient}%' `;
    }
    if(Number(data.protein_content_id)) {
        if(data.protein_content_id == 1) {
            query_where += `AND protein BETWEEN 0 AND 9.9 `;
        } else if(data.protein_content_id == 2) {
            query_where += `AND protein BETWEEN 10 AND 19.9 `;
        } else if(data.protein_content_id == 3) {
            query_where += `AND protein BETWEEN 20 AND 30 `;
        } else if(data.protein_content_id == 4) {
            query_where += `AND protein > 30 `;
        }
    }

    return query_where;
}

module.exports = {
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
    search_petfood_query,
    count_search_petfood_query
}
