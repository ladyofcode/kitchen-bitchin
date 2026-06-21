import { env } from '$env/dynamic/private';

export async function sendTelegram(message: string): Promise<void> {
	const token = env.TELEGRAM_BOT_TOKEN;
	const chatId = env.TELEGRAM_CHAT_ID;

	if (!token || !chatId) {
		console.warn('[notify] TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID not set; skipping notification.');
		return;
	}

	try {
		const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({
				chat_id: chatId,
				text: message,
				disable_web_page_preview: true
			})
		});
		if (!res.ok) {
			console.error('[notify] Telegram responded', res.status, await res.text());
		}
	} catch (err) {
		console.error('[notify] Telegram request failed', err);
	}
}
