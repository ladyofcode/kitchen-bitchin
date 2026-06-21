<script lang="ts">
	import { onMount } from 'svelte';
	import { dev } from '$app/environment';
	import { Button } from '$lib/components/ui/button/index.js';

	let unlocked = $state(dev);
	let checking = $state(!dev);

	async function verify(): Promise<boolean> {
		try {
			const res = await fetch('/api/auth/check', { credentials: 'include' });
			return res.ok;
		} catch {
			return false;
		}
	}

	async function begin() {
		checking = true;
		unlocked = await verify();
		checking = false;
	}

	onMount(() => {
		if (dev) return;
		void begin();
	});
</script>

{#if !unlocked}
	<div
		class="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-background px-6 text-center"
		role="dialog"
		aria-modal="true"
		aria-labelledby="auth-gate-title"
		aria-busy={checking}
	>
		<h1 id="auth-gate-title" class="page-title mb-0">Kitchen</h1>
		<p class="max-w-sm text-muted-foreground">Tap begin to sign in.</p>
		<Button size="lg" disabled={checking} onclick={begin}>
			{checking ? 'Signing in…' : 'Begin'}
		</Button>
	</div>
{/if}
