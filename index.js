const express = require('express');
const axios = require('axios');
const session = require('express-session');

const app = express();
const PORT = 3000;
const CLIENT_ID = '1139276098987901002';
const CLIENT_SECRET = 'Gwe-8hs9vSZAaGpc_0dGHPlTmJSpcbCG';
const REDIRECT_URI = 'http://nxbot.onrender.com/callback';
const SESSION_SECRET = 'UmaChaveSecretaMuitoComplexa123!@#';

app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: true
}));

app.get('/', (req, res) => {
  if (!req.session.accessToken) {
    res.send(`
      <html>
        <body>
          <h1>Bot Designer for Discord</h1>
          <a href="/login">Login with Discord</a>
        </body>
      </html>
    `);
  } else {
    res.send(`
      <html>
        <body>
          <h1>Welcome, ${req.session.user.username}#${req.session.user.discriminator}!</h1>
          <a href="/logout">Logout</a>
        </body>
      </html>
    `);
  }
});

app.get('/login', (req, res) => {
  res.redirect(`https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify`);
});

app.get('/callback', async (req, res) => {
  const code = req.query.code;

  const response = await axios.post('https://discord.com/api/oauth2/token', {
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    code: code,
    grant_type: 'authorization_code',
    redirect_uri: REDIRECT_URI,
    scope: 'identify'
  });

  const accessToken = response.data.access_token;

  const userResponse = await axios.get('https://discord.com/api/v10/users/@me', {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  const user = userResponse.data;

  req.session.accessToken = accessToken;
  req.session.user = user;

  res.redirect('/');
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
