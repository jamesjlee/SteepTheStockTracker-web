import { Stack, Skeleton, Td, Tr } from '@chakra-ui/react';
import moment from 'moment';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import {
  Stock,
  useGetAllStocksQuery,
  useGetWatchlistsQuery,
  useSaveStocksMutation,
} from '../generated/graphql';
import StockElement from './Stock';

const Stocks: React.FC<{}> = ({}): JSX.Element | null => {
  const from = moment(moment.now()).subtract(5, 'days').format('YYYY-MM-DD');
  const to = moment(moment.now()).subtract(1, 'days').format('YYYY-MM-DD');
  const days = 4;
  const [allTickers, setAllTickers] = useState<string[]>([
    //@ts-ignore
    ...new Set(data?.getAllStocks.stocks.map((stock) => stock.symbol)),
  ]);

  const [difference, setDifference] = useState<string[]>([]);
  const { data, error, loading } = useGetAllStocksQuery({
    variables: {
      from,
      to,
      symbols: allTickers,
    },
  });

  const router = useRouter();

  const {
    data: watchlistData,
    error: watchlistError,
    loading: watchlistLoading,
  } = useGetWatchlistsQuery();

  useEffect(() => {
    if (watchlistData?.getWatchlists) {
      setAllTickers(
        watchlistData!.getWatchlists?.watchlists!.filter(
          (watchlist) => watchlist.id.toString() === router.query.id
        )[0].items
      );
    }
  }, [watchlistData]);

  const [saveStocks, { data: saveStockData, loading: saveStockLoading }] =
    useSaveStocksMutation();
  const [reducedStockMap, setReducedStockMap] = useState<any[]>([]);

  const saveIfDoesNotExist = async (item: string) => {
    const savedStock = await saveStocks({
      variables: {
        symbol: item,
        from,
        to,
      },
      update: (cache) => {
        cache.evict({ fieldName: 'stocks:{}' });
      },
    });

    for (const stockTicker of savedStock!.data!.saveStocks!.stocks!) {
      if (!allTickers?.includes(stockTicker.symbol)) {
        setReducedStockMap((prevStockMap) => [...prevStockMap, stockTicker]);
        setAllTickers((prevTickers) => [...prevTickers!, stockTicker.symbol]);
      }
    }
  };

  const checkDiff = async (difference: string[]) => {
    for (const diff of difference) {
      await saveIfDoesNotExist(diff);
      router.reload();
    }
  };

  const checkAndSaveDiffs = () => {
    //@ts-ignore
    let tickers: Stock[] = data!.getAllStocks!.stocks!.concat();

    let fetchedTickers = [
      //@ts-ignore
      ...new Set(tickers.map((stock) => stock.symbol)),
    ];

    if (fetchedTickers!.length! > 0) {
      setDifference(
        fetchedTickers!
          .filter((ticker) => !allTickers!.includes(ticker))
          .concat(
            ...allTickers!.filter((ticker) => !fetchedTickers!.includes(ticker))
          )
      );

      if (difference.length > 0) {
        checkDiff(difference);
        setDifference(difference);
      }
    }
  };

  useEffect(() => {
    if (
      !loading &&
      !saveStockLoading &&
      data?.getAllStocks! &&
      data!.getAllStocks!.stocks!.length! === 0
    ) {
      for (const ticker of allTickers!) {
        saveIfDoesNotExist(ticker);
      }
    } else if (
      !loading &&
      !saveStockLoading &&
      data?.getAllStocks.stocks?.length! > 0 &&
      allTickers
    ) {
      checkAndSaveDiffs();
    }
  }, [data, difference, allTickers, reducedStockMap]);

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

  if (error) {
    return <div>{error.message}</div>;
  }

  if (
    !loading &&
    !saveStockLoading &&
    data?.getAllStocks?.stocks?.length! > 0
  ) {
    //@ts-ignore
    let result: Stock[] = data!.getAllStocks!.stocks!.concat();

    // @ts-ignore
    return result
      .sort((a, b) => moment(a.recordDate).diff(moment(b.recordDate)))
      .map((stock) => <StockElement key={stock.id} inst={stock} />);
  }

  if (
    !loading &&
    !saveStockLoading &&
    reducedStockMap &&
    reducedStockMap.length > 0
  ) {
    // @ts-ignore
    return reducedStockMap
      ?.flat()
      .sort((a, b) => {
        return moment(a.recordDate).diff(moment(b.recordDate));
      })
      .map((stock) => (
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

  return <div>could not render stock</div>;
};

export default Stocks;
