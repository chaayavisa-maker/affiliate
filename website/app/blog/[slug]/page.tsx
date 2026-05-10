import { getAllPosts, getPostBySlug } from '@/lib/posts';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { Table, Thead, Th, Td, Tr } from '@/components/mdx/Table';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import type { Metadata } from 'next';

interface Props {
  params: { slug: string };
}

export async function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = getPostBySlug(params.slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
      images: [{ url: post.ogImage, width: 1200, height: 630 }],
    },
  };
}

export default function PostPage({ params }: Props) {
  const post = getPostBySlug(params.slug);
  if (!post) notFound();

  const allPosts = getAllPosts();
  const related = allPosts
    .filter((p) => p.slug !== post.slug && p.category === post.category)
    .slice(0, 3);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="grid lg:grid-cols-[1fr_320px] gap-12">
        {/* Main Content */}
        <article>
          {/* Breadcrumb */}
          <nav className="text-sm text-gray-400 mb-6">
            <a href="/" className="hover:text-gray-600">Home</a>
            <span className="mx-2">/</span>
            <a href="/blog" className="hover:text-gray-600">Reviews</a>
            <span className="mx-2">/</span>
            <span className="text-gray-600 capitalize">{post.category}</span>
          </nav>

          {/* Header */}
          <header className="mb-8">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="bg-sky-100 text-sky-700 text-sm font-semibold px-3 py-1 rounded-full capitalize">
                {post.category}
              </span>
              {post.tags.map((tag) => (
                <span key={tag} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">{tag}</span>
              ))}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-4">
              {post.title}
            </h1>
            <p className="text-lg text-gray-500 mb-4">{post.description}</p>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span>Updated {format(new Date(post.date), 'MMMM d, yyyy')}</span>
              <span>·</span>
              <span>{post.readingTime}</span>
            </div>
          </header>

          {/* AdSense in-article */}
          <div className="bg-gray-50 rounded-xl h-20 flex items-center justify-center text-gray-400 text-xs mb-8">
            {/* <ins className="adsbygoogle" data-ad-client="ca-pub-YOUR_ID" data-ad-slot="IN_ARTICLE_SLOT" /> */}
            Advertisement
          </div>

          {/* Article body */}
          <div className="prose max-w-none">
            <MDXRemote
  source={post.content}
  components={{
    table: Table,
    thead: Thead,
    th: Th,
    td: Td,
    tr: Tr,
  }}
/>
          </div>

          {/* Tags */}
          <div className="mt-10 pt-6 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-600 mb-3">Tags:</p>
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span key={tag} className="bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded-full">{tag}</span>
              ))}
            </div>
          </div>
        </article>

        {/* Sidebar */}
        <aside className="space-y-6">
          {/* Sticky wrapper */}
          <div className="sticky top-24 space-y-6">
            {/* Top Pick CTA */}
            <div className="bg-gradient-to-br from-sky-50 to-indigo-50 border border-sky-200 rounded-2xl p-5">
              <p className="text-xs font-bold text-sky-600 uppercase tracking-wide mb-2">🏆 Our Top Pick</p>
              <p className="font-bold text-gray-900 mb-1">Jasper AI</p>
              <p className="text-sm text-gray-600 mb-4">Best overall AI writing tool for teams and agencies.</p>
              <a href="https://www.jasper.ai?fpr=YOUR_ID" rel="nofollow sponsored" target="_blank"
                className="block w-full bg-sky-600 hover:bg-sky-700 text-white text-center py-3 px-4 rounded-xl font-semibold text-sm transition-colors">
                Try Jasper Free →
              </a>
              <p className="text-xs text-gray-400 text-center mt-2">14-day free trial, no credit card</p>
            </div>

            {/* AdSense Sidebar */}
            <div className="bg-gray-50 rounded-xl h-64 flex items-center justify-center text-gray-400 text-xs">
              {/* <ins className="adsbygoogle" data-ad-client="ca-pub-YOUR_ID" data-ad-slot="SIDEBAR_SLOT" /> */}
              Advertisement
            </div>

            {/* Related posts */}
            {related.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <p className="font-semibold text-gray-900 mb-4">Related Reviews</p>
                <div className="space-y-3">
                  {related.map((rel) => (
                    <a key={rel.slug} href={`/blog/${rel.slug}`}
                      className="block text-sm text-gray-700 hover:text-sky-600 font-medium transition-colors line-clamp-2 leading-snug">
                      {rel.title}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Newsletter */}
            <div className="bg-sky-900 text-white rounded-2xl p-5">
              <p className="font-bold mb-2">📧 Weekly AI Tool Picks</p>
              <p className="text-sky-200 text-sm mb-4">Join 5,000+ readers getting the best tools every week.</p>
              <input type="email" placeholder="your@email.com"
                className="w-full px-3 py-2 rounded-lg text-gray-900 text-sm mb-2 focus:outline-none" />
              <button className="w-full bg-sky-500 hover:bg-sky-400 text-white py-2 px-4 rounded-lg text-sm font-semibold transition-colors">
                Subscribe Free
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
