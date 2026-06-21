<script lang="ts">
	import { timer } from '$lib/timer.svelte';
	import VoiceMic from '$lib/components/VoiceMic.svelte';
	import type { VoiceCommand } from '$lib/voice/commands';
	import { Button } from '$lib/components/ui/button/index.js';

	let digitBuffer = $state('');

	const entry = $derived(formatEntry(digitBuffer));

	const mainDisplay = $derived(
		timer.finished ? "Time's up!" : timer.active ? timer.display : entry.display
	);

	const canStart = $derived(!timer.active && entry.seconds > 0);

	function formatEntry(buf: string): { display: string; seconds: number } {
		const padded = buf.padStart(4, '0').slice(-4);
		const mm = Math.min(59, parseInt(padded.slice(0, 2), 10));
		const ss = Math.min(59, parseInt(padded.slice(2, 4), 10));
		return {
			display: `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`,
			seconds: mm * 60 + ss
		};
	}

	function pressDigit(digit: number) {
		digitBuffer = (digitBuffer + String(digit)).slice(-4);
	}

	function clearEntry() {
		digitBuffer = '';
	}

	function startFromKeypad() {
		if (entry.seconds > 0) {
			timer.setSeconds(entry.seconds);
			digitBuffer = '';
		}
	}

	function handleVoiceCommand(command: VoiceCommand) {
		switch (command.type) {
			case 'setTimer':
				timer.setSeconds(command.seconds);
				digitBuffer = '';
				break;
			case 'startTimer':
				timer.resume();
				break;
			case 'pauseTimer':
				timer.pause();
				break;
			case 'cancelTimer':
				timer.cancel();
				digitBuffer = '';
				break;
		}
	}

	const keypad = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
</script>

<VoiceMic ingredients={[]} steps={[]} oncommand={handleVoiceCommand} />

<h1 class="page-title">Timer</h1>

<div class="flex flex-col items-center gap-8">
	<div
		class="text-[clamp(4rem,18vw,7rem)] font-bold leading-none tabular-nums tracking-tight {timer.finished
			? 'animate-pulse text-primary'
			: ''}"
	>
		{mainDisplay}
	</div>

	{#if !timer.active}
		<div class="grid w-full max-w-xs grid-cols-3 gap-2">
			{#each keypad as digit (digit)}
				<Button
					type="button"
					variant="outline"
					class="h-16 text-2xl font-semibold transition-colors hover:border-accent hover:bg-accent hover:text-accent-foreground"
					onclick={() => pressDigit(digit)}
				>
					{digit}
				</Button>
			{/each}
			<Button
				type="button"
				variant="outline"
				class="h-16 text-lg font-semibold transition-colors hover:border-accent hover:bg-accent hover:text-accent-foreground"
				onclick={clearEntry}
			>
				Clear
			</Button>
			<Button
				type="button"
				variant="outline"
				class="h-16 text-2xl font-semibold transition-colors hover:border-accent hover:bg-accent hover:text-accent-foreground"
				onclick={() => pressDigit(0)}
			>
				0
			</Button>
			<Button type="button" class="h-16 text-lg font-semibold" disabled={!canStart} onclick={startFromKeypad}>
				Start
			</Button>
		</div>
		<p class="max-w-xs text-center text-sm text-muted-foreground">
			Tap digits to set minutes and seconds, then Start. Or say “set timer ten minutes” here or on a
			recipe page.
		</p>
	{:else}
		<div class="flex flex-wrap justify-center gap-3">
			{#if timer.finished}
				<Button type="button" onclick={timer.cancel}>Stop alarm</Button>
			{:else if timer.running}
				<Button type="button" variant="outline" onclick={timer.pause}>Pause</Button>
				<Button type="button" variant="outline" onclick={timer.cancel}>Cancel</Button>
			{:else}
				<Button type="button" onclick={timer.resume}>Resume</Button>
				<Button type="button" variant="outline" onclick={timer.cancel}>Cancel</Button>
			{/if}
		</div>
	{/if}
</div>
