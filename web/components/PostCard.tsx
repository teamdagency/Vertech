import Link from 'next/link';
import type { FeedPost } from '@/lib/types';

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function PostCard({ post }: { post: FeedPost }) {
  return (
    <article className="flex gap-4 border-b border-white/10 py-5 first:pt-0">
      <div className="w-24 shrink-0 pt-1 text-right font-mono text-[11px] text-muted">{formatTime(post.createdAt)}</div>
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex items-center gap-2">
          <Link href={`/profiles/${post.authorUsername}`} className="font-body text-sm font-semibold text-paper hover:text-ochre">
            {post.authorDisplayName}
          </Link>
          <span className="font-mono text-xs text-muted">@{post.authorUsername}</span>
        </div>
        <p className="whitespace-pre-wrap font-body text-[15px] leading-relaxed text-paper/90">{post.body}</p>
        <div className="mt-3 flex gap-4 font-mono text-xs text-muted">
          <span>{post.commentCount} commentaire{post.commentCount === 1 ? '' : 's'}</span>
          <span>{post.reactionCount} réaction{post.reactionCount === 1 ? '' : 's'}</span>
        </div>
      </div>
    </article>
  );
}
