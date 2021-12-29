import { useApolloClient } from '@apollo/client';
import { Box, Button, Flex } from '@chakra-ui/react';
import Link from 'next/link';
import React from 'react';
import { useLogoutMutation, useMeQuery } from '../generated/graphql';
import { isServer } from '../utils/isServer';

const Navbar = ({}) => {
  const { data, loading } = useMeQuery({
    skip: isServer(),
  });
  const [logout, { loading: logoutFetching }] = useLogoutMutation();
  const apolloClient = useApolloClient();

  let body = null;

  if (loading) {
    body = <Box>loading navbar...</Box>;
  } else if (!data?.me) {
    body = (
      <Flex ml="auto">
        <Box m={6}>
          <Link href="/login">Login</Link>
        </Box>
        <Box m={6}>
          <Link href="/register">Register</Link>
        </Box>
      </Flex>
    );
  } else {
    body = (
      <>
        <Box m={6}>
          <Link href="/">Home</Link>
        </Box>
        <Box m={6}>
          <Link href="/watchlists">Watchlists</Link>
        </Box>
        <Flex ml="auto">
          <Box m={6}>
            <Button
              onClick={async () => {
                await logout();
                await apolloClient.resetStore();
              }}
              isLoading={logoutFetching}
              variant="link"
            >
              Logout
            </Button>
          </Box>
        </Flex>
      </>
    );
  }

  return (
    <Flex
      h="10vh"
      flexDirection="row"
      justifyContent="flex-start"
      alignContent="center"
      position="sticky"
    >
      {body}
    </Flex>
  );
};

export default Navbar;
