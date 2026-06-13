export interface Article {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
}

// content-agent adds entries here when it publishes a new article
export const articles: Article[] = [
  { slug: "impact-of-creatine-on-your-health", title: "The Impact of Creatine on Your Health: What You Need to Know", date: "2026-06-13", excerpt: "Discover how creatine affects your body, from boosting athletic performance to supporting brain health and overall wellness." },
];
