import { Box, Button, Flex, Input } from '@chakra-ui/react';
import { Form, Formik } from 'formik';
import { useRouter } from 'next/router';
import React, { LegacyRef, useRef, useState } from 'react';
import { useCreateWatchlistMutation } from '../generated/graphql';
import { InputField } from './InputField';
import Layout from './Layout';

const CreateWatchlist = ({}) => {
  const router = useRouter();

  const [createWatchlist] = useCreateWatchlistMutation();
  const [stocks, setStocks] = useState<string[]>([]);
  const stockRef = useRef<any>();
  const [disableButton, setDisableButton] = useState(true);
  const watchlistNameRef = useRef<any>();
  const [watchlistName, setWatchlistName] = useState('');

  const addStock = () => {
    const stock = stockRef.current.value;
    if (stock === '') {
      // do nothing
      return;
    }

    setStocks((prevStocks) => {
      setDisableButton(true);

      if (watchlistNameRef.current.value !== '' && stock !== '') {
        setDisableButton(false);
      }
      if (!prevStocks.includes(stock.toUpperCase())) {
        return [...prevStocks, stock.toUpperCase()];
      }
      return [...prevStocks];
    });
    stockRef.current.value = '';
  };

  const watchlistNameChange = () => {
    setDisableButton(true);
    if (watchlistNameRef.current.value !== '' && stocks.length > 0) {
      setDisableButton(false);
      setWatchlistName(watchlistNameRef.current.value);
    }
  };

  return (
    <Flex flexDirection="column">
      <Box>
        <Input
          ref={stockRef}
          name="stock"
          placeholder="ticker"
          label="Stock"
          type="text"
        />
        <Button mb={5} colorScheme="teal" onClick={() => addStock()}>
          Add Stock
        </Button>
        <Box>
          <u>Initializing watchlist with the following stocks:</u>
          <Box>
            {stocks.length > 0 ? <b>[{stocks.join(',')}]</b> : <div>[]</div>}
          </Box>
        </Box>
      </Box>
      <Box mt={5}>
        <Formik
          enableReinitialize
          initialValues={{
            name: watchlistName,
            items: stocks,
          }}
          onSubmit={async (values, { setErrors }) => {
            const { errors } = await createWatchlist({
              variables: values,
              update: (cache) => {
                cache.evict({ fieldName: 'watchlists:{}' });
              },
            });
            if (!errors) {
              watchlistNameRef.current.value = '';
              router.reload();
            }
          }}
        >
          {({ isSubmitting }) => (
            <Form>
              <Input
                name="name"
                placeholder="watchlist name"
                label="Watchlist"
                ref={watchlistNameRef}
                onChange={watchlistNameChange}
              />
              <Button
                mt={4}
                type="submit"
                isLoading={isSubmitting}
                colorScheme="blue"
                float="right"
                disabled={disableButton}
              >
                Create watchlist
              </Button>
            </Form>
          )}
        </Formik>
      </Box>
    </Flex>
  );
};

export default CreateWatchlist;
