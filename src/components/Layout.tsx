import { Box, Center, Flex } from '@chakra-ui/react';
import React from 'react';
import Footer from './Footer';
import Navbar from './Navbar';

interface LayoutProps {
  children: React.ReactChild;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <>
      <Navbar />
      <Flex justifyContent="center" alignItems="center" h="80vh" w="100%">
        <main>{children}</main>
      </Flex>
      <Footer />
    </>
  );
};

export default Layout;
