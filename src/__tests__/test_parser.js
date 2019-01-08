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

const TEST_CASE_LIST = [
    testCase('r? @bar', expected(CommandType.AssignReviewer, ['bar'])),
    testCase('r? @bar @foo', expected(CommandType.AssignReviewer, ['bar', 'foo'])),
    testCase('  r? @bar \n @foo', expected(CommandType.AssignReviewer, ['bar'])),
    testCase('r?', null),
    testCase('    r?    ', null),
    testCase('r? foo', null),
    testCase('\n r? @bar', null),
    testCase('r ? @bar', null),

    testCase('r+', expected(CommandType.AcceptPullRequest, [])),
    testCase('r+ @bar', expected(CommandType.AcceptPullRequest, ['bar'])),
    testCase('r+ @bar @foo', expected(CommandType.AcceptPullRequest, ['bar', 'foo'])),
    testCase('   r+ @bar \n @foo', expected(CommandType.AcceptPullRequest, ['bar'])),
    testCase('    r+    ', expected(CommandType.AcceptPullRequest, [])),
    testCase('r+ foo', expected(CommandType.AcceptPullRequest, [])),
    testCase('\n r+ @bar', null),
    testCase('r +', null),

    testCase('r-', expected(CommandType.RejectPullRequest, [])),
    testCase('r- @bar', expected(CommandType.RejectPullRequest, ['bar'])),
    testCase('r- @bar @foo', expected(CommandType.RejectPullRequest, ['bar', 'foo'])),
    testCase('   r-  @bar \n @foo', expected(CommandType.RejectPullRequest, ['bar'])),
    testCase('    r-    ', expected(CommandType.RejectPullRequest, [])),
    testCase('r- foo', expected(CommandType.RejectPullRequest, [])),
    testCase('\n r- @bar', null),
    testCase('r -', null),
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