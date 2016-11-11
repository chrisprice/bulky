const cache = require('./cache');
const ms = require('ms');

const sheetId = '1zsTH8pDdCEdX92C-yZcoSo5T52hRKR2NlBg4LUDPxKw';
const range = 'A:C';

const fields = [
  { header: 'User', name: 'name', parse: String },
  { header: 'Session', name: 'session', parse: String },
  { header: 'Mnemonic', name: 'mnemonic', parse: String }
];

module.exports = cache({ sheetId, range, fields, refreshInterval: ms('10s') });
