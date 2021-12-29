import { QueryResult } from '@apollo/client';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import {
  Exact,
  StocksQuery,
  useSaveStocksMutation,
  useStocksLazyQuery,
} from '../generated/graphql';
import Stock from './Stock';

interface StocksProps {
  item: string;
}

const Stocks: React.FC<StocksProps> = ({ item }): JSX.Element | null => {
  const from = moment(moment.now()).subtract(5, 'days').format('YYYY-MM-DD');
  const to = moment(moment.now()).subtract(1, 'days').format('YYYY-MM-DD');
  const [getStocks, { data, error, loading }] = useStocksLazyQuery();
  const [saveStocks, { data: saveStockData, loading: saveStockLoading }] =
    useSaveStocksMutation();
  const [stocks, setStocks] = useState<JSX.Element[] | undefined>([]);
  const [gotStocks, setGotStocks] = useState<{ stocks: any[] }>();

  const saveStock = async () => {
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

    return savedStock
      ?.data!.saveStocks!.stocks!.sort((a, b) =>
        moment(a.recordDate).diff(moment(b.recordDate))
      )
      .map((stock) => (
        <Stock
          key={stock.id}
          inst={{
            symbol: stock.symbol,
            close: stock.close,
            volume: stock.volume,
            recordDate: stock.recordDate,
          }}
        />
      ));
  };

  useEffect(() => {
    const gettingAndSettingStocks = async () => {
      if (!loading) {
        const gotStock: QueryResult<
          StocksQuery,
          Exact<{ symbol: string; from: any; to: any }>
        > = await getStocks({
          variables: {
            symbol: item,
            from,
            to,
          },
        });
        setGotStocks({ stocks: [...gotStock!.data!.stocks!.stocks!.concat()] });

        if (data && data!.stocks!.stocks!.length < 1 && !saveStockLoading) {
          const savedStock = await saveStock();
          setStocks(savedStock);
        }
      }
    };
    gettingAndSettingStocks();
  }, [loading, data]);

  if (loading) {
    return <div>loading stocks...</div>;
  }

  if (error) {
    return <div>{error.message}</div>;
  }

  if (gotStocks && gotStocks.stocks!.length > 0) {
    gotStocks!.stocks.length > 0
      ? gotStocks!.stocks.sort((a, b) =>
          moment(a.recordDate).diff(moment(b.recordDate))
        )
      : gotStocks;

    // @ts-ignore
    return gotStocks.stocks.map((inst) => <Stock key={inst.id} inst={inst} />);
  } else if (stocks && stocks.length > 0) {
    // @ts-ignore
    return stocks.map((renderedStock) => renderedStock);
  }

  return <div>could not render stock</div>;
};

export default Stocks;
