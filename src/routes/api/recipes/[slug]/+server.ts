import { error, json } from '@sveltejs/kit';
import { getRecipe } from '$lib/server/recipes';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const recipe = await getRecipe(params.slug);
	if (!recipe) error(404, 'Recipe not found');
	return json(recipe);
};
