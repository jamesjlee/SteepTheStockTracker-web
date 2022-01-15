import { forwardRef, Skeleton, Td, Tr } from '@chakra-ui/react';
import moment from 'moment';
import { useRouter } from 'next/router';
import React, { useEffect, useImperativeHandle, useState } from 'react';
import {
  Stock,
  useGetAllStocksQuery,
  useGetWatchlistsQuery,
  useSaveStocksMutation,
} from '../generated/graphql';
import StockElement from './Stock';

const Stocks: React.FC<{
  items: string[] | undefined;
}> = forwardRef(({ items }, forwardedRef): JSX.Element | null => {
  useImperativeHandle(forwardedRef, () => ({
    reload: () => {
      router.reload();
    },
  }));

  const [different, setDifferent] = useState<boolean>(false);

  const from = localStorage.getItem('fromDate')
    ? localStorage.getItem('fromDate')
    : localStorage.setItem(
        'fromDate',
        moment(moment.now()).subtract(5, 'days').format('YYYY-MM-DD')
      );
  const to = localStorage.getItem('toDate')
    ? localStorage.getItem('toDate')
    : localStorage.setItem(
        'toDate',
        moment(moment.now()).subtract(1, 'days').format('YYYY-MM-DD')
      );
  const [allTickers, setAllTickers] = useState<string[]>([]);

  const { data, error, loading } = useGetAllStocksQuery({
    variables: {
      from,
      to,
      symbols: items,
    },
  });

  const router = useRouter();

  const {
    data: watchlistData,
    error: watchlistError,
    loading: watchlistLoading,
  } = useGetWatchlistsQuery();

  const [saveStocks, { loading: saveStockLoading }] = useSaveStocksMutation();
  const [reducedStockMap, setReducedStockMap] = useState<any[]>([]);

  const saveIfDoesNotExist = async (diff: string) => {
    try {
      const savedStock = await saveStocks({
        variables: {
          symbol: diff,
          from,
          to,
        },
        update: (cache) => {
          cache.evict({ fieldName: 'stocks:{}' });
        },
      });
      return savedStock;
    } catch (err) {
      console.log(err);
    }
  };

  const checkDiff = async (difference: string[]) => {
    let allPromises = [];
    for (const diff of difference) {
      allPromises.push(saveIfDoesNotExist(diff));
    }

    const awaitedPromises = await Promise.all(allPromises);
    for (let i = 0; i < awaitedPromises.length; i++) {
      if (awaitedPromises[i]?.data?.saveStocks.stocks?.length! > 0) {
        for (const stockTicker of awaitedPromises[i]?.data?.saveStocks
          ?.stocks!) {
          if (!allTickers?.includes(stockTicker.symbol)) {
            setReducedStockMap((prevStockMap) => [
              ...prevStockMap,
              stockTicker,
            ]);
            setAllTickers((prevTickers) => [
              ...prevTickers,
              stockTicker.symbol,
            ]);
          }
        }
      }
    }
  };

  const checkAndSaveDiffs = () => {
    //@ts-ignore
    let tickers: Stock[] =
      data?.getAllStocks?.stocks?.length! > 0
        ? data?.getAllStocks?.stocks?.concat()
        : [];

    if (tickers) {
      let fetchedTickers = [
        //@ts-ignore
        ...new Set(tickers.map((stock) => stock.symbol)),
      ];

      let diff = allTickers.filter(
        (ticker) =>
          !fetchedTickers.some((fetchedTicker) => ticker === fetchedTicker)
      );

      let dateIsDifferent = false;
      if (tickers.length > 0) {
        dateIsDifferent = !moment(tickers[0]?.recordDate).isBetween(
          moment(localStorage.getItem('fromDate')),
          moment(localStorage.getItem('toDate')),
          undefined,
          '[]'
        );
      }
      console.log('diff', diff);
      console.log('dateIsDiff', dateIsDifferent);

      if (diff.length > 0 || dateIsDifferent) {
        checkDiff(diff);
        setDifferent(true);
      }
    }
  };

  useEffect(() => {
    if (watchlistData?.getWatchlists) {
      setAllTickers(
        watchlistData!.getWatchlists?.watchlists!.filter(
          (watchlist) => watchlist.id.toString() === router.query.id
        )[0].items
      );
    }
  }, [watchlistData?.getWatchlists.watchlists?.length, allTickers.length]);

  useEffect(() => {
    checkAndSaveDiffs();
  }, [
    data?.getAllStocks.stocks?.length,
    allTickers.length,
    reducedStockMap.length,
  ]);

  if (loading || saveStockLoading || watchlistLoading) {
    let loadingSkeletons = [];
    let loadingSkeleton = [];
    for (let i = 0; i < 4; i++) {
      loadingSkeletons.push(
        <Td>
          <Skeleton height="30px" width="100px" />
        </Td>
      );
    }
    for (let i = 0; i < 13; i++) {
      loadingSkeleton.push(<Tr>{loadingSkeletons}</Tr>);
    }

    return <>{loadingSkeleton}</>;
  }

  if (error || watchlistError) {
    let err = error || watchlistError;
    return <div>{err?.message}</div>;
  }

  if (different) {
    if (reducedStockMap.length > 0) {
      // @ts-ignore
      return reducedStockMap
        ?.flat()
        .sort((a, b) => {
          return moment(a.recordDate).diff(moment(b.recordDate));
        })
        .map((stock, index) => (
          <StockElement
            key={stock.id}
            inst={{
              symbol: stock.symbol,
              close: stock.close,
              volume: stock.volume,
              recordDate: stock.recordDate,
            }}
          />
        ));
    } else if (data?.getAllStocks.stocks?.length! > 0) {
      //@ts-ignore
      return data?.getAllStocks.stocks
        ?.concat()
        .sort((a, b) => moment(a.recordDate).diff(moment(b.recordDate)))
        .map((stock, index) => <StockElement key={stock.id} inst={stock} />);
    }
  }

  if (data?.getAllStocks?.stocks?.length! > 0) {
    //@ts-ignore
    let result: Stock[] = data!.getAllStocks!.stocks!.concat();

    // @ts-ignore
    return result
      .sort((a, b) => moment(a.recordDate).diff(moment(b.recordDate)))
      .map((stock, index) => <StockElement key={stock.id} inst={stock} />);
  }

  if (reducedStockMap && reducedStockMap.length > 0) {
    // @ts-ignore
    return reducedStockMap
      ?.flat()
      .sort((a, b) => {
        return moment(a.recordDate).diff(moment(b.recordDate));
      })
      .map((stock, index) => (
        <StockElement
          key={stock.id}
          inst={{
            symbol: stock.symbol,
            close: stock.close,
            volume: stock.volume,
            recordDate: stock.recordDate,
          }}
        />
      ));
  }

  return <Tr>could not render stock</Tr>;
});

export default Stocks;
