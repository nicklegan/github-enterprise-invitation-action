# Github Enterprise Invitation Action

> A GitHub Action to generate a report to retrieve pending and failed invitations for a GitHub cloud enterprise or organization.

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
        uses: actions/checkout@v3

      - name: Get invitation report
        uses: nicklegan/github-enterprise-invitation-action@v2.0.0
        with:
          token: ${{ secrets.ORG_TOKEN }}
        # org: ''
        # enterprise: ''
        # sort: 'created_at'
        # sort-order: 'desc'
        # json: 'false'
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

| Name              | Description                                                        | Default                     | Location       | Required |
| :---------------- | :----------------------------------------------------------------- | :-------------------------- | :------------- | :------- |
| `org`             | Organization different than workflow context                       |                             | [workflow.yml] | `false`  |
| `enterprise`      | Enterprise slug, to retrieve invitations for the entire enterprise |                             | [workflow.yml] | `false`  |
| `sort`            | Sort the CSV report by column (select column in JSON format)       | `created_at`                | [action.yml]   | `false`  |
| `sort-order`      | Sort CSV column order (ascending or descending)                    | `desc`                      | [action.yml]   | `false`  |
| `json`            | Setting to generate an additional report in JSON format            | `false`                     | [workflow.yml] | `false`  |
| `committer-name`  | The name of the committer that will appear in the Git history      | `github-actions`            | [action.yml]   | `false`  |
| `committer-email` | The committer email that will appear in the Git history            | `github-actions@github.com` | [action.yml]   | `false`  |

[workflow.yml]: #Usage 'Usage'
[action.yml]: action.yml 'action.yml'

:bulb: JSON column name details used for sorting CSV columns by key used in the workflow file are specified below.

## CSV layout

| CSV column   | JSON         | Description                                      |
| :----------- | :----------- | :----------------------------------------------- |
| `Username`   | `login`      | GitHub username                                  |
| `Email`      | `email`      | Email address used for the invitation            |
| `State`      | `state`      | Pending or failed state of the invitation        |
| `Created at` | `created_at` | Date the invitation was created                  |
| `Failed at`  | `failed_at`  | Specifies the date if the invitation has failed  |
| `Org`        | `entOrg`     | The organization the invitation was sent out for |
| `Inviter`    | `inviter`    | The user or account initiating the invitation    |

A CSV report file will be saved in the repository reports folder using the following naming format: **`organization/enterprise`-invitations.csv**.
