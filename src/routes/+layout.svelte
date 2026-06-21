<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import AuthGate from '$lib/components/AuthGate.svelte';
	import TimerWidget from '$lib/components/TimerWidget.svelte';
	import { Button } from '$lib/components/ui/button/index.js';

	let { children } = $props();

	const nav = [
		{ href: '/', label: 'Recipes' },
		{ href: '/timer', label: 'Timer' },
		{ href: '/upload', label: 'Upload' },
		{ href: '/settings', label: 'Settings' }
	];
</script>

<AuthGate />

<div class="flex min-h-dvh flex-col">
	<header
		class="sticky top-0 z-10 flex items-center justify-between gap-4 border-b bg-card px-4 py-3 shadow-sm"
	>
		<a href="/" class="text-xl font-bold text-foreground no-underline">Kitchen</a>
		<nav class="flex gap-1">
			{#each nav as item (item.href)}
				<Button
					href={item.href}
					variant={page.url.pathname === item.href ? 'default' : 'ghost'}
					size="sm"
				>
					{item.label}
				</Button>
			{/each}
		</nav>
	</header>

	<main class="mx-auto w-full max-w-3xl flex-1 px-4 pt-6 pb-4">
		{@render children()}
	</main>

	<TimerWidget />
</div>
