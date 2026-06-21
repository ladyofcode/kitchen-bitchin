import { error, json } from '@sveltejs/kit';
import { saveRecipeFile } from '$lib/server/recipes';
import { sendTelegram } from '$lib/server/notify';
import type { RequestHandler } from './$types';

const MAX_BYTES = 1_000_000;

export const POST: RequestHandler = async ({ request }) => {
	const form = await request.formData();
	const files = form.getAll('files').filter((f): f is File => f instanceof File);

	if (files.length === 0) error(400, 'No files provided');

	const saved: string[] = [];
	for (const file of files) {
		if (!file.name.toLowerCase().endsWith('.md')) {
			error(415, `Only .md files are allowed: ${file.name}`);
		}
		if (file.size > MAX_BYTES) {
			error(413, `File is too large: ${file.name}`);
		}
		const content = await file.text();
		saved.push(await saveRecipeFile(file.name, content));
	}

	await sendTelegram(`Uploaded ${saved.length} recipe file(s): ${saved.join(', ')}`);
	return json({ saved });
};
