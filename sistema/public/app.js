const $ = id => document.getElementById(id);
if (!localStorage.token) location.href = 'index.html';
$('usuario').textContent = localStorage.nome;
document.querySelector('.nome').textContent = localStorage.nome;

function sair() { localStorage.clear(); location.href = 'index.html'; }
$('sair').onclick = sair;

function aviso(texto, tipo = 'ok') { $('msg').textContent = texto; $('msg').className = 'msg ' + tipo; }
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cpfMask = c => c.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
const dataBR = d => d.split('-').reverse().join('/');

async function api(url, metodo = 'GET', corpo) {
  const r = await fetch(url, { method: metodo,
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.token },
    body: corpo ? JSON.stringify(corpo) : undefined });
  const d = await r.json();
  if (r.status === 401) { alert(d.erro); sair(); }
  if (!r.ok) throw new Error(d.erro || 'Erro inesperado.');
  return d;
}

function tabela(cols, linhas, vazio) {
  if (!linhas.length) return `<p class="vazio">${vazio}</p>`;
  return `<table><thead><tr>${cols.map(c => `<th>${c}</th>`).join('')}</tr></thead>
    <tbody>${linhas.map(l => `<tr>${l.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}

// Navegação
function ir(v) {
  document.querySelectorAll('section').forEach(s => s.classList.toggle('ativo', s.id === v));
  document.querySelectorAll('nav button').forEach(b => b.classList.toggle('ativo', b.dataset.v === v));
  aviso('');
  ({ colaboradores: carregarColab, tarefas: carregarTarefas, agenda: carregarAgenda })[v]?.();
}
document.querySelectorAll('[data-v]').forEach(b => b.onclick = () => ir(b.dataset.v));
document.querySelectorAll('[data-ir]').forEach(b => b.onclick = () => ir(b.dataset.ir));

// Colaboradores
async function carregarColab() {
  try {
    const l = await api('/api/colaboradores?busca=' + encodeURIComponent($('busca').value.trim()));
    $('t-col').innerHTML = tabela(['Nome', 'E-mail', 'CPF', 'Cargo', ''],
      l.map(c => [esc(c.nome), esc(c.email), cpfMask(esc(c.cpf)), esc(c.cargo),
        `<button class="btn perigo" onclick="excluirColab(${c.id})">Excluir</button>`]),
      'Nenhum colaborador encontrado.');
  } catch (e) { aviso(e.message, 'erro'); }
}
$('f-busca').onsubmit = e => { e.preventDefault(); carregarColab(); };
$('limpar').onclick = () => { $('busca').value = ''; carregarColab(); };
$('f-col').onsubmit = async e => {
  e.preventDefault();
  try {
    await api('/api/colaboradores', 'POST', { nome: $('c-nome').value, email: $('c-email').value,
      cpf: $('c-cpf').value, cargo: $('c-cargo').value });
    e.target.reset(); aviso('Colaborador cadastrado.'); carregarColab();
  } catch (er) { aviso(er.message, 'erro'); }
};
async function excluirColab(id) {
  if (!confirm('Excluir este colaborador?')) return;
  try { await api('/api/colaboradores/' + id, 'DELETE'); aviso('Colaborador excluído.'); carregarColab(); }
  catch (e) { aviso(e.message, 'erro'); }
}

// Tarefas
async function carregarTarefas() {
  try {
    const [cols, tars] = await Promise.all([api('/api/colaboradores'), api('/api/tarefas')]);
    $('t-resp').innerHTML = '<option value="">Selecione...</option>' +
      cols.map(c => `<option value="${c.id}">${esc(c.nome)}</option>`).join('');
    $('t-tar').innerHTML = tabela(['Título', 'Descrição', 'Status', 'Responsável', ''],
      tars.map(t => [esc(t.titulo), esc(t.descricao), esc(t.status), esc(t.colaborador),
        `<button class="btn perigo" onclick="excluirTarefa(${t.id})">Excluir</button>`]),
      'Nenhuma tarefa cadastrada.');
  } catch (e) { aviso(e.message, 'erro'); }
}
$('f-tar').onsubmit = async e => {
  e.preventDefault();
  try {
    await api('/api/tarefas', 'POST', { titulo: $('t-titulo').value, descricao: $('t-desc').value,
      status: $('t-status').value, colaborador_id: $('t-resp').value });
    e.target.reset(); aviso('Tarefa cadastrada.'); carregarTarefas();
  } catch (er) { aviso(er.message, 'erro'); }
};
async function excluirTarefa(id) {
  if (!confirm('Excluir esta tarefa?')) return;
  try { await api('/api/tarefas/' + id, 'DELETE'); aviso('Tarefa excluída.'); carregarTarefas(); }
  catch (e) { aviso(e.message, 'erro'); }
}

// Agendamentos
async function carregarAgenda() {
  try {
    const [tars, ag] = await Promise.all([api('/api/tarefas'), api('/api/agendamentos')]);
    $('a-tarefa').innerHTML = '<option value="">Selecione...</option>' +
      tars.map(t => `<option value="${t.id}">${esc(t.titulo)} (${esc(t.colaborador)})</option>`).join('');
    $('t-age').innerHTML = tabela(['Entrega', 'Tarefa', 'Descrição', 'Status', 'Responsável', 'E-mail', 'Cargo', 'Obs.'],
      ag.map(a => [dataBR(a.data_entrega), esc(a.titulo), esc(a.descricao), esc(a.status),
        esc(a.colaborador), esc(a.email), esc(a.cargo), esc(a.observacao)]),
      'Nenhum agendamento cadastrado.');
  } catch (e) { aviso(e.message, 'erro'); }
}
$('f-age').onsubmit = async e => {
  e.preventDefault();
  try {
    await api('/api/agendamentos', 'POST', { tarefa_id: $('a-tarefa').value, data_entrega: $('a-data').value,
      observacao: $('a-obs').value });
    e.target.reset(); aviso('Agendamento criado.'); carregarAgenda();
  } catch (er) { aviso(er.message, 'erro'); }
};
