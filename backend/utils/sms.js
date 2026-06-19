'use strict';

/**
 * Utilitaire SMS via Africa's Talking.
 * Si AT_API_KEY ou AT_USERNAME ne sont pas définis, renvoie notConfigured:true
 * sans planter — le serveur démarre et fonctionne sans SMS.
 */

const AT_URL  = 'https://api.africastalking.com/version1/messaging';
const AT_URL_SANDBOX = 'https://api.sandbox.africastalking.com/version1/messaging';

async function sendSMS(to, message) {
  const apiKey   = process.env.AT_API_KEY;
  const username = process.env.AT_USERNAME;

  if (!apiKey || !username) {
    return { success: false, notConfigured: true };
  }

  const isSandbox = username === 'sandbox';
  const url = isSandbox ? AT_URL_SANDBOX : AT_URL;

  const params = new URLSearchParams({
    username,
    to,
    message,
  });

  const senderId = process.env.AT_SENDER_ID;
  if (senderId && !isSandbox) params.set('from', senderId);

  const res = await fetch(url, {
    method:  'POST',
    headers: {
      apiKey,
      Accept:         'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Africa's Talking HTTP ${res.status}: ${text}`);
  }

  const data = await res.json();
  const recipients = data?.SMSMessageData?.Recipients || [];
  const failed = recipients.filter(r => r.status !== 'Success');
  if (failed.length) {
    throw new Error(`Échec envoi SMS: ${failed.map(r => r.status).join(', ')}`);
  }

  return { success: true };
}

module.exports = { sendSMS };
