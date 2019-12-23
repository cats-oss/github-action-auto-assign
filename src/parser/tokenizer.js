'use strict';

const assert = require('assert');

const { Token, TokenType } = require('./token');

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
    return (char === CHAR_LIST_SEPATOR) || (char === ':') || (char === ';') || (char === '.');
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

class Tokenizer {
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

        const value = scanString(this._sourceIter);
        if (value.type === TokenType.Eof) {
            this._destroy();
        }

        return {
            done: false,
            value,
        };
    }

    [Symbol.iterator]() {
        return this;
    }
}

/**
 *  @param {!BackableStringIterator} charIter
 *  @returns    {!Token}
 */
function scanString(charIter) {
    const { done, value: char, } = charIter.next();
    if (done) {
        const t = new Token(TokenType.Eof, null);
        return t;
    }

    if (isWhiteSpace(char)) {
        return scanWhiteSpace(charIter, char);
    }

    if (isOperatorFragment(char)) {
        return scanOperator(charIter, char);
    }

    if (isSeparator(char)) {
        return scanSeparator(char);
    }

    if (isReviewDirective(char)) {
        return scanReviewDirective(charIter, char);
    }

    if (isIdCall(char)) {
        return scanUsername(charIter);
    }

    return scanIdentifier(charIter, char);
}

/**
 *  @param {!BackableStringIterator} charIter
 *  @param  {string}  char
 *  @returns    {!Token}
 */
function scanWhiteSpace(charIter, char) {
    let buffer = char;
    for (; ;) {
        const { done, value } = charIter.next();
        if (done) {
            break;
        }

        if (!isWhiteSpace(value)) {
            charIter.back();
            break;
        }

        buffer += value;
    }

    const t = new Token(TokenType.WhiteSpace, buffer);
    return t;
}

/**
 *  @param {!BackableStringIterator} charIter
 *  @param  {string}  char
 *  @returns    {!Token}
 */
function scanIdentifier(charIter, char) {
    let buffer = char;
    for (; ;) {
        const { done, value } = charIter.next();
        if (done) {
            break;
        }

        if (!isPartOfIdentifier(value)) {
            charIter.back();
            break;
        }

        buffer += value;
    }

    const t = new Token(TokenType.Identifier, buffer);
    return t;
}

/**
 *  @param {!BackableStringIterator} charIter
 *  @param  {string}  char
 *  @returns    {!Token}
 */
function scanOperator(charIter, char) {
    let buffer = char;

    const { done, value } = charIter.next();
    if (done) {
        const t = new Token(TokenType.Invalid, buffer);
        return t;
    }

    if (!isOperatorFragment(value)) {
        const t = new Token(TokenType.Invalid, buffer);
        return t;
    }

    if (char !== value) {
        charIter.back();
        const t = new Token(TokenType.Invalid, buffer);
        return t;
    }

    buffer += value;
    const t = new Token(TokenType.Operator, buffer);
    return t;
}

/**
 *  @param {string} char
 *  @returns    {!Token}
 */
function scanSeparator(char) {
    switch (char) {
        case CHAR_LIST_SEPATOR:
            return new Token(TokenType.ListSeparator, char);
        default:
            return new Token(TokenType.Separator, char);
    }
}

/**
 *  @param {!BackableStringIterator} charIter
 *  @param  {string}  char
 *  @returns    {!Token}
 */
function scanReviewDirective(charIter, char) {
    let buffer = char;

    const { done, value } = charIter.next();
    if (done) {
        const t = new Token(TokenType.ReviewDirective, char);
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

    charIter.back();
    return scanIdentifier(charIter, char);
}

/**
 *  @param {!BackableStringIterator} charIter
 *  @returns    {!Token}
 */
function scanUsername(charIter) {
    let buffer = '';
    for (; ;) {
        const { done, value } = charIter.next();
        if (done) {
            break;
        }

        if (!isPartOfIdentifier(value)) {
            charIter.back();
            break;
        }

        buffer += value;
    }

    const t = new Token(TokenType.UserName, buffer);
    return t;
}

function* tokenizeHighLevel(string) {
    const tokenStream = new Tokenizer(string);
    for (const token of tokenStream) {
        switch (token.type) {
            case TokenType.AssignReviewerDirective:
            case TokenType.RejectPullRequestDirective:
            case TokenType.AcceptPullRequestDirective:
            case TokenType.AcceptPullRequestWithReviewerNameDirective:
                yield new Token(TokenType.ReviewDirective, null);
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
