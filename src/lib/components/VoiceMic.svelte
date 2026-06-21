<script module lang="ts">
	export type { RecipeVoiceApi } from '$lib/components/IngredientReader.svelte';
</script>

<script lang="ts">
	import IngredientReader, { type RecipeVoiceApi } from '$lib/components/IngredientReader.svelte';
	import MicToggle from '$lib/components/MicToggle.svelte';
	import type { Ingredient } from '$lib/types';
	import type { VoiceCommand } from '$lib/voice/commands';

	let {
		ingredients = [],
		steps = [],
		oncommand,
		onnotestart,
		onnoteappend,
		onnotesave,
		onnotecancel,
		voice = $bindable(undefined as RecipeVoiceApi | undefined)
	}: {
		ingredients?: Ingredient[];
		steps?: string[];
		oncommand?: (command: VoiceCommand) => void;
		onnotestart?: () => void;
		onnoteappend?: (text: string) => void;
		onnotesave?: () => void;
		onnotecancel?: () => void;
		voice?: RecipeVoiceApi | undefined;
	} = $props();
</script>

<IngredientReader
	bind:voice
	{ingredients}
	{steps}
	{oncommand}
	{onnotestart}
	{onnoteappend}
	{onnotesave}
	{onnotecancel}
/>

{#if voice?.micSupported}
	<MicToggle
		class="fixed top-19 right-[calc((100vw-min(100vw,48rem))/2+1rem)] z-40"
		state={voice.micState}
		listening={voice.isListening}
		onclick={voice.toggleListening}
	/>
{/if}
