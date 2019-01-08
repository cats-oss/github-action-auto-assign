# GitHub Action to assign a reviewer by comment command.

* This works as [GitHub Actions](https://developer.github.com/actions/).
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

### `r? @username1 @username2`

* This assigns `@username1` and `@username2` to _assignees_ filed.
* This adds the label `S-awaiting-review`.

### `r+`

* This assigns the user who opens the issue to _assignees_ filed.
* This adds the label `S-awaiting-merge`.

### `r-`

* This assigns the user who opens the issue to _assignees_ filed.
* This adds the label `S-need-code-change`.


## Setup

TBD...


## Limitations

* By the Limitation of the current GitHub Actions, this would not works your repository well.
    * We confirms this works with a private repository. But we have not confirmed yet to work with a public one.