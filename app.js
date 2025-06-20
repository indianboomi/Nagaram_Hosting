const express = require('express');
const session = require('express-session');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = 3000;

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
}));

app.use(express.static('views'));

app.get('/', (req, res) => {
  if (req.session.user) {
    res.redirect('/dashboard');
  } else {
    const oauthUrl = `https://discord.com/api/oauth2/authorize?client_id=${process.env.CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}&response_type=code&scope=identify`;
    res.send(`<a href="${oauthUrl}">Login with Discord</a>`);
  }
});

app.get('/callback', async (req, res) => {
  const code = req.query.code;

  if (!code) return res.send('No code provided');

  try {
    const tokenRes = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.REDIRECT_URI,
      scope: 'identify'
    }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const userRes = await axios.get('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenRes.data.access_token}` }
    });

    req.session.user = userRes.data;
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.send('Error logging in');
  }
});

app.get('/dashboard', (req, res) => {
  if (!req.session.user) return res.redirect('/');
  const user = req.session.user;
  res.send(`
  <h1>Welcome, ${user.username}#${user.discriminator}</h1>
  <img src="https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png" width="100">
  <br><a href="/logout">Logout</a>
`);
res.sendFile(__dirname + '/views/dashboard.html');
const html = `
<!DOCTYPE html>
<html lang="en">
<head>...same HTML from above...</head>
<body>
  <!-- rest of the HTML -->
  <h1>Welcome, ${user.username}#${user.discriminator}</h1>
  <img src="https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png" width="100" alt="User Avatar" />
</body>
</html>
`;

res.send(html);
