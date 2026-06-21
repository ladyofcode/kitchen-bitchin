export type RecognizerState = 'idle' | 'loading' | 'listening' | 'error';

export interface VoiceListenerOptions {
	modelUrl: string;
	grammar?: string[];
	onResult: (text: string) => void;
	onPartial?: (text: string) => void;
	onState?: (state: RecognizerState) => void;
	onError?: (error: unknown) => void;
}

type VoskModel = Awaited<ReturnType<(typeof import('vosk-browser'))['createModel']>>;

interface RecognizerMessage {
	result?: { text?: string; partial?: string };
}

export function isVoiceInputSupported(): boolean {
	return (
		typeof window !== 'undefined' &&
		!!navigator.mediaDevices?.getUserMedia &&
		(typeof AudioContext !== 'undefined' || 'webkitAudioContext' in window)
	);
}

export class VoiceListener {
	private opts: VoiceListenerOptions;
	private model: VoskModel | null = null;
	private recognizer: any = null;
	private stream: MediaStream | null = null;
	private context: AudioContext | null = null;
	private source: MediaStreamAudioSourceNode | null = null;
	private processor: ScriptProcessorNode | null = null;
	private active = false;
	private sampleRate = 16000;

	constructor(opts: VoiceListenerOptions) {
		this.opts = opts;
	}

	get listening(): boolean {
		return this.active;
	}

	private createRecognizer(grammar?: string[]): any {
		const grammarJson = grammar?.length ? JSON.stringify([...grammar, '[unk]']) : undefined;
		const recognizer = new (this.model as any).KaldiRecognizer(this.sampleRate, grammarJson);

		recognizer.on('result', (message: RecognizerMessage) => {
			const text = message?.result?.text?.trim() ?? '';
			if (text) this.opts.onResult(text);
		});
		if (this.opts.onPartial) {
			recognizer.on('partialresult', (message: RecognizerMessage) => {
				const partial = message?.result?.partial?.trim() ?? '';
				if (partial) this.opts.onPartial?.(partial);
			});
		}
		return recognizer;
	}

	setGrammar(grammar?: string[]): void {
		if (!this.active || !this.model) return;
		const previous = this.recognizer;
		this.recognizer = this.createRecognizer(grammar);
		try {
			previous?.remove?.();
		} catch {
		}
	}

	async start(): Promise<void> {
		if (this.active) return;
		this.opts.onState?.('loading');
		try {
			this.stream = await navigator.mediaDevices.getUserMedia({
				audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 }
			});

			const Ctx: typeof AudioContext =
				window.AudioContext ?? (window as any).webkitAudioContext;
			this.context = new Ctx();
			this.sampleRate = this.context.sampleRate;

			if (!this.model) {
				const { createModel } = await import('vosk-browser');
				this.model = await createModel(this.opts.modelUrl);
			}

			this.recognizer = this.createRecognizer(this.opts.grammar);

			this.source = this.context.createMediaStreamSource(this.stream);
			this.processor = this.context.createScriptProcessor(4096, 1, 1);
			this.processor.onaudioprocess = (event) => {
				try {
					this.recognizer?.acceptWaveform(event.inputBuffer);
				} catch (err) {
					this.opts.onError?.(err);
				}
			};
			this.source.connect(this.processor);
			this.processor.connect(this.context.destination);

			this.active = true;
			this.opts.onState?.('listening');
		} catch (err) {
			this.opts.onError?.(err);
			this.opts.onState?.('error');
			await this.stop();
		}
	}

	async stop(): Promise<void> {
		this.active = false;
		if (this.processor) {
			this.processor.onaudioprocess = null;
			this.processor.disconnect();
			this.processor = null;
		}
		if (this.source) {
			this.source.disconnect();
			this.source = null;
		}
		if (this.context) {
			await this.context.close().catch(() => {});
			this.context = null;
		}
		if (this.stream) {
			this.stream.getTracks().forEach((track) => track.stop());
			this.stream = null;
		}
		if (this.recognizer) {
			try {
				this.recognizer.remove?.();
			} catch {
			}
			this.recognizer = null;
		}
		this.opts.onState?.('idle');
	}
}
