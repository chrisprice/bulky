const readFileSync = require('fs').readFileSync;
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const wallet = require('./lib/wallet');
const stock = require('./lib/stock');
const users = require('./lib/users');
const uuid = require('uuid');
const ms = require('ms');

const satoshisPerBitcoin = 1e8;

const configPath = process.argv[2];
const { bws, google } = JSON.parse(readFileSync(configPath, 'utf8'));

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use((req, res, next) => {
  const session = req.cookies.session || uuid.v4();
  res.cookie('session', session, { maxAge: ms('1Y'), httpOnly: true });

  Promise.all([stock({ google }).list(), users({ google }).list()])
    .then(([stock, users]) => {
      const user = users.find((user) => user.session === session);
      if (!user) {
        throw new Error(`User not found.`);
      }
      const walletPromise = user ? wallet({ bws, mnemonic: user.mnemonic }) : Promise.resolve(null);
      return walletPromise.then((wallet) => ({ user, wallet, stock, session }));
    })
    .then((app) => {
      req.app = app;
      next();
    })
    .catch((e) => {
      console.error(session, e);
      res.sendStatus(403);
    });
});

app.get('/', (req, res) => {
  const { session, stock, wallet, user } = req.app;
  wallet.balance()
    .then((balance) => {
      res.send(`
        <!doctype html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body>
          <h3>${user.name} £${(balance.availableAmount / satoshisPerBitcoin).toFixed(2)}</h3>
          <hr/>
          ${
            stock.filter(item => item.inStock)
              .map(item => `
                <form action="purchase/${item.address}" method="POST">
                  <input type="hidden" name="session" value="${session}"/>
                  <h3>${item.name}</h3>
                  <ul>
                    <li>£${item.scottcoinPrice.toFixed(2)}</li>
                    <li><input type="submit" value="Purchase"/></li>
                  </ul>
                </form>`
              )
              .join('\n')
          }
        </body>
        </html>`);
    })
    .catch((e) => {
      res.sendStatus(500);
      console.error(e);
    });
});

app.post('/purchase/:address', (req, res) => {
  // csrf protection
  if (req.cookies.session !== req.body.session) {
    return res.sendStatus(400);
  }

  const { address } = req.params;
  const { session, wallet, stock } = req.app;

  const item = stock.find(item => item.address === address);
  const amountSatoshis = Math.round(item.scottcoinPrice * satoshisPerBitcoin);

  wallet.send({ address, amount: amountSatoshis })
    .then(() => {
      res.send(`
        <!doctype html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body>
          <h3>Purchased ${item.name} for £${item.scottcoinPrice.toFixed(2)}</h3>
          <hr/>
          <form action="/" method="GET">
            <input type="submit" value="Home"/>
          </form>
        </body>
        </html>`);
    })
    .catch((e) => {
      res.sendStatus(500);
      console.error(e);
    });
});

app.listen(3000, () => console.log('Listening on port 3000'));
