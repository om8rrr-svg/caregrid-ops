export async function postSlack(text: string) {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) {
    console.warn('[alerts/slack] SLACK_WEBHOOK_URL missing. Printing instead.');
    console.log({ text });
    return;
  }
  await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
}