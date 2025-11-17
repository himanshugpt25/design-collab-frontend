import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';

import { useAddCommentMutation, useGetCommentsQuery } from '../api/commentsApi';
import type { Comment } from '../../../entities/comment/model/types';
import { env } from '../../../shared/config/env';

interface CommentsPanelProps {
  designId: string;
}

export const CommentsPanel = ({ designId }: CommentsPanelProps) => {
  const { data, isFetching } = useGetCommentsQuery(designId, {
    skip: !env.isApiConfigured || !designId,
  });
  const [addComment, { isLoading }] = useAddCommentMutation();
  const [message, setMessage] = useState('');

  const comments = useMemo(() => data ?? [], [data]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!message.trim()) return;

    const optimisticComment: Pick<Comment, 'text' | 'authorName' | 'mentions'> = {
      text: message,
      authorName: 'You',
      mentions: [],
    };

    setMessage('');

    if (env.isApiConfigured) {
      try {
        await addComment({ designId, body: optimisticComment }).unwrap();
      } catch {
        setMessage(optimisticComment.text);
      }
    }
  };

  return (
    <section className="flex h-full flex-col rounded-2xl border border-slate-800 bg-slate-900/70">
      <header className="border-b border-slate-800 px-4 py-3">
        <p className="text-sm font-semibold uppercase tracking-widest text-slate-400">Comments</p>
        {!env.isApiConfigured && (
          <p className="text-xs text-amber-400">
            Set <code className="font-mono">VITE_API_URL</code> to enable live data.
          </p>
        )}
      </header>
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {isFetching && (
          <p className="text-xs text-slate-500">Loading comments from the API…</p>
        )}
        {!comments.length && !isFetching && (
          <p className="text-xs text-slate-500">No comments yet. Start the conversation!</p>
        )}
        {comments.map((comment) => (
          <article
            key={comment._id}
            className="rounded-xl border border-slate-800 bg-slate-950/50 p-3 text-sm text-slate-200"
          >
            <p className="font-semibold text-slate-100">{comment.authorName}</p>
            <p className="text-slate-300">{comment.text}</p>
            <p className="text-xs text-slate-500">
              {new Date(comment.createdAt).toLocaleString()}
            </p>
          </article>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="border-t border-slate-800 p-4">
        <textarea
          className="h-20 w-full resize-none rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-sm text-slate-100 outline-none focus:border-sky-500"
          placeholder="Leave a comment or @mention a teammate"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />
        <div className="mt-2 flex justify-end">
          <button
            type="submit"
            disabled={!message.trim() || isLoading}
            className="rounded-xl bg-sky-500/90 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-sky-500/40 transition hover:bg-sky-400/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isLoading ? 'Sending…' : 'Comment'}
          </button>
        </div>
      </form>
    </section>
  );
};

