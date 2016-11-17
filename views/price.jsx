const { satoshisPerBitcoin } = require('../lib/coins');
const React = require('react');

module.exports = ({ priceInSatoshis, priceInScottcoins }) => {
  if ((priceInSatoshis == null && priceInScottcoins == null) || (priceInSatoshis != null && priceInScottcoins != null)) {
    throw new Error('Specify a price in one unit only');
  }
  if (priceInScottcoins == null) {
    priceInScottcoins = priceInSatoshis / satoshisPerBitcoin;
  }
  const str = priceInScottcoins.toFixed(6);
  return (
    <span>
      £{str.substring(0, str.length - 4)}
      <small><small><small>{str.substring(str.length - 4)}</small></small></small>
    </span>
  );
};
