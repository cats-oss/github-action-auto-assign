'use strict';

const assert = require('assert');

class BackableStringIterator {
    /**
     * @param {string} str
     */
    constructor(str) {
        this._iter = str[Symbol.iterator]();
        this._prevCache = null;
        this._prev = null;
    }

    next() {
        const prev = this._prev;
        if (prev !== null) {
            this._prev = null;
            this._prevCache = prev;
            return {
                done: false,
                value: prev,
            };
        }
        assert.strictEqual(prev, null, 'this._prev must be null');

        const { done, value, } = this._iter.next();
        if (done) {
            this._prevCache = null;
        } else {
            this._prevCache = value;
        }

        return {
            done,
            value,
        };
    }

    back() {
        assert.notStrictEqual(this._prevCache, null, 'this._prev must not be null');
        this._prev = this._prevCache;
        this._prevCache = null;
    }

    [Symbol.iterator]() {
        return this;
    }
}

const TokenType = Object.freeze({
    WhiteSpace: 0,
    Eof: 1,
    Unknown: 2,
    Invalid: 3,

    Identifier: 10,
    UserName: 11,

    Separator: 20,
    ListSeparator: 21,

    Directive: 30,
    ReviewDirective: 31,
    AssignReviewerDirective: 32,
    AcceptPullRequestDirective: 33,
    AcceptPullRequestWithReviewerNameDirective: 34,
    RejectPullRequestDirective: 35,

    Operator: 40,
});

class Token {
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

/**
 *  @param {string} char
 *  @returns    {boolean}
 */
function isOperatorFragment(char) {
    return (char === '|') || (char === '&');
}

const CHAR_LIST_SEPATOR = ',';

/**
 *  @param {string} char
 *  @returns    {boolean}
 */
function isSeparator(char) {
    return (char === CHAR_LIST_SEPATOR) || (char === ';') || (char === '.');
}

/**
 *  @param {string} char
 *  @returns    {boolean}
 */
function isIdCall(char) {
    return char === '@';
}

/**
 *  @param {string} char
 *  @returns    {boolean}
 */
function isReviewDirective(char) {
    return char === 'r';
}

const CHAR_REVIEW_OPERATOR_QUESTION = '?';
const CHAR_REVIEW_OPERATOR_PLUS = '+';
const CHAR_REVIEW_OPERATOR_EQUAL = '=';
const CHAR_REVIEW_OPERATOR_MINUS = '-';

/**
 *  @param {string} char
 *  @returns    {boolean}
 */
function isReviewOperatorAndIsNotPartOfUserId(char) {
    return (char === CHAR_REVIEW_OPERATOR_QUESTION) || (char === CHAR_REVIEW_OPERATOR_PLUS) || (char === CHAR_REVIEW_OPERATOR_EQUAL);
}

/**
 *  @param {string} char
 *  @returns    {boolean}
 */
function isReviewOperator(char) {
    return isReviewOperatorAndIsNotPartOfUserId(char) || (char === CHAR_REVIEW_OPERATOR_MINUS);
}

/**
 *  @param {string} char
 *  @returns    {boolean}
 */
function isPartOfIdentifier(char) {
    return !isWhiteSpace(char) && !isOperatorFragment(char) && !isSeparator(char) && !isIdCall(char) && !isReviewOperatorAndIsNotPartOfUserId(char);
}

class Scanner {
    constructor(source) {
        this._sourceIter = new BackableStringIterator(source);
        this._hasReachedEof = false;
    }

    _destroy() {
        this._sourceIter = null;
        this._hasReachedEof = true;
    }

    next() {
        if (this._hasReachedEof) {
            return {
                done: true,
            };
        }

        const value = this._scan();
        if (value.type === TokenType.Eof) {
            this._destroy();
        }

        return {
            done: false,
            value,
        };
    }

    _scan() {
        const sourceIter = this._sourceIter;

        const { done, value: char, } = sourceIter.next();
        if (done) {
            const t = new Token(TokenType.Eof, null);
            return t;
        }

        if (isWhiteSpace(char)) {
            return this._scanWhiteSpace(char);
        }

        if (isOperatorFragment(char)) {
            return this._scanOperator(char);
        }

        if (isSeparator(char)) {
            return this._scanSeparator(char);
        }

        if (isReviewDirective(char)) {
            return this._scanReviewDirective(char);
        }

        if (isIdCall(char)) {
            return this._scanUsername();
        }

        return this._scanIdentifier(char);
    }

    _scanWhiteSpace(char) {
        const sourceIter = this._sourceIter;
        let buffer = char;
        for (;;) {
            const { done, value } = sourceIter.next();
            if (done) {
                break;
            }

            if (!isWhiteSpace(value)) {
                sourceIter.back();
                break;
            }

            buffer += value;
        }

        const t = new Token(TokenType.WhiteSpace, buffer);
        return t;
    }

    _scanIdentifier(char) {
        const sourceIter = this._sourceIter;
        let buffer = char;
        for (;;) {
            const { done, value } = sourceIter.next();
            if (done) {
                break;
            }

            if (!isPartOfIdentifier(value)) {
                this._sourceIter.back();
                break;
            }

            buffer += value;
        }

        const t = new Token(TokenType.Identifier, buffer);
        return t;
    }

    _scanOperator(char) {
        const sourceIter = this._sourceIter;
        let buffer = char;

        const { done, value } = sourceIter.next();
        if (done) {
            const t = new Token(TokenType.Invalid, buffer);
            return t;
        }

        if (!isOperatorFragment(value)) {
            const t = new Token(TokenType.Invalid, buffer);
            return t;
        }

        if (char !== value) {
            sourceIter.back();
            const t = new Token(TokenType.Invalid, buffer);
            return t;
        }

        buffer += value;
        const t = new Token(TokenType.Operator, buffer);
        return t;
    }

    _scanSeparator(char) {
        switch (char) {
            case CHAR_LIST_SEPATOR:
                return new Token(TokenType.ListSeparator, char);
            default:
                return new Token(TokenType.Separator, char);
        }
    }

    _scanReviewDirective(char) {
        const sourceIter = this._sourceIter;
        let buffer = char;

        const { done, value } = sourceIter.next();
        if (done) {
            const t = new Token(TokenType.Directive, char);
            return t;
        }

        if (isReviewOperator(value)) {
            buffer += value;
            switch (value) {
                case CHAR_REVIEW_OPERATOR_QUESTION:
                    return new Token(TokenType.AssignReviewerDirective, buffer);
                case CHAR_REVIEW_OPERATOR_PLUS:
                    return new Token(TokenType.AcceptPullRequestDirective, buffer);
                case CHAR_REVIEW_OPERATOR_EQUAL:
                    return new Token(TokenType.AcceptPullRequestWithReviewerNameDirective, buffer);
                case CHAR_REVIEW_OPERATOR_MINUS:
                    return new Token(TokenType.RejectPullRequestDirective, buffer);
                default:
                    throw new RangeError(`unrachable with isReviewOperator: ${value}`);
            }
        }

        sourceIter.back();
        return this._scanIdentifier(char);
    }

    _scanUsername() {
        const sourceIter = this._sourceIter;
        let buffer = '';
        for (;;) {
            const { done, value } = sourceIter.next();
            if (done) {
                break;
            }

            if (!isPartOfIdentifier(value)) {
                this._sourceIter.back();
                break;
            }

            buffer += value;
        }

        const t = new Token(TokenType.UserName, buffer);
        return t;
    }

    [Symbol.iterator]() {
        return this;
    }
}

function* tokenizeHighLevel(string) {
    const tokenStream = new Scanner(string);
    for (const token of tokenStream) {
        switch (token.type) {
            case TokenType.AssignReviewerDirective:
            case TokenType.RejectPullRequestDirective:
            case TokenType.AcceptPullRequestDirective:
            case TokenType.AcceptPullRequestWithReviewerNameDirective:
                yield new Token(TokenType.Directive, null);
                yield token;
                continue;
            default:
                yield token;
                continue;
        }
    }
}

function* tokenizeString(string) {
    yield* tokenizeHighLevel(string);
}

module.exports = Object.freeze({
    TokenType,
    tokenizeString,
});
