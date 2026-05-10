import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import readingTime from 'reading-time';

const POSTS_DIR = path.join(process.cwd(), 'content', 'posts');

export interface PostMeta {
  slug: string;
  title: string;
  date: string;
  updatedDate: string;
  description: string;
  category: string;
  tags: string[];
  ogImage: string;
  readingTime: string;
}

export interface Post extends PostMeta {
  content: string;
  schemaJson: string | null; // extracted JSON-LD from export const schema
}

/** Strip `export const schema = { ... }` blocks from MDX and return them separately */
function extractAndStripSchema(raw: string): { content: string; schemaJson: string | null } {
  // Match: export const schema = { ... } where we track brace depth
  const exportStart = raw.indexOf('export const schema =');
  if (exportStart === -1) return { content: raw, schemaJson: null };

  const braceStart = raw.indexOf('{', exportStart);
  if (braceStart === -1) return { content: raw, schemaJson: null };

  let depth = 0;
  let end = -1;
  for (let i = braceStart; i < raw.length; i++) {
    if (raw[i] === '{') depth++;
    else if (raw[i] === '}') {
      depth--;
      if (depth === 0) { end = i + 1; break; }
    }
  }

  if (end === -1) return { content: raw, schemaJson: null };

  const schemaStr = raw.slice(braceStart, end).trim();
  // Remove the whole export statement line(s) from content
  const before = raw.slice(0, exportStart);
  const after = raw.slice(end);
  // Also consume trailing semicolons / newlines
  const afterTrimmed = after.replace(/^[;\s]*/, '');

  let schemaJson: string | null = null;
  try {
    // eslint-disable-next-line no-eval
    const obj = eval('(' + schemaStr + ')');
    schemaJson = JSON.stringify(obj);
  } catch {
    schemaJson = null;
  }

  return { content: (before + afterTrimmed).trim(), schemaJson };
}

/** Extract H2/H3 headings for table of contents */
export interface TocItem {
  level: 2 | 3;
  text: string;
  id: string;
}

export function extractToc(content: string): TocItem[] {
  const lines = content.split('\n');
  const toc: TocItem[] = [];
  for (const line of lines) {
    const h2 = line.match(/^##\s+(.+)/);
    const h3 = line.match(/^###\s+(.+)/);
    const match = h2 || h3;
    if (match) {
      const text = match[1].trim();
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-');
      toc.push({ level: h2 ? 2 : 3, text, id });
    }
  }
  return toc;
}

export function getAllPosts(): PostMeta[] {
  if (!fs.existsSync(POSTS_DIR)) return [];

  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.mdx'));

  const posts = files.map((file) => {
    const raw = fs.readFileSync(path.join(POSTS_DIR, file), 'utf-8');
    const { data, content } = matter(raw);
    const { content: cleaned } = extractAndStripSchema(content);
    const rt = readingTime(cleaned);
    return {
      slug: data.slug || file.replace('.mdx', ''),
      title: data.title || 'Untitled',
      date: data.date || new Date().toISOString().slice(0, 10),
      updatedDate: data.updatedDate || data.date || new Date().toISOString().slice(0, 10),
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
  const { data, content: rawContent } = matter(raw);
  const { content: cleaned, schemaJson } = extractAndStripSchema(rawContent);
  const rt = readingTime(cleaned);

  return {
    slug: data.slug || slug,
    title: data.title || 'Untitled',
    date: data.date || new Date().toISOString().slice(0, 10),
    updatedDate: data.updatedDate || data.date || new Date().toISOString().slice(0, 10),
    description: data.description || '',
    category: data.category || 'general',
    tags: data.tags || [],
    ogImage: data.ogImage || '/og/default.png',
    readingTime: rt.text,
    content: cleaned,
    schemaJson,
  };
}

export function getPostsByCategory(category: string): PostMeta[] {
  return getAllPosts().filter((p) => p.category === category);
}

export function getAllCategories(): string[] {
  return [...new Set(getAllPosts().map((p) => p.category))];
}
