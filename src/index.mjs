import * as assert from 'assert';
import * as fs from 'fs/promises';

import OctokitMod from '@octokit/rest';

const { Octokit } = OctokitMod;

import {
    parseString,
    CommandType,
} from './parser/index.js';
import {
    assignReviewer,
    acceptPullRequest,
    rejectPullRequest
} from './operations.js';

(async function main() {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    assert.strictEqual(
        typeof GITHUB_TOKEN,
        'string',
        'GITHUB_TOKEN should be string'
    );

    const GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY;
    assert.strictEqual(
        typeof GITHUB_REPOSITORY,
        'string',
        'GITHUB_REPOSITORY should be string'
    );

    const GITHUB_EVENT_NAME = process.env.GITHUB_EVENT_NAME;
    assert.strictEqual(
        typeof GITHUB_EVENT_NAME,
        'string',
        'GITHUB_EVENT_NAME should be string'
    );
    if (
        GITHUB_EVENT_NAME !== 'issue_comment' &&
        GITHUB_EVENT_NAME !== 'pull_request_review'
    ) {
        throw new TypeError(`${GITHUB_EVENT_NAME} event is not supported`);
    }

    const GITHUB_EVENT_PATH = process.env.GITHUB_EVENT_PATH;
    assert.strictEqual(
        typeof GITHUB_EVENT_PATH,
        'string',
        'GITHUB_EVENT_PATH should be string'
    );

    const eventDataString = await fs.readFile(GITHUB_EVENT_PATH, {
        encoding: 'utf8',
        flag: 'r'
    });
    const eventData = JSON.parse(eventDataString);

    // https://developer.github.com/v3/activity/events/types/#issuecommentevent
    // TODO: Support PR review

    if (eventData.action !== 'created' && eventData.action !== 'submitted') {
        console.log('only support `.action !== created`');
        return;
    }

    let issueCreator = null;
    let issueNumber = null;
    let commentBody = null;
    let currentAssignee = null;
    switch (GITHUB_EVENT_NAME) {
        case 'issue_comment':
            issueCreator = eventData.issue.user.login;
            issueNumber = eventData.issue.number;
            commentBody = eventData.comment.body;
            currentAssignee = eventData.issue.assignees.map((user) => user.login);
            break;
        case 'pull_request_review':
            issueCreator = eventData.pull_request.user.login;
            issueNumber = eventData.pull_request.number;
            commentBody = eventData.review.body;
            currentAssignee = eventData.pull_request.assignees.map((user) => user.login);
            break;
        default:
            throw new RangeError('unreachable!');
    }

    if (typeof commentBody !== 'string') {
        console.warn(`commentBody should be string, but typeof \`${typeof commentBody}\`, value is \`${commentBody}\``);
        return;
    }

    const command = parseString(commentBody);
    if (command === null) {
        console.log(`this comment is not supported, commentBody: ${commentBody}`);
        return;
    }

    let task = null;
    let nextAssignee = null;
    switch (command.type) {
        case CommandType.AssignReviewer:
            nextAssignee = command.target;
            task = assignReviewer;
            break;
        case CommandType.AcceptPullRequest:
            nextAssignee = [issueCreator];
            task = acceptPullRequest;
            break;
        case CommandType.RejectPullRequest:
            nextAssignee = [issueCreator];
            task = rejectPullRequest;
            break;
        default:
            throw new RangeError(JSON.stringify(command));
    }

    const octokitClient = new Octokit({
        auth: GITHUB_TOKEN,
    });

    await task(
        octokitClient,
        GITHUB_REPOSITORY,
        issueNumber,
        currentAssignee,
        nextAssignee
    );
})().catch((e) => {
    console.error(e);
    process.exit(1);
});
