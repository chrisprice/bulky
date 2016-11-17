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
      header div {
        overflow: hidden;
      }
      header div h1 {
        text-align: center;
      }
      header div h1 a {
        color: black;
        text-decoration: none;
      }
      header div p {
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
      <div>
        <h1><a href="/">Bulky</a></h1>
        <p><small>Powered By Scottcoin</small></p>
      </div>
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
