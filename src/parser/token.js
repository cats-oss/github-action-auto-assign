'use strict';

const TokenType = Object.freeze({
    WhiteSpace: 0,
    Eof: 1,
    Unknown: 2,
    Invalid: 3,

    Identifier: 10,
    UserName: 11,

    Separator: 20,
    ListSeparator: 21,

    ReviewDirective: 30,
    AssignReviewerDirective: 31,
    AcceptPullRequestDirective: 32,
    AcceptPullRequestWithReviewerNameDirective: 33,
    RejectPullRequestDirective: 34,

    Operator: 40,
});

class Token {
    constructor(type, val) {
        this.type = type;
        this.value = val;
        Object.freeze(this);
    }
}

module.exports = Object.freeze({
    TokenType,
    Token,
});