import test from 'ava';

import ParserMod from '../parser';

const {
    CommandType,
    parseString,
    Command,
} = ParserMod;

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
    return array.map(({ input }) => {
        return {
            input: 'bors' + input,
            expected: null,
        };
    });
}

function withMultipleBotName(array) {
    return array.map(({ input }) => {
        return {
            input: 'bors1 bors2 ' + input,
            expected: null,
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
    // TODO: testCase('r+ @bar', null),
    // TODO: testCase('r+ @bar @foo', null),
    // TODO: testCase('   r+ @bar \n @foo', null),
    // TODO: testCase('    r+    ', null),
    // TODO: testCase('r+ foo', null),
    testCase('\n r+ @bar', null),
    testCase('r +', null),
    // TODO: testCase('r=bar', expected(CommandType.AcceptPullRequest, null)),
    // TODO: testCase('r=bar,foo', null),
    // TODO: testCase('r=', null),
    // TODO: testCase('r = bar', null),
    // TODO: testCase('r= \n foo', null),
];

const REJECT_REVIEW_TEST_CASE_LIST = [
    testCase('r-', expected(CommandType.RejectPullRequest, null)),
    // TODO: testCase('r- @bar', null),
    // TODO: testCase('r- @bar @foo', null),
    // TODO: testCase('   r-  @bar \n @foo', null),
    // TODO: testCase('    r-    ', null),
    // TODO: testCase('r- foo', null),
    testCase('\n r- @bar', null),
    testCase('r -', null),
];

const TEST_CASE_LIST = [
    ...REQUEST_REVIEW_TEST_CASE_LIST,
    ...[
    // TODO:    ...withBotName(REQUEST_REVIEW_TEST_CASE_LIST),
    // TODO:    ...withPrefixLikeBotName(REQUEST_REVIEW_TEST_CASE_LIST),
    // TODO:    ...withMultipleBotName(REQUEST_REVIEW_TEST_CASE_LIST),
    ],

    ...APPROVE_REVIEW_TEST_CASE_LIST,
    ...[
    // TODO:    ...withBotName(APPROVE_REVIEW_TEST_CASE_LIST),
    // TODO:    ...withPrefixLikeBotName(APPROVE_REVIEW_TEST_CASE_LIST),
    // TODO:    ...withMultipleBotName(APPROVE_REVIEW_TEST_CASE_LIST),
    ],

    ...REJECT_REVIEW_TEST_CASE_LIST,
    ...[
    // TODO:    ...withBotName(REJECT_REVIEW_TEST_CASE_LIST),
    // TODO:    ...withPrefixLikeBotName(REJECT_REVIEW_TEST_CASE_LIST),
    // TODO:    ...withMultipleBotName(REJECT_REVIEW_TEST_CASE_LIST),
    ],

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