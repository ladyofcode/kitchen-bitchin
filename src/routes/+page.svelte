<script lang="ts">
	import type { PageData } from './$types';
	import { Badge } from '$lib/components/ui/badge/index.js';

	let { data }: { data: PageData } = $props();
</script>

<h1 class="page-title">Recipes</h1>

{#if data.recipes.length === 0}
	<p class="text-muted-foreground">
		No recipes yet. Add some on the <a href="/upload" class="text-primary underline-offset-4 hover:underline">Upload</a> page or drop <code class="rounded-md bg-muted px-1.5 py-0.5 text-sm">.md</code> files into
		the recipes folder.
	</p>
{:else}
	<ul class="grid list-none gap-0 divide-y divide-border p-0">
		{#each data.recipes as recipe (recipe.slug)}
			<li>
				<a
					href="/recipe/{recipe.slug}"
					class="block py-4 text-foreground no-underline transition-colors hover:text-primary"
				>
					<span class="block text-lg font-semibold">{recipe.title}</span>
					<span class="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
						{#if recipe.servings}<span>Serves {recipe.servings}</span>{/if}
						{#each recipe.tags as tag (tag)}<Badge variant="outline">{tag}</Badge>{/each}
					</span>
				</a>
			</li>
		{/each}
	</ul>
{/if}
