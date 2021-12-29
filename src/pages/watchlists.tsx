import { DeleteIcon, ViewIcon } from '@chakra-ui/icons';
import {
  Box,
  Container,
  Flex,
  IconButton,
  StackDivider,
  VStack,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import React from 'react';
import CreateWatchlist from '../components/CreateWatchlist';
import Layout from '../components/Layout';
import {
  useDeleteWatchlistMutation,
  useGetWatchlistsQuery,
} from '../generated/graphql';
import { withApollo } from '../utils/withApollo';

const Watchlists = ({}) => {
  const router = useRouter();
  const { data, loading, error } = useGetWatchlistsQuery();
  const [deleteWatchlist] = useDeleteWatchlistMutation();

  if (loading) {
    return (
      <Layout>
        <div>loading..</div>
      </Layout>
    );
  }

  if (error) {
    return <div>{error.message}</div>;
  }

  return (
    <Layout>
      <Flex flexDirection="column">
        <CreateWatchlist />
        <VStack
          divider={<StackDivider borderColor="gray.200" />}
          spacing={1}
          align="stretch"
          mt={4}
        >
          {data!.getWatchlists!.watchlists!.map((watchlist) => {
            return (
              <Flex key={watchlist.id}>
                <Box rounded="md" boxShadow="md" bg="black" w="300px">
                  <Box
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    h="100%"
                  >
                    <Container
                      display="flex"
                      justifyContent="center"
                      alignItems="center"
                      color="white"
                    >
                      {watchlist.name}
                    </Container>
                  </Box>
                </Box>
                <IconButton
                  aria-label="view"
                  icon={<ViewIcon />}
                  colorScheme="blue"
                  onClick={() => {
                    router.push(`/watchlist/${watchlist.id}`);
                  }}
                ></IconButton>
                <IconButton
                  colorScheme="red"
                  aria-label="delete"
                  icon={<DeleteIcon />}
                  onClick={async () => {
                    const { errors } = await deleteWatchlist({
                      variables: { id: watchlist.id },
                      update: (cache) => {
                        cache.evict({ fieldName: 'watchlists:{}' });
                      },
                    });

                    if (!errors) {
                      router.reload();
                    }
                  }}
                ></IconButton>
              </Flex>
            );
          })}
        </VStack>
      </Flex>
    </Layout>
  );
};

export default withApollo({ ssr: true })(Watchlists);
