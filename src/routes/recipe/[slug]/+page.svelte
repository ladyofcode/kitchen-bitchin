<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import VoiceMic, { type RecipeVoiceApi } from '$lib/components/VoiceMic.svelte';
	import { timer } from '$lib/timer.svelte';
	import type { VoiceCommand } from '$lib/voice/commands';
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';

	let { data }: { data: PageData } = $props();
	const recipe = $derived(data.recipe);

	let voice = $state<RecipeVoiceApi | undefined>();
	let recipeBodyEl = $state<HTMLElement | undefined>();

	const voiceBtnClass =
		'transition-colors hover:border-accent hover:bg-accent hover:text-accent-foreground';

	function speakAction(fn: () => void) {
		return (event: MouseEvent) => {
			(event.currentTarget as HTMLElement).blur();
			fn();
		};
	}

	function handleVoiceCommand(command: VoiceCommand) {
		switch (command.type) {
			case 'useTimer':
				goto('/timer');
				break;
			case 'setTimer':
				timer.setSeconds(command.seconds);
				break;
			case 'startTimer':
				timer.resume();
				break;
			case 'pauseTimer':
				timer.pause();
				break;
			case 'cancelTimer':
				timer.cancel();
				break;
		}
	}

	let noteText = $state('');
	let saving = $state(false);
	let errorMsg = $state('');

	async function submitNote() {
		const text = noteText.trim();
		if (!text || saving) return;

		saving = true;
		errorMsg = '';
		try {
			const res = await fetch(`/api/recipes/${recipe.slug}/note`, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ note: text })
			});
			if (!res.ok) throw new Error(`Save failed (${res.status})`);
			noteText = '';
			await invalidateAll();
		} catch (err) {
			errorMsg = err instanceof Error ? err.message : 'Failed to save note';
		} finally {
			saving = false;
		}
	}

	function saveNote(event: SubmitEvent) {
		event.preventDefault();
		submitNote();
	}

	function handleNoteStart() {
		noteText = '';
		errorMsg = '';
	}

	function handleNoteAppend(text: string) {
		noteText = noteText ? `${noteText} ${text}` : text;
	}

	function readStepFromEvent(event: Event) {
		const item = event.currentTarget as HTMLElement;
		const step = Number(item.dataset.step);
		if (step > 0) voice?.readStep(step);
	}

	function handleStepKeydown(event: KeyboardEvent) {
		if (event.key !== 'Enter') return;
		event.preventDefault();
		readStepFromEvent(event);
	}

	function enhanceStepItems() {
		if (!recipeBodyEl || !voice?.ttsSupported) return;

		for (const heading of recipeBodyEl.querySelectorAll('h2')) {
			if (!/^steps$/i.test(heading.textContent?.trim() ?? '')) continue;

			const list = heading.nextElementSibling;
			if (list?.tagName !== 'OL') continue;

			list.querySelectorAll<HTMLElement>(':scope > li').forEach((item, index) => {
				item.classList.add('step-item');
				item.dataset.step = String(index + 1);
				item.setAttribute('role', 'button');
				item.tabIndex = 0;
				item.setAttribute('aria-label', `Read step ${index + 1}`);
				item.addEventListener('click', readStepFromEvent);
				item.addEventListener('keydown', handleStepKeydown);
			});
		}
	}

	$effect(() => {
		recipe.bodyHtml;
		voice?.ttsSupported;
		queueMicrotask(enhanceStepItems);
	});
</script>

<VoiceMic
	bind:voice
	ingredients={recipe.ingredients}
	steps={recipe.steps}
	oncommand={handleVoiceCommand}
	onnotestart={handleNoteStart}
	onnoteappend={handleNoteAppend}
	onnotesave={submitNote}
/>

<div>
	<Button href="/" variant="ghost" size="sm" class="mb-2 -ml-2">← All recipes</Button>

	<h1 class="page-title">{recipe.title}</h1>

	<div class="mb-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
		{#if recipe.servings}<span>Serves {recipe.servings}</span>{/if}
		{#each recipe.tags as tag (tag)}<Badge variant="outline">{tag}</Badge>{/each}
	</div>

	{#if voice?.lastHeard}
		<p class="mb-4 text-sm italic text-muted-foreground">heard: "{voice.lastHeard}"</p>
	{/if}
</div>

{#if recipe.ingredients.length > 0}
	<section class="space-y-3">
		<h2 class="section-title">Ingredients</h2>
		{#if voice?.ttsSupported}
			<div class="mb-3 flex flex-wrap gap-2">
				<Button type="button" variant="outline" size="sm" class={voiceBtnClass} onclick={speakAction(voice.readNames)}
					>Read list</Button
				>
				<Button
					type="button"
					variant="outline"
					size="sm"
					class={voiceBtnClass}
					onclick={speakAction(voice.readMeasurements)}>Measurements</Button
				>
				<Button type="button" variant="outline" size="sm" class={voiceBtnClass} onclick={speakAction(voice.nextStep)}
					>Next step</Button
				>
				<Button type="button" variant="outline" size="sm" class={voiceBtnClass} onclick={speakAction(voice.repeat)}
					>Repeat</Button
				>
				<Button type="button" variant="destructive" size="sm" onclick={speakAction(voice.stopSpeaking)}>Stop</Button>
			</div>
		{:else if voice}
			<p class="mb-3 text-sm text-muted-foreground">
				Speech output is not available in this browser.
			</p>
		{/if}
		<ul class="grid list-none gap-1 p-0">
			{#each recipe.ingredients as ing (ing.item)}
				<li class="flex gap-3">
					<span class="min-w-18 shrink-0 text-right text-muted-foreground whitespace-nowrap"
						>{ing.amount}</span
					>
					<span>{ing.item}</span>
				</li>
			{/each}
		</ul>
	</section>
{/if}

<Separator class="my-6" />

<section class="recipe-body" bind:this={recipeBodyEl}>
	{@html recipe.bodyHtml}
</section>

<Separator class="my-6" />

<section class="space-y-3">
	<h2 class="section-title">Add a note</h2>
	{#if voice?.micSupported}
		<p class="text-sm text-muted-foreground">
			{#if voice.dictating}
				<span class="font-medium text-accent">● Listening… say "save note" when done.</span>
			{:else}
				Tip: say "add note" to dictate, then "save note".
			{/if}
		</p>
	{/if}
	<form class="flex flex-col gap-3" onsubmit={saveNote}>
		<Textarea
			bind:value={noteText}
			rows={3}
			placeholder="e.g. Used half the lemon next time, was plenty"
		/>
		{#if errorMsg}
			<Alert.Root variant="destructive">
				<Alert.Description>{errorMsg}</Alert.Description>
			</Alert.Root>
		{/if}
		<Button type="submit" disabled={saving || !noteText.trim()}>
			{saving ? 'Saving...' : 'Save note'}
		</Button>
	</form>
</section>

<style>
	:global(.recipe-body h2) {
		font-size: 1.125rem;
		font-weight: 600;
		margin-top: 1.5rem;
		margin-bottom: 0.75rem;
	}

	:global(.recipe-body h2:first-child) {
		margin-top: 0;
	}

	:global(.recipe-body h3) {
		font-size: 1rem;
		font-weight: 600;
		margin-top: 1.25rem;
		margin-bottom: 0.5rem;
	}

	:global(.recipe-body p) {
		margin: 0.75rem 0;
	}

	:global(.recipe-body ol) {
		list-style-type: decimal;
		margin: 0.75rem 0;
		padding-left: 1.75rem;
	}

	:global(.recipe-body ul) {
		list-style-type: disc;
		margin: 0.75rem 0;
		padding-left: 1.75rem;
	}

	:global(.recipe-body li) {
		margin: 0.35rem 0;
		padding-left: 0.25rem;
	}

	:global(.recipe-body li::marker) {
		color: var(--muted-foreground);
		font-weight: 600;
	}

	:global(.recipe-body ol ol) {
		list-style-type: lower-alpha;
	}

	:global(.recipe-body ul ul) {
		list-style-type: circle;
	}

	:global(.recipe-body li.step-item) {
		margin-left: -0.5rem;
		padding: 0.5rem 0.5rem 0.5rem 0.25rem;
		border-radius: var(--radius-md);
		cursor: pointer;
		transition:
			background-color 0.15s ease,
			color 0.15s ease;
	}

	:global(.recipe-body li.step-item:hover),
	:global(.recipe-body li.step-item:focus-visible) {
		background: color-mix(in oklch, var(--accent) 18%, transparent);
		color: var(--foreground);
		outline: none;
	}

	:global(.recipe-body li.step-item:hover::marker),
	:global(.recipe-body li.step-item:focus-visible::marker) {
		color: var(--accent);
	}
</style>
