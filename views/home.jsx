const { satoshisPerBitcoin } = require('../lib/coins');
const React = require('react');
const Layout = require('./layout.jsx');
const Price = require('./price.jsx');

const Item = ({ item, session, balance }) => {
  const disabled = item.scottcoinPrice > (balance.availableAmount / satoshisPerBitcoin);
  return (
    <form action={`purchase/${item.address}`} method="POST">
      <input type="hidden" name="session" value={session}/>
      <p>
        <button type="submit" disabled={disabled}>
          {item.name}{' - '}
          <Price priceInScottcoins={item.scottcoinPrice}/>
        </button>
      </p>
    </form>
  );
};

module.exports = ({ stock, balance, user, session, signature }) => (
  <Layout session={session} balance={balance} user={user}>
    <h3>Purchase</h3>
    {
      stock.map(item => <Item item={item} session={session} key={item.address} balance={balance}/>)
    }
    <iframe src={`https://honesty.store/session/${session}/${signature}`} style={{ display: 'none' }}/>
  </Layout>
);
