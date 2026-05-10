'use client';

export default function NewsletterForm() {
  return (
    <form className="flex gap-3 max-w-md mx-auto" onSubmit={(e) => e.preventDefault()}>
      <input
        type="email"
        placeholder="your@email.com"
        className="flex-1 px-4 py-3 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-400"
      />
      <button
        type="submit"
        className="bg-sky-500 hover:bg-sky-400 text-white px-6 py-3 rounded-xl font-semibold transition-colors whitespace-nowrap"
      >
        Subscribe
      </button>
    </form>
  );
}