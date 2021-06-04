import * as assert from 'assert/strict';

import { TokenType } from './token.js';
import {
    tokenizeString,
} from './tokenizer.js';

/**
 *  @readonly
 *  @enum   {number}
 */
const CommandType = Object.freeze({
    AcceptPullRequest: 1,
    RejectPullRequest: 2,
    AssignReviewer: 3,
});

class Command {
    /**
     * @param {CommandType} type
     * @param {*} target
     */
    constructor(type, target) {
        this.type = type;
        this.target = target;
    }
}

/**
 * @param {string} input
 * @returns {Command|null}
 */
function parseString(input) {
    const lines = input.split('\n');
    if (lines.length === 0) {
        console.log('There is no first line');
        return null;
    }

    // Treat the first line as the command line for us.
    const firstLine = lines[0];

    const tokenStream = tokenizeString(firstLine);

    for (;;) {
        const { done, value: token, } = tokenStream.next();
        if (done) {
            return null;
        }
        assert.ok(!!token, 'token should not null');

        if (token.type === TokenType.Separator || token.type === TokenType.ListSeparator) {
            return null;
        }

        if (token.type === TokenType.ReviewDirective) {
            break;
        }
    }

    {
        const { done, value: token, } = tokenStream.next();
        if (done) {
            console.log('the token iterator only have single item');
            return null;
        }
        assert.ok(!!token, 'token should not null');

        switch (token.type) {
            case TokenType.AcceptPullRequestDirective:
                return parseAcceptPullRequest(tokenStream);
            case TokenType.AcceptPullRequestWithReviewerNameDirective:
                return parseAcceptPullRequestWithReviewers(tokenStream);
            case TokenType.RejectPullRequestDirective:
                return parseRejectPullRequest(tokenStream);
            case TokenType.AssignReviewerDirective:
                return parseAssignReviewer(tokenStream);
            default:
                console.log(`this token is not supported by here: ${token.type}`);
                return null;
        }
    }
}

/**
 *  @typedef {import('./token.js').Token} Token
 */

/**
 * @param {Token} token
 * @returns {boolean}
 */
function isNotWhiteSpaceToken(token) {
    const type = token.type;
    return (type !== TokenType.WhiteSpace) && (type !== TokenType.Eof);
}

/**
 * @param {IterableIterator<Token>} tokenStream
 * @returns {Command|null}
 */
function parseAcceptPullRequest(tokenStream) {
    const restTokenList = Array.from(tokenStream).filter(isNotWhiteSpaceToken);
    if (restTokenList.length > 0) {
        console.log(`restTokenList.length is zero`);
        return null;
    }

    const c = new Command(CommandType.AcceptPullRequest, null);
    return c;
}

/**
 * @param {IterableIterator<Token>} tokenStream
 * @returns {Command|null}
 */
function parseAcceptPullRequestWithReviewers(tokenStream) {
    const user = [];
    for (const token of tokenStream) {
        switch (token.type) {
            case TokenType.UserName:
                user.push(token.value);
                break;
            case TokenType.Separator:
                return null;
            case TokenType.Identifier:
                user.push(token.value);
                break;
        }
    }

    if (user.length === 0) {
        console.log(`user.length is zero`);
        return null;
    }

    const c = new Command(CommandType.AcceptPullRequest, user);
    return c;
}

/**
 * @param {IterableIterator<Token>} tokenStream
 * @returns {Command|null}
 */
function parseRejectPullRequest(tokenStream) {
    const restTokenList = Array.from(tokenStream).filter(isNotWhiteSpaceToken);
    if (restTokenList.length > 0) {
        console.log(`restTokenList.length is zero`);
        return null;
    }

    const c = new Command(CommandType.RejectPullRequest, null);
    return c;
}

/**
 * @param {IterableIterator<Token>} tokenStream
 * @returns {Command|null}
 */
function parseAssignReviewer(tokenStream) {
    const user = [];
    for (const token of tokenStream) {
        if (token.type === TokenType.UserName) {
            user.push(token.value);
        }
    }

    if (user.length === 0) {
        console.log(`user.length is zero`);
        return null;
    }

    const c = new Command(CommandType.AssignReviewer, user);
    return c;
}

export {
    parseString,
    CommandType,

    // export for testing
    Command,
};