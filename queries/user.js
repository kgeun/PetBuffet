const FIND_USER_BY_ID =
`SELECT
    username, userid, password, user_level, user_num
FROM
    user_info
WHERE
    userid = ?`

const COUNT_USER =
`SELECT
    count(*) as count
FROM
    user_info
WHERE
    userid = ?`

const INSERT_USER =
`INSERT INTO user_info
    ( userid, password, username, user_level )
VALUES
    ( ?, ?, ?, 1)`



module.exports = {
    FIND_USER_BY_ID,
    COUNT_USER,
    INSERT_USER
}
