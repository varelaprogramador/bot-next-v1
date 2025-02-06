import express from 'express';
import { clerkClient } from '@clerk/express';

const app = express();
app.use(express.json());

// Endpoint para atualizar o usuário
app.post('/update-user', async (req, res) => {
  const { userId, firstName, lastName, email } = req.body;

  try {
    const updatedUser = await clerkClient.users.updateUser(userId, {
      firstName,
      lastName,
     
    });
    res.json(updatedUser);
  } catch (error) {
    console.error("Erro ao atualizar o usuário:", error);
    res.status(500).json({ error: 'Erro ao atualizar o usuário' });
  }
});

// Endpoint para criar um novo usuário (admin-only)
app.post('/create-user', async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  try {
    const newUser = await clerkClient.users.createUser({
      firstName,
      lastName,
      emailAddress: [email], // O email deve ser um array de emails
      password,
    });
    res.json(newUser);
  } catch (error) {
    console.error("Erro ao criar novo usuário:", error);
    res.status(500).json({ error: 'Erro ao criar novo usuário' });
  }
});

// Endpoint para obter todos os usuários
app.get('/get-users', async (req, res) => {
  try {
    // Obtendo todos os usuários
    const users = await clerkClient.users.getUserList({
      orderBy: '-created_at', // Ordenando pela data de criação (mais recente primeiro)
    });

    res.json(users.data); // Retorna apenas os dados dos usuários
  } catch (error) {
    console.error("Erro ao obter todos os usuários:", error);
    res.status(500).json({ error: 'Erro ao obter todos os usuários' });
  }
});

// Iniciar o servidor
app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});
