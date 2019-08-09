# GitHub Action to assign a reviewer by comment command.

[![CircleCI](https://circleci.com/gh/cats-oss/github-action-auto-assign.svg?style=svg)](https://circleci.com/gh/cats-oss/workflows/github-action-auto-assign)


* This works as [GitHub Actions](https://help.github.com/en/articles/about-github-actions).
* This assigns a reviewer and change a label by special comment command. 
* This behaves like [highfive](https://github.com/servo/highfive) or [popuko](https://github.com/voyagegroup/popuko)


## Motivation

* We don't manage any bot instance for this purpose.
* We'd like to use managed service to host this kind of a bot.
* Try GitHub Actions :)
    * Investigate its latency & its throughput for chat bot purpose.


## Special Command List

* You can use these command as a comment for issue or pull request or pull request review.
* Your comment change some status of the issue you commented.
* This actions treats `S-` prefixed labels exclusively.
  * e.g. If your pull request is labeled with `S-a` and `S-b`,
    then this action replaces them with `S-c`.
* If your comment has multiple line, this action interprets only the first line of it.
* To support the command style which [bors-ng]() uses, you can write `botname <this action command>`.
  * e.g. `bors r+` is ok.

### `r? @username1 @username2`

* This assigns `@username1` and `@username2` to _assignees_ filed.
* This adds the label `S-awaiting-review`.

### `r+` or `r=username1, username2`

* This assigns the user who opens the issue to _assignees_ filed.
* This adds the label `S-awaiting-merge`.

### `r-`

* This assigns the user who opens the issue to _assignees_ filed.
* This adds the label `S-need-code-change`.


## Setup

Add this example to your GitHub Actions [workflow configuration](https://help.github.com/en/articles/configuring-workflows).

### YAML syntax

```yaml
name: assign_review_by_comment by issue_comment
on: [issue_comment, pull_request_review]

jobs:
  assign_review_by_comment:
    runs-on: ubuntu-latest
    steps:
    - name: assign_review_by_comment
      # We recommend to use an arbitary latest version
      # if you don't have any troubles.
      # You can also specify `master`, but it sometimes might be broken.
      uses: cats-oss/github-action-auto-assign@v1.0.0
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Legacy HCL syntax

```
workflow "assign_review_by_comment by issue_comment" {
  # By the design of GitHub Actions, this action requires that the workflow is includeded in your _default branch_.
  # See https://developer.github.com/actions/creating-workflows/workflow-configuration-options/#workflow-attributes
  on = "issue_comment"
  resolves = ["assign_review_by_comment"]
}

workflow "assign_review_by_comment by PR review comment" {
  # By the design of GitHub Actions, this action requires that the workflow is includeded in your pull request
  # which you want to use this action.
  # See https://developer.github.com/actions/creating-workflows/workflow-configuration-options/#workflow-attributes
  on = "pull_request_review"
  resolves = ["assign_review_by_comment"]
}

action "assign_review_by_comment" {
  # see https://developer.github.com/actions/creating-workflows/workflow-configuration-options/#action-blocks
  # `master` branch might be broken sometimes.
  # `stable` branch is more stable, but the evolving is slow. 
  uses = "cats-oss/github-action-auto-assign@v1.0.0"
  # This field is required.
  secrets = ["GITHUB_TOKEN"]
}
```


## Limitations

* By the Limitation of the current GitHub Actions, this might not works your repository well.
    * Because GitHub Actions is still in beta.
    * We confirms this works with a private repository. But we have not confirmed yet to work with a public one.


## Known Problems

### This action could not interact with my comment in a few seconds.

* We know that this action takes ~30sec to react user comment.
* We think this is the current or fundamental limitation of GitHub Actions.
  See [#6](https://github.com/cats-oss/github-action-auto-assign/issues/6).