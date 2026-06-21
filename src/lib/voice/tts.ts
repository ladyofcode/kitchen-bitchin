export interface SpeakOptions {
	rate?: number;
	pitch?: number;
	voice?: SpeechSynthesisVoice;
}

export function isSpeechSupported(): boolean {
	return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function stopSpeaking(): void {
	if (isSpeechSupported()) window.speechSynthesis.cancel();
}

export function speak(text: string, opts: SpeakOptions = {}): Promise<void> {
	return new Promise((resolve) => {
		if (!isSpeechSupported() || !text.trim()) {
			resolve();
			return;
		}
		const utterance = new SpeechSynthesisUtterance(text);
		utterance.rate = opts.rate ?? 1;
		utterance.pitch = opts.pitch ?? 1;
		if (opts.voice) utterance.voice = opts.voice;
		utterance.onend = () => resolve();
		utterance.onerror = () => resolve();
		window.speechSynthesis.speak(utterance);
	});
}

export async function speakSequence(phrases: string[], opts: SpeakOptions = {}): Promise<void> {
	stopSpeaking();
	for (const phrase of phrases) {
		await speak(phrase, opts);
	}
}
