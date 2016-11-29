const readFileSync = require('fs').readFileSync;
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const expressReactViews = require('express-react-views');
const wallet = require('./lib/wallet');
const stock = require('./lib/stock');
const users = require('./lib/users');
const Credentials = require('bitcore-wallet-client/lib/credentials');
const uuid = require('uuid');
const ms = require('ms');
const path = require('path');
const crypto = require('crypto');

const satoshisPerBitcoin = 1e8;

const configPath = process.argv[2];
const { bws, google, secret } = JSON.parse(readFileSync(configPath, 'utf8'));

const services = {
  users: users({ clientEmail: google.client_email, privateKey: google.private_key }),
  stock: stock({ clientEmail: google.client_email, privateKey: google.private_key })
};

const app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jsx');
app.engine('jsx', expressReactViews.createEngine());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static('public'));
app.use((req, res, next) => {
  req.session = req.cookies.session || uuid.v4();
  res.cookie('session', req.session, { maxAge: ms('1Y'), httpOnly: true });
  req.signature = crypto.createHmac('sha256', secret)
    .update(req.session)
    .digest('hex');
  if (req.path.indexOf('/mnemonic') === 0 || req.path.indexOf('/session') === 0) {
    return next();
  }
  if (req.path.match(/\.(?:png|xml|ico|json)$/)) {
    return next();
  }
  services.users.list()
    .then((users) => {
      req.user = users.find((user) => user.session === req.session);
      if (!req.user) {
        console.warn(req.session, `User not found`);
        return res.status(403)
          .render('error', { session: req.session });
      }
      return wallet({ bws, mnemonic: req.user.mnemonic })
        .then((wallet) => {
          req.wallet = wallet;
          return wallet.balance();
        })
        .then((balance) => {
          req.balance = balance;
          next();
        });
    })
    .catch((e) => {
      console.error(req.session, e);
      res.status(500)
        .render('error', { session: req.session });
    });
});

app.get('/', (req, res) => {
  const { session, wallet, user, balance, signature } = req;
  services.stock.list()
    .then((stock) => stock.filter(item => item.inStock))
    .then((stock) => {
      res.render('home', { session, wallet, user, balance, stock, signature });
    })
    .catch((e) => {
      console.error(session, e);
      res.status(500)
        .render('error', req);
    });
});

app.get('/transactions', (req, res) => {
  const { session, wallet, user, balance } = req;
  Promise.all([wallet.transactions(), services.stock.list()])
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
          id: tx.txid,
          date: new Date(tx.time * 1000),
          label: item.name,
          amount: output.amount,
          quantity: Math.round(output.amount / satoshisPerBitcoin / item.scottcoinPrice)
        };
      })
        .filter(tx => tx)
        .filter((tx, i) => i < 10);
      res.render('transactions', { session, transactions, user, balance });
    })
    .catch((e) => {
      console.error(session, e);
      res.status(500)
        .render('error', req);
    });
});

app.get('/topup', (req, res) => {
  const amount = (req.query.amount ? Number(req.query.amount) : 5).toFixed(2);
  const { session, wallet, user, balance } = req;
  wallet.address()
    .then((address) => {
      res.render('topup', { user, balance, address, amount, session });
    })
    .catch((e) => {
      console.error(session, e);
      res.status(500)
        .render('error', req);
    });
});

app.post('/purchase/:address', (req, res) => {
  // csrf protection
  if (req.cookies.session !== req.body.session) {
    return res.sendStatus(400);
  }

  const { address } = req.params;
  const { session, wallet, user, balance } = req;

  services.stock.list()
    .then((stock) => stock.find(item => item.address === address))
    .then((item) => {
      const amountSatoshis = Math.round(item.scottcoinPrice * satoshisPerBitcoin);
      return wallet.send({ address, amount: amountSatoshis })
        .then(() => item);
    })
    .then((item) => {
      res.render('confirmation', { item, session, user, balance });
    })
    .catch((e) => {
      console.error(session, e);
      res.status(500)
        .render('error', req);
    });
});

app.get('/mnemonic/:secret', (req, res) => {
  if (req.params.secret !== secret) {
    return res.sendStatus(403);
  }

  res.send(Credentials.createWithMnemonic('livenet', '', 'en', 0));
});

app.get('/session/:session/:signature', (req, res) => {
  const { session, signature } = req.params;
  const validate = crypto.createHmac('sha256', secret)
    .update(session)
    .digest('hex');
  if (validate === signature) {
    res.cookie('session', session, { maxAge: ms('1Y'), httpOnly: true });
  }
  res.sendStatus(200);
});

app.listen(3000, () => console.log('Listening on port 3000'));
