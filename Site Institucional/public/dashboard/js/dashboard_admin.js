// public/dashboard/js/dashboard_admin.js
// Dashboard Admin - SyncHeart

document.addEventListener('DOMContentLoaded', () => {
  iniciarDashboardAdmin();
});

// ---------- Estado local ----------
let modelos = [];
let dispositivosPorModelo = {}; // { modeloId: [{ dispositivo_uuid, dispositivo_id }] }
let equipes = []; // { equipe_id, nome_equipe }
let ticketsClinica = []; // todos tickets ativos vindos do Jira (clínica)
let ticketsFiltrados = []; // tickets do segmento 3 (filtrados por modelo)

let chartStacked = null;
let chartDonut = null;
let chartMeanTime = null;

// ---------- Elementos DOM ----------
const breadcrumbClinicaInfoEl = document.getElementById('breadcrumb_path');
const headerUserInfoEl = document.getElementById('header_user_info');

const kpiQtdDevicesEl = document.getElementById('kpi_qtd_devices');
const kpiQtdModelsEl = document.getElementById('kpi_qtd_models');
const kpiQtdSquadsEl = document.getElementById('kpi_qtd_squads');

const qtdUnsolvedEl = document.getElementById('qtd_unsolved');
const levelUnsolvedEl = document.getElementById('level_qtd_devices_with_not_solved_alerts');
const qtdOverwhelmedEl = document.getElementById('qtd_overwhelmed_squads');
const levelOverwhelmedEl = document.getElementById('level_qtd_overwhelmed_squads');
const meanTimeResolutionEl = document.getElementById('mean_time_resolution');

const graficoTarefasEquipesEl = document.getElementById('graficoBarrasEmpilhadasAcompanhamentoTarefasEquipes');
const graficoDonutStatusEl = document.getElementById('graficoDonutStatusAlertas');
const graficoTempoEquipeEl = document.getElementById('graficoBarrasTempoMedioResolucaoCadaEquipe');

const selectFilterModel = document.getElementById('filter_by_model');
const eventsBody = document.getElementById('eventsBody');

// ---------- Inicialização ----------
async function iniciarDashboardAdmin() {
  const dadosUsuarioLogado = JSON.parse(sessionStorage.getItem("USUARIO_LOGADO"));
  const token = sessionStorage.getItem('authToken');

  if (!dadosUsuarioLogado || !token) {
    window.location.href = "../login.html";
    return;
  }

  // mostra clínica no breadcrumb do cabeçalho
  breadcrumbClinicaInfoEl.textContent = dadosUsuarioLogado.clinica.nome;
  // mostra usuário no cabeçalho
  headerUserInfoEl.innerHTML = `<div class="user-info"><span class="user-name">${dadosUsuarioLogado.usuario.nome}</span><span class="user-email">${dadosUsuarioLogado.usuario.email}</span></div>`;

  // carrega dados essenciais
  await Promise.all([
    carregarModelos(token),
    carregarEquipes(dadosUsuarioLogado.usuario.clinicaId, token),
    carregarTicketsClinica(dadosUsuarioLogado.clinica.nome, token)
  ]);

  await carregarDispositivosDeModelos(token);

  montarKPIsSegmento1();
  montarSegmento2();
  popularSelectModelos();
  aplicarFiltroModelo('geral'); // carrega segmento 3 com todos os tickets (últimos 90 dias)
}

// ---------- Fetchers / backend calls ----------

async function carregarModelos(token) {
  try {
    const res = await fetch('/modelos/listar', { headers: { 'Authorization': `Bearer ${token}` } });
    if (!res.ok) throw new Error('Falha ao carregar modelos');
    modelos = await res.json();
    if (kpiQtdModelsEl) kpiQtdModelsEl.innerText = modelos.length;
  } catch (err) {
    console.error('carregarModelos', err);
    modelos = [];
  }
}

async function carregarEquipes(idClinica, token) {
  try {
    const res = await fetch(`/equipes/por-clinica/${idClinica}`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (!res.ok) throw new Error('Falha ao carregar equipes');
    equipes = await res.json();
    if (kpiQtdSquadsEl) kpiQtdSquadsEl.innerText = equipes.length;
  } catch (err) {
    console.error('carregarEquipes', err);
    equipes = [];
  }
}

async function carregarDispositivosDeModelos(token) {
  dispositivosPorModelo = {};
  try {
    for (let m of modelos) {
      try {
        const res = await fetch(`/modelos/listar/${m.modelo_id}/dispositivos`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) throw new Error('Falha ao carregar dispositivos');
        const lista = await res.json();
        dispositivosPorModelo[m.modelo_id] = lista.map(d => ({ dispositivo_uuid: d.dispositivo_uuid, dispositivo_id: d.dispositivo_id }));
      } catch (e) {
        dispositivosPorModelo[m.modelo_id] = [];
        console.error('modelo dispositivos erro', m.modelo_id, e);
      }
    }
    const totalDevices = Object.values(dispositivosPorModelo).reduce((acc, arr) => acc + arr.length, 0);
    if (kpiQtdDevicesEl) kpiQtdDevicesEl.innerText = totalDevices;
  } catch (err) {
    console.error('carregarDispositivosDeModelos', err);
  }
}

// >>>>>>>>>> TODO: CONFERIR AQUI SE FUNCIONA COM O JIRA <<<<<<<<<<<
// tickets da clínica (rota esperada: GET /jira/listar/:nomeClinica)
async function carregarTicketsClinica(nomeClinica, token) {
  try {
    const nomeUrl = encodeURIComponent(nomeClinica.replaceAll(' ', '_'));
    const res = await fetch(`/jira/listar/${nomeUrl}`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (!res.ok) throw new Error('Falha ao carregar tickets Jira');
    ticketsClinica = await res.json();
  } catch (err) {
    console.error('carregarTicketsClinica', err);
    ticketsClinica = [];
  }
}

// >>>>>>>>>> TODO: CONFERIR AQUI SE FUNCIONA COM O JIRA <<<<<<<<<<<
// rota usada no dashboard_modelo.js para buscar por modelo
async function buscarTicketsPorModelo(nomeClinica, idModelo, token) {
  try {
    const resposta = await fetch('/jira/listar/modelo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ nomeClinica, idModelo })
    });
    if (!resposta.ok) throw new Error('Falha ao buscar tickets por modelo');
    return await resposta.json();
  } catch (err) {
    console.error('buscarTicketsPorModelo', err);
    return [];
  }
}

// ---------- Segmento 1: Geral da Clínica (KPIs de Dimensão e Risco Operacional) ----------

function montarKPIsSegmento1() {


  // >>>>>>>>>> TODO: CONFERIR AQUI SE FUNCIONA COM O JIRA <<<<<<<<<<<
  // dispositivos com alertas não resolvidos = devices únicos extraídos dos ticketsClinica
  const uniqueDeviceUuids = new Set();
  ticketsClinica.forEach(t => {
    try {
      const description = t.description?.content?.[0]?.content?.[0]?.text || '';
      // Confere se o ticket tem description e content, [0] pega o primeiro elemento do array content.
      // Se tudo existir até aqui, pega a propriedade text desse objeto.
      // Se em qualquer ponto o resultado for undefined ou null, o valor final será uma string vazia ('').
      // Garante que o description seja sempre uma string.
      const firstLine = description.split('\n')[0] || '';
      const uuid = (firstLine.split(':')[1] || '').trim().substring(0, 36);
      // .substring() Pega os primeiros 36 caracteres da string porque um UUID padrão tem exatamente 36 caracteres (incluindo os hífens).
      if (uuid) uniqueDeviceUuids.add(uuid);
    } catch (e) { /* ignorar */ }
  });
  const devicesWithUnresolved = uniqueDeviceUuids.size;
  if (qtdUnsolvedEl) qtdUnsolvedEl.innerText = devicesWithUnresolved;

  // barra nível
  const totalDevices = Number(kpiQtdDevicesEl?.innerText || 0);
  const pct = totalDevices === 0 ? 0 : Math.round((devicesWithUnresolved / totalDevices) * 100);
  if (levelUnsolvedEl) {
    levelUnsolvedEl.style.width = Math.min(100, pct) + '%';
    levelUnsolvedEl.style.background = pct > 50 ? '#e74c3c' : (pct > 0 ? '#f1c40f' : '#10982bff');
  }


  
  // equipes sobrecarregadas (>30 não resolvidos)
  // Heurística: tenta extrair "Equipe: X" do description do ticket; se não houver, conta como 'Sem Equipe'
  const countPorEquipe = {};
  ticketsClinica.forEach(t => {
    try {
      const description = t.description?.content?.[0]?.content?.[0]?.text || '';
      const lines = description.split('\n').map(l => l.trim());
      let equipeLine = lines.find(l => /^Equipe\s*:/i.test(l));
      let equipe = equipeLine ? equipeLine.split(':')[1].trim() : 'Sem Equipe';
      countPorEquipe[equipe] = (countPorEquipe[equipe] || 0) + 1;
    } catch (e) { /* ignorar */ }
  });

  const overwhelmedCount = Object.values(countPorEquipe).filter(v => v > 30).length;
  if (qtdOverwhelmedEl) qtdOverwhelmedEl.innerText = overwhelmedCount;
  if (levelOverwhelmedEl) {
    const squadCount = equipes.length || 1;
    const pctSquads = Math.round((overwhelmedCount / squadCount) * 100);
    levelOverwhelmedEl.style.width = Math.min(100, pctSquads) + '%';
    levelOverwhelmedEl.style.background = pctSquads > 50 ? '#e74c3c' : (pctSquads > 0 ? '#f1c40f' : '#10982bff');
  }

  // tempo médio de resolução (dias) - tickets com campo resolvido_em
  let somaDias = 0;
  let n = 0;
  ticketsClinica.forEach(t => {
    try {
      const detectado = t.detectado_em ? new Date(t.detectado_em) : null;
      const resolvido = t.resolvido_em ? new Date(t.resolvido_em) : null;
      if (detectado && resolvido) {
        somaDias += (resolvido - detectado) / (1000 * 60 * 60 * 24);
        n++;
      }
    } catch (e) { /* ignorar */ }
  });
  const mediaDias = n === 0 ? 0 : Math.round((somaDias / n) * 10) / 10;
  if (meanTimeResolutionEl) {
    meanTimeResolutionEl.innerText = mediaDias;
    meanTimeResolutionEl.style.color = mediaDias > 7 ? '#e74c3c' : (mediaDias > 2 ? '#f1c40f' : '#10982bff');
  }
}

// ---------- Segmento 2: Gráfico de barras empilhadas por equipe ----------

function montarSegmento2() {
  // Agrupa ticketsClinica por equipe e por status
  const grupos = {}; // { equipe: { resolvidos, em_analise, ativos } }

  ticketsClinica.forEach(t => {
    try {
      const description = t.description?.content?.[0]?.content?.[0]?.text || '';
      const lines = description.split('\n').map(l => l.trim());
      let equipeLine = lines.find(l => /^Equipe\s*:/i.test(l));
      let equipe = equipeLine ? equipeLine.split(':')[1].trim() : 'Sem Equipe';

      if (!grupos[equipe]) grupos[equipe] = { resolvidos: 0, em_analise: 0, ativos: 0 };

      const status = (t.status || t.fields?.status?.name || '').toString().toLowerCase();
      if (status.includes('resolv') || status.includes('done') || status.includes('closed')) grupos[equipe].resolvidos++;
      else if (status.includes('anal') || status.includes('in progress') || status.includes('em analis')) grupos[equipe].em_analise++;
      else grupos[equipe].ativos++;
    } catch (e) { /* ignorar */ }
  });

  const labels = Object.keys(grupos);
  const dadosResolvidos = labels.map(l => grupos[l].resolvidos);
  const dadosEmAnalise = labels.map(l => grupos[l].em_analise);
  const dadosAtivos = labels.map(l => grupos[l].ativos);

  if (!graficoTarefasEquipesEl) return;
  if (chartStacked) chartStacked.destroy();

  chartStacked = new Chart(graficoTarefasEquipesEl.getContext('2d'), {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Resolvidos', data: dadosResolvidos },
        { label: 'Em acompanhamento', data: dadosEmAnalise },
        { label: 'Ativos', data: dadosAtivos }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } },
      plugins: { legend: { position: 'bottom' } }
    }
  });
}

// ---------- Segmento 3: filtros por modelo + KPIs, gráficos e lista ----------

function popularSelectModelos() {
  if (!selectFilterModel) return;
  selectFilterModel.innerHTML = '';

  const optGeral = document.createElement('option');
  optGeral.value = 'geral';
  optGeral.text = 'Geral';
  selectFilterModel.appendChild(optGeral);

  modelos.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.modelo_id;
    opt.text = `${m.nome_fabricante || ''} ${m.nome_modelo || ''}`;
    selectFilterModel.appendChild(opt);
  });

  selectFilterModel.addEventListener('change', (e) => {
    aplicarFiltroModelo(e.target.value);
  });
}

async function aplicarFiltroModelo(valor) {
  const token = sessionStorage.getItem('authToken');
  const dadosUsuarioLogado = JSON.parse(sessionStorage.getItem("USUARIO_LOGADO"));
  const nomeClinica = dadosUsuarioLogado.clinica.nome;

  if (valor === 'geral') {
    ticketsFiltrados = ticketsClinica.slice();
  } else {
    ticketsFiltrados = await buscarTicketsPorModelo(nomeClinica, Number(valor), token);
  }

  montarSegmento3();
}

function montarSegmento3() {
  montarKPIsStatusAlertas();
  montarGraficoTempoResolucaoPorEquipe();
  popularListaAlertasRecentes();
}

// KPIs status alertas + donut
function montarKPIsStatusAlertas() {
  const total = ticketsFiltrados.length;
  const resolvidos = ticketsFiltrados.filter(t => {
    const status = (t.status || t.fields?.status?.name || '').toString().toLowerCase();
    return status.includes('resolv') || status.includes('done') || status.includes('closed');
  }).length;
  const emAcompanhamento = ticketsFiltrados.filter(t => {
    const status = (t.status || t.fields?.status?.name || '').toString().toLowerCase();
    return status.includes('anal') || status.includes('in progress');
  }).length;
  const ativos = total - resolvidos;

  document.getElementById('kpi_alerts_total').innerText = total;
  document.getElementById('kpi_alerts_solved').innerText = resolvidos;
  document.getElementById('kpi_alerts_in_progress').innerText = emAcompanhamento;
  document.getElementById('kpi_alerts_active').innerText = ativos;

  // cores simples
  document.getElementById('kpi_alerts_solved').style.color = resolvidos > 0 ? '#10982bff' : '#555';
  document.getElementById('kpi_alerts_in_progress').style.color = emAcompanhamento > 0 ? '#f1c40f' : '#555';
  document.getElementById('kpi_alerts_active').style.color = ativos > 0 ? '#e74c3c' : '#555';

  montarGraficoDonutStatus({ resolvidos, emAcompanhamento, ativos });
}

function montarGraficoDonutStatus({ resolvidos, emAcompanhamento, ativos }) {
  if (!graficoDonutStatusEl) return;
  if (chartDonut) chartDonut.destroy();

  chartDonut = new Chart(graficoDonutStatusEl.getContext('2d'), {
    type: 'doughnut',
    data: {
      labels: ['Resolvidos', 'Em acompanhamento', 'Ativos'],
      datasets: [{ data: [resolvidos, emAcompanhamento, ativos] }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
  });
}

function montarGraficoTempoResolucaoPorEquipe() {
  // média por equipe (somente tickets que possuem detectado_em e resolvido_em)
  const somaPorEquipe = {}; // { equipe: { totalDias, count } }

  ticketsFiltrados.forEach(t => {
    try {
      const description = t.description?.content?.[0]?.content?.[0]?.text || '';
      const lines = description.split('\n').map(l => l.trim());
      let equipeLine = lines.find(l => /^Equipe\s*:/i.test(l));
      let equipe = equipeLine ? equipeLine.split(':')[1].trim() : 'Sem Equipe';

      const detectado = t.detectado_em ? new Date(t.detectado_em) : null;
      const resolvido = t.resolvido_em ? new Date(t.resolvido_em) : null;
      if (!detectado || !resolvido) return;

      const diffDias = (resolvido - detectado) / (1000 * 60 * 60 * 24);
      if (!somaPorEquipe[equipe]) somaPorEquipe[equipe] = { totalDias: 0, count: 0 };
      somaPorEquipe[equipe].totalDias += diffDias;
      somaPorEquipe[equipe].count++;
    } catch (e) { /* ignorar */ }
  });

  const labels = Object.keys(somaPorEquipe);
  const medias = labels.map(l => Math.round((somaPorEquipe[l].totalDias / somaPorEquipe[l].count) * 10) / 10);

  if (!graficoTempoEquipeEl) return;
  if (chartMeanTime) chartMeanTime.destroy();

  chartMeanTime = new Chart(graficoTempoEquipeEl.getContext('2d'), {
    type: 'bar',
    data: { labels, datasets: [{ label: 'Tempo médio (dias)', data: medias }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
  });
}

function popularListaAlertasRecentes() {
  if (!eventsBody) return;
  eventsBody.innerHTML = '';

  const sorted = ticketsFiltrados.slice().sort((a, b) => new Date(b.detectado_em) - new Date(a.detectado_em));

  for (let t of sorted.slice(0, 50)) {
    const severity = (t.priority?.name || t.severidade || '').toString().toLowerCase();
    const detectado = t.detectado_em ? formatDateTime(t.detectado_em) : '-';
    const resolvido = t.resolvido_em ? formatDateTime(t.resolvido_em) : '-';
    const duracao = calcularDuracaoEvento(t);
    const evento = extrairResumoEvento(t);

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${severity.includes('high') || severity.includes('crit') ? '<strong style="color:#e74c3c">Crítico</strong>' : 'Atenção'}</td>
      <td>${duracao}</td>
      <td>${detectado}</td>
      <td>${resolvido}</td>
      <td>${evento}</td>
      <td>${t.duracao || '-'}</td>
    `;
    if (severity.includes('high') || severity.includes('crit')) tr.classList.add('critico');

    eventsBody.appendChild(tr);
  }
}

// ---------- utilitários ----------
function formatDateTime(v) {
  try {
    const d = new Date(v);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${yy}-${mm}-${dd} ${hh}:${min}`;
  } catch (e) { return '-'; }
}

function calcularDuracaoEvento(t) {
  try {
    const detectado = t.detectado_em ? new Date(t.detectado_em) : null;
    const resolvido = t.resolvido_em ? new Date(t.resolvido_em) : new Date();
    if (!detectado) return '-';
    const diffMin = Math.round((resolvido - detectado) / (1000 * 60));
    if (diffMin < 60) return diffMin + ' min';
    const horas = Math.floor(diffMin / 60);
    const minutos = diffMin % 60;
    return `${horas}h ${minutos}m`;
  } catch (e) { return '-'; }
}

function extrairResumoEvento(t) {
  try {
    const description = t.description?.content?.[0]?.content?.[0]?.text || '';
    const lines = description.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length >= 2) return lines[1];
    return lines[0] || '-';
  } catch (e) { return '-'; }
}

// funções expostas para os onChange do HTML
window.atualizarKpisPorModelo = (val) => aplicarFiltroModelo(val);
// window.atualizarKpisPorPeriodo = (val) => { /* ignorado */ };