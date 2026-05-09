import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import readingTime from 'reading-time';

const POSTS_DIR = path.join(process.cwd(), 'content', 'posts');

export interface PostMeta {
  slug: string;
  title: string;
  date: string;
  description: string;
  category: string;
  tags: string[];
  ogImage: string;
  readingTime: string;
}

export interface Post extends PostMeta {
  content: string;
}

export function getAllPosts(): PostMeta[] {
  if (!fs.existsSync(POSTS_DIR)) return [];

  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.mdx'));

  const posts = files.map((file) => {
    const raw = fs.readFileSync(path.join(POSTS_DIR, file), 'utf-8');
    const { data, content } = matter(raw);
    const rt = readingTime(content);
    return {
      slug: data.slug || file.replace('.mdx', ''),
      title: data.title || 'Untitled',
      date: data.date || new Date().toISOString().slice(0, 10),
      description: data.description || '',
      category: data.category || 'general',
      tags: data.tags || [],
      ogImage: data.ogImage || '/og/default.png',
      readingTime: rt.text,
    } as PostMeta;
  });

  return posts.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPostBySlug(slug: string): Post | null {
  const filePath = path.join(POSTS_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);
  const rt = readingTime(content);

  return {
    slug: data.slug || slug,
    title: data.title || 'Untitled',
    date: data.date || new Date().toISOString().slice(0, 10),
    description: data.description || '',
    category: data.category || 'general',
    tags: data.tags || [],
    ogImage: data.ogImage || '/og/default.png',
    readingTime: rt.text,
    content,
  };
}

export function getPostsByCategory(category: string): PostMeta[] {
  return getAllPosts().filter((p) => p.category === category);
}

export function getAllCategories(): string[] {
  const posts = getAllPosts();
  return [...new Set(posts.map((p) => p.category))];
}
