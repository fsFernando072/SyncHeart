// js/dashboard_dispositivo.js


 const headerUserInfoEl = document.getElementById('header_user_info');
// --- Helpers simples ---
const rnd = (min, max) => Math.round(min + Math.random() * (max - min));
const avg = arr => Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);

// Gera labels horários (24h)
const hoursLabels = Array.from({ length: 24 }, (_, i) => `${i}:00`);

// --- Dados base sintéticos (podem ser substituídos por fetch) ---
function makeSynthetic(deviceSeed = 0) {
  // seed influencia valores para simular diferenças entre dispositivos
  const baseCpu = 50 + (deviceSeed * 3) % 30;
  const cpu = hoursLabels.map((_, i) => Math.max(5, Math.round(baseCpu + Math.sin(i / 3) * 12 + (deviceSeed * 2) % 6 - Math.random() * 6)));
  const ram = cpu.map(v => Math.max(8, Math.round(v * (0.7 + (deviceSeed % 3) * 0.05))));
  const disk = hoursLabels.map(() => rnd(10, 60));
  const batt = hoursLabels.map((_, i) => Math.max(2, Math.round(100 - i * (0.7 + (deviceSeed % 2) * 0.2) - Math.random() * 1.7)));
  const alerts = [
    rnd(0, 10) + (deviceSeed % 3), // cpu alerts
    rnd(0, 8) + (deviceSeed % 2),  // ram alerts
    rnd(0, 6)                     // flash alerts
  ];
  const alertsTimeline = Array.from({ length: 7 }, () => rnd(0, 6));
  return { cpu, ram, disk, batt, alerts, alertsTimeline };
}

// --- Chart holders (para poder atualizar se precisar) ---
let chartTrend = null;
let chartDonut = null;
let chartBatt = null;
let chartAlerts = null;
let chartCpuSmall = null;
let chartRamSmall = null;
let chartFlashSmall = null;

// --- Inicializa todos os charts com dados iniciais ---
function initAllCharts(sample) {

   const dadosUsuarioLogado = JSON.parse(sessionStorage.getItem("USUARIO_LOGADO"));
  const nomeUsuario = dadosUsuarioLogado.usuario.nome;
        const emailUsuario = dadosUsuarioLogado.usuario.email;
        headerUserInfoEl.innerHTML = `<div class="user-info"><span class="user-name">${nomeUsuario}</span><span class="user-email">${emailUsuario}</span></div>`;


 
  // Trend (CPU/RAM/Flash)
  try {
    const ctxTrend = document.getElementById('graficoCpu%PorHora') ? document.getElementById('graficoCpu%PorHora').getContext('2d') : null;
    // Your big trend canvas in HTML is graficoCpu%PorHora? In the file you have multiple canvases.
    // We'll create the main trend using graficoCpu%PorHora for CPU and use others for their own charts.
  } catch (e) {
    // ignore - but proceed to create charts using the exact IDs present in your HTML
  }

  // Main: Tendência combinada (use graficoCpu%PorHora as main "trend" if available)
  const mainTrendCanvas = document.getElementById('graficoCpu%PorHora') || document.getElementById('graficoBateria%PorDia') || null;
  if (mainTrendCanvas) {
    const ctx = mainTrendCanvas.getContext('2d');
    if (chartTrend) chartTrend.destroy();
    chartTrend = new Chart(ctx, {
      type: 'line',
      data: {
        labels: hoursLabels,
        datasets: [
          { label: 'CPU %', data: sample.cpu, borderWidth: 2, tension: 0.25, fill: false, borderColor: '#D6166F' },
          { label: 'RAM %', data: sample.ram, borderWidth: 2, tension: 0.25, fill: false, borderColor: '#7B6EFB' },
          { label: 'Flash %', data: sample.disk, borderWidth: 2, tension: 0.25, fill: false, borderColor: '#18C5D6' }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        scales: { y: { beginAtZero: true, max: 100 } }
      }
    });
  }

  // Donut (graficoDonutsWhereFromAlertas)
  const donutEl = document.getElementById('graficoDonutsWhereFromAlertas');
  if (donutEl) {
    if (chartDonut) chartDonut.destroy();
    const ctx = donutEl.getContext('2d');
    chartDonut = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['CPU', 'RAM', 'Flash'],
        datasets: [{ data: sample.alerts }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }
    });
  }

  // Battery chart (graficoBateria%PorDia)
  const battEl = document.getElementById('graficoBateria%PorDia');
  if (battEl) {
    if (chartBatt) chartBatt.destroy();
    const ctx = battEl.getContext('2d');
    chartBatt = new Chart(ctx, {
      type: 'line',
      data: { labels: hoursLabels, datasets: [{ label: 'Bateria %', data: sample.batt, fill: true, tension: 0.3, borderColor: '#D6166F', backgroundColor: 'rgba(214,22,111,0.08)' }] },
      options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: 100 } } }
    });
  }

  // Alerts timeline (graficoAlertasPorDia)
  const alertsEl = document.getElementById('graficoAlertasPorDia');
  if (alertsEl) {
    if (chartAlerts) chartAlerts.destroy();
    const ctx = alertsEl.getContext('2d');
    chartAlerts = new Chart(ctx, {
      type: 'bar',
      data: { labels: ['D-6', 'D-5', 'D-4', 'D-3', 'D-2', 'D-1', 'Hoje'], datasets: [{ label: 'Alertas', data: sample.alertsTimeline, backgroundColor: '#D6166F' }] },
      options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
    });
  }

  // Small CPU distribution (graficoCpu%PorHora used in HTML for small chart? There is also graficoCpu%PorHora used as main - if duplicated, it's okay)
  const cpuSmallEl = document.getElementById('graficoCpu%PorHora');
  if (cpuSmallEl && !chartCpuSmall) {
    // if already used as mainTrend above, skip creating small chart with same id
    // (we already created 'chartTrend' using that id). So do nothing here.
  }

  // Ram small
  const ramEl = document.getElementById('graficoRamGbPorHora');
  if (ramEl) {
    if (chartRamSmall) chartRamSmall.destroy();
    const ctx = ramEl.getContext('2d');
    chartRamSmall = new Chart(ctx, {
      type: 'line',
      data: { labels: hoursLabels, datasets: [{ data: sample.ram, fill: false, tension: 0.25, borderColor: '#7B6EFB' }] },
      options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
    });
  }

  // Flash small
  const flashEl = document.getElementById('graficoFlashGbPorHora');
  if (flashEl) {
    if (chartFlashSmall) chartFlashSmall.destroy();
    const ctx = flashEl.getContext('2d');
    chartFlashSmall = new Chart(ctx, {
      type: 'line',
      data: { labels: hoursLabels, datasets: [{ data: sample.disk, fill: false, tension: 0.25, borderColor: '#18C5D6' }] },
      options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
    });
  }
}

// --- Atualiza mini-KPIs e legendas com base no sample gerado ---
function updateMiniKPIs(sample, deviceId) {
  const setText = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
  setText('mini_batt', (sample.batt[sample.batt.length - 1] || 0) + '%');
  setText('mini_cpu', Math.round(avg(sample.cpu)) + '%');
  setText('mini_ram', Math.round(avg(sample.ram)) + '%');
  setText('mini_flash', Math.round(avg(sample.disk)) + '%');

  // Atualiza legenda de alertas (IDs no HTML: não há ids, mas existem spans com texto "CPU: XX%..." ?
  // No seu HTML você tem: CPU: XX% etc. Eu atualizo os elementos se existirem:
  const totalAlerts = sample.alerts.reduce((a, b) => a + b, 0) || 1;
  const cpuPct = Math.round(sample.alerts[0] / totalAlerts * 100);
  const ramPct = Math.round(sample.alerts[1] / totalAlerts * 100);
  const flashPct = Math.round(sample.alerts[2] / totalAlerts * 100);
  const elCpu = document.getElementById('alerts-cpu');
  const elRam = document.getElementById('alerts-ram');
  const elDisk = document.getElementById('alerts-disk');
  if (elCpu) elCpu.textContent = cpuPct + '%';
  if (elRam) elRam.textContent = ramPct + '%';
  if (elDisk) elDisk.textContent = flashPct + '%';
}

// --- Função que atualiza tudo para um device selecionado (simula fetch) ---
function updateForDevice(deviceId) {
  // derive a seed from deviceId to produce consistent but different samples
  const seed = parseInt(deviceId.replace(/\D/g, '') || '0', 10) % 7;
  const sample = makeSynthetic(seed);
  updateMiniKPIs(sample, deviceId);

  // Re-init charts with this sample
  initAllCharts(sample);
  // Atualiza título (se houver)
  const header = document.getElementById('header_title');
  if (header) header.textContent = `Visão do paciente — ${deviceId}`;
}

// --- Configura seleção da sidebar (mantém classes que você já usa) ---
function setupDeviceSelection() {
  const items = document.querySelectorAll('.device-row');
  if (!items || items.length === 0) return;
  items.forEach(item => {
    item.addEventListener('click', () => {
      // remove selected de todos
      items.forEach(i => { i.classList.remove('selected'); i.removeAttribute('aria-selected'); });
      // marcar este
      item.classList.add('selected');
      item.setAttribute('aria-selected', 'true');
      const deviceId = item.dataset.device || item.querySelector('.device-id')?.textContent?.trim();
      if (deviceId) updateForDevice(deviceId);
    });

    // também permitir seleção via teclado (enter/space)
    item.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        item.click();
      }
    });
  });

  // inicializa com o item marcado no HTML (caso já exista)
  const initial = document.querySelector('.device-row.selected') || items[0];
  if (initial) {
    const deviceId = initial.dataset.device || initial.querySelector('.device-id')?.textContent?.trim();
    if (deviceId) updateForDevice(deviceId);
  }
}

// --- DOM ready ---
document.addEventListener('DOMContentLoaded', () => {
  setupDeviceSelection();

  // Se no futuro quiser trocar o período, adicione listener no select e chame updateForDevice com novo período.
  // Exemplo (se existir um select #periodSelect):
  const sel = document.getElementById('periodSelect');
  if (sel) {
    sel.addEventListener('change', () => {
      // re-render para o dispositivo atual (simulação)
      const current = document.querySelector('.device-row.selected');
      const deviceId = current?.dataset?.device || current?.querySelector('.device-id')?.textContent?.trim();
      if (deviceId) updateForDevice(deviceId);
    });
  }
});

// --- Toggle Sidebar Device List ---
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("toggleDeviceListBtn");
  const list = document.querySelector(".sidebar-list-devices");
  const main = document.querySelector(".main-content");

  if (btn && list && main) {
    btn.addEventListener("click", () => {
      list.classList.toggle("hidden");
      main.classList.toggle("expanded");
    });
  }

  // Corrige comportamento quando a janela é redimensionada
  function handleResize() {
    if (window.innerWidth <= 1000) {
      // força mostrar a lista e remove estado expandido
      list.classList.remove("hidden");
      main.classList.remove("expanded");
    }
  }

  // executa uma vez no início
  handleResize();



  function configurarBotaoCadastrar() {
        const dadosUsuarioLogado = JSON.parse(sessionStorage.getItem("USUARIO_LOGADO"));
        const cargoId = dadosUsuarioLogado.usuario.cargoId;

        const botaoCadastrar = document.getElementById('nav_cadastrar');
        const labelCadastrar = document.getElementById('nav_cadastrar_label');

        // Garante que os elementos existem antes de tentar alterar
        if (!botaoCadastrar || !labelCadastrar) {
            return;
        }

        // Esconde o botão por padrão. Ele só será exibido se o cargo tiver uma função de cadastro.
        botaoCadastrar.style.display = 'none';

        switch (cargoId) {
            case 2: // Admin da Clínica
                labelCadastrar.textContent = 'Funcionários';
                botaoCadastrar.href = 'crud_funcionario.html';
                botaoCadastrar.title = 'Gerenciar Funcionários';
                botaoCadastrar.style.display = 'flex'; // Torna o botão visível
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



     configurarBotaoCadastrar()
  // e sempre que a tela muda de tamanho
  window.addEventListener("resize", handleResize);
});
