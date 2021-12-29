import { Td, Tr } from '@chakra-ui/react';
import React from 'react';

interface StockProps {
  inst: {
    symbol: string;
    recordDate: string;
    close: number;
    volume: number;
  };
}

const Stock: React.FC<StockProps> = ({ inst }) => {
  return (
    <Tr>
      <Td>{inst.symbol}</Td>
      <Td>{inst.recordDate}</Td>
      <Td>{inst.close}</Td>
      <Td>{inst.volume}</Td>
    </Tr>
  );
};

export default Stock;
