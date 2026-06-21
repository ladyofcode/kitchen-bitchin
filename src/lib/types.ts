export interface Ingredient {
	item: string;
	amount: string;
}

export interface RecipeSummary {
	slug: string;
	title: string;
	tags: string[];
	servings?: number;
}

export interface Recipe extends RecipeSummary {
	ingredients: Ingredient[];
	steps: string[];
	bodyMarkdown: string;
	bodyHtml: string;
}
