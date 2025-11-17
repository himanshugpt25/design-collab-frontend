import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import type { Comment } from '../types/comment';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

export const commentsApi = createApi({
  reducerPath: 'commentsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    credentials: 'include',
  }),
  tagTypes: ['Comment', 'CommentList'],
  endpoints: (builder) => ({
    getComments: builder.query<Comment[], string>({
      query: (designId) => `/designs/${designId}/comments`,
      providesTags: (result, _error, designId) =>
        result
          ? [
              { type: 'CommentList', id: designId },
              ...result.map((comment) => ({ type: 'Comment' as const, id: comment._id })),
            ]
          : [{ type: 'CommentList', id: designId }],
    }),
    addComment: builder.mutation<
      Comment,
      { designId: string; body: Pick<Comment, 'text' | 'authorName' | 'mentions'> }
    >({
      query: ({ designId, body }) => ({
        url: `/designs/${designId}/comments`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, { designId }) => [
        { type: 'CommentList', id: designId },
      ],
    }),
  }),
});

export const { useGetCommentsQuery, useAddCommentMutation } = commentsApi;

