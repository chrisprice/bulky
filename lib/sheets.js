const fetch = require('node-fetch');
const querystring = require('querystring');
const JWT = require('google-auth-library/lib/auth/jwtclient');

const baseUrl = 'https://sheets.googleapis.com/v4/spreadsheets';

module.exports = ({ sheetId, range, fields = [] }) => {

  const request = ({ path = '', params = {}, options, accessToken }) => {
    const query = querystring.stringify(Object.assign({ access_token: accessToken }, params));
    const url = `${baseUrl}/${sheetId}/values/${range}/${path}?${query}`;
    return fetch(url, options)
      .then(res => res.json())
      .then(json => {
        if (json.error) {
          throw new Error(json.error.message);
        }
        return json;
      });
  };

  const append = ({ accessToken, data }) => {
    const params = { valueInputOption: 'USER_ENTERED' };
    const values = data.map(datum => {
      return Object.keys(fields)
        .map(field => datum[field.name]);
    });
    const options = {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        range: range,
        majorDimension: 'ROWS',
        values: [ values ]
      })
    };
    return request({ accessToken, path: ':append', params, options });
  };

  const list = ({ accessToken }) => request({ accessToken })
    .then((json) => {
      const [header, ...rows] = json.values;
      const createObject = (row) =>
        header.reduce((obj, fieldHeader, i) => {
          const field = fields.find(field => field.header === fieldHeader);
          const name = field ? field.name : fieldHeader;
          const parse = field ? field.parse : String;
          obj[name] = parse(row[i]);
          return obj;
        }, {});
      return rows.map(createObject);
    });

  return ({ clientEmail, privateKey }) => {

    const getAuthToken = () => new Promise((resolve, reject) => {
      new JWT(clientEmail, null, privateKey, ['https://www.googleapis.com/auth/spreadsheets'], null)
        .authorize((error, tokens) => {
          if (error) {
            return reject(new Error(`Get auth failed: ${error}`));
          }
          resolve(tokens.access_token);
        });
    });

    return {
      append: (data = []) => getAuthToken()
        .then((accessToken) => append({ accessToken, data })),
      list: () => getAuthToken()
        .then((accessToken) => list({ accessToken }))
    };
  };
};
