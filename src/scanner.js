'use strict';

const TOKEN_WHITE_SPACE = 0;
const TOKEN_EOF = 1;
const TOKEN_IDENTIFIER = 2;

class LowLevelToken {
    constructor(type, val) {
        this.type = type;
        this.value = val;
        Object.freeze(this);
    }
}

/**
 *  @param {string} char
 *  @returns    {boolean}
 */
function isWhiteSpace(char) {
    return /\s/u.test(char);
}

function* lowLevelTokenizeString(input) {
    let candidate = '';
    let mode = 0; // normal=0, skip whitespace=1, scan identifier=2

    const resetCandidateWith = (ch) => {
        candidate = ch;
    };

    const pushToCandidate = (ch) => {
        candidate += ch;
    };

    for (const ch of input) {
        switch (mode) {
            case 0:
                if (isWhiteSpace(ch)) {
                    mode = 1;
                } else {
                    mode = 2;
                }
                resetCandidateWith(ch);
                continue;
            case 1:
                if (isWhiteSpace(ch)) {
                    pushToCandidate(ch);
                } else {
                    yield new LowLevelToken(TOKEN_WHITE_SPACE, candidate);
                    mode = 2;
                    resetCandidateWith(ch);
                }
                continue;
            case 2:
                if (isWhiteSpace(ch)) {
                    yield new LowLevelToken(TOKEN_IDENTIFIER, candidate);
                    mode = 1;
                    resetCandidateWith(ch);
                } else {
                    pushToCandidate(ch);
                }
                continue;
        }
    }

    switch (mode) {
        case 1:
            yield new LowLevelToken(TOKEN_WHITE_SPACE, candidate);
            break;
        case 2:
            yield new LowLevelToken(TOKEN_IDENTIFIER, candidate);
            break;
    }

    yield new LowLevelToken(TOKEN_EOF, '');
}

const TokenType = Object.freeze({
    Directive: 0,
    AcceptPullRequest: 1,
    RejectPullRequest: 2,
    AssignReviewer: 3,
    UserName: 4,
    Unknown: 5,
    Eof: 6
});

class HighLevelToken {
    constructor(type, value) {
        this.type = type;
        this.value = value;
    }
}

function* createHighLevelToken(token) {
    const { value } = token;
    switch (value) {
        case 'r?':
            yield new HighLevelToken(TokenType.Directive, null);
            yield new HighLevelToken(TokenType.AssignReviewer, null);
            break;
        case 'r-':
            yield new HighLevelToken(TokenType.Directive, null);
            yield new HighLevelToken(TokenType.RejectPullRequest, null);
            break;
        case 'r+':
            yield new HighLevelToken(TokenType.Directive, null);
            yield new HighLevelToken(TokenType.AcceptPullRequest, null);
            break;
        default:
            // TODO: support `r=username` syntax.
            if (value.startsWith('@')) {
                const v = value.replace(/^@/u, '');
                yield new HighLevelToken(TokenType.UserName, v);
            } else {
                yield new HighLevelToken(TokenType.Unknown, null);
            }
            break;
    }
}

function* tokenizeHighLevel(string) {
    const tokenStream = lowLevelTokenizeString(string);
    for (const token of tokenStream) {
        switch (token.type) {
            case TOKEN_WHITE_SPACE:
                continue;
            case TOKEN_EOF:
                return;
            case TOKEN_IDENTIFIER:
                yield* createHighLevelToken(token);
                continue;
        }
    }
}

module.exports = Object.freeze({
    TokenType,
    tokenizeString: tokenizeHighLevel
});
