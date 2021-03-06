const SELECT_CURRENT_PETFOOD =
`SELECT
    petfood_id, petfood_company_id, petfood_company_name,
    petfood_name, target_age_id, target_age, nutrition_score,
    ROUND((SELECT AVG(petfood_rcmd_value) FROM petfood_rcmd WHERE petfood_id = petfood.petfood_id),1) AS customer_score,
    petfood_photo_addr, main_ingredient
FROM
    petfood
NATURAL JOIN
    petfood_company
NATURAL JOIN
    petfood_target_age
WHERE
    petfood_id = ?`;

const SELECT_REVIEW_TITLE_INFO =
`SELECT
    petfood_review_id, petfood_review_title, username, petfood_rcmd_value,
    DATE_FORMAT(creation_datetime, '%Y-%m-%d') as creation_datetime,
    (SELECT COUNT(*) AS number_of_comments FROM review_comment
    WHERE petfood_review.petfood_review_id = review_comment.petfood_review_id)
    AS number_of_comments,
    (SELECT COUNT(*) as number_of_rcmd FROM review_rcmd WHERE
    petfood_review.petfood_review_id = review_rcmd.petfood_review_id
    AND review_rcmd = 1 ) AS number_of_rcmd,
    (SELECT COUNT(*) as number_of_rcmd FROM review_rcmd WHERE
    petfood_review.petfood_review_id = review_rcmd.petfood_review_id
    AND review_rcmd = -1 ) AS number_of_non_rcmd
FROM
    petfood_review
NATURAL JOIN
    user_info
NATURAL JOIN
    petfood_rcmd
WHERE
    petfood_id = ?
AND
(
        petfood_review_title LIKE ?
    OR
        petfood_review_content LIKE ?
)
ORDER BY
    petfood_review_id DESC
LIMIT ? OFFSET ?`

const COUNT_REVIEW =
`SELECT
    COUNT(*) AS count
FROM
    petfood_review
WHERE
    petfood_id = ?
AND
(
        petfood_review_title LIKE ?
    OR
        petfood_review_content LIKE ?
)`

const SELECT_REVIEW_CONTENT =
`SELECT
    petfood_review_id, petfood_review_title, petfood_review_content,
    user_num, petfood_id, userid, username, petfood_rcmd_value,
    DATE_FORMAT(creation_datetime, '%Y-%m-%d %H:%i') as creation_datetime
FROM
    petfood_review
NATURAL JOIN
    user_info
NATURAL JOIN
    petfood_rcmd
WHERE
    petfood_review_id = ?
`

const INSERT_RCMD =
`INSERT INTO
    petfood_rcmd ( user_num , petfood_id, petfood_rcmd_value )
VALUES
    ( ?, ?, ? )`

const INSERT_REVIEW =
`INSERT INTO petfood_review
    ( petfood_review_title, petfood_review_content, user_num,
        petfood_id, petfood_rcmd_id, creation_datetime )
VALUES
    ( ?, ?, ?, ?, ?, now() )`

const COUNT_AND_SELECT_RCMD =
`SELECT
    petfood_rcmd_id, petfood_rcmd_value, COUNT(*) as count
FROM
    petfood_rcmd
WHERE
    petfood_id = ?
AND
    user_num = ?`

const UPDATE_REVIEW =
`UPDATE
    petfood_review
SET
    petfood_review_title = ?,
    petfood_review_content = ?
WHERE
    petfood_review_id = ?`

const DELETE_REVIEW =
`DELETE FROM
    petfood_review
WHERE
    petfood_review_id = ?`

const SELECT_ALL_REVIEW =
`SELECT
    petfood_review_id, petfood_review_title, petfood_review_content,
    user_num, username, petfood_id, petfood_name, petfood_photo_addr,
    DATE_FORMAT(creation_datetime, '%Y-%m-%d') as creation_datetime
FROM
    petfood_review
NATURAL JOIN
    user_info
NATURAL JOIN
    petfood
WHERE
    petfood_review_title LIKE ?
OR
    petfood_review_content LIKE ?
ORDER BY
    petfood_review_id DESC
LIMIT ? OFFSET ?`;

const COUNT_SELECT_ALL_REVIEW =
`SELECT
    COUNT(*) as count
FROM
    petfood_review
WHERE
    petfood_review_title LIKE ?
OR
    petfood_review_content LIKE ?`;

const SELECT_REVIEW_RCMD =
`SELECT
    COUNT(*) as count
FROM
    review_rcmd
WHERE
    petfood_review_id = ?
AND
    review_rcmd = 1`;

const SELECT_REVIEW_NON_RCMD =
`SELECT
    COUNT(*) as count
FROM
    review_rcmd
WHERE
    petfood_review_id = ?
AND
    review_rcmd = -1`;

const COUNT_SELECT_REVIEW_RCMD =
`SELECT
    COUNT(*) as count
FROM
    review_rcmd
WHERE
    petfood_review_id = ?
AND
    user_num = ?`;

const INSERT_REVIEW_RCMD =
`INSERT INTO
    review_rcmd (review_rcmd, petfood_review_id, user_num)
VALUES
    ( ?, ?, ? )`;

module.exports = {
    SELECT_CURRENT_PETFOOD,
    SELECT_REVIEW_TITLE_INFO,
    SELECT_REVIEW_CONTENT,
    INSERT_RCMD,
    INSERT_REVIEW,
    COUNT_AND_SELECT_RCMD,
    COUNT_REVIEW,
    UPDATE_REVIEW,
    DELETE_REVIEW,
    SELECT_ALL_REVIEW,
    COUNT_SELECT_ALL_REVIEW,
    SELECT_REVIEW_RCMD,
    SELECT_REVIEW_NON_RCMD,
    COUNT_SELECT_REVIEW_RCMD,
    INSERT_REVIEW_RCMD
}
