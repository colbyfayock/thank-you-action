require('dotenv').config();
const fetch = require('node-fetch');
const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
  const GITHUB_TOKEN = core.getInput('GITHUB_TOKEN');
  const TENOR_TOKEN = core.getInput('TENOR_TOKEN') || process.env.TENOR_TOKEN;
  const message = core.getInput('message') || 'Thank you!';
  const searchTerm = core.getInput('searchTerm') || 'thank you';

  if ( typeof TENOR_TOKEN !== 'string' ) {
    throw new Error('Invalid TENOR_TOKEN: did you forget to set it in your action config?');
  }

  if ( typeof GITHUB_TOKEN !== 'string' ) {
    throw new Error('Invalid GITHUB_TOKEN: did you forget to set it in your action config?');
  }

  const randomPos = Math.round(Math.random() * 1000);
  const url = `https://api.tenor.com/v1/search?q=${encodeURIComponent(searchTerm)}&pos=${randomPos}&limit=1&media_filter=minimal&contentfilter=high`

  console.log(`Searching Tenor: ${url}`)

  const response = await fetch(`${url}&key=${TENOR_TOKEN}`);
  const { results } = await response.json();
  const gifUrl = results[0].media[0].tinygif.url;

  console.log(`Found gif from Tenor: ${gifUrl}`);

  const { context = {} } = github;
  const { pull_request } = context.payload;

  if ( !pull_request ) {
    throw new Error('Could not find pull request!')
  };

  console.log(`Found pull request: ${pull_request.number}`);

  const octokit = github.getOctokit(GITHUB_TOKEN)

  await octokit.issues.createComment({
    ...context.repo,
    issue_number: pull_request.number,
    body: `${message}\n\n<img src="${gifUrl}" alt="${searchTerm}" />`
  });
}

run().catch(e => core.setFailed(e.message));