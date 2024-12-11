import axios from 'axios';
import { CookieJar } from 'tough-cookie';
import { wrapper } from 'axios-cookiejar-support';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import { google } from 'googleapis';

const jar = new CookieJar();
const client = wrapper(axios.create({ jar }));

async function createConversation() {
  try {
    // create a user
    await client.post('http://localhost/api/v3/auth/new', {
      hname: 'Test Participant 01',
      email: 'moderator@polis.test',
      password: 'Te$tP@ssw0rd*',
      password2: 'Te$tP@ssw0rd*',
      gatekeeperTosPrivacy: 'true',
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    // create a conversation
    const response = await client.post('http://localhost/api/v3/conversations', {
      is_active: 'true',
      is_draft: 'true',
      topic: 'Conversation Topic',
      description: 'Conversation Description',
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const conversationId = await response.data.conversation_id
    const dummyComments = [
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.', 
      'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.', 
      'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
    ]

    // seed comments in the conversation
    for (let i = 0; i < dummyComments.length; i++) {
      await client.post('http://localhost/api/v3/comments', {
        conversation_id: conversationId,
        is_seed: true,
        pid: 'mypid',
        txt: dummyComments[i],
      })
    }

    // logout
    await client.post('http://localhost/api/v3/auth/deregister')

    return conversationId;

  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function runLighthouse(url) {
  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless']
  });

  const options = {output: 'json', port: chrome.port};

  const runnerResult = await lighthouse(url, options);
  console.log('Lighthouse audit completed');
  
  // Kill the Chrome instance after the audit is finished
  await chrome.kill();

  return runnerResult
}

function extractAccessibilityIssues(issues, report, pageName) {
  const accessibilityAudits = report.categories.accessibility.auditRefs
  
  accessibilityAudits.forEach(audit => {
    const auditId = audit.id;
    const auditDetails = report.audits[auditId];

    // failed tests have a int score of 0
    if (auditDetails.score == 0) {
      const issueTitle = auditDetails.title;
      const issueDescription = auditDetails.description;
      const accessibilityIssue = ['', issueTitle, pageName, issueDescription, 'Auto evaluation', auditId, 'Lighthouse'];
      issues.push(accessibilityIssue);
    }
  })
}

async function authenticate(credentials) {
  const auth = new google.auth.GoogleAuth({
    keyFile: credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return await auth.getClient();
}

// return entries that are not already in the spreadsheet
async function filterDuplicates (auth, spreadsheetId, newIssues) {
  const sheets = google.sheets({ version: 'v4', auth });
  const range = 'Sheet1!B:C';
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  const existingIssues = res.data.values || [];

  const existingIssuesSet = new Set(existingIssues.map(issue => JSON.stringify(issue)))
  
  const filteredIssues = newIssues.filter(issue => !existingIssuesSet.has(JSON.stringify([issue[1], issue[2]])))

  return filteredIssues;
}

async function writeToSheet(auth, newIssues, spreadsheetId) {
  const sheets = google.sheets({ version: 'v4', auth });

  const nonDuplicateIssues = await filterDuplicates(auth, spreadsheetId, newIssues);
  
  await sheets.spreadsheets.values.append({
      spreadsheetId: spreadsheetId,
      range: 'A1',
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: nonDuplicateIssues
      }
  });
  console.log('Data written to Sheet.');
}

async function uploadIssues(spreadsheetId, issues, credentials) {
  const auth = await authenticate(credentials);
  await writeToSheet(auth, issues, spreadsheetId);
}

try {
  const conversationId = await createConversation();
  const pages = {
    'Home page': 'http://localhost',
    'Open participation page': `http://localhost/${conversationId}`
  };
  const issues = [];
  
  for (const [pageName, url] of Object.entries(pages)) {
    const { lhr } = await runLighthouse(url);
    extractAccessibilityIssues(issues, lhr, pageName)
  }

  const credentials = './googleCredentials.json';
  const args = process.argv.slice(2);
  const spreadsheetId = args.find(arg => arg.includes('--spreadsheetId')).split('=')[1];

  if (issues) {
    await uploadIssues(spreadsheetId, issues, credentials);
  }
} catch (e) {
  console.error('Error:', e);
}