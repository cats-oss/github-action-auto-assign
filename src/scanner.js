'use strict';

const assert = require('assert');

const TOKEN_WHITE_SPACE = 0;
const TOKEN_EOF = 1;
const TOKEN_IDENTIFIER = 2;
const TOKEN_OPERATOR = 3;
const TOKEN_INVALIDATE = 4;

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

/**
 *  @param {string} char
 *  @returns    {boolean}
 */
function isOperatorFragment(char) {
    return (char === '|') || (char === '&');
}

class LowLevelScanner {
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
        if (value.type === TOKEN_EOF) {
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
            const t = new LowLevelToken(TOKEN_EOF, null);
            return t;
        }

        if (isWhiteSpace(char)) {
            return this._scanWhiteSpace(char);
        }

        if (isOperatorFragment(char)) {
            return this._scanOperator(char);
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

        const t = new LowLevelToken(TOKEN_WHITE_SPACE, buffer);
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

            if (isWhiteSpace(value)) {
                this._sourceIter.back();
                break;
            }

            buffer += value;
        }

        const t = new LowLevelToken(TOKEN_IDENTIFIER, buffer);
        return t;
    }

    _scanOperator(char) {
        const sourceIter = this._sourceIter;
        let buffer = char;

        const { done, value } = sourceIter.next();
        if (done) {
            const t = new LowLevelToken(TOKEN_INVALIDATE, buffer);
            return t;
        }

        if (!isOperatorFragment(value)) {
            const t = new LowLevelToken(TOKEN_INVALIDATE, buffer);
            return t;
        }

        if (char !== value) {
            sourceIter.back();
            const t = new LowLevelToken(TOKEN_INVALIDATE, buffer);
            return t;
        }

        buffer += value;
        const t = new LowLevelToken(TOKEN_OPERATOR, buffer);
        return t;
    }

    [Symbol.iterator]() {
        return this;
    }
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
    const tokenStream = new LowLevelScanner(string);
    for (const token of tokenStream) {
        switch (token.type) {
            case TOKEN_WHITE_SPACE:
                continue;
            case TOKEN_EOF:
                return;
            case TOKEN_IDENTIFIER:
                yield* createHighLevelToken(token);
                continue;
            case TOKEN_OPERATOR:
                continue;
            case TOKEN_INVALIDATE:
                continue;
        }
    }
}

module.exports = Object.freeze({
    TokenType,
    tokenizeString: tokenizeHighLevel
});
