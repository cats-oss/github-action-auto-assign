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

    {
        const { done, value: token, } = tokenStream.next();
        if (done) {
            console.log('the token iterator is empty');
            return null;
        }

        if (token.type !== TokenType.Directive) {
            console.log(`the first token is not .Directive, actually ${token.type}`);
            return null;
        }
    }

    let commandType = null;
    {
        const { done, value: token, } = tokenStream.next();
        if (done) {
            console.log('the token iterator only have single item');
            return null;
        }

        switch (token.type) {
            case TokenType.AcceptPullRequest:
                commandType = CommandType.AcceptPullRequest;
                break;
            case TokenType.RejectPullRequest:
                commandType = CommandType.RejectPullRequest;
                break;
            case TokenType.AssignReviewer:
                commandType = CommandType.AssignReviewer;
                break;
            default:
                console.log(`this token is not supported by here: ${token.type}`);
                return null;
        }
    }

    const user = [];
    for (const token of tokenStream) {
        if (token.type === TokenType.UserName) {
            user.push(token.value);
        }
    }

    if (commandType === CommandType.AssignReviewer) {
        if (user.length === 0) {
            console.log(`user.length is zero`);
            return null;
        }
    }

    const c = new Command(commandType, user);
    return c;
}

module.exports = Object.freeze({
    parseString,
    CommandType,

    // export for testing
    Command,
});
