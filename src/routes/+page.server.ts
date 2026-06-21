import { listRecipes } from '$lib/server/recipes';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return { recipes: await listRecipes() };
};
