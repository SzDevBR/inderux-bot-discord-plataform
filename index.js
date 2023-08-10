const express = require('express');
const axios = require('axios');
const session = require('express-session');
const mongoose = require('mongoose');

const app = express();
const PORT = 3000;
const CLIENT_ID = '1139276098987901002';
const CLIENT_SECRET = 'Gwe-8hs9vSZAaGpc_0dGHPlTmJSpcbCG';
const REDIRECT_URI = 'http://nxbot.onrender.com/callback';
const SESSION_SECRET = 'UmaChaveSecretaMuitoComplexa123!@#';

const app = express();
const PORT = 3000;
const MONGODB_URI = 'mongodb+srv://inderux:inderux@cluster0.yuzl0.mongodb.net/?retryWrites=true&w=majority'; // Altere a URI para sua configuração

mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const clientSchema = new mongoose.Schema({
  name: String,
  description: String,
  userId: String, // ID do usuário do Discord
  commands: [{ name: String, content: String }],
  variables: [{ name: String, content: String }]
});

const Client = mongoose.model('Client', clientSchema);

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
    res.send(`<html>
      <body>
        <h1>Welcome, ${req.session.user.username}#${req.session.user.discriminator}!</h1>
        
        <h2>Your Applications:</h2>
        <ul>
          ${userApplications.map(application => `
            <li><a href="/applications/${application.id}">${application.name}</a></li>
          `).join('')}
        </ul>
        
        <a href="/applications/create">Create New Application</a><br>
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
app.get('/applications', (req, res) => {
  if (!req.session.accessToken) {
    return res.redirect('/');
  }

const userId = req.session.user.id;
  const userApplications = await Client.find({ userId });

  res.send(`
    <html>
      <body>
        <h1>Your Applications</h1>
        <ul>
          ${userApplications.map(application => `
            <li><a href="/applications/${application.id}">${application.name}</a></li>
          `).join('')}
        </ul>
      </body>
    </html>
  `);
});

// Rota para exibir detalhes e permitir a edição de uma aplicação específica
app.get('/applications/:id', (req, res) => {
  const applicationId = req.params.id;

  const applicationDetails = await Client.findById(applicationId);
  
  res.send(`
    <html>
      <body>
        <h1>${applicationDetails.name}</h1>
        <p>Description: ${applicationDetails.description}</p>
        <h2>Commands</h2>
        <ul>
          ${applicationDetails.commands.map(command => `
            <li>
              ${command.name} - 
              <a href="/applications/${applicationId}/commands/${command.id}/edit">Edit</a> |
              <a href="/applications/${applicationId}/commands/${command.id}/delete">Delete</a>
            </li>
          `).join('')}
        </ul>
        <a href="/applications/${applicationId}/commands/create">Create New Command</a>
      </body>
    </html>
  `);
});

// Rota para criar um novo comando em uma aplicação específica
// Rota para criar um novo comando em uma aplicação específica
app.get('/applications/:id/commands/create', async (req, res) => {
  const applicationId = req.params.id;

  // Verificar se o usuário está autenticado
  if (!req.session.accessToken) {
    return res.redirect('/');
  }

  // Verificar se o usuário é dono da aplicação (ou aplicar lógica de permissão adequada)
  const userId = req.session.user.id;
  const application = await Client.findOne({ _id: applicationId, userId });

  if (!application) {
    return res.status(403).send('You do not have permission to create a command for this application.');
  }

  res.send(`
    <html>
      <body>
        <h1>Create New Command</h1>
        <form method="post" action="/applications/${applicationId}/commands">
          <label for="commandName">Command Name:</label>
          <input type="text" id="commandName" name="commandName" required><br>
          <label for="commandContent">Command Content:</label>
          <textarea id="commandContent" name="commandContent" required></textarea><br>
          <button type="submit">Create Command</button>
        </form>
      </body>
    </html>
  `);
});

// Rota para processar o formulário de criação de comando
app.post('/applications/:id/commands', async (req, res) => {
  const applicationId = req.params.id;
  const { commandName, commandContent } = req.body;

  // Verificar se o usuário está autenticado
  if (!req.session.accessToken) {
    return res.redirect('/');
  }

  // Verificar se o usuário é dono da aplicação (ou aplicar lógica de permissão adequada)
  const userId = req.session.user.id;
  const application = await Client.findOne({ _id: applicationId, userId });

  if (!application) {
    return res.status(403).send('You do not have permission to create a command for this application.');
  }

  // Criar o novo comando e salvar no banco de dados
  application.commands.push({ name: commandName, content: commandContent });
  await application.save();

  res.redirect(`/applications/${applicationId}`);
});


// Rota para editar um comando específico em uma aplicação
app.get('/applications/:appId/commands/:cmdId/edit', async (req, res) => {
  const applicationId = req.params.appId;
  const commandId = req.params.cmdId;

  // Verificar se o usuário está autenticado
  if (!req.session.accessToken) {
    return res.redirect('/');
  }

  // Verificar se o usuário é dono da aplicação (ou aplicar lógica de permissão adequada)
  const userId = req.session.user.id;
  const application = await Client.findOne({ _id: applicationId, userId });


  if (!application) {
    return res.status(403).send('You do not have permission to edit commands for this application.');
  }

  // Encontrar o comando pelo ID
  const command = application.commands.find(cmd => cmd.id === commandId);

  if (!command) {
    return res.status(404).send('Command not found.');
  }

  res.send(`
    <html>
      <body>
        <h1>Edit Command</h1>
        <form method="post" action="/applications/${applicationId}/commands/${commandId}/edit">
          <label for="commandName">Command Name:</label>
          <input type="text" id="commandName" name="commandName" value="${command.name}" required><br>
          <label for="commandContent">Command Content:</label>
          <textarea id="commandContent" name="commandContent" required>${command.content}</textarea><br>
          <button type="submit">Save Changes</button>
        </form>
      </body>
    </html>
  `);
  // Atualizar os detalhes do comando
  command.name = commandName;
  command.content = commandContent;

  // Salvar as mudanças no banco de dados
  await application.save();

  res.redirect(`/applications/${applicationId}`);
});

// Rota para deletar um comando específico em uma aplicação
app.get('/applications/:appId/commands/:cmdId/delete', async (req, res) => {
  const applicationId = req.params.appId;
  const commandId = req.params.cmdId;

  // Verificar se o usuário está autenticado
  if (!req.session.accessToken) {
    return res.redirect('/');
  }

  // Verificar se o usuário é dono da aplicação (ou aplicar lógica de permissão adequada)
  const userId = req.session.user.id;
  const application = await Client.findOne({ _id: applicationId, userId });

  if (!application) {
    return res.status(403).send('You do not have permission to delete commands for this application.');
  }

  // Encontrar o índice do comando pelo ID
  const commandIndex = application.commands.findIndex(cmd => cmd.id === commandId);

  if (commandIndex === -1) {
    return res.status(404).send('Command not found.');
  }

  // Remover o comando do array
  application.commands.splice(commandIndex, 1);

  // Salvar as mudanças no banco de dados
  await application.save();

  res.redirect(`/applications/${applicationId}`);
});





app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
