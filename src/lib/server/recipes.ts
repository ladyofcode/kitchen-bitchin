import { promises as fs } from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { marked } from 'marked';
import { env } from '$env/dynamic/private';
import type { Ingredient, Recipe, RecipeSummary } from '$lib/types';

export const RECIPES_DIR = path.resolve(env.RECIPES_DIR ?? 'recipes');

export function recipeFilePath(slug: string): string {
	const safe = path.basename(slug).replace(/\.md$/i, '');
	return path.join(RECIPES_DIR, `${safe}.md`);
}

function slugFromFilename(filename: string): string {
	return filename.replace(/\.md$/i, '');
}

function titleFromSlug(slug: string): string {
	return slug
		.replace(/[-_]+/g, ' ')
		.replace(/\s+/g, ' ')
		.trim()
		.replace(/\b\w/g, (c) => c.toUpperCase());
}

function normalizeTags(raw: unknown): string[] {
	if (Array.isArray(raw)) return raw.map((t) => String(t));
	if (typeof raw === 'string') {
		return raw
			.split(',')
			.map((t) => t.trim())
			.filter(Boolean);
	}
	return [];
}

function normalizeIngredients(raw: unknown): Ingredient[] {
	if (!Array.isArray(raw)) return [];
	return raw.map((entry): Ingredient => {
		if (entry && typeof entry === 'object') {
			const obj = entry as Record<string, unknown>;
			return {
				item: String(obj.item ?? obj.name ?? '').trim(),
				amount: obj.amount === undefined || obj.amount === null ? '' : String(obj.amount).trim()
			};
		}
		return { item: String(entry).trim(), amount: '' };
	});
}

const orderedItem = /^\s*\d+[.)]\s+(.+)$/;

function parseSteps(markdown: string): string[] {
	const lines = markdown.split(/\r?\n/);
	const stepsSection: string[] = [];
	const allOrdered: string[] = [];
	let inSteps = false;

	for (const line of lines) {
		const heading = line.match(/^#{1,6}\s+(.*)$/);
		if (heading) {
			inSteps = /^steps\b/i.test(heading[1].trim());
			continue;
		}
		const item = line.match(orderedItem);
		if (item) {
			allOrdered.push(item[1].trim());
			if (inSteps) stepsSection.push(item[1].trim());
		}
	}

	return stepsSection.length > 0 ? stepsSection : allOrdered;
}

function parseSummary(slug: string, data: Record<string, unknown>): RecipeSummary {
	const servingsRaw = data.servings;
	const servings =
		typeof servingsRaw === 'number'
			? servingsRaw
			: typeof servingsRaw === 'string' && servingsRaw.trim() !== ''
				? Number(servingsRaw)
				: undefined;

	return {
		slug,
		title: typeof data.title === 'string' && data.title.trim() ? data.title.trim() : titleFromSlug(slug),
		tags: normalizeTags(data.tags),
		servings: Number.isFinite(servings) ? (servings as number) : undefined
	};
}

export async function listRecipes(): Promise<RecipeSummary[]> {
	let entries: string[];
	try {
		entries = await fs.readdir(RECIPES_DIR);
	} catch (err) {
		if ((err as NodeJS.ErrnoException).code === 'ENOENT') return [];
		throw err;
	}

	const files = entries.filter((f) => f.toLowerCase().endsWith('.md'));
	const summaries = await Promise.all(
		files.map(async (file) => {
			const raw = await fs.readFile(path.join(RECIPES_DIR, file), 'utf8');
			const { data } = matter(raw);
			return parseSummary(slugFromFilename(file), data as Record<string, unknown>);
		})
	);

	return summaries.sort((a, b) => a.title.localeCompare(b.title));
}

export async function getRecipe(slug: string): Promise<Recipe | null> {
	let raw: string;
	try {
		raw = await fs.readFile(recipeFilePath(slug), 'utf8');
	} catch (err) {
		if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
		throw err;
	}

	const { data, content } = matter(raw);
	const summary = parseSummary(path.basename(slug).replace(/\.md$/i, ''), data as Record<string, unknown>);
	const bodyMarkdown = content.trim();

	return {
		...summary,
		ingredients: normalizeIngredients((data as Record<string, unknown>).ingredients),
		steps: parseSteps(bodyMarkdown),
		bodyMarkdown,
		bodyHtml: await marked.parse(bodyMarkdown)
	};
}

const noteDateFormat = new Intl.DateTimeFormat('en-GB', {
	day: 'numeric',
	month: 'short',
	year: 'numeric'
});

function appendNoteToMarkdown(raw: string, note: string): string {
	const now = new Date();
	const line = `- ${noteDateFormat.format(now)} - ${note.trim()} <!-- ${now.toISOString()} -->`;
	const trimmed = raw.replace(/\s+$/, '');
	const hasNotes = /^##\s+notes\s*$/im.test(raw);
	return hasNotes ? `${trimmed}\n${line}\n` : `${trimmed}\n\n## Notes\n\n${line}\n`;
}

export async function appendNote(slug: string, note: string): Promise<Recipe | null> {
	const file = recipeFilePath(slug);
	let raw: string;
	try {
		raw = await fs.readFile(file, 'utf8');
	} catch (err) {
		if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
		throw err;
	}

	await fs.writeFile(file, appendNoteToMarkdown(raw, note), 'utf8');
	return getRecipe(slug);
}

export async function saveRecipeFile(originalName: string, content: string): Promise<string> {
	const base = path.basename(originalName);
	if (!/\.md$/i.test(base)) {
		throw new Error(`Only .md files are allowed: ${base}`);
	}
	const file = recipeFilePath(base);
	await fs.mkdir(RECIPES_DIR, { recursive: true });
	await fs.writeFile(file, content, 'utf8');
	return path.basename(file).replace(/\.md$/i, '');
}
