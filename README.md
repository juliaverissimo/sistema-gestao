# Sistema de Gestão e Agendamento de Tarefas

Stack: Node.js + Express, conexão manual com PostgreSQL (driver `pg`, sem ORM), HTML/CSS/JS puro.

## Como executar
1. No pgAdmin: crie o banco `saep_db` (botão direito em Databases > Create).
2. Abra o Query Tool em `saep_db`, cole e execute `saep_db.sql`.
3. Em `sistema/`, edite `.env` e coloque a senha do seu Postgres em `DB_PASSWORD`.
4. No terminal: `cd sistema && npm install && npm start`
5. Acesse http://localhost:3000 — login: `admin@saep.com` / `123456`

## Segurança / LGPD
- Senha: hash bcrypt (`crypt` + `gen_salt('bf')` do pgcrypto).
- CPF: criptografado com `pgp_sym_encrypt`; chave em `.env` (`CHAVE_CRIPTO`).
- Login com token JWT que expira em 1 hora.

## Requisitos funcionais
RF01 Login com mensagens de erro · RF02 Painel com nome do usuário, menu e logout ·
RF03 Cadastro/busca/exclusão de colaboradores · RF04 Cadastro de tarefas vinculadas a um colaborador ·
RF05 Cronograma ordenado por data com dados da tarefa e do responsável.

## Enviar ao GitHub
```
git init && echo "node_modules/\n.env" > .gitignore
git add . && git commit -m "Simulado - gestão de tarefas"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/SEU_REPO.git
git push -u origin main
```
