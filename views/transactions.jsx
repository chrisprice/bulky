const React = require('react');
const Layout = require('./layout.jsx');
const Price = require('./price.jsx');
const moment = require('moment');

const NoTransactions = () => (
  <p>No recent transactions.</p>
);

const Transaction = ({ item }) => (
  <p>
    {item.label}
    <br/>
    <small><Price priceInSatoshis={item.amount}/>,{' '}{moment(item.date).fromNow()}</small>
  </p>
);

module.exports = ({ transactions, session, balance, user }) => (
  <Layout session={session} balance={balance} user={user}>
    <form action="topup" method="GET">
      <h3>Topup</h3>
      <button type="submit" name="amount" value="0.5">£0.50</button>
      <button type="submit" name="amount" value="1">£1.00</button>
      <button type="submit" name="amount" value="2">£2.00</button>
      <button type="submit" name="amount" value="5">£5.00</button>
      <button type="submit" name="amount" value="10">£10.00</button>
    </form>
    <hr/>
    <h3>Recent Transactions</h3>
    {
      transactions.length === 0
      ? <NoTransactions/>
      : transactions.map(item => <Transaction item={item} key={item.id}/>)
    }
  </Layout>
);
