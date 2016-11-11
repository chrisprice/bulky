const sheets = require('./sheets');

module.exports = ({ sheetId, range, fields, refreshInterval }) =>
  ({ clientEmail, privateKey }) => {
    const base = sheets({ sheetId, range, fields })({ clientEmail, privateKey });

    let cache = null;

    const update = () => base.list()
      .then((result) => {
        cache = Promise.resolve(result);
        return cache;
      })
      .catch((e) => {
        console.warn('Failed to update cache', e);
        throw e;
      });

    cache = update();

    setInterval(update, refreshInterval);

    return {
      append: base.append,
      list: () => cache
    };
  };
