const cache = require('./cache');
const ms = require('ms');

const sheetId = '1DzyNc1O1zwzHiFxvX_fQHZe4zgg71ke0PUAD9Kal900';
const range = 'A:M';

const fields = [
  { header: 'Item', name: 'name', parse: String },
  { header: 'In Stock', name: 'inStock', parse: x => Boolean(Number(x)) },
  { header: 'ScottCoin Only', name: 'scottcoinOnly', parse: x => Boolean(Number(x)) },
  { header: 'Multipack Price', name: 'multipackPrice', parse: Number },
  { header: 'Multipack Quantity', name: 'multipackQuantity', parse: Number },
  { header: 'ScottCoin Price', name: 'scottcoinPrice', parse: Number },
  { header: 'GBP Price', name: 'gbpPrice', parse: x => x ? Number(x) : null },
  { header: 'Address', name: 'address', parse: String },
  { header: 'Bitcoin URL', name: 'bitcoinUrl', parse: String },
  { header: 'QR Code', name: 'qrCode', parse: String },
  { header: 'Tx List (Insight)', name: 'txListUrl', parse: String },
  { header: 'Tx List (API)', name: 'txListApi', parse: String },
  { header: 'Funding Tx', name: 'fundingTx', parse: String }
];

module.exports = cache({ sheetId, range, fields, refreshInterval: ms('10s') });
