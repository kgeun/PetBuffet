const SELECT_PETFOOD_TITLE =
`SELECT
    petfood_photo_addr, petfood_id, petfood_name,
    nutrition_score, customer_score, main_ingredient, target_age
FROM
    petfood
NATURAL JOIN
    petfood_target_age
ORDER BY
    petfood_id DESC
LIMIT 5 OFFSET ?`;

const COUNT_PETFOOD =
`SELECT
    COUNT(*) as count
FROM
    petfood`;

const SELECT_PETFOOD_ALL_INFO =
`SELECT
    petfood_id, petfood_company_id, petfood_name,
    protein, fat, calcium, phosphorus, ingredients,
    target_age_id, nutrition_score, customer_score,
    petfood_photo_addr, main_ingredient, petfood_company_name, target_age
FROM
    petfood
NATURAL JOIN
    petfood_company
NATURAL JOIN
    petfood_target_age
WHERE
    petfood_id = ?`

const SELECT_PETFOOD_SOME_INFO =
`SELECT
    petfood_id, petfood_company_id, petfood_name,
    protein, fat, calcium, phosphorus, ingredients,
    target_age_id, petfood_photo_addr
FROM
    petfood
WHERE
    petfood_id = ?`

const SELECT_PETFOOD_COMPANY =
`SELECT
    petfood_company_id, petfood_company_name
FROM
    petfood_company`

const SELECT_TARGET_AGE =
`SELECT
    target_age_id, target_age
FROM
    petfood_target_age`

const INSERT_PETFOOD =
`INSERT INTO petfood
    ( petfood_company_id, petfood_name,
    protein, fat, calcium, phosphorus, ingredients,
    target_age_id, nutrition_score, customer_score,
    petfood_photo_addr, main_ingredient )
VALUES
    ( ? , ? , ? , ? , ? ,
    ? , ? , ? , ? , 0 ,
    ?, ? )`

const UPDATE_PETFOOD_WITH_PHOTO =
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
    customer_score = 0,
    main_ingredient = ?,
    petfood_photo_addr = ?
WHERE
    petfood_id = ?`

const UPDATE_PETFOOD_WITHOUT_PHOTO =
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
    customer_score = 0,
    main_ingredient = ?
WHERE
    petfood_id = ?`

const DELETE_PETFOOD =
`DELETE FROM
    petfood
WHERE
    petfood_id = ?`

const SELECT_REVIEW_RECENT_TWO =
`SELECT
    petfood_review_id, petfood_review_title, petfood_review_content
FROM
    petfood_review
WHERE
    petfood_id = ?
ORDER BY
    petfood_review_id DESC
LIMIT 2 OFFSET 0`

const SELECT_MAIN_INGREDIENT =
`SELECT
    main_ingredient_id, main_ingredient_name
FROM
    petfood_main_ingredient`


module.exports = {
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
    SELECT_MAIN_INGREDIENT
}
