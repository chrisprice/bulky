const React = require('react');
const Layout = require('./layout');

module.exports = ({ children, session }) => (
  <Layout session={session}>
    <h3>Opps</h3>
    <p>Something went wrong</p>
  </Layout>
);
