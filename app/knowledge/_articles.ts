export interface Article {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
}

// content-agent adds entries here when it publishes a new article
export const articles: Article[] = [];
