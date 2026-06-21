class TimerController {
	remaining = $state(0);
	running = $state(false);
	finished = $state(false);

	#endTime = 0;
	#intervalId: ReturnType<typeof setInterval> | null = null;
	#alarmId: ReturnType<typeof setInterval> | null = null;
	#alarmBeeps = 0;
	#wakeLock: WakeLockSentinel | null = null;
	#audioCtx: AudioContext | null = null;

	get active(): boolean {
		return this.remaining > 0 || this.finished;
	}

	get display(): string {
		const minutes = Math.floor(this.remaining / 60);
		const seconds = this.remaining % 60;
		return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
	}

	setSeconds = (seconds: number) => {
		if (seconds <= 0) return;
		this.remaining = Math.round(seconds);
		this.#run();
	};

	resume = () => {
		if (!this.running && this.remaining > 0) this.#run();
	};

	pause = () => {
		this.running = false;
		this.#stopInterval();
		this.#releaseWakeLock();
	};

	cancel = () => {
		this.running = false;
		this.finished = false;
		this.remaining = 0;
		this.#stopInterval();
		this.#stopAlarm();
		this.#releaseWakeLock();
	};

	#run = () => {
		if (this.remaining <= 0) return;
		this.running = true;
		this.finished = false;
		this.#endTime = Date.now() + this.remaining * 1000;
		this.#stopInterval();
		this.#intervalId = setInterval(this.#tick, 250);
		this.#acquireWakeLock();
	};

	#tick = () => {
		this.remaining = Math.max(0, Math.ceil((this.#endTime - Date.now()) / 1000));
		if (this.remaining <= 0) this.#finish();
	};

	#finish = () => {
		this.#stopInterval();
		this.running = false;
		this.finished = true;
		this.remaining = 0;
		this.#releaseWakeLock();
		this.#playAlarm();
		navigator.vibrate?.([500, 200, 500, 200, 500]);
	};

	#stopInterval = () => {
		if (this.#intervalId) {
			clearInterval(this.#intervalId);
			this.#intervalId = null;
		}
	};

	#acquireWakeLock = async () => {
		try {
			if ('wakeLock' in navigator) {
				this.#wakeLock = await navigator.wakeLock.request('screen');
			}
		} catch {
		}
	};

	#releaseWakeLock = () => {
		this.#wakeLock?.release().catch(() => {});
		this.#wakeLock = null;
	};

	#playAlarm = () => {
		try {
			const Ctx =
				window.AudioContext ??
				(window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
			this.#audioCtx = this.#audioCtx ?? new Ctx();
			this.#audioCtx.resume?.();
			this.#alarmBeeps = 0;
			const beep = () => {
				const ctx = this.#audioCtx;
				if (!ctx) return;
				const osc = ctx.createOscillator();
				const gain = ctx.createGain();
				osc.frequency.value = 880;
				osc.connect(gain);
				gain.connect(ctx.destination);
				gain.gain.setValueAtTime(0.001, ctx.currentTime);
				gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.02);
				gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
				osc.start();
				osc.stop(ctx.currentTime + 0.45);
				this.#alarmBeeps += 1;
				if (this.#alarmBeeps >= 12) this.#stopAlarm();
			};
			beep();
			this.#alarmId = setInterval(beep, 800);
		} catch {
		}
	};

	#stopAlarm = () => {
		if (this.#alarmId) {
			clearInterval(this.#alarmId);
			this.#alarmId = null;
		}
	};
}

export const timer = new TimerController();
