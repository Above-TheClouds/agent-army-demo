export interface Article {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
}

// content-agent adds entries here when it publishes a new article
export const articles: Article[] = [
  { slug: "how-to-build-an-ai-agent-workflow", title: "How to Build an AI Agent Workflow", date: "2026-06-13", excerpt: "Learn the essential steps to design and implement a powerful AI agent workflow from scratch." },
  { slug: "how-to-build-an-ai-agent-workflow", title: "How to Build an AI Agent Workflow", date: "2026-06-13", excerpt: "Learn the essential steps to design and implement a powerful AI agent workflow from scratch." },
];
