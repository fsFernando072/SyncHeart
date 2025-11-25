// js/dashboard_dispositivo.js

// Captura o elemento do cabeçalho onde aparece o nome e e-mail do usuário logado
const headerUserInfoEl = document.getElementById('header_user_info');

// ----------------------------------------------------------------
// Funções Auxiliares (Helpers)
// ----------------------------------------------------------------

// Gera um número aleatório inteiro entre "min" e "max"
const rnd = (min, max) => Math.round(min + Math.random() * (max - min));
// Calcula a média de um array numérico e arredonda o resultado
const avg = arr => Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);

// Cria um array de 24 posições com os horários no formato "0:00", "1:00", ..., "23:00"
const hoursLabels = Array.from({ length: 24 }, (_, i) => `${i}:00`);

// ----------------------------------------------------------------
// Função para gerar dados sintéticos (Mock simulado)
// ----------------------------------------------------------------
// Essa função gera dados aleatórios apenas para demonstração dos gráficos.
// O parâmetro `deviceSeed` muda levemente os valores conforme o dispositivo.
function makeSynthetic(deviceSeed = 0) {
  // Bateria vai diminuindo ao longo do tempo, simulando consumo diário
  const batt = hoursLabels.map((_, i) =>
    Math.max(2, Math.round(100 - i * (0.7 + (deviceSeed % 2) * 0.2) - Math.random() * 1.7))
  );
  // Quantidade total de alertas por tipo
  const alerts = [
    rnd(0, 10) + (deviceSeed % 3), // CPU
    rnd(0, 8) + (deviceSeed % 2),  // RAM
    rnd(0, 6)                      // Flash
  ];
  // Linha do tempo dos alertas (últimos 7 dias)
  const alertsTimeline = Array.from({ length: 7 }, () => rnd(0, 6));

  // Retorna todos os conjuntos de dados simulados
  return { batt, alerts, alertsTimeline };
}

// ----------------------------------------------------------------
// Variáveis para guardar os gráficos (Instâncias do Chart.js)
// ----------------------------------------------------------------
let chartTrend = null;
let chartBatt = null;
let chartAlerts = null;

// ----------------------------------------------------------------
// Inicialização de todos os gráficos da dashboard
// ----------------------------------------------------------------
function initAllCharts(sample) {
  // Exibe informações do usuário logado no cabeçalho
  const dadosUsuarioLogado = JSON.parse(sessionStorage.getItem("USUARIO_LOGADO"));
  const nomeUsuario = dadosUsuarioLogado.usuario.nome;
  const emailUsuario = dadosUsuarioLogado.usuario.email;

  headerUserInfoEl.innerHTML = `
    <div class="user-info">
      <span class="user-name">${nomeUsuario}</span>
      <span class="user-email">${emailUsuario}</span>
    </div>`;


  // Gráfico de Bateria (% por dia)
  const battEl = document.getElementById('graficoBateria%PorDia');
  if (battEl) {
    if (chartBatt) chartBatt.destroy();
    const ctx = battEl.getContext('2d');
    chartBatt = new Chart(ctx, {
      type: 'line',
      data: {
        labels: hoursLabels,
        datasets: [{
          label: 'Bateria %',
          data: sample.batt,
          fill: true,
          tension: 0.3,
          borderColor: '#D6166F',
          backgroundColor: 'rgba(214,22,111,0.08)'
        }]
      },
      annotation: {
        annotations: [{
          type: 'line',
          mode: 'horizontal',
          scaleID: 'y-axis-0',
          value: '50',
          fill: true,
          borderColor: 'orange',
          borderWidth: 2
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: 100 } } }
    });
  }

  // Gráfico de Alertas (últimos 7 dias)
  const alertsEl = document.getElementById('graficoAlertasPorDia');
  if (alertsEl) {
    if (chartAlerts) chartAlerts.destroy();
    const ctx = alertsEl.getContext('2d');
    chartAlerts = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['D-6', 'D-5', 'D-4', 'D-3', 'D-2', 'D-1', 'Hoje'],
        datasets: [{ label: 'Alertas', data: sample.alertsTimeline, backgroundColor: '#D6166F' }]
      },
      options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
    });
  }

  // Gráficos menores individuais
}

// ----------------------------------------------------------------
// Atualiza as mini-KPIs e percentuais de alerta
// ----------------------------------------------------------------
function updateMiniKPIs(sample, deviceId) {
  // Função auxiliar para atualizar texto de um elemento pelo ID
  const setText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  // Atualiza valores dos mini indicadores
  setText('mini_batt', (sample.batt.at(-1) || 0) + '%');

  // Calcula a porcentagem de alertas por tipo (CPU, RAM, Flash)
  const totalAlerts = sample.alerts.reduce((a, b) => a + b, 0) || 1;
  // Atualiza, se existirem, os elementos específicos de alertas
}

// ----------------------------------------------------------------
// Função para trocar dados quando seleciona um dispositivo
// ----------------------------------------------------------------
function updateForDevice(deviceId) {
  // Gera um "seed" com base no ID do dispositivo (para manter consistência)
  const seed = parseInt(deviceId.replace(/\D/g, '') || '0', 10) % 7;
  const sample = makeSynthetic(seed);

  // Atualiza KPIs e gráficos com novos dados
  updateMiniKPIs(sample, deviceId);
  initAllCharts(sample);

  // Atualiza o título do cabeçalho com o nome do dispositivo
  const header = document.getElementById('header_title');
  if (header) header.textContent = `Visão do paciente — ${deviceId}`;
}

// ----------------------------------------------------------------
// Confiuração de seleção de dispositivos na lista lateral
// ----------------------------------------------------------------
function setupDeviceSelection() {
  const items = document.querySelectorAll('.device-row');
  if (!items.length) return;

  items.forEach(item => {
    // Clique: define o item como "selecionado"
    item.addEventListener('click', () => {
      items.forEach(i => i.classList.remove('selected'));
      item.classList.add('selected');
      const deviceId = item.dataset.device || item.querySelector('.device-id')?.textContent?.trim();
      if (deviceId) updateForDevice(deviceId);
    });

    // Teclado (Enter ou Espaço)
    item.addEventListener('keydown', (ev) => {
      if (['Enter', ' '].includes(ev.key)) {
        ev.preventDefault();
        item.click();
      }
    });
  });

  // Inicializa automaticamente com o primeiro dispositivo selecionado
  const initial = document.querySelector('.device-row.selected') || items[0];
  if (initial) {
    const deviceId = initial.dataset.device || initial.querySelector('.device-id')?.textContent?.trim();
    if (deviceId) updateForDevice(deviceId);
  }
}

// ----------------------------------------------------------------
// Evento principal — Dom pronto
// ----------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  // Inicializa seleção dos dispositivos
  setupDeviceSelection();

  // Listener para troca de período (caso o HTML tenha esse select futuramente)
  const sel = document.getElementById('periodSelect');
  if (sel) {
    sel.addEventListener('change', () => {
      const current = document.querySelector('.device-row.selected');
      const deviceId = current?.dataset?.device || current?.querySelector('.device-id')?.textContent?.trim();
      if (deviceId) updateForDevice(deviceId);
    });
  }
});

// ----------------------------------------------------------------
// Botão de mostrar/ocultar lista e dispositivos
// ----------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("toggleDeviceListBtn");
  const list = document.querySelector(".sidebar-list-devices");
  const main = document.querySelector(".main-content");

  // Clique no botão: alterna visibilidade da lista
  if (btn && list && main) {
    btn.addEventListener("click", () => {
      list.classList.toggle("hidden");
      main.classList.toggle("expanded");
    });
  }

  // Corrige comportamento quando redimensiona a janela (<=1000px)
  function handleResize() {
    if (window.innerWidth <= 1000) {
      list.classList.remove("hidden");
      main.classList.remove("expanded");
    }
  }

  handleResize(); // executa uma vez no carregamento
  window.addEventListener("resize", handleResize); // executa sempre que redimensiona

  // ----------------------------------------------------------------
  // Configura botão "cadastrar" no sidebar conforme cargo
  // ----------------------------------------------------------------
  function configurarBotaoCadastrar() {
    const dadosUsuarioLogado = JSON.parse(sessionStorage.getItem("USUARIO_LOGADO"));
    const cargoId = dadosUsuarioLogado.usuario.cargoId;

    const botaoCadastrar = document.getElementById('nav_cadastrar');
    const labelCadastrar = document.getElementById('nav_cadastrar_label');

    if (!botaoCadastrar || !labelCadastrar) return;

    // Esconde por padrão, depois exibe conforme cargo
    botaoCadastrar.style.display = 'none';

    switch (cargoId) {
      case 2: // Admin da Clínica
        labelCadastrar.textContent = 'Funcionários';
        botaoCadastrar.href = 'crud_funcionario.html';
        botaoCadastrar.title = 'Gerenciar Funcionários';
        botaoCadastrar.style.display = 'flex';
        break;

      case 4: // Engenharia Clínica
        labelCadastrar.textContent = 'Modelos';
        botaoCadastrar.href = 'crud_modelo.html';
        botaoCadastrar.title = 'Gerenciar Modelos de MP';
        botaoCadastrar.style.display = 'flex';
        break;

      case 3: // Eletrofisiologista
        labelCadastrar.textContent = 'Marcapassos';
        botaoCadastrar.href = 'provisionar_dispositivo.html';
        botaoCadastrar.title = 'Provisionar Marcapassos';
        botaoCadastrar.style.display = 'flex';
        break;
    }
  }

  configurarBotaoCadastrar(); // executa ao carregar
});
