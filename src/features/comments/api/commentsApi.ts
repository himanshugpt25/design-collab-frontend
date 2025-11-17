import type { Comment } from '../../../entities/comment/model/types';
import { baseApi } from '../../../shared/api/baseApi';

export const commentsApi = baseApi.injectEndpoints({
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

