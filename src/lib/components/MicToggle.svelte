<script lang="ts">
	import type { RecognizerState } from '$lib/voice/stt';
	import { cn } from '$lib/utils.js';

	let {
		state,
		listening = false,
		class: className,
		onclick
	}: {
		state: RecognizerState;
		listening?: boolean;
		class?: string;
		onclick: () => void;
	} = $props();

	const pulsing = $derived(state === 'listening');

	const label = $derived(
		state === 'loading'
			? 'Loading voice model'
			: state === 'listening'
				? 'Listening — tap to stop'
				: state === 'error'
					? 'Voice unavailable — tap to retry'
					: 'Enable voice'
	);
</script>

<button
	type="button"
	class={cn(
		'flex size-24 items-center justify-center rounded-full border-[3px] transition-all outline-none select-none',
		listening
			? 'border-primary bg-primary text-primary-foreground shadow-inner'
			: 'border-border bg-background text-muted-foreground shadow-md hover:border-primary/40 hover:text-foreground',
		pulsing && 'mic-active',
		state === 'loading' && 'opacity-70',
		state === 'error' && !listening && 'border-destructive/50 text-destructive',
		className
	)}
	{onclick}
	aria-label={label}
	title={label}
>
	<svg
		class="h-16 w-auto"
		viewBox="0 0 83.44 122.88"
		fill="currentColor"
		aria-hidden="true"
	>
		<path
			d="M45.04,95.45v24.11c0,1.83-1.49,3.32-3.32,3.32c-1.83,0-3.32-1.49-3.32-3.32V95.45c-10.16-0.81-19.32-5.3-26.14-12.12 C4.69,75.77,0,65.34,0,53.87c0-1.83,1.49-3.32,3.32-3.32s3.32,1.49,3.32,3.32c0,9.64,3.95,18.41,10.31,24.77 c6.36,6.36,15.13,10.31,24.77,10.31h0c9.64,0,18.41-3.95,24.77-10.31c6.36-6.36,10.31-15.13,10.31-24.77 c0-1.83,1.49-3.32,3.32-3.32s3.32,1.49,3.32,3.32c0,11.48-4.69,21.91-12.25,29.47C64.36,90.16,55.2,94.64,45.04,95.45L45.04,95.45z M41.94,0c6.38,0,12.18,2.61,16.38,6.81c4.2,4.2,6.81,10,6.81,16.38v30c0,6.38-2.61,12.18-6.81,16.38c-4.2,4.2-10,6.81-16.38,6.81 s-12.18-2.61-16.38-6.81c-4.2-4.2-6.81-10-6.81-16.38v-30c0-6.38,2.61-12.18,6.81-16.38C29.76,2.61,35.56,0,41.94,0L41.94,0z M53.62,11.51c-3-3-7.14-4.86-11.68-4.86c-4.55,0-8.68,1.86-11.68,4.86c-3,3-4.86,7.14-4.86,11.68v30c0,4.55,1.86,8.68,4.86,11.68 c3,3,7.14,4.86,11.68,4.86c4.55,0,8.68-1.86,11.68-4.86c3-3,4.86-7.14,4.86-11.68v-30C58.49,18.64,56.62,14.51,53.62,11.51 L53.62,11.51z"
		/>
	</svg>
</button>

<style>
	.mic-active {
		animation: mic-glow 2s ease-in-out infinite;
	}

	@keyframes mic-glow {
		0%,
		100% {
			box-shadow:
				inset 0 2px 4px oklch(0 0 0 / 0.15),
				0 0 0 0 color-mix(in oklch, var(--primary) 45%, transparent);
		}
		50% {
			box-shadow:
				inset 0 3px 6px oklch(0 0 0 / 0.15),
				0 0 0 14px color-mix(in oklch, var(--primary) 0%, transparent);
		}
	}
</style>
