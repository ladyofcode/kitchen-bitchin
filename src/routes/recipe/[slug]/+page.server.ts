import { error } from '@sveltejs/kit';
import { getRecipe } from '$lib/server/recipes';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const recipe = await getRecipe(params.slug);
	if (!recipe) error(404, 'Recipe not found');
	return { recipe };
};
