const core = require('@actions/core')
const github = require('@actions/github')
const { stringify } = require('csv-stringify/sync')
const arraySort = require('array-sort')
const token = core.getInput('token', { required: true })
const octokit = github.getOctokit(token)
const eventPayload = require(process.env.GITHUB_EVENT_PATH)
const org = core.getInput('org', { required: false }) || eventPayload.organization.login
const { owner, repo } = github.context.repo
const committerName = core.getInput('committer-name', { required: false }) || 'github-actions'
const committerEmail = core.getInput('committer-email', { required: false }) || 'github-actions@github.com'
const enterprise = core.getInput('enterprise', { required: false }) || ''

;(async () => {
  try {
    const invites = []
    if (enterprise !== '') {
      await orgNames(invites)
      const reportPath = `reports/${enterprise}-invitations.csv`
      await report(invites, reportPath)
    } else {
      const entOrg = org
      await pendingInvites(entOrg, invites)
      await failedInvites(entOrg, invites)
      const reportPath = `reports/${org}-invitations.csv`
      await report(invites, reportPath)
    }
  } catch (error) {
    core.setFailed(error.message)
  }
})()

// Query all enterprise org names
async function orgNames(invites) {
  try {
    let endCursor = null
    const query = /* GraphQL */ `
      query ($enterprise: String!, $cursorID: String) {
        enterprise(slug: $enterprise) {
          organizations(first: 100, after: $cursorID) {
            nodes {
              login
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      }
    `

    let hasNextPage = false
    let dataJSON = null

    do {
      dataJSON = await octokit.graphql({
        query,
        enterprise: enterprise,
        cursorID: endCursor
      })

      const entOrgs = dataJSON.enterprise.organizations.nodes.map((entOrg) => entOrg.login)

      hasNextPage = dataJSON.enterprise.organizations.pageInfo.hasNextPage

      for (const entOrg of entOrgs) {
        if (hasNextPage) {
          endCursor = dataJSON.enterprise.organizations.pageInfo.endCursor
        } else {
          endCursor = null
        }
        await pendingInvites(entOrg, invites)
        await failedInvites(entOrg, invites)
      }
    } while (hasNextPage)
  } catch (error) {
    core.setFailed(error.message)
  }
}

// Query pending invites from enterprise org
async function pendingInvites(entOrg, invites) {
  try {
    const data = await octokit.paginate(octokit.rest.orgs.listPendingInvitations, {
      org: entOrg
    })

    data.forEach((invite) => {
      const login = invite.login || ''
      const email = invite.email || ''
      const state = 'Pending'
      const created_at = invite.created_at.slice(0, 10) || ''
      const inviter = invite.inviter.login || ''

      invites.push({ login, email, state, created_at, inviter, entOrg })
    })
  } catch (error) {
    core.warning(error.message)
  }
}

// Query failed invites from enterprise org
async function failedInvites(entOrg, invites) {
  try {
    const data = await octokit.paginate(octokit.rest.orgs.listFailedInvitations, {
      org: entOrg
    })

    data.forEach((invite) => {
      const login = invite.login || ''
      const email = invite.email || ''
      const state = 'Failed'
      const created_at = invite.created_at.slice(0, 10) || ''
      const failed_at = invite.failed_at.slice(0, 10) || ''
      const inviter = invite.inviter.login || ''

      invites.push({ login, email, state, created_at, failed_at, inviter, entOrg })
    })
  } catch (error) {
    core.warning(error.message)
  }
}

// Create and push report for all enterprise orgs
async function report(invites, reportPath) {
  try {
    const columns = {
      login: 'Username',
      email: 'Email',
      state: 'State',
      created_at: 'Created at',
      failed_at: 'Failed at',
      inviter: 'Inviter',
      entOrg: 'Org'
    }

    const sortColumn = core.getInput('sort', { required: false }) || 'created_at'
    const sortArray = arraySort(invites, sortColumn, { reverse: true })

    const csv = stringify(sortArray, {
      header: true,
      columns: columns
    })

    const opts = {
      owner,
      repo,
      path: reportPath,
      message: `${new Date().toISOString().slice(0, 10)} invitation report`,
      content: Buffer.from(csv).toString('base64'),
      committer: {
        name: committerName,
        email: committerEmail
      }
    }

    try {
      const { data } = await octokit.rest.repos.getContent({
        owner,
        repo,
        path: reportPath
      })

      if (data && data.sha) {
        opts.sha = data.sha
      }
    } catch (err) {}

    await octokit.rest.repos.createOrUpdateFileContents(opts)
  } catch (error) {
    core.setFailed(error.message)
  }
}
