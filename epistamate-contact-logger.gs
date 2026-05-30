/**
 * Epistamate — Contact Form Logger
 * Google Apps Script
 *
 * ALREADY DEPLOYED — to update:
 * 1. Paste this into the script editor (replace everything)
 * 2. Save (Ctrl+S)
 * 3. Deploy > Manage deployments > Edit (pencil icon) > Version: New version > Deploy
 *    (Do NOT create a new deployment — update the existing one to keep the same URL)
 */

const SHEET_NAME   = 'Enquiries';
const NOTIFY_EMAIL = 'epistamate@proton.me';
const SHEET_ID     = '1e6g_-iJCu1-rGiSkwZnEDZfOmnu7I9dx2LMkZS_qQJE';

// ── CORS headers — required for browser fetch from epistamate.com ─────────────
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

// ── Handle preflight OPTIONS request ─────────────────────────────────────────
function doOptions(e) {
  return ContentService
    .createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT);
}

// ── Receives form POST from epistamate.com ────────────────────────────────────
function doPost(e) {
  try {
    const sheet = getSheet();

    let data = {};
    try {
      data = JSON.parse(e.postData.contents);
    } catch (_) {
      data = e.parameter || {};
    }

    sheet.appendRow([
      Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd'),
      data.name         || '',
      data.organisation || '',
      data.email        || '',
      data.domain       || '',
      data.problem      || '',
      data.source       || '',
      'New',
      '',
      '',
    ]);

    sendAlert(data);

    const output = ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);

    return output;

  } catch (err) {
    console.error('Logger error:', err.message);
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ── GET — connection test ─────────────────────────────────────────────────────
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'Epistamate logger running' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── Email alert ───────────────────────────────────────────────────────────────
function sendAlert(data) {
  const name = data.name         || 'Unknown';
  const org  = data.organisation || 'No organisation';

  const subject = 'Epistamate enquiry: ' + name + ' / ' + org;
  const sheetLink = 'https://docs.google.com/spreadsheets/d/' + SHEET_ID;

  const body = [
    'New enquiry on epistamate.com',
    '',
    'Name:           ' + name,
    'Organisation:   ' + org,
    'Email:          ' + (data.email  || ''),
    'Domain:         ' + (data.domain || 'Not selected'),
    'Source:         ' + (data.source || 'Not selected'),
    '',
    'Research problem:',
    (data.problem || '(not provided)'),
    '',
    '────────────────────────────────',
    'Tracker: ' + sheetLink,
    '',
    'REPLY TEMPLATE:',
    '',
    'Hi ' + name.split(' ')[0] + ',',
    '',
    "Thanks for reaching out. I'm travelling for part of June but will",
    'be in touch personally within a week.',
    '',
    'In the meantime:',
    '- Engine: https://epistamate.com/engine.html',
    '- Demo: https://epistamate.com/distila_demo.html',
    '- Blog: https://epistamate.com/blog/',
    '',
    'Looking forward to the conversation.',
    '',
    'Abhishek',
    'Epistamate | epistamate@proton.me',
  ].join('\n');

  MailApp.sendEmail({ to: NOTIFY_EMAIL, subject: subject, body: body });
}

// ── Helper ────────────────────────────────────────────────────────────────────
function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(SHEET_NAME) || ss.getActiveSheet();
}

// ── Test — run from editor to verify sheet + email ───────────────────────────
function testLogger() {
  const fake = {
    name: 'Test User', organisation: 'Test Org',
    email: 'test@example.com', domain: 'Policy / Think Tank',
    problem: 'Testing the logger.', source: 'LinkedIn',
  };
  sendAlert(fake);
  getSheet().appendRow([
    Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd'),
    fake.name, fake.organisation, fake.email,
    fake.domain, fake.problem, fake.source,
    'Test', 'Delete this row', '',
  ]);
  Logger.log('Test complete.');
}
