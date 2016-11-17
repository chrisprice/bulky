const React = require('react');
const Layout = require('./layout.jsx');
const Price = require('./price.jsx');

module.exports = ({ item, session, balance, user }) => (
  <Layout session={session} balance={balance} user={user}>
    <h3>Purchased {item.name} for <Price priceInScottcoins={item.scottcoinPrice}/></h3>
  </Layout>
);
