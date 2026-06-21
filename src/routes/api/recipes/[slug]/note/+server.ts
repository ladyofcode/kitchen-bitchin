import { error, json } from '@sveltejs/kit';
import { appendNote } from '$lib/server/recipes';
import { sendTelegram } from '$lib/server/notify';
import type { RequestHandler } from './$types';

const MAX_NOTE_LENGTH = 2000;

export const POST: RequestHandler = async ({ params, request }) => {
	const body = await request.json().catch(() => null);
	const text = typeof body?.note === 'string' ? body.note.trim() : '';

	if (!text) error(400, 'Note text is required');
	if (text.length > MAX_NOTE_LENGTH) error(413, 'Note is too long');

	const recipe = await appendNote(params.slug, text);
	if (!recipe) error(404, 'Recipe not found');

	await sendTelegram(`Note added to "${recipe.title}":\n${text}`);
	return json(recipe);
};
