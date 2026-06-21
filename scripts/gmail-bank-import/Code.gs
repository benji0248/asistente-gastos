/**
 * Gmail → Supabase bank email import
 *
 * 1. Set EDGE_FUNCTION_URL, USER_TOKEN, WEBHOOK_SECRET, GMAIL_LABEL below.
 * 2. Run createMinuteTrigger() once from the editor.
 * 3. Authorize Gmail when prompted.
 */
const EDGE_FUNCTION_URL = 'https://YOUR_PROJECT.supabase.co/functions/v1/bank-email-import';
const USER_TOKEN = 'YOUR_IMPORT_TOKEN';
const WEBHOOK_SECRET = 'YOUR_WEBHOOK_SECRET';
const GMAIL_LABEL = 'AsistenteGastos';

function syncBankEmails() {
  const query = 'label:' + GMAIL_LABEL + ' is:unread';
  const threads = GmailApp.search(query, 0, 20);

  threads.forEach(function (thread) {
    const messages = thread.getMessages();
    messages.forEach(function (message) {
      if (!message.isUnread()) return;
      processMessage_(message);
    });
  });
}

function processMessage_(message) {
  const messageId = message.getHeader('Message-ID') || message.getId();
  const payload = {
    userToken: USER_TOKEN,
    messageId: messageId,
    from: message.getFrom(),
    subject: message.getSubject(),
    body: message.getPlainBody() || message.getBody(),
  };

  const response = UrlFetchApp.fetch(EDGE_FUNCTION_URL, {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'x-webhook-secret': WEBHOOK_SECRET,
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });

  const status = response.getResponseCode();
  if (status >= 200 && status < 300) {
    const body = JSON.parse(response.getContentText() || '{}');
    if (body.ok) {
      message.markRead();
    }
    return;
  }

  console.error('Import failed', status, response.getContentText());
}

function createMinuteTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    if (trigger.getHandlerFunction() === 'syncBankEmails') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  ScriptApp.newTrigger('syncBankEmails')
    .timeBased()
    .everyMinutes(1)
    .create();
}
