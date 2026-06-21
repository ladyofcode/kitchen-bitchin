<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';

	let fileInput: HTMLInputElement;
	let files = $state<FileList | null>(null);
	let uploading = $state(false);
	let message = $state('');
	let errorMsg = $state('');

	const hasFiles = $derived(!!files && files.length > 0);

	async function upload(event: SubmitEvent) {
		event.preventDefault();
		if (!files || files.length === 0 || uploading) return;

		uploading = true;
		message = '';
		errorMsg = '';
		const form = new FormData();
		for (const file of Array.from(files)) form.append('files', file);

		try {
			const res = await fetch('/api/recipes/upload', { method: 'POST', body: form });
			if (!res.ok) {
				const body = await res.json().catch(() => null);
				throw new Error(body?.message ?? `Upload failed (${res.status})`);
			}
			const data: { saved: string[] } = await res.json();
			message = `Saved ${data.saved.length} file(s): ${data.saved.join(', ')}`;
			files = null;
			fileInput.value = '';
		} catch (err) {
			errorMsg = err instanceof Error ? err.message : 'Upload failed';
		} finally {
			uploading = false;
		}
	}
</script>

<h1 class="page-title">Upload recipes</h1>
<p class="text-muted-foreground">
	Add Markdown (<code class="rounded-md bg-muted px-1.5 py-0.5 text-sm">.md</code>) files from your Obsidian vault.
</p>

<form class="mt-4 flex flex-col items-start gap-3" onsubmit={upload}>
	<Input
		bind:ref={fileInput}
		type="file"
		accept=".md,text/markdown"
		multiple
		onchange={(e) => (files = e.currentTarget.files)}
	/>
	<Button type="submit" disabled={!hasFiles || uploading}>
		{uploading ? 'Uploading...' : 'Upload'}
	</Button>
</form>

{#if message}
	<Alert.Root class="mt-4">
		<Alert.Description>
			{message} — <a href="/" class="text-primary underline-offset-4 hover:underline">view recipes</a>
		</Alert.Description>
	</Alert.Root>
{/if}
{#if errorMsg}
	<Alert.Root variant="destructive" class="mt-4">
		<Alert.Description>{errorMsg}</Alert.Description>
	</Alert.Root>
{/if}
