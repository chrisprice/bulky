const fetch = require('node-fetch');
const JWT = require('google-auth-library/lib/auth/jwtclient');

const sheetId = '1zsTH8pDdCEdX92C-yZcoSo5T52hRKR2NlBg4LUDPxKw';
const rangeName = 'A:C';

const baseUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/`;

const fieldMap = {
  'User': 'name',
  'Session': 'session',
  'Mnemonic': 'mnemonic'
};

const fieldTypeMap = {
  'name': String,
  'session': String,
  'mnemonic': String
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
    .then((accessToken) => fetch(`${baseUrl}values/${rangeName}/?access_token=${accessToken}`))
    .then(res => res.json())
    .then(json => {
      if (json.error) {
        throw new Error(json.error.message);
      }
      const [header, ...rows] = json.values;
      const createObject = (row) =>
        header.reduce((obj, field, i) => {
          const fieldName = fieldMap[field];
          obj[fieldName] = fieldTypeMap[fieldName](row[i]);
          return obj;
        }, {});
      return rows.map(createObject);
    });

  const insert = ({ name, session, mnemonic }) => getAuthToken(google)
    .then((accessToken) => fetch(`${baseUrl}values/${rangeName}:append?valueInputOption=USER_ENTERED&access_token=${accessToken}`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        range: rangeName,
        majorDimension: 'ROWS',
        values: [ [ name, session, mnemonic ] ]
      })
    }))
    .then(res => res.json())
    .then(json => {
      if (json.error) {
        throw new Error(json.error.message);
      }
    });

  return { insert, list };
};
