# Github Enterprise Invitation Action

> A GitHub Action to generate a report to retrieve all pending and failed invitations for a GitHub enterprise or organization.

## Usage

```yml
name: Invitation Report

on:
  workflow_dispatch:
  schedule:
    # Runs on every Sunday at 00:00 UTC
    #
    #        ┌────────────── minute
    #        │ ┌──────────── hour
    #        │ │ ┌────────── day (month)
    #        │ │ │ ┌──────── month
    #        │ │ │ │ ┌────── day (week)
    - cron: '0 0 * * 0'

jobs:
  invitation-report:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v2

      - name: Get invitation report
        uses: nicklegan/github-enterprise-invitation-action@v1.0.0
        with:
          token: ${{ secrets.ORG_TOKEN }}
          org: ''
          enterprise: ''
```

## GitHub secrets

| Name                 | Value                                                                     | Required |
| :------------------- | :------------------------------------------------------------------------ | :------- |
| `ORG_TOKEN`          | A `repo`, `read:org` and `read:enterprise` scoped [Personal Access Token] | `true`   |
| `ACTIONS_STEP_DEBUG` | `true` [Enables diagnostic logging]                                       | `false`  |

[personal access token]: https://github.com/settings/tokens/new?scopes=repo,read:org,read:enterprise&description=Invitation+Action 'Personal Access Token'
[enables diagnostic logging]: https://docs.github.com/en/actions/managing-workflow-runs/enabling-debug-logging#enabling-runner-diagnostic-logging 'Enabling runner diagnostic logging'

:bulb: The `read:enterprise` scope is only needed when running the Action on the enterprise level.

:bulb: Disable [token expiration](https://github.blog/changelog/2021-07-26-expiration-options-for-personal-access-tokens/) to avoid failed workflow runs when running on a schedule.

:bulb: If the organization has SAML SSO enabled, make sure the personal access token is [authorized](https://docs.github.com/enterprise-cloud@latest/authentication/authenticating-with-saml-single-sign-on/authorizing-a-personal-access-token-for-use-with-saml-single-sign-on) to access the organization.

## Action inputs

If the organization name in the workflow is left blank, the Action will generate a report for the organization the workflow is located in. If an enterprise slug is used in the workflow, this will supersede the organization parameter and the Action will run on the enterprise level instead.

| Name              | Description                                                   | Default                     | Options        | Required |
| :---------------- | :------------------------------------------------------------ | :-------------------------- | :------------- | :------- |
| `org`             | Organization different than workflow context                  |                             | [workflow.yml] | `false`  |
| `enterprise`      | Enterprise slug                                               |                             | [workflow.yml] | `false`  |
| `sort`            | Column sort order of the report                               | `created_at`                | [action.yml]   | `false`  |
| `committer-name`  | The name of the committer that will appear in the Git history | `github-actions`            | [action.yml]   | `false`  |
| `committer-email` | The committer email that will appear in the Git history       | `github-actions@github.com` | [action.yml]   | `false`  |

[workflow.yml]: #Usage 'Usage'
[action.yml]: action.yml 'action.yml'

## CSV layout

| Column     | Description                                      |
| :--------- | :----------------------------------------------- |
| Username   | GitHub username                                  |
| Email      | Email address used for the invitation            |
| State      | Pending or failed state of the invitation        |
| Created at | Date the invitation was created                  |
| Failed at  | Specifies the date if the invitation has failed  |
| Org        | The organization the invitation was sent out for |
| Inviter    | The user or account initiating the invitation    |

A CSV report file will be saved in the repository reports folder using the following naming format: **<organization/enterprise>-invitations.csv**.
