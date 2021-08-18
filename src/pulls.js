/**
 * @param {import('@octokit/rest').Octokit} aOctoKit
 * @param {string} owner
 * @param {string} repo
 * @param {number} issueOrPullNumber
 * @return {Promise<boolean>}
 */
export async function isPullRequest(aOctoKit, owner, repo, issueOrPullNumber) {
    try {
        await aOctoKit.pulls.get({
            owner,
            repo,
            // eslint-disable-next-line camelcase
            pull_number: issueOrPullNumber,
        });

        return true;
    } catch (_e) {
        return false;
    }
}
