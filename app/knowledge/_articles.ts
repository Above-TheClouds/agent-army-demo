export interface Article {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
}

// content-agent adds entries here when it publishes a new article
export const articles: Article[] = [
  { slug: "ai-agent-army-rise-of-multi-agent-systems-2026", title: "AI Agent Army: The Rise of Multi-Agent Systems Reshaping the Future", date: "2026-06-15", excerpt: "Explore how coordinated AI agent armies are transforming industries through autonomous collaboration and task execution in 2026." },
];
