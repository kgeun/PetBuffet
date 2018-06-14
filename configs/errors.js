class NoIdOrPasswordError extends Error {
    constructor() {
        super();
        this.error_object = {
            status: "ERROR",
            message: "아이디나 패스워드를 입력하지 않았습니다."
        };
    }
}

class UserNotFoundError extends Error {
    constructor() {
        super();
        this.error_object = {
            status: "ERROR",
            message: "존재하지 않는 아이디 입니다."
        };
    }
}

class WrongPasswordError extends Error {
    constructor() {
        super();
        this.error_object = {
            status : "ERROR",
            message : "비밀번호가 틀렸습니다."
        };
    }
}

class FormNotFilledError extends Error {
    constructor() {
        super();
        this.error_object = {
            status : "ERROR",
            message : "모든 항목이 입력되지 않았습니다."
        };
    }
}

class IdDuplicateError extends Error {
    constructor() {
        super();
        this.error_object = {
            status : "ERROR",
            message : "아이디가 중복되었습니다."
        };
    }
}

class NoPermissionError extends Error {
    constructor() {
        super();
        this.error_object = {
            status : "ERROR",
            message : "권한이 없습니다."
        };
    }
}

class RcmdAlreadyExistError extends Error {
    constructor() {
        super();
        this.error_object = {
            status : "ERROR",
            message : "이미 이 사료에 대해서 추천을 했습니다."
        };
    }
}

module.exports = {
    NoIdOrPasswordError,
    UserNotFoundError,
    WrongPasswordError,
    FormNotFilledError,
    IdDuplicateError,
    NoPermissionError,
    RcmdAlreadyExistError
}
