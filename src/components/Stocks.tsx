import { Stack, Skeleton, Td, Tr } from '@chakra-ui/react';
import moment from 'moment';
import { useRouter } from 'next/router';
import React, { useEffect, useLayoutEffect, useState } from 'react';
import {
  Stock,
  useGetAllStocksQuery,
  useGetWatchlistsQuery,
  useSaveStocksMutation,
} from '../generated/graphql';
import StockElement from './Stock';

const Stocks: React.FC<{ items: string[] | undefined }> = ({
  items,
}): JSX.Element | null => {
  const from = moment(moment.now()).subtract(5, 'days').format('YYYY-MM-DD');
  const to = moment(moment.now()).subtract(1, 'days').format('YYYY-MM-DD');
  const days = 4;
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

    if (
      savedStock &&
      savedStock.data &&
      savedStock.data.saveStocks &&
      savedStock.data.saveStocks.stocks
    ) {
      for (const stockTicker of savedStock?.data?.saveStocks?.stocks!) {
        if (!allTickers?.includes(stockTicker.symbol)) {
          setReducedStockMap((prevStockMap) => [...prevStockMap, stockTicker]);
          setAllTickers((prevTickers) => [...prevTickers!, stockTicker.symbol]);
        }
      }
    }
  };

  const checkDiff = (difference: string[]) => {
    for (const diff of difference) {
      saveIfDoesNotExist(diff);
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

      let diff = fetchedTickers!
        .filter((ticker) => !allTickers!.includes(ticker))
        .concat(
          ...allTickers!.filter((ticker) => !fetchedTickers!.includes(ticker))
        );
      if (diff.length > 0) {
        checkDiff(diff);
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
  }, [watchlistData]);

  useEffect(() => {
    checkAndSaveDiffs();
  }, []);

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

  if (data?.getAllStocks?.stocks?.length! > 0) {
    //@ts-ignore
    let result: Stock[] = data!.getAllStocks!.stocks!.concat();

    // @ts-ignore
    return result
      .sort((a, b) => moment(a.recordDate).diff(moment(b.recordDate)))
      .map((stock) => <StockElement key={stock.id} inst={stock} />);
  }

  if (reducedStockMap.length > 0) {
    // @ts-ignore
    return reducedStockMap
      ?.flat()
      .sort((a, b) => {
        return moment(a.recordDate).diff(moment(b.recordDate));
      })
      .map((stock, index) => (
        <StockElement
          key={index}
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
