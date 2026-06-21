<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';

	type Theme = 'light' | 'dark' | 'system';

	const FONT_SIZES = [
		{ label: 'Small', value: 0.9 },
		{ label: 'Normal', value: 1 },
		{ label: 'Large', value: 1.2 },
		{ label: 'Extra large', value: 1.4 }
	];

	let theme = $state<Theme>('system');
	let fontScale = $state(1);

	onMount(() => {
		const stored = localStorage.getItem('theme');
		theme = stored === 'light' || stored === 'dark' ? stored : 'system';
		fontScale = parseFloat(localStorage.getItem('fontScale') ?? '1') || 1;
	});

	function applyTheme(next: Theme) {
		theme = next;
		if (next === 'system') {
			localStorage.removeItem('theme');
			document.documentElement.classList.toggle(
				'dark',
				matchMedia('(prefers-color-scheme: dark)').matches
			);
		} else {
			localStorage.setItem('theme', next);
			document.documentElement.classList.toggle('dark', next === 'dark');
		}
	}

	function applyFontScale(next: number) {
		fontScale = next;
		localStorage.setItem('fontScale', String(next));
		document.documentElement.style.setProperty('--font-scale', String(next));
	}
</script>

<h1 class="page-title">Settings</h1>

<section class="space-y-3">
	<h2 class="section-title">Theme</h2>
	<div class="flex flex-wrap gap-2">
		{#each ['light', 'dark', 'system'] as const as option (option)}
			<Button
				type="button"
				variant={theme === option ? 'default' : 'outline'}
				onclick={() => applyTheme(option)}
			>
				{option[0].toUpperCase() + option.slice(1)}
			</Button>
		{/each}
	</div>
</section>

<Separator class="my-6" />

<section class="space-y-3">
	<h2 class="section-title">Font size</h2>
	<div class="flex flex-wrap gap-2">
		{#each FONT_SIZES as size (size.value)}
			<Button
				type="button"
				variant={fontScale === size.value ? 'default' : 'outline'}
				onclick={() => applyFontScale(size.value)}
			>
				{size.label}
			</Button>
		{/each}
	</div>
	<p class="mt-4 rounded-lg border border-dashed p-4 text-muted-foreground">
		The quick brown fox jumps over the lazy dog.
	</p>
</section>
