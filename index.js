const readFileSync = require('fs').readFileSync;
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const wallet = require('./lib/wallet');
const stock = require('./lib/stock');
const users = require('./lib/users');
const Credentials = require('bitcore-wallet-client/lib/credentials');
const uuid = require('uuid');
const ms = require('ms');

const satoshisPerBitcoin = 1e8;

const configPath = process.argv[2];
const { bws, google, secret } = JSON.parse(readFileSync(configPath, 'utf8'));

const services = {
  users: users({ clientEmail: google.client_email, privateKey: google.private_key }),
  stock: stock({ clientEmail: google.client_email, privateKey: google.private_key })
};

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use((req, res, next) => {
  req.session = req.cookies.session || uuid.v4();
  res.cookie('session', req.session, { maxAge: ms('1Y'), httpOnly: true });
  if (req.path.indexOf('/create') === 0) {
    return next();
  }
  services.users.list()
    .then((users) => {
      req.user = users.find((user) => user.session === req.session);
      if (!req.user) {
        console.warn(req.session, `User not found`);
        return res.status(403)
          .send(`
            <!doctype html>
            <html>
            <head>
              <title>Tuck Shop</title>
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <meta name="apple-mobile-web-app-capable" content="yes">
            </head>
            <body>
              <h3>Opps</h3>
              <p>You're not signed up for this service yet.</p>
              <p><small>${req.session}</small></p>
              <hr/>
              <form action="/" method="GET">
                <input type="submit" value="Home"/>
              </form>
            </body>
            </html>`);
      }
      return wallet({ bws, mnemonic: req.user.mnemonic })
        .then((wallet) => {
          req.wallet = wallet;
          next();
        });
    })
    .catch((e) => {
      console.error(req.session, e);
      res.status(500)
        .send(`
          <!doctype html>
          <html>
          <head>
            <title>Tuck Shop</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <meta name="apple-mobile-web-app-capable" content="yes">
          </head>
          <body>
            <h3>Opps</h3>
            <p>Something went wrong</p>
            <p><small>${req.session}</small></p>
            <hr/>
            <form action="/" method="GET">
              <input type="submit" value="Home"/>
            </form>
          </body>
          </html>`);
    });
});

app.get('/', (req, res) => {
  const { session, wallet, user } = req;
  Promise.all([req.wallet.balance(), services.stock.list()])
    .then(([balance, stock]) => {
      res.send(`
        <!doctype html>
        <html>
        <head>
          <title>Tuck Shop</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <meta name="apple-mobile-web-app-capable" content="yes">
        </head>
        <body>
          <h3>${user.name} £${(balance.availableAmount / satoshisPerBitcoin).toFixed(2)}</h3>
          <form action="transactions" method="GET">
            <input type="submit" value="Recent Transactions"/>
          </form>
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
          <hr/>
          <form action="topup" method="GET">
            £ <input type="number" name="amount" value="5.00" min="0.01" step="0.01"/> <input type="submit" value="Topup"/>
          </form>
        </body>
        </html>`);
    })
    .catch((e) => {
      console.error(session, e);
      res.status(500)
        .send(`
          <!doctype html>
          <html>
          <head>
            <title>Tuck Shop</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <meta name="apple-mobile-web-app-capable" content="yes">
          </head>
          <body>
            <h3>Opps</h3>
            <p>Something went wrong</p>
            <p><small>${session}</small></p>
            <hr/>
            <form action="/" method="GET">
              <input type="submit" value="Home"/>
            </form>
          </body>
          </html>`);
    });
});

app.get('/transactions', (req, res) => {
  const { session, wallet, user } = req;
  Promise.all([req.wallet.transactions(), services.stock.list()])
    .then(([rawTransactions, stock]) => {
      const transactions = rawTransactions.map(tx => {
        const output = tx.outputs.find(output => !output.isMine);
        if (!output) {
          return null;
        }
        const item = stock.find(item => item.address === output.address);
        if (!item) {
          return null;
        }
        return {
          date: new Date(tx.time * 1000),
          label: item.name,
          quantity: Math.round(output.amount / satoshisPerBitcoin / item.scottcoinPrice)
        };
      })
        .filter(tx => tx)
        .filter((tx, i) => i < 10);
      res.send(`
        <!doctype html>
        <html>
        <head>
          <title>Tuck Shop</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <meta name="apple-mobile-web-app-capable" content="yes">
        </head>
        <body>
          <h3>Recent Transactions</h3>
          <hr/>
          <ul>
          ${
            transactions.map(tx => `<li>${tx.label} <small>${tx.date.toDateString()}</small></li>`)
              .join('\n')
          }
          </ul>
          <hr/>
          <form action="/" method="GET">
            <input type="submit" value="Home"/>
          </form>
        </body>
        </html>`);
    })
    .catch((e) => {
      console.error(session, e);
      res.status(500)
        .send(`
          <!doctype html>
          <html>
          <head>
            <title>Tuck Shop</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <meta name="apple-mobile-web-app-capable" content="yes">
          </head>
          <body>
            <h3>Opps</h3>
            <p>Something went wrong</p>
            <p><small>${session}</small></p>
            <hr/>
            <form action="/" method="GET">
              <input type="submit" value="Home"/>
            </form>
          </body>
          </html>`);
    });
});

app.get('/topup', (req, res) => {
  const amount = req.query.amount ? Number(req.query.amount) : 5;
  const { session, wallet, user } = req;
  Promise.all([req.wallet.balance(), req.wallet.address()])
    .then(([balance, address]) => {
      res.send(`
        <!doctype html>
        <html>
        <head>
          <title>Tuck Shop</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <meta name="apple-mobile-web-app-capable" content="yes">
        </head>
        <body>
          <h3>${user.name} £${(balance.availableAmount / satoshisPerBitcoin).toFixed(2)}</h3>
          <hr/>
          <p>Show this code to someone with ScottCoins whilst crossing their palm with the appropriate amount of silver (£${amount}) and they'll top you up.</p>
          <img width="100%" src="https://chart.googleapis.com/chart?cht=qr&chs=500x500&chl=bitcoin:${address}%3Famount%3D${amount}"/>
          <p><small>tuckshop:${address}</small></p>
          <hr/>
          <form action="/" method="GET">
            <input type="submit" value="Home"/>
          </form>
        </body>
        </html>`);
    })
    .catch((e) => {
      console.error(session, e);
      res.status(500)
        .send(`
          <!doctype html>
          <html>
          <head>
            <title>Tuck Shop</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <meta name="apple-mobile-web-app-capable" content="yes">
          </head>
          <body>
            <h3>Opps</h3>
            <p>Something went wrong</p>
            <p><small>${session}</small></p>
            <hr/>
            <form action="/" method="GET">
              <input type="submit" value="Home"/>
            </form>
          </body>
          </html>`);
    });
});

app.post('/purchase/:address', (req, res) => {
  // csrf protection
  if (req.cookies.session !== req.body.session) {
    return res.sendStatus(400);
  }

  const { address } = req.params;
  const { session, wallet } = req.app;

  services.stock.list()
    .then((stock) => stock.find(item => item.address === address))
    .then((item) => {
      const amountSatoshis = Math.round(item.scottcoinPrice * satoshisPerBitcoin);
      return req.wallet.send({ address, amount: amountSatoshis })
        .then(() => item);
    })
    .then((item) => {
      res.send(`
        <!doctype html>
        <html>
        <head>
          <title>Tuck Shop</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <meta name="apple-mobile-web-app-capable" content="yes">
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
      console.error(session, e);
      res.status(500)
        .send(`
          <!doctype html>
          <html>
          <head>
            <title>Tuck Shop</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <meta name="apple-mobile-web-app-capable" content="yes">
          </head>
          <body>
            <h3>Opps</h3>
            <p>Something went wrong</p>
            <p><small>${session}</small></p>
            <hr/>
            <form action="/" method="GET">
              <input type="submit" value="Home"/>
            </form>
          </body>
          </html>`);
    });
});

app.post('/create/:secret', (req, res) => {
  const { session } = req.params;
  const { name } = req.query;
  if (req.params.secret !== secret) {
    return res.sendStatus(403);
  }

  wallet.create({ bws, walletName: name })
    .then((mnemonic) => users({ google }).insert({ name, session: '', mnemonic }))
    .then(() => res.sendStatus(200))
    .catch((e) => {
      console.error(name, session, e);
      res.sendStatus(500);
    });
});

app.listen(3000, () => console.log('Listening on port 3000'));
