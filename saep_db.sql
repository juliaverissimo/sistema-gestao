-- Execute no pgAdmin: Query Tool conectado ao banco "saep_db"
-- (CREATE DATABASE saep_db; deve ser executado antes, conectado ao banco "postgres")
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DROP TABLE IF EXISTS agendamentos, tarefas, colaboradores, usuarios CASCADE;

CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  senha TEXT NOT NULL                     -- hash bcrypt (crypt)
);

CREATE TABLE colaboradores (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(120) NOT NULL,
  cpf BYTEA NOT NULL,                     -- criptografado (pgp_sym_encrypt)
  cargo VARCHAR(80) NOT NULL
);

CREATE TABLE tarefas (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(120) NOT NULL,
  descricao TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'Pendente',
  colaborador_id INT NOT NULL REFERENCES colaboradores(id)
);

CREATE TABLE agendamentos (
  id SERIAL PRIMARY KEY,
  tarefa_id INT NOT NULL REFERENCES tarefas(id) ON DELETE CASCADE,
  data_entrega DATE NOT NULL,
  observacao VARCHAR(200)
);

-- Chave de criptografia do CPF: 'chave_lgpd_saep' (a mesma deve estar no .env)
INSERT INTO usuarios (nome, email, senha) VALUES
 ('Administrador', 'admin@saep.com', crypt('123456', gen_salt('bf'))),
 ('Maria Gestora', 'maria@saep.com', crypt('senha123', gen_salt('bf'))),
 ('João Gerente',  'joao@saep.com',  crypt('abc123',   gen_salt('bf')));

INSERT INTO colaboradores (nome, email, cpf, cargo) VALUES
 ('Ana Souza',    'ana@empresa.com',    pgp_sym_encrypt('11122233344', 'chave_lgpd_saep'), 'Analista'),
 ('Bruno Lima',   'bruno@empresa.com',  pgp_sym_encrypt('55566677788', 'chave_lgpd_saep'), 'Desenvolvedor'),
 ('Carla Mendes', 'carla@empresa.com',  pgp_sym_encrypt('99988877766', 'chave_lgpd_saep'), 'Gerente de Projetos');

INSERT INTO tarefas (titulo, descricao, status, colaborador_id) VALUES
 ('Levantar requisitos',   'Reunião com o cliente',         'Concluída',    1),
 ('Modelar banco de dados','Criar DER e script SQL',        'Em andamento', 2),
 ('Revisar cronograma',    'Ajustar prazos do projeto',     'Pendente',     3);

INSERT INTO agendamentos (tarefa_id, data_entrega, observacao) VALUES
 (1, CURRENT_DATE + 2,  'Entregar ata da reunião'),
 (2, CURRENT_DATE + 5,  'Validar com o gestor'),
 (3, CURRENT_DATE + 10, 'Apresentar à diretoria');
