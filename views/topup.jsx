const React = require('react');
const Layout = require('./layout.jsx');

module.exports = ({ user, balance, session, address, amount }) => (
  <Layout  session={session} balance={balance} user={user}>
    <p>
      Show this code to someone with scottcoins whilst crossing their palm with
      the appropriate amount of silver (£{amount}) and they'll top you up.
    </p>
    <img width="100%" src={`https://chart.googleapis.com/chart?cht=qr&chs=500x500&chl=bitcoin:${address}%3Famount%3D${amount}`}/>
    <p><small>{address}</small></p>
  </Layout>
);
