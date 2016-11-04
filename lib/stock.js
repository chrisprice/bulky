const fetch = require('node-fetch');
const JWT = require('google-auth-library/lib/auth/jwtclient');

const baseUrl = 'https://sheets.googleapis.com/v4/spreadsheets/1DzyNc1O1zwzHiFxvX_fQHZe4zgg71ke0PUAD9Kal900/';

const fieldMap = {
  'Item': 'name',
  'In Stock': 'inStock',
  'ScottCoin Only': 'scottcoinOnly',
  'Multipack Price': 'multipackPrice',
  'Multipack Quantity': 'multipackQuantity',
  'ScottCoin Price': 'scottcoinPrice',
  'GBP Price': 'gbpPrice',
  'Address': 'address',
  'Bitcoin URL': 'bitcoinUrl',
  'QR Code': 'qrCode',
  'Tx List (Insight)': 'txListUrl',
  'Tx List (API)': 'txListApi',
  'Funding Tx': 'fundingTx'
};

const fieldTypeMap = {
  'name': String,
  'inStock': x => Boolean(Number(x)),
  'scottcoinOnly': x => Boolean(Number(x)),
  'multipackPrice': Number,
  'multipackQuantity': Number,
  'scottcoinPrice': Number,
  'gbpPrice': x => x ? Number(x) : null,
  'address': String,
  'bitcoinUrl': String,
  'qrCode': String,
  'txListUrl': String,
  'txListApi': String,
  'fundingTx': String
};

const getAuthToken = ({ client_email, private_key }) => new Promise((resolve, reject) => {
  // eslint-disable-next-line camelcase
  new JWT(client_email, null, private_key, ['https://www.googleapis.com/auth/spreadsheets'], null)
    .authorize((error, tokens) => {
      if (error) {
        return reject(new Error(`Get auth failed: ${error}`));
      }
      resolve(tokens.access_token);
    });
});

module.exports = ({ google }) => {
  const list = () => getAuthToken(google)
    .then((accessToken) => {
      // const options = { headers: { 'Authorisation': `Bearer ${accessToken}` } };
      // console.log(options);
      return fetch(`${baseUrl}values/Stock/?access_token=${accessToken}`);
    })
    .then(res => res.json())
    .then(json => {
      const [header, ...rows] = json.values;
      const createObject = (row) =>
        header.reduce((obj, field, i) => {
          const fieldName = fieldMap[field];
          obj[fieldName] = fieldTypeMap[fieldName](row[i]);
          return obj;
        }, {});
      return rows.map(createObject);
    });

  return { list };
};
