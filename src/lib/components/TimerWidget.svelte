<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { timer } from '$lib/timer.svelte';
	import { Button } from '$lib/components/ui/button/index.js';

	const visible = $derived(timer.active && page.url.pathname !== '/timer');
</script>

{#if visible}
	<Button
		type="button"
		class="fixed right-4 bottom-4 z-50 rounded-full px-4 py-2 font-bold tabular-nums shadow-lg {timer.finished
			? 'animate-pulse'
			: ''}"
		onclick={() => goto('/timer')}
		aria-label="Open timer"
	>
		{timer.finished ? "Time's up" : timer.display}
	</Button>
{/if}
