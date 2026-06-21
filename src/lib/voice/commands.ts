export type VoiceCommand =
	| { type: 'readList' }
	| { type: 'readMeasurements' }
	| { type: 'readStep'; step: number }
	| { type: 'nextStep' }
	| { type: 'repeat' }
	| { type: 'stop' }
	| { type: 'howMuch'; ingredient: string }
	| { type: 'addNote' }
	| { type: 'useTimer' }
	| { type: 'setTimer'; seconds: number }
	| { type: 'startTimer' }
	| { type: 'pauseTimer' }
	| { type: 'cancelTimer' };

const NUMBER_WORDS: Record<string, number> = {
	zero: 0,
	one: 1,
	two: 2,
	three: 3,
	four: 4,
	five: 5,
	six: 6,
	seven: 7,
	eight: 8,
	nine: 9,
	ten: 10,
	eleven: 11,
	twelve: 12,
	thirteen: 13,
	fourteen: 14,
	fifteen: 15,
	sixteen: 16,
	seventeen: 17,
	eighteen: 18,
	nineteen: 19,
	twenty: 20,
	thirty: 30,
	forty: 40,
	fifty: 50,
	sixty: 60
};

export const COMMAND_GRAMMAR: string[] = [
	'read',
	'list',
	'ingredients',
	'measurements',
	'step',
	'next',
	'repeat',
	'stop',
	'how',
	'much',
	'add',
	'note',
	'save',
	'use',
	'set',
	'start',
	'pause',
	'resume',
	'cancel',
	'timer',
	'minute',
	'minutes',
	'second',
	'seconds',
	...Object.keys(NUMBER_WORDS)
];

export function buildGrammar(ingredientItems: string[] = []): string[] {
	const words = new Set(COMMAND_GRAMMAR);
	for (const item of ingredientItems) {
		for (const word of item.toLowerCase().split(/\s+/)) {
			const cleaned = word.replace(/[^a-z]/g, '');
			if (cleaned) words.add(cleaned);
		}
	}
	return [...words];
}

function matchIngredient(tokens: string[], ingredientItems: string[]): string | null {
	const heard = new Set(tokens);
	let best: string | null = null;
	let bestScore = 0;
	for (const item of ingredientItems) {
		const itemWords = item.toLowerCase().split(/\s+/).map((w) => w.replace(/[^a-z]/g, ''));
		const score = itemWords.filter((w) => w && heard.has(w)).length;
		if (score > bestScore) {
			bestScore = score;
			best = item;
		}
	}
	return bestScore > 0 ? best : null;
}

function parseSpokenNumber(tokens: string[]): number | null {
	let total = 0;
	let found = false;
	for (const token of tokens) {
		const value = NUMBER_WORDS[token];
		if (value === undefined) continue;
		found = true;
		total += value;
	}
	return found ? total : null;
}

export function parseCommand(text: string, ingredientItems: string[] = []): VoiceCommand | null {
	const normalized = text.toLowerCase().trim();
	if (!normalized) return null;
	const tokens = normalized.split(/\s+/);
	const has = (word: string) => tokens.includes(word);

	if (has('timer')) {
		if (has('cancel') || has('stop')) return { type: 'cancelTimer' };
		if (has('pause')) return { type: 'pauseTimer' };
		if (has('set') || has('use')) {
			const number = parseSpokenNumber(tokens);
			if (number !== null) {
				const unitSeconds = has('second') || has('seconds') ? 1 : 60;
				return { type: 'setTimer', seconds: number * unitSeconds };
			}
		}
		if (has('start') || has('resume')) return { type: 'startTimer' };
		if (has('use')) return { type: 'useTimer' };
	}

	if (has('note') && has('add')) return { type: 'addNote' };

	if (has('how') && has('much')) {
		const ingredient = matchIngredient(tokens, ingredientItems);
		if (ingredient) return { type: 'howMuch', ingredient };
	}

	if (has('next')) return { type: 'nextStep' };
	if (has('step')) {
		const number = parseSpokenNumber(tokens);
		if (number !== null) return { type: 'readStep', step: number };
	}
	if (has('measurements')) return { type: 'readMeasurements' };
	if (has('list') || has('ingredients')) return { type: 'readList' };
	if (has('repeat')) return { type: 'repeat' };
	if (has('stop')) return { type: 'stop' };

	return null;
}
