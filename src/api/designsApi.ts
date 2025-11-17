import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import type { Design } from '../types/design';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

export const designsApi = createApi({
  reducerPath: 'designsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    credentials: 'include',
  }),
  tagTypes: ['Design', 'DesignList'],
  endpoints: (builder) => ({
    getDesigns: builder.query<Design[], void>({
      query: () => '/designs',
      providesTags: (result) =>
        result
          ? [
              { type: 'DesignList', id: 'LIST' },
              ...result.map((design) => ({ type: 'Design' as const, id: design._id })),
            ]
          : [{ type: 'DesignList', id: 'LIST' }],
    }),
    getDesign: builder.query<Design, string>({
      query: (designId) => `/designs/${designId}`,
      providesTags: (_result, _error, designId) => [{ type: 'Design', id: designId }],
    }),
    updateDesign: builder.mutation<Design, Partial<Design> & Pick<Design, '_id'>>({
      query: ({ _id, ...body }) => ({
        url: `/designs/${_id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _error, { _id }) => [
        { type: 'Design', id: _id },
        { type: 'DesignList', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetDesignsQuery,
  useGetDesignQuery,
  useLazyGetDesignQuery,
  useUpdateDesignMutation,
} = designsApi;

