import blogData from "../data/blog_data.json";

export type BlogDataItem = {
  id: number;
  slug: string;
  title: string;
  url?: string;
  date: string;
  category: string;
  image: string;
  content: BlogContentSection[];
};

export type BlogPost = BlogDataItem & {
  excerpt: string;
  readTime: string;
  author: {
    name: string;
    role: string;
    avatar: string;
    bio: string;
  };
  tags: string[];
};

export type BlogContentSection =
  | { type: "heading"; level: 2 | 3; content: string }
  | { type: "paragraph"; content: string }
  | { type: "list"; items: string[] }
  | { type: "blockquote"; content: string };

const author = {
  name: "FBS Prints Team",
  role: "Printing, Signage & Growth Specialists",
  avatar: "/images/brand/fbs-prints-logo.webp",
  bio: "FBS Prints helps businesses grow with practical signage, printing, direct mail, web design, and SEO guidance built around real-world execution.",
};

const cleanCategory = (category: string) =>
  category
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const slugifyTag = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 2);

const extractTextFromContent = (content: BlogContentSection[]) =>
  content
    .flatMap((section) => {
      if (section.type === "paragraph" || section.type === "heading" || section.type === "blockquote") {
        return [section.content];
      }

      return section.items;
    })
    .join(" ");

const createExcerpt = (post: BlogDataItem) => {
  const firstParagraph = post.content.find((section) => section.type === "paragraph");
  const text = firstParagraph?.content ?? extractTextFromContent(post.content);
  const trimmed = text.replace(/\s+/g, " ").trim();

  if (trimmed.length <= 180) {
    return trimmed;
  }

  return `${trimmed.slice(0, 177).trimEnd()}...`;
};

const estimateReadTime = (post: BlogDataItem) => {
  const wordCount = `${post.title} ${extractTextFromContent(post.content)}`
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const minutes = Math.max(2, Math.ceil(wordCount / 180));
  return `${minutes} min read`;
};

const createTags = (post: BlogDataItem) => {
  const titleWords = slugifyTag(post.title);
  const categoryWords = slugifyTag(post.category);

  return Array.from(new Set([post.category, ...categoryWords, ...titleWords])).slice(0, 6);
};

const normalizeDate = (date: string) => {
  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "2026-01-01";
  }

  return parsed.toISOString().slice(0, 10);
};

export const blogPosts: BlogPost[] = [...(blogData as BlogDataItem[])]
  .filter((post) => post.slug && post.title && Array.isArray(post.content) && post.content.length > 0)
  .map((post) => {
    const normalizedPost: BlogDataItem = {
      ...post,
      date: normalizeDate(post.date),
      category: cleanCategory(post.category || "Blog"),
      image: post.image || "/images/brand/fbs-prints-logo.webp",
    };

    return {
      ...normalizedPost,
      excerpt: createExcerpt(normalizedPost),
      readTime: estimateReadTime(normalizedPost),
      author,
      tags: createTags(normalizedPost),
    };
  })
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

export const getBlogPost = (slug: string) => {
  const normalized = slug.replace(/24\/7/g, "24-7");
  return blogPosts.find((post) => post.slug === slug || post.slug === normalized);
};

export const getRelatedPosts = (post: BlogPost, limit = 2) =>
  blogPosts
    .filter((item) => item.id !== post.id)
    .sort((a, b) => {
      if (a.category === post.category && b.category !== post.category) return -1;
      if (a.category !== post.category && b.category === post.category) return 1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    })
    .slice(0, limit);

export const formatBlogDate = (date: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
