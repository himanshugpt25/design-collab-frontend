import type { Design } from '../../../entities/design/model/types';
import { baseApi } from '../../../shared/api/baseApi';

export const designsApi = baseApi.injectEndpoints({
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

