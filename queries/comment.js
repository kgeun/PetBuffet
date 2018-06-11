const SELECT_COMMENTS_BY_REVIEW_ID =
`SELECT
    review_comment_id, user_num, username,
    DATE_FORMAT(creation_datetime, '%y-%m-%d %H:%i') as creation_datetime,
    review_comment_content, petfood_review_id
FROM
    review_comment
NATURAL JOIN
    user_info
WHERE
    petfood_review_id = ?`;

const INSERT_COMMENT =
`INSERT INTO review_comment
    (user_num, creation_datetime, review_comment_content, petfood_review_id)
VALUES
    (?, now(), ?, ?)`

const DELETE_COMMENT =
`DELETE FROM
    review_comment
WHERE
    review_comment_id = ?`

const UPDATE_COMMENT =
`UPDATE
    review_comment
SET
    review_comment_content = ?
WHERE
    review_comment_id = ?`

module.exports = {
    SELECT_COMMENTS_BY_REVIEW_ID,
    INSERT_COMMENT,
    DELETE_COMMENT,
    UPDATE_COMMENT
};
