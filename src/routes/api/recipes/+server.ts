import { json } from '@sveltejs/kit';
import { listRecipes } from '$lib/server/recipes';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	return json(await listRecipes());
};
