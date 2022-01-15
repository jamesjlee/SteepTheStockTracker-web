import { AddIcon, ArrowBackIcon, ArrowForwardIcon } from '@chakra-ui/icons';
import {
  Box,
  Heading,
  IconButton,
  Input,
  Table,
  TableCaption,
  Tbody,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react';
import moment from 'moment';
import { useRouter } from 'next/router';
import React, { useRef, useState } from 'react';
import Layout from '../../components/Layout';
import Stocks from '../../components/Stocks';
import { useAddToWatchlistMutation } from '../../generated/graphql';
import { useGetWatchlistFromUrl } from '../../utils/useGetWatchlistFromUrl';
import { withApollo } from '../../utils/withApollo';

const Watchlist = ({}) => {
  const { data, error, loading } = useGetWatchlistFromUrl();
  const [addToWatchlist] = useAddToWatchlistMutation();
  const tickerRef = useRef<any>();
  const router = useRouter();
  const stocksRef = useRef<any>();

  const backDate = () => {
    if (localStorage.getItem('fromDate') && localStorage.getItem('toDate')) {
      localStorage.setItem(
        'fromDate',
        moment(localStorage.getItem('fromDate'))
          .subtract(5, 'days')
          .format('YYYY-MM-DD')
      );
      localStorage.setItem(
        'toDate',
        moment(localStorage.getItem('toDate'))
          .subtract(5, 'days')
          .format('YYYY-MM-DD')
      );
      stocksRef?.current?.reload();
    }
  };
  const forwardDate = () => {
    if (localStorage.getItem('fromDate') && localStorage.getItem('toDate')) {
      localStorage.setItem(
        'fromDate',
        moment(localStorage.getItem('fromDate'))
          .add(5, 'days')
          .format('YYYY-MM-DD')
      );
      localStorage.setItem(
        'toDate',
        moment(localStorage.getItem('toDate'))
          .add(5, 'days')
          .format('YYYY-MM-DD')
      );
      stocksRef?.current?.reload();
    }
  };

  if (loading) {
    return (
      <Layout>
        <div>loading table...</div>
      </Layout>
    );
  }

  if (error) {
    return <div>{error.message}</div>;
  }

  if (!data?.getWatchlist) {
    return (
      <Layout>
        <Box>could not find watchlist</Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <>
        <Heading mb={4}>{data.getWatchlist.watchlist?.name}</Heading>
        <Box mb={4}>[{data.getWatchlist.watchlist?.items.join(', ')}]</Box>
        <Box display="flex">
          <Input type="text" placeholder="ticker..." ref={tickerRef} mb={4} />
          <IconButton
            aria-label="add"
            icon={<AddIcon />}
            onClick={async () => {
              if (
                tickerRef?.current?.value !== '' &&
                !data.getWatchlist.watchlist?.items.includes(
                  tickerRef.current.value.toUpperCase()
                )
              ) {
                await addToWatchlist({
                  variables: {
                    input: {
                      id: data!.getWatchlist?.watchlist!.id,
                      item: tickerRef?.current?.value.toUpperCase(),
                    },
                  },
                  update: (cache) => {
                    cache.evict({
                      fieldName: 'watchlists:{}',
                    });
                  },
                });
              }
              tickerRef.current.value = '';
            }}
          />
        </Box>
        <Box overflowY="auto" maxHeight="70vh">
          <Table variant="striped" size="lg">
            <TableCaption>
              <Box>
                <IconButton
                  mr={2}
                  icon={<ArrowBackIcon />}
                  aria-label="back"
                  onClick={backDate}
                />
                <IconButton
                  ml={2}
                  icon={<ArrowForwardIcon />}
                  aria-label="forward"
                  onClick={forwardDate}
                  disabled={moment(
                    moment(localStorage.getItem('toDate'))
                  ).isSame(
                    moment(moment().subtract(1, 'days').format('YYYY-MM-DD'))
                  )}
                />
              </Box>
            </TableCaption>
            <Thead position="sticky" top={0} bgColor="black">
              <Tr>
                <Th color="white">Symbol</Th>
                <Th color="white">Date</Th>
                <Th color="white">Closing Price</Th>
                <Th color="white">Volume</Th>
              </Tr>
            </Thead>
            <Tbody>
              <Stocks
                items={data.getWatchlist.watchlist?.items}
                //@ts-ignore
                ref={stocksRef}
              />
            </Tbody>
          </Table>
        </Box>
      </>
    </Layout>
  );
};

export default withApollo({ ssr: false })(Watchlist);
