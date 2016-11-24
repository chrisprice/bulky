const fetch = require('node-fetch');

module.exports = (stock) => Promise.all(
  stock.map(item => fetch(item.txListApi)
    .then(res => res.json())
    .then((itemBlockchain) => {
      // This assumes the scottcoin price for an item is constant throughout its life.
      let purchaseCount = Math.round(itemBlockchain.totalReceived / item.scottcoinPrice);
      return Object.assign({ purchaseCount }, item)
    })));
