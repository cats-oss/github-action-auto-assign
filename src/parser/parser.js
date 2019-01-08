'use strict';

const {
    TokenType,
    tokenizeString,
} = require('./scanner');

const CommandType = Object.freeze({
    AcceptPullRequest: 1,
    RejectPullRequest: 2,
    AssignReviewer: 3,
});

class Command {
    constructor(type, target) {
        this.type = type;
        this.target = target;
    }
}

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

        if (token.type === TokenType.Directive) {
            break;
        }
    }

    {
        const { done, value: token, } = tokenStream.next();
        if (done) {
            console.log('the token iterator only have single item');
            return null;
        }

        switch (token.type) {
            case TokenType.AcceptPullRequest:
                return parseAcceptPullRequest(tokenStream);
            case TokenType.RejectPullRequest:
                return parseRejectPullRequest(tokenStream);
            case TokenType.AssignReviewer:
                return parseAssignReviewer(tokenStream);
            default:
                console.log(`this token is not supported by here: ${token.type}`);
                return null;
        }
    }
}

function parseAcceptPullRequest(tokenStream) {
    const restTokenList = Array.from(tokenStream);
    if (restTokenList.length > 0) {
        return null;
    }

    const c = new Command(CommandType.AcceptPullRequest, null);
    return c;
}

function parseRejectPullRequest(tokenStream) {
    const restTokenList = Array.from(tokenStream);
    if (restTokenList.length > 0) {
        return null;
    }

    const c = new Command(CommandType.RejectPullRequest, null);
    return c;
}

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

module.exports = Object.freeze({
    parseString,
    CommandType,

    // export for testing
    Command,
});
