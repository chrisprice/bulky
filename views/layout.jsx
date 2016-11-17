const React = require('react');
const Price = require('./price.jsx');

module.exports = ({ children, session, balance, user }) => (
  <html>
  <head>
    <title>Bulky - Powered by Scottcoin</title>
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    <meta name="apple-mobile-web-app-capable" content="yes"/>
    <style>
    {`
      button {
        overflow: hidden;
      }
      button h1 {
        animation: spin 1s linear infinite;
      }
      @keyframes spin {
        33% {
          transform:rotateX(360deg);
        }
        50% {
          transform:rotateY(360deg);
        }
        75% {
          transform:rotateZ(360deg);
        }
      }
      button p {
        animation: scroll 5s linear infinite;
      }
      @keyframes scroll {
        0% {
          transform:translate(110%, 0);
        }
        100% {
          transform:translate(-110%, 0);
        }
      }
    `}
    </style>
  </head>
  <body>
    <header>
      <form action="/" method="GET">
        <button type="submit">
          <h1>Bulky</h1>
          <p><small>Powered By Scottcoin</small></p>
        </button>
      </form>
      {
        user != null && balance != null && (
          <form action="/transactions" method="GET">
            <br/>
            <button type="submit">
              {user.name} <Price priceInSatoshis={balance.availableAmount}/>
            </button>
          </form>
        )
      }
    </header>
    <hr/>
    {children}
    <hr/>
    <footer>
      <small>{session}</small>
    </footer>
  </body>
  </html>
);
