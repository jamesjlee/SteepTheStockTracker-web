import { createWithApollo } from './createWithApollo';
import {
  ApolloClient,
  defaultDataIdFromObject,
  InMemoryCache,
} from '@apollo/client';
import { NextPageContext } from 'next';
import { Stock } from '../generated/graphql';

const cache = new InMemoryCache({
  //@ts-ignore
  dataIdFromObject: (object) => {
    switch (object.__typename) {
      case 'Stock':
        return object.id; // use the `id` field as the identifier
      case 'StocksResponse':
        let idString = '';
        //@ts-ignore
        for (const [index, stock] of object.stocks.entries()) {
          //@ts-ignore
          if (index === object.stocks.length - 1) {
            idString += stock.id;
          } else {
            idString += stock.id + '-';
          }
        }
        return `StocksResponse:${idString}`; // use `ids` as the identifier
      default:
        return defaultDataIdFromObject(object); // fall back to default handling
    }
  },
});

const createClient = (ctx: NextPageContext) =>
  new ApolloClient({
    uri: process.env.NEXT_PUBLIC_API_URL as string,
    credentials: 'include',
    headers: {
      cookie:
        (typeof window === 'undefined'
          ? ctx?.req?.headers.cookie
          : undefined) || '',
    },
    cache,
  });

export const withApollo = createWithApollo(createClient);
