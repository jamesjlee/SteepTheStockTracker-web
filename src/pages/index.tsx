import type { NextPage } from 'next';
import Layout from '../components/Layout';
import { withApollo } from '../utils/withApollo';

const Index: NextPage = ({}) => {
  return <Layout>Welcome to Steep -- The Stock Tracker!</Layout>;
};

export default withApollo({ ssr: false })(Index);
