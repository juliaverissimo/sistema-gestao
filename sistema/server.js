require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const path = require('path');

// Conexão manual com o PostgreSQL (mesmo banco visto no pgAdmin)
const pool = new Pool({
  host: process.env.DB_HOST, port: process.env.DB_PORT,
  database: process.env.DB_NAME, user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});
const CHAVE = process.env.CHAVE_CRIPTO;

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Middleware: valida o token (expira em 1 hora)
function auth(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  try { req.user = jwt.verify(token, process.env.JWT_SECRET); next(); }
  catch { res.status(401).json({ erro: 'Sessão expirada. Faça login novamente.' }); }
}

// ---------- LOGIN ----------
app.post('/api/login', async (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) return res.status(400).json({ erro: 'Informe e-mail e senha.' });
  try {
    const r = await pool.query(
      'SELECT id, nome FROM usuarios WHERE email = $1 AND senha = crypt($2, senha)', [email, senha]);
    if (r.rowCount === 0) return res.status(401).json({ erro: 'Usuário ou senha inválidos.' });
    const token = jwt.sign({ id: r.rows[0].id, nome: r.rows[0].nome }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, nome: r.rows[0].nome });
  } catch (e) { console.error(e); res.status(500).json({ erro: 'Erro no servidor.' }); }
});

// ---------- COLABORADORES ----------
app.get('/api/colaboradores', auth, async (req, res) => {
  const busca = `%${req.query.busca || ''}%`;
  const r = await pool.query(
    `SELECT id, nome, email, cargo, pgp_sym_decrypt(cpf, $2) AS cpf
       FROM colaboradores
      WHERE nome ILIKE $1 OR email ILIKE $1 OR cargo ILIKE $1
      ORDER BY nome`, [busca, CHAVE]);
  res.json(r.rows);
});

app.post('/api/colaboradores', auth, async (req, res) => {
  const { nome, email, cpf, cargo } = req.body;
  if (!nome || !email || !cpf || !cargo) return res.status(400).json({ erro: 'Preencha todos os campos.' });
  await pool.query(
    'INSERT INTO colaboradores (nome, email, cpf, cargo) VALUES ($1, $2, pgp_sym_encrypt($3, $5), $4)',
    [nome, email, cpf.replace(/\D/g, ''), cargo, CHAVE]);
  res.status(201).json({ ok: true });
});

app.delete('/api/colaboradores/:id', auth, async (req, res) => {
  try { await pool.query('DELETE FROM colaboradores WHERE id = $1', [req.params.id]); res.json({ ok: true }); }
  catch { res.status(409).json({ erro: 'Colaborador possui tarefas e não pode ser excluído.' }); }
});

// ---------- TAREFAS ----------
app.get('/api/tarefas', auth, async (req, res) => {
  const r = await pool.query(
    `SELECT t.id, t.titulo, t.descricao, t.status, c.nome AS colaborador
       FROM tarefas t JOIN colaboradores c ON c.id = t.colaborador_id ORDER BY t.id`);
  res.json(r.rows);
});

app.post('/api/tarefas', auth, async (req, res) => {
  const { titulo, descricao, status, colaborador_id } = req.body;
  if (!titulo || !colaborador_id) return res.status(400).json({ erro: 'Informe o título e o responsável.' });
  await pool.query(
    'INSERT INTO tarefas (titulo, descricao, status, colaborador_id) VALUES ($1, $2, $3, $4)',
    [titulo, descricao, status || 'Pendente', colaborador_id]);
  res.status(201).json({ ok: true });
});

app.delete('/api/tarefas/:id', auth, async (req, res) => {
  await pool.query('DELETE FROM tarefas WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

// ---------- AGENDAMENTOS ----------
app.get('/api/agendamentos', auth, async (req, res) => {
  const r = await pool.query(
    `SELECT a.id, to_char(a.data_entrega, 'YYYY-MM-DD') AS data_entrega, a.observacao,
            t.titulo, t.descricao, t.status, c.nome AS colaborador, c.email, c.cargo
       FROM agendamentos a
       JOIN tarefas t ON t.id = a.tarefa_id
       JOIN colaboradores c ON c.id = t.colaborador_id
      ORDER BY a.data_entrega ASC`);
  res.json(r.rows);
});

app.post('/api/agendamentos', auth, async (req, res) => {
  const { tarefa_id, data_entrega, observacao } = req.body;
  if (!tarefa_id || !data_entrega) return res.status(400).json({ erro: 'Informe a tarefa e a data.' });
  await pool.query('INSERT INTO agendamentos (tarefa_id, data_entrega, observacao) VALUES ($1, $2, $3)',
    [tarefa_id, data_entrega, observacao]);
  res.status(201).json({ ok: true });
});

app.listen(3000, () => console.log('Sistema rodando em http://localhost:3000'));
