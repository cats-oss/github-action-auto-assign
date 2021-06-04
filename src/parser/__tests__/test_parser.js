import test from 'ava';

import {
    CommandType,
    parseString,
    Command,
} from '../parser.js';

function testCase(input, expected) {
    return {
        input,
        expected,
    };
}

function expected(type, target) {
    return new Command(type, target);
}

function withBotName(array) {
    return array.map(({ input, expected }) => {
        return {
            input: 'bors ' + input,
            expected,
        };
    });
}

function withPrefixLikeBotName(array) {
    const result = [];
    for (const { input } of array) {
        if (/^\s/u.test(input)) {
            continue;
        }

        result.push({
            input: 'bors' + input,
            expected: null,
        });
    }
    return result;
}

function withMultipleBotName(array) {
    return array.map(({ input, expected }) => {
        return {
            input: 'bors1 bors2 ' + input,
            expected,
        };
    });
}

const REQUEST_REVIEW_TEST_CASE_LIST = [
    testCase('r? @bar', expected(CommandType.AssignReviewer, ['bar'])),
    testCase('r? @bar @foo', expected(CommandType.AssignReviewer, ['bar', 'foo'])),
    testCase('r? @bar || @foo', expected(CommandType.AssignReviewer, ['bar', 'foo'])),
    testCase('r? @bar && @foo', expected(CommandType.AssignReviewer, ['bar', 'foo'])),
    testCase('  r? @bar \n @foo', expected(CommandType.AssignReviewer, ['bar'])),
    testCase('r?', null),
    testCase('    r?    ', null),
    testCase('r? foo', null),
    testCase('\n r? @bar', null),
    testCase('r ? @bar', null),
    testCase('r? ||', null),
    testCase('    r?    ||', null),
    testCase('r? || foo', null),
    testCase('r? foo ||', null),
    testCase('\n r? @bar ||', null),
    testCase('r ? @bar || @bar', null),
    testCase('r? |&&', null),
    testCase('r? ||&', null),
    testCase('r? ||&&', null),
    testCase('    r?    &&', null),
    testCase('r? && foo', null),
    testCase('r? foo &&', null),
    testCase('\n r? @bar &&', null),
    testCase('r ?', null),
    testCase('r ? @bar && @bar', null),
];

const APPROVE_REVIEW_TEST_CASE_LIST = [
    testCase('r+', expected(CommandType.AcceptPullRequest, null)),
    testCase('r+ @bar', null),
    testCase('r+ @bar @foo', null),
    testCase('   r+ @bar \n @foo', null),
    testCase('    r+    ', expected(CommandType.AcceptPullRequest, null)),
    testCase('r+ foo', null),
    testCase('\n r+ @bar', null),
    testCase('r +', null),
    testCase('r=bar', expected(CommandType.AcceptPullRequest, ['bar'])),
    testCase('r=bar,foo', expected(CommandType.AcceptPullRequest, ['bar', 'foo'])),
    testCase('r=bar, foo', expected(CommandType.AcceptPullRequest, ['bar', 'foo'])),
    testCase('r=bar,   foo,   ', expected(CommandType.AcceptPullRequest, ['bar', 'foo'])),
    testCase('r=bar;foo', null),
    testCase('r=bar;foo;', null),
    testCase('r=bar.foo.', null),
    testCase('r=bar.foo,', null),
    testCase('r=', null),
    testCase('r = bar', null),
    testCase('r= \n foo', null),
];

const REJECT_REVIEW_TEST_CASE_LIST = [
    testCase('r-', expected(CommandType.RejectPullRequest, null)),
    testCase('r- @bar', null),
    testCase('r- @bar @foo', null),
    testCase('   r-  @bar \n @foo', null),
    testCase('    r-    ', expected(CommandType.RejectPullRequest, null)),
    testCase('r- foo', null),
    testCase('\n r- @bar', null),
    testCase('r -', null),
];

// We should avoid "Delegating reviews" case in https://bors.tech/documentation/getting-started/
const BORS_DELEGETE_COMMAND_TEST_CASE_LIST = [
    testCase('@some-user: bors r+', null),
    testCase('@bors[bot]: Permission denied', null),
    testCase('@some-reviewer: bors delegate=some-user', null),
    testCase('@bors[bot]: some-user now has permission to review this pull request.', null),
    testCase('@bors[bot]: Added to queue', null),
];

const TEST_CASE_LIST = [
    ...REQUEST_REVIEW_TEST_CASE_LIST,
    ...[
        ...withBotName(REQUEST_REVIEW_TEST_CASE_LIST),
        ...withPrefixLikeBotName(REQUEST_REVIEW_TEST_CASE_LIST),
        ...withMultipleBotName(REQUEST_REVIEW_TEST_CASE_LIST),
    ],

    ...APPROVE_REVIEW_TEST_CASE_LIST,
    ...[
        ...withBotName(APPROVE_REVIEW_TEST_CASE_LIST),
        ...withPrefixLikeBotName(APPROVE_REVIEW_TEST_CASE_LIST),
        ...withMultipleBotName(APPROVE_REVIEW_TEST_CASE_LIST),
    ],

    ...REJECT_REVIEW_TEST_CASE_LIST,
    ...[
        ...withBotName(REJECT_REVIEW_TEST_CASE_LIST),
        ...withPrefixLikeBotName(REJECT_REVIEW_TEST_CASE_LIST),
        ...withMultipleBotName(REJECT_REVIEW_TEST_CASE_LIST),
    ],

    ...BORS_DELEGETE_COMMAND_TEST_CASE_LIST,
];

for (const testCase of TEST_CASE_LIST) {
    const {
        input,
        expected,
    } = testCase;

    test(`parseString(), input: \`${input}\`, expected: ${JSON.stringify(expected)}`, (t) => {
        const actual = parseString(input);
        t.deepEqual(actual, expected);
    });
}