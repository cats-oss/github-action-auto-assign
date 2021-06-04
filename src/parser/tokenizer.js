import { StringScanner } from './string_scanner.js';
import { Token, TokenType } from './token.js';

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
    /**
     * @param {string} source
     */
    constructor(source) {
        /**
         * @type {StringScanner|null}
         */
        this._sourceIter = new StringScanner(source);
        /**
         *  @type {boolean}
         */
        this._hasReachedEof = false;
    }

    /**
     *  @returns    {void}
     */
    _destroy() {
        this._sourceIter = null;
        this._hasReachedEof = true;
    }

    /**
     * @returns {IteratorResult<Token, undefined>}
     */
    next() {
        if (this._hasReachedEof) {
            return {
                done: true,
                value: undefined,
            };
        }

        const source = this._sourceIter;
        if (!source) {
            throw new TypeError('this has been destroyed');
        }

        const value = scanString(source);
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
 *  @param {StringScanner} charIter
 *  @returns    {!Token}
 */
function scanString(charIter) {
    const char = charIter.scan();
    if (char === null) {
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
 *  @param {StringScanner} charIter
 *  @param  {string}  char
 *  @returns    {!Token}
 */
function scanWhiteSpace(charIter, char) {
    let buffer = char;
    for (; ;) {
        const nextChar = charIter.lookahead();
        if (nextChar === null) {
            break;
        }

        if (!isWhiteSpace(nextChar)) {
            break;
        }

        buffer += nextChar;
        charIter.scan();
    }

    const t = new Token(TokenType.WhiteSpace, buffer);
    return t;
}

/**
 *  @param {StringScanner} charIter
 *  @param  {string}  char
 *  @returns    {!Token}
 */
function scanIdentifier(charIter, char) {
    let buffer = char;
    for (; ;) {
        const nextChar = charIter.lookahead();
        if (nextChar === null) {
            break;
        }

        if (!isPartOfIdentifier(nextChar)) {
            break;
        }

        buffer += nextChar;
        charIter.scan();
    }

    const t = new Token(TokenType.Identifier, buffer);
    return t;
}

/**
 *  @param {StringScanner} charIter
 *  @param  {string}  char
 *  @returns    {!Token}
 */
function scanOperator(charIter, char) {
    let buffer = char;

    const nextChar = charIter.lookahead();
    if (nextChar === null) {
        const t = new Token(TokenType.Invalid, buffer);
        return t;
    }

    if (!isOperatorFragment(nextChar)) {
        const t = new Token(TokenType.Invalid, buffer);
        return t;
    }

    if (char !== nextChar) {
        const t = new Token(TokenType.Invalid, buffer);
        return t;
    }

    buffer += nextChar;
    charIter.scan();
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
 *  @param {StringScanner} charIter
 *  @param  {string}  char
 *  @returns    {!Token}
 */
function scanReviewDirective(charIter, char) {
    let buffer = char;

    const charNext = charIter.lookahead();
    if (charNext === null) {
        return scanIdentifier(charIter, char);
    }

    if (isReviewOperator(charNext)) {
        buffer += charNext;
        switch (charNext) {
            case CHAR_REVIEW_OPERATOR_QUESTION:
                charIter.scan();
                return new Token(TokenType.AssignReviewerDirective, buffer);
            case CHAR_REVIEW_OPERATOR_PLUS:
                charIter.scan();
                return new Token(TokenType.AcceptPullRequestDirective, buffer);
            case CHAR_REVIEW_OPERATOR_EQUAL:
                charIter.scan();
                return new Token(TokenType.AcceptPullRequestWithReviewerNameDirective, buffer);
            case CHAR_REVIEW_OPERATOR_MINUS:
                charIter.scan();
                return new Token(TokenType.RejectPullRequestDirective, buffer);
            default:
                throw new RangeError(`unrachable with isReviewOperator: ${charNext}`);
        }
    }

    return scanIdentifier(charIter, char);
}

/**
 *  @param {StringScanner} charIter
 *  @returns    {!Token}
 */
function scanUsername(charIter) {
    let buffer = '';
    for (; ;) {
        const charNext = charIter.lookahead();
        if (charNext === null) {
            break;
        }

        if (!isPartOfIdentifier(charNext)) {
            break;
        }

        buffer += charNext;
        charIter.scan();
    }

    const t = new Token(TokenType.UserName, buffer);
    return t;
}

/**
 * @param {string} string
 */
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

/**
 * @param {string} string
 */
function* tokenizeString(string) {
    yield* tokenizeHighLevel(string);
}

export {
    TokenType,
    tokenizeString,
};
