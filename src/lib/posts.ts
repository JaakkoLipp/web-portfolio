import { getCollection } from "astro:content";
import readingTime from "reading-time";

export type Post = {
  slug: string;
  title: string;
  date: string; // ISO
  tag?: string;
  icon?: string;
  excerpt?: string;
  minutes: number;
};

export async function getAllPosts(): Promise<Post[]> {
  const entries = await getCollection("posts");

  const posts: Post[] = entries.map((e) => {
    const d = e.data.date;
    const iso = typeof d === "string" ? d : d.toISOString();

    const stats = readingTime(e.body ?? "");
    const minutes = Math.max(1, Math.round(stats.minutes));

    return {
      slug: e.id,
      title: e.data.title,
      date: iso,
      tag: e.data.tag,
      icon: e.data.icon,
      excerpt: e.data.excerpt,
      minutes,
    };
  });

  posts.sort((a, b) => +new Date(b.date) - +new Date(a.date));
  return posts;
}

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}
