import { useGetWatchlistQuery } from '../generated/graphql';
import { useGetIntId } from './useGetIntId';

export const useGetWatchlistFromUrl = () => {
  const intId = useGetIntId();
  return useGetWatchlistQuery({
    skip: intId === -1,
    variables: {
      id: intId,
    },
  });
};
