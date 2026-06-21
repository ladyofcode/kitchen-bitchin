<script module lang="ts">
	import type { RecognizerState } from '$lib/voice/stt';

	export type RecipeVoiceApi = {
		micSupported: boolean;
		micState: RecognizerState;
		isListening: boolean;
		lastHeard: string;
		ttsSupported: boolean;
		dictating: boolean;
		toggleListening: () => void;
		readNames: () => void;
		readMeasurements: () => void;
		nextStep: () => void;
		readStep: (step: number) => void;
		repeat: () => void;
		stopSpeaking: () => void;
	};
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import type { Ingredient } from '$lib/types';
	import { isSpeechSupported, speak, speakSequence, stopSpeaking } from '$lib/voice/tts';
	import { VoiceListener, isVoiceInputSupported } from '$lib/voice/stt';
	import { buildGrammar, parseCommand, type VoiceCommand } from '$lib/voice/commands';

	let {
		ingredients,
		steps,
		oncommand,
		onnotestart,
		onnoteappend,
		onnotesave,
		onnotecancel,
		voice = $bindable(undefined as RecipeVoiceApi | undefined)
	}: {
		ingredients: Ingredient[];
		steps: string[];
		oncommand?: (command: VoiceCommand) => void;
		onnotestart?: () => void;
		onnoteappend?: (text: string) => void;
		onnotesave?: () => void;
		onnotecancel?: () => void;
		voice?: RecipeVoiceApi | undefined;
	} = $props();

	const MODEL_URL = '/models/vosk-model-small-en-us-0.15.tar.gz';

	let ttsSupported = $state(false);
	let micSupported = $state(false);
	let micState = $state<RecognizerState>('idle');
	let lastHeard = $state('');
	let dictating = $state(false);

	let nextStepIndex = $state(0);
	let lastSpoken = '';

	let listener: VoiceListener | null = null;

	const isListening = $derived(micState === 'listening' || micState === 'loading');
	const commandGrammar = $derived(buildGrammar(ingredients.map((i) => i.item)));

	$effect(() => {
		voice = {
			micSupported,
			micState,
			isListening,
			lastHeard,
			ttsSupported,
			dictating,
			toggleListening,
			readNames,
			readMeasurements,
			nextStep,
			readStep,
			repeat,
			stopSpeaking
		};
	});

	onMount(() => {
		ttsSupported = isSpeechSupported();
		micSupported = isVoiceInputSupported();
		return () => {
			stopSpeaking();
			listener?.stop();
		};
	});

	function say(text: string) {
		lastSpoken = text;
		stopSpeaking();
		speak(text);
	}

	function sayMany(phrases: string[]) {
		lastSpoken = phrases.join('. ');
		speakSequence(phrases);
	}

	function stepPhrase(index: number): string {
		return `Step ${index + 1}. ${steps[index]}`;
	}

	function readNames() {
		sayMany(['Ingredients', ...ingredients.map((i) => i.item)]);
	}

	function readMeasurements() {
		sayMany(ingredients.map((ing) => (ing.amount ? `${ing.item}, ${ing.amount}` : ing.item)));
	}

	function readStep(stepNumber: number) {
		const index = stepNumber - 1;
		if (index < 0 || index >= steps.length) {
			say(`There is no step ${stepNumber}.`);
			return;
		}
		say(stepPhrase(index));
		nextStepIndex = index + 1;
	}

	function nextStep() {
		if (steps.length === 0) {
			say('This recipe has no steps.');
			return;
		}
		if (nextStepIndex >= steps.length) {
			say('That was the last step.');
			return;
		}
		say(stepPhrase(nextStepIndex));
		nextStepIndex += 1;
	}

	function repeat() {
		if (lastSpoken) {
			stopSpeaking();
			speak(lastSpoken);
		}
	}

	function readHowMuch(name: string) {
		const ing = ingredients.find((i) => i.item === name);
		if (!ing) return;
		say(ing.amount ? `${ing.item}, ${ing.amount}` : `No measurement listed for ${ing.item}.`);
	}

	async function startNoteDictation() {
		if (dictating) return;
		onnotestart?.();
		stopSpeaking();
		await speak('Dictating note. Say save note when done.');
		dictating = true;
		listener?.setGrammar();
	}

	function endNoteDictation(save: boolean) {
		if (!dictating) return;
		dictating = false;
		listener?.setGrammar(commandGrammar);
		if (save) onnotesave?.();
		else onnotecancel?.();
	}

	function handleDictation(text: string) {
		const lower = text.toLowerCase();
		if (/\b(cancel|discard) note\b/.test(lower) || lower === 'stop') {
			endNoteDictation(false);
			say('Note cancelled.');
			return;
		}
		if (/\bsave note\b/.test(lower)) {
			const remainder = lower.replace(/\bsave note\b.*$/, '').trim();
			if (remainder) onnoteappend?.(remainder);
			endNoteDictation(true);
			return;
		}
		onnoteappend?.(text);
	}

	function handleCommand(command: VoiceCommand) {
		switch (command.type) {
			case 'readList':
				readNames();
				break;
			case 'readMeasurements':
				readMeasurements();
				break;
			case 'readStep':
				readStep(command.step);
				break;
			case 'nextStep':
				nextStep();
				break;
			case 'repeat':
				repeat();
				break;
			case 'howMuch':
				readHowMuch(command.ingredient);
				break;
			case 'addNote':
				startNoteDictation();
				break;
			case 'stop':
				stopSpeaking();
				oncommand?.(command);
				break;
			default:
				oncommand?.(command);
		}
	}

	async function startListening() {
		if (listener) return;
		listener = new VoiceListener({
			modelUrl: MODEL_URL,
			grammar: commandGrammar,
			onResult: (text) => {
				lastHeard = text;
				if (dictating) {
					handleDictation(text);
					return;
				}
				const command = parseCommand(text, ingredients.map((i) => i.item));
				if (command) handleCommand(command);
			},
			onState: (state) => (micState = state),
			onError: (error) => console.error('[voice]', error)
		});
		await listener.start();
	}

	async function stopListening() {
		await listener?.stop();
		listener = null;
		micState = 'idle';
		dictating = false;
	}

	function toggleListening() {
		if (listener) stopListening();
		else startListening();
	}
</script>
