// public/dashboard/js/dashboard_admin.js
// Dashboard Admin - SyncHeart

document.addEventListener('DOMContentLoaded', () => {
  iniciarDashboardAdmin();
});

// ---------- Estado local ----------
let modelos = [];
let dispositivosPorModelo = {}; // { modeloId: [{ dispositivo_uuid, dispositivo_id }] }
let equipes = []; // { equipe_id, nome_equipe }
let ticketsClinica = []; // todos tickets vindos do Jira (normalizados)
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
// const qtdOverwhelmedEl = document.getElementById('qtd_overwhelmed_squads');
// const levelOverwhelmedEl = document.getElementById('level_qtd_overwhelmed_squads');
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
  const nomeClinica = JSON.parse(sessionStorage.getItem("USUARIO_LOGADO")).clinica.nome;
  await Promise.all([ // Promise.all([...]) é um método que recebe um array de Promises (tarefas assíncronas).
    carregarModelos(token),
    carregarEquipes(dadosUsuarioLogado.usuario.clinicaId, token),
    carregarTicketsClinica(nomeClinica, token)
  ]);

  await carregarDispositivosDeModelos(token);

  // após carregar dados básicos, monta tudo
  montarKPIsSegmento1();
  montarSegmento2();
  popularSelectModelos();
  aplicarFiltroModelo('geral'); // carrega segmento 3 com todos os tickets (últimos 90 dias)
}

// ---------- Fetchers / backend calls (mantidos) ----------

// FUNÇÃO FUNCIONANDO BEM !!!
async function carregarModelos(token) {
  try {
    const res = await fetch('/modelos/listar', { headers: { 'Authorization': `Bearer ${token}` } });
    if (!res.ok) throw new Error('Falha ao carregar modelos');
      // Verifica se a resposta foi bem‑sucedida (res.ok é true para status 200–299).
      // Se não, lança um erro que será tratado no catch.
    modelos = await res.json();
    if (kpiQtdModelsEl) kpiQtdModelsEl.innerText = modelos.length; // Aqui faz exibir a KPI no html.
  } catch (err) {
    console.error('carregarModelos', err);
    modelos = [];
  }
}
console.log("modelos:", modelos)
// FUNÇÃO FUNCIONANDO BEM !!!
async function carregarEquipes(idClinica, token) {
  try {
    const res = await fetch(`/equipes/por-clinica/${idClinica}`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (!res.ok) throw new Error('Falha ao carregar equipes');
    equipes = await res.json();
    if (kpiQtdSquadsEl) kpiQtdSquadsEl.innerText = equipes.length; // Aqui faz exibir a KPI no html.
  } catch (err) {
    console.error('carregarEquipes', err);
    equipes = [];
  }
}

// FUNÇÃO FUNCIONANDO BEM !!!
async function carregarDispositivosDeModelos(token) {
  // criação de array com os modelos e seus dispositivos repectivos, útil para exibir total de modelos posteriormente
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
       // Object.values(...) retorna apenas os arrays
          // reduce percorre cada array e acumula um resultado.
          // acc é o acumulador (começa em 0).
    if (kpiQtdDevicesEl) kpiQtdDevicesEl.innerText = totalDevices; // exibir a KPI
  } catch (err) {
    console.error('carregarDispositivosDeModelos', err);
  }
}

// ---------- carregarTicketsClinica + parser leve ----------

// Helper: extrai texto plano da description do Jira (rich-text) com fallback
function extrairDescriptionTexto(descriptionField) {
  try {
    if (!descriptionField) return '';
    if (typeof descriptionField === 'string') return descriptionField.trim(); // o operador typeof retorna o tipo da variável.

    const parts = [];
    function walk(node) {
      if (!node) return;
      if (typeof node === 'string') {
        parts.push(node);
        return;
      }
      if (Array.isArray(node)) {
        node.forEach(walk);
        return;
      }
      if (typeof node === 'object' && node.text) {
        parts.push(node.text);
      }
      for (const k of Object.keys(node)) {
        const v = node[k];
        if (v && (typeof v === 'object' || Array.isArray(v))) walk(v);
      }
    }
    walk(descriptionField);
    return parts.join('\n').replace(/\n{2,}/g, '\n').trim();
    // parts.join('\n')
      // Junta todos os pedaços de texto encontrados em parts, separados por quebras de linha.
    // .replace(/\n{2,}/g, '\n')
      // Remove quebras de linha duplicadas (se houver duas ou mais seguidas, vira apenas uma).
  } catch (e) {
    return '';
  }
}

// Helper: tenta extrair uuid, componente, valor detectado, equipe e resumo do texto da descrição (heurística)
function parseDescriptionFields(descText) {
  const lines = (descText || '').split('\n').map(l => l.trim()).filter(Boolean);
  const result = {
    raw: descText || '',
    uuid: null,
    tipo_alerta: null,
    componente: null,
    valor_detectado: null,
    equipe: null,
    resumo: null
  };

  if (lines.length === 0) return result;

  // heurística para uuid (procura UUID-like ou linha com "UUID:" / "Device:")
  for (let i = 0; i < Math.min(6, lines.length); i++) {
    const l = lines[i];
    if (/uuid\s*[:\-]/i.test(l) || /device\s*[:\-]/i.test(l)) {
    // Usa regex para verificar se a linha contém uuid: ou device: (case-insensitive).
      const maybe = l.split(':').slice(1).join(':').trim() || l;
      result.uuid = maybe.substring(0, 36);
      break;
    }
    // fallback para detectar string com hífens e muitos hex (possible uuid)
    const m = l.match(/[0-9a-fA-F]{8,}-[0-9a-fA-F\-]{8,}/);
    if (m) { result.uuid = m[0].substring(0,36); break; }
  }

  // procura por Componente / Tipo / Valor detectado / Equipe
  for (let i = 0; i < Math.min(12, lines.length); i++) {
    const l = lines[i];

    // Componente: Disco
    const compMatch = l.match(/(?:componente|componete|component)\s*[:\-]\s*(.+)/i);
    if (compMatch && !result.componente) result.componente = compMatch[1].trim();

    // Tipo: (fallback to tipo_alerta)
    const tipoMatch = l.match(/(?:tipo)\s*[:\-]\s*(.+)/i);
    if (tipoMatch && !result.tipo_alerta) result.tipo_alerta = tipoMatch[1].trim();

    // Valor detectado: 50.0%  OR Valor: 50%
    const valorMatch = l.match(/(?:valor(?:\s*detectad[oa])?|valor)\s*[:\-]\s*([0-9]+(?:[.,][0-9]+)?\s*%?)/i);
    if (valorMatch && !result.valor_detectado) result.valor_detectado = valorMatch[1].trim();

    // Equipe:
    const eqMatch = l.match(/(?:equipe)\s*[:\-]\s*(.+)/i);
    if (eqMatch && !result.equipe) result.equipe = eqMatch[1].trim();
  }

  // resumo: por convenção a segunda linha costuma descrever (fallbacks)
  if (lines.length >= 2) result.resumo = lines[1];
  else result.resumo = lines[0];

  return result;
}

// Faz fetch na rota backend que consulta o Jira e normaliza os tickets
async function carregarTicketsClinica(nomeClinica, token) {
  try {
    const safeName = encodeURIComponent((nomeClinica || '').replaceAll(' ', '_'));
    const res = await fetch(`/jira/listar/tudoClinica/${safeName}`, { headers: { 'Authorization': `Bearer ${token}` } });

    if (!res.ok) {
      console.error('carregarTicketsClinica - resposta não OK', res.status, await res.text());
      throw new Error('Falha ao carregar tickets Jira');
    }

    const rawTickets = await res.json(); // array vindo do jiraModel (cada item pode ser fields ou fields direto)

    // Aviso sobre limites do Jira (causa comum de ver só 100 issues)
    if (Array.isArray(rawTickets) && rawTickets.length >= 100) {
      console.warn('JIRA_LIMIT_WARNING: resposta do backend contém >=100 tickets. Verifique maxResults/paginação no backend (Jira API costuma limitar a 100 por página).');
    }

    // normaliza em um shape simples (o dashboard usa esses campos)
    ticketsClinica = rawTickets.map((f, idx) => {
      const fields = f.fields ? f.fields : f; // tolerância se backend já devolveu fields
      const descText = extrairDescriptionTexto(fields.description);
      const parsed = parseDescriptionFields(descText);

      const priorityName = (fields.priority && fields.priority.name) ? fields.priority.name : (fields.severidade || null);
      const detectado_em = fields.created || fields.detectado_em || null;
      const resolvido_em = fields.resolutiondate || fields.resolvido_em || fields.updated || null;
      const statusName = (fields.status && fields.status.name) ? fields.status.name : (fields.status || '');
      const issuetype = (fields.issuetype && fields.issuetype.name) ? fields.issuetype.name : (fields.issuetype || '');

      return {
        // padronizado
        uuid: parsed.uuid || null,
        tipo_alerta: parsed.tipo_alerta || issuetype || null,
        severidade: priorityName || null,
        detectado_em,
        resolvido_em,
        status: statusName,
        descricao_raw: parsed.raw,
        resumo: parsed.resumo || null,
        equipe: parsed.equipe || null,
        componente: parsed.componente || parsed.tipo_alerta || null,
        valor_detectado: parsed.valor_detectado || null,
        original: fields,
        _idx: idx
      };
    });

    // Atribui equipes artificiais onde não há equipe (Alpha/Beta/Gamma)
    ticketsClinica = assignArtificialTeams(ticketsClinica);

    console.log('carregarTicketsClinica -> normalizados e com equipes (amostra 10):', ticketsClinica.slice(0, 10));
  } catch (err) {
    console.error('carregarTicketsClinica', err);
    ticketsClinica = [];
  }
}

// ---------- Função utilitária: atribuição artificial de equipes ----------
// Distribui tickets entre Alpha/Beta/Gamma de forma determinística.
// Se ticket já tiver equipe, respeita; caso contrário, usa hash do uuid (ou round-robin).
function assignArtificialTeams(tickets) {
  const teams = ['Alpha', 'Beta', 'Gamma'];
  let rr = 0;
  return tickets.map(t => {
    if (t.equipe && typeof t.equipe === 'string' && t.equipe.trim().length > 0) return t;
    // tenta hash por uuid
    let team = null;
    const uuid = t.uuid || (t.original && (t.original.dispositivo_uuid || '')) || '';
    if (uuid) {
      let sum = 0;
      for (let i = 0; i < uuid.length; i++) sum += uuid.charCodeAt(i);
      team = teams[sum % teams.length];
    } else {
      team = teams[(rr++) % teams.length];
    }
    return { ...t, equipe: team };
  });
}

// rota usada no dashboard_modelo.js para buscar por modelo (mantive)
async function buscarTicketsPorModelo(nomeClinica, idModelo, token) {
  try {
    const resposta = await fetch('/jira/listar/modelo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ nomeClinica, idModelo })
    });
    if (!resposta.ok) throw new Error('Falha ao buscar tickets por modelo');
    const raw = await resposta.json();
    // normaliza e garante equipes artificiais também
    const norm = raw.map((f, idx) => {
      const fields = f.fields ? f.fields : f;
      const descText = extrairDescriptionTexto(fields.description);
      const parsed = parseDescriptionFields(descText);
      return {
        uuid: parsed.uuid || null,
        tipo_alerta: parsed.tipo_alerta || (fields.issuetype && fields.issuetype.name) || null,
        severidade: (fields.priority && fields.priority.name) || fields.severidade || null,
        detectado_em: fields.created || fields.detectado_em || null,
        resolvido_em: fields.resolutiondate || fields.resolvido_em || fields.updated || null,
        status: (fields.status && fields.status.name) || fields.status || '',
        descricao_raw: parsed.raw,
        resumo: parsed.resumo || fields.summary || null,
        componente: parsed.componente || parsed.tipo_alerta || null,
        valor_detectado: parsed.valor_detectado || null,
        equipe: parsed.equipe || null,
        original: fields,
        _idx: idx
      };
    });
    return assignArtificialTeams(norm);
  } catch (err) {
    console.error('buscarTicketsPorModelo', err);
    return [];
  }
}

// ---------- Segmento 1: Geral da Clínica (KPIs de Dimensão e Risco Operacional) ----------
function montarKPIsSegmento1() {
  // dispositivos com alertas não resolvidos = contagem de tickets cujo status NÃO indica resolvido/closed
  const naoResolvidos = ticketsClinica.filter(t => {
    const s = (t.status || '').toString().toLowerCase();
    return !(s.includes('resolv') || s.includes('done') || s.includes('closed') || s.includes('resolved'));
  });

  // qtd dispositivos com alertas não resolvidos (conta por UUID *distinct*)
  const uuidsSet = new Set();
  naoResolvidos.forEach(t => { if (t.uuid) uuidsSet.add(t.uuid); });
  const devicesWithUnresolved = uuidsSet.size;
  if (qtdUnsolvedEl) qtdUnsolvedEl.innerText = devicesWithUnresolved;

  // barra nível (percentual em relação ao total de devices cadastrados no banco)
  const totalDevices = Number(kpiQtdDevicesEl?.innerText || 0);
  const pct = totalDevices === 0 ? 0 : Math.round((devicesWithUnresolved / totalDevices) * 100);
  if (levelUnsolvedEl) {
    levelUnsolvedEl.style.width = Math.min(100, pct) + '%';
    levelUnsolvedEl.style.background = pct > 50 ? '#e74c3c' : (pct > 0 ? '#f1c40f' : '#10982bff');
  }

  /*
  // equipes sobrecarregadas (>30 não resolvidos) - conta tickets nao resolvidos por equipe (heurística)
  const countUnsolvedPorEquipe = {};
  naoResolvidos.forEach(t => {
    const equipe = t.equipe || 'Sem Equipe';
    countUnsolvedPorEquipe[equipe] = (countUnsolvedPorEquipe[equipe] || 0) + 1;
  });
  const overwhelmedCount = Object.values(countUnsolvedPorEquipe).filter(v => v > 30).length;
  if (qtdOverwhelmedEl) qtdOverwhelmedEl.innerText = overwhelmedCount;
  if (levelOverwhelmedEl) {
    const squadCount = equipes.length || 1;
    const pctSquads = Math.round((overwhelmedCount / squadCount) * 100);
    levelOverwhelmedEl.style.width = Math.min(100, pctSquads) + '%';
    levelOverwhelmedEl.style.background = pctSquads > 50 ? '#e74c3c' : (pctSquads > 0 ? '#f1c40f' : '#10982bff');
  }
  */

  // tempo médio de resolução (dias) - usamos detectado_em e resolvido_em quando disponíveis
  let somaDias = 0;
  let n = 0;
  ticketsClinica.forEach(t => {
    try {
      const detectado = t.detectado_em ? new Date(t.detectado_em) : null;
      // considera resolvido_em como resolutiondate ou updated conforme já normalizado
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
  // Vamos garantir que temos ao menos Alpha/Beta/Gamma para visualização (mesmo que não existam equipes no DB)
  const forcedTeams = ['Alpha', 'Beta', 'Gamma'];

  // Conta tickets por equipe e por status
  const grupos = {}; // { equipe: { resolvidos, em_analise, ativos } }
  ticketsClinica.forEach(t => {
    const equipe = t.equipe || 'Sem Equipe';
    if (!grupos[equipe]) grupos[equipe] = { resolvidos: 0, em_analise: 0, ativos: 0 };

    const status = (t.status || '').toString().toLowerCase();
    if (status.includes('resolv') || status.includes('done') || status.includes('closed') || status.includes('resolved')) grupos[equipe].resolvidos++;
    else if (status.includes('analy') || status.includes('in progress') || status.includes('backlog')) grupos[equipe].em_analise++;
    else grupos[equipe].ativos++;
  });

  // Se não houver equipes reais suficientes, insere as forçadas (com zero)
  forcedTeams.forEach(tn => { if (!grupos[tn]) grupos[tn] = { resolvidos: 0, em_analise: 0, ativos: 0 }; });

  // Se houver muitas equipes reais (caso queira ver só as top3, poderia limitar), aqui vou mostrar todas
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

// ---------- Segmento 3, listas, utilitários finais ----------
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
  montarStatusAlertas();
  montarGraficoTempoResolucaoPorEquipe();
  popularListaAlertasRecentes();
}

// KPIs status alertas + donut
function montarStatusAlertas() {
  const total = ticketsFiltrados.length;
  const resolvidos = ticketsFiltrados.filter(t => {
    const status = (t.status || '').toString().toLowerCase();
    return status.includes('resolv') || status.includes('done') || status.includes('closed') || status.includes('resolved');
  }).length;
  const emAcompanhamento = ticketsFiltrados.filter(t => {
    const status = (t.status || '').toString().toLowerCase();
    return status.includes('analy') || status.includes('in progress');
  }).length;
  const ativos = total - resolvidos;

  montarKPIsStatusAlertas({ total, resolvidos, emAcompanhamento, ativos });
  montarGraficoDonutStatus({ resolvidos, emAcompanhamento, ativos });
}

function montarKPIsStatusAlertas({ total, resolvidos, emAcompanhamento, ativos }) {
  const elTotal = document.getElementById('kpi_alerts_total');
  const elSolved = document.getElementById('kpi_alerts_solved');
  const elProgress = document.getElementById('kpi_alerts_in_progress');
  const elActive = document.getElementById('kpi_alerts_active');

  if (elTotal) elTotal.innerText = total;
  if (elSolved) { elSolved.innerText = resolvidos; elSolved.style.color = resolvidos > 0 ? '#10982bff' : '#555'; }
  if (elProgress) { elProgress.innerText = emAcompanhamento; elProgress.style.color = emAcompanhamento > 0 ? '#f1c40f' : '#555'; }
  if (elActive) { elActive.innerText = ativos; elActive.style.color = ativos > 0 ? '#e74c3c' : '#555'; }
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
  const somaPorEquipe = {}; // { equipe: { totalDias, count } }

  ticketsFiltrados.forEach(t => {
    try {
      const equipe = t.equipe || 'Sem Equipe';
      const detectado = t.detectado_em ? new Date(t.detectado_em) : null;
      const resolvido = t.resolvido_em ? new Date(t.resolvido_em) : null;
      if (!detectado || !resolvido) return;

      const diffDias = (resolvido - detectado) / (1000 * 60 * 60 * 24);
      if (!somaPorEquipe[equipe]) somaPorEquipe[equipe] = { totalDias: 0, count: 0 };
      somaPorEquipe[equipe].totalDias += diffDias;
      somaPorEquipe[equipe].count++;
    } catch (e) { /* ignorar */ }
  });

  // garantir Alpha/Beta/Gamma exibidos mesmo se não existirem
  ['Alpha', 'Beta', 'Gamma'].forEach(tn => { if (!somaPorEquipe[tn]) somaPorEquipe[tn] = { totalDias: 0, count: 0 }; });

  const labels = Object.keys(somaPorEquipe);
  const medias = labels.map(l => somaPorEquipe[l].count ? Math.round((somaPorEquipe[l].totalDias / somaPorEquipe[l].count) * 10) / 10 : 0);

  if (!graficoTempoEquipeEl) return;
  if (chartMeanTime) chartMeanTime.destroy();

  chartMeanTime = new Chart(graficoTempoEquipeEl.getContext('2d'), {
    type: 'bar',
    data: { labels, datasets: [{ label: 'Tempo médio (dias)', data: medias }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
  });
}

// ---------- Lista de alertas recentes (tabela) ----------
// Exibe "Componente: Valor" na coluna de componente
function popularListaAlertasRecentes() {
  if (!eventsBody) return;
  eventsBody.innerHTML = '';

  const sorted = ticketsFiltrados.slice().sort((a, b) => {
    const da = a.detectado_em ? new Date(a.detectado_em) : 0;
    const db = b.detectado_em ? new Date(b.detectado_em) : 0;
    return db - da;
  });

  // limita linhas para performance
  for (let t of sorted.slice(0, 50)) {
    const severity = (t.severidade || '').toString().toLowerCase();
    const detectado = t.detectado_em ? formatDateTime(t.detectado_em) : '-';
    const resolvido = t.resolvido_em ? formatDateTime(t.resolvido_em) : '-';
    const duracao = calcularDuracaoEvento(t);

    // → COMBINAÇÃO: Componente + Valor detectado (robusto)
    // t.componente e t.valor_detectado foram já preenchidos na normalização quando possível
    let componente = (t.componente || '').toString().trim();
    let valor = (t.valor_detectado || '').toString().trim();

    // Se vierem vazios, tentamos caminhos alternativos dentro de original (caso backend retorne campos diferentes)
    if (!componente && t.original) {
      componente = t.original.componente || t.original.componentName || t.original.tipo || '';
    }
    if ((!valor || valor === '') && t.original) {
      valor = t.original.valor_detectado || t.original.valorDetectado || t.original.value || '';
    }

    // limpeza básica: trocar comma por dot e manter % quando houver
    if (valor && typeof valor === 'string') valor = valor.replace(',', '.');

    const tipoAlerta = componente ? (valor ? `${componente}: ${valor}` : componente) : '-';

    const uuid = t.uuid || (t.original && (t.original.dispositivo_uuid || t.original.customfield_dispositivo)) || '-';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${severity.includes('high') || severity.includes('crit') ? '<strong style="color:#e74c3c">Crítico</strong>' : 'Atenção'}</td>
      <td>${duracao}</td>
      <td>${detectado}</td>
      <td>${resolvido}</td>
      <td>${tipoAlerta}</td>
      
      <td>${uuid}</td>
    `;
    // <td>${duracao}</td>

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
    const lines = (t.descricao_raw || '').split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length >= 2) return lines[1];
    return lines[0] || '-';
  } catch (e) { return '-'; }
}

// funções expostas para os onChange do HTML
window.atualizarKpisPorModelo = (val) => aplicarFiltroModelo(val);
// window.atualizarKpisPorPeriodo = (val) => { /* ignorado */ };
