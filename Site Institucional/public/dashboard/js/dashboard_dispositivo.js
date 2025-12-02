// js/dashboard_dispositivo.js

const token = sessionStorage.getItem('authToken');
const usuarioLogado = JSON.parse(sessionStorage.getItem('USUARIO_LOGADO'));
const nomeClinica = usuarioLogado?.clinica?.nome;
const usuarioId = usuarioLogado?.usuario?.id;

let chartBateriaHora = null;
let chartConsumoSemanal = null;

// Elementos
const headerUserInfoEl = document.getElementById('header_user_info');
const headerTitleEl = document.getElementById('header_title');
const listaBody = document.getElementById('listaBody');
const eventsBody = document.getElementById('eventsBody');

// KPIs
const kpiBateriaAtual = document.getElementById('kpi_bateria_atual');
const kpiMediaConsumo = document.getElementById('kpi_media_consumo');
const kpiDeltaConsumo = document.getElementById('kpi_delta_consumo');
const kpiProximaRecarga = document.getElementById('kpi_proxima_recarga');

document.addEventListener('DOMContentLoaded', async () => {
  if (!token || !usuarioLogado) {
    window.location.href = '../login.html';
    return;
  }

  // Info do usuário logado
  headerUserInfoEl.innerHTML = `
        <div class="user-info">
            <span class="user-name">${usuarioLogado.usuario.nome}</span>
            <span class="user-email">${usuarioLogado.usuario.email}</span>
        </div>`;

  await carregarListaDispositivos();
});

// Carrega lista de dispositivos 
async function carregarListaDispositivos() {
  try {
    const res = await fetch(`/dashboard-dispositivos/${usuarioId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) {
      const erro = await res.json().catch(() => ({}));
      throw new Error(erro.mensagem || erro.erro || `Erro ${res.status}`);
    }

    const dispositivos = await res.json();

    listaBody.innerHTML = '';

    if (dispositivos.length === 0) {
      listaBody.innerHTML = '<tr><td colspan="3">Nenhum dispositivo vinculado a este usuário.</td></tr>';
      return;
    }

    dispositivos.forEach(dev => {
      const tr = document.createElement('tr');
      tr.className = 'device-row';
      tr.dataset.device = dev.dispositivo_uuid;
      tr.innerHTML = `
        <td class="col-device">
            <span class="codigo-dispositivo">${dev.dispositivo_uuid}</span>
            <span class="codigo-paciente">${dev.paciente_codigo || '—'}</span>
        </td>
        <td class="col-batt"><span class="device-batt">—%</span></td>
        <td class="col-alerts"><span class="device-alerts">0</span></td>
      `;
      tr.addEventListener('click', () => selecionarDispositivo(dev.dispositivo_uuid, tr));
      listaBody.appendChild(tr);
    });

    // Seleciona automaticamente o primeiro
    listaBody.querySelector('.device-row')?.click();

  } catch (err) {
    console.error('Erro ao carregar dispositivos:', err);
    listaBody.innerHTML = `<tr><td colspan="3">Erro: ${err.message}</td></tr>`;
  }
}

// Quando clica em um dispositivo
async function selecionarDispositivo(deviceId, elementoTR) {
  document.querySelectorAll('.device-row').forEach(r => r.classList.remove('selected'));
  elementoTR.classList.add('selected');
  headerTitleEl.textContent = `Visão do paciente — ${deviceId}`;

  await carregarDashboardBateria(deviceId);
}

// Busca os dados da bateria via Lambda
async function carregarDashboardBateria(deviceId) {
  try {
    const res = await fetch(`/clinicas/${nomeClinica}/dispositivos/${deviceId}/dashboard-bateria`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) throw new Error('Falha ao carregar dashboard de bateria');

    const data = await res.json(); // ← Isso é o DashboardBateriaDto

    atualizarKPIs(data);
    atualizarGraficoBateriaPorHora(data.bateriaPorHora);
    atualizarGraficoConsumoSemanal(data.consumoSemanal);
    atualizarEventosRecentes(data.eventosRecentes);
    atualizarListaBateria(deviceId, data.bateriaAtual);

  } catch (err) {
    console.error(err);
    alert('Erro ao carregar dados da bateria');
  }
}

function atualizarListaBateria(deviceId, bateriaAtual) {
  const row = document.querySelector(`.device-row[data-device="${deviceId}"]`);
  if (row) {
    const battSpan = row.querySelector('.device-batt');
    battSpan.textContent = Math.round(bateriaAtual) + '%';
    battSpan.style.color = bateriaAtual < 20 ? '#e74c3c' : bateriaAtual < 50 ? '#f1c40f' : '#27ae60';
  }
}

function atualizarKPIs(data) {
  kpiBateriaAtual.textContent = Math.round(data.bateriaAtual) + '%';
  kpiMediaConsumo.textContent = data.mediaConsumoSemanal.toFixed(1) + '%/semana';
  kpiProximaRecarga.textContent = data.proximaRecarga || 'Indeterminado';

  const delta = data.deltaConsumo?.toFixed(1) || 0;
  kpiDeltaConsumo.textContent = delta > 0 ? `+${delta}%` : `${delta}%`;
  kpiDeltaConsumo.style.color = delta > 0 ? '#e74c3c' : '#27ae60';
}

function atualizarGraficoBateriaPorHora(historico) {
  const ctx = document.getElementById('graficoBateriaPorHora').getContext('2d');
  if (chartBateriaHora) chartBateriaHora.destroy();

  chartBateriaHora = new Chart(ctx, {
    type: 'line',
    data: {
      labels: historico.labels,
      datasets: [{
        label: 'Bateria (%)',
        data: historico.valores,
        fill: true,
        borderColor: '#D6166F',
        backgroundColor: 'rgba(214, 22, 111, 0.1)',
        tension: 0.3,
        pointRadius: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { min: 0, max: 100 } }
    }
  });
}

function atualizarGraficoConsumoSemanal(historico) {
  const ctx = document.getElementById('graficoConsumoSemanal').getContext('2d');
  if (chartConsumoSemanal) chartConsumoSemanal.destroy();

  chartConsumoSemanal = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: historico.labels,
      datasets: [{
        label: 'Consumo semanal (%)',
        data: historico.valores,
        backgroundColor: '#D6166F'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { beginAtZero: true } }
    }
  });
}

function atualizarEventosRecentes(eventos) {
  eventsBody.innerHTML = '';
  if (!eventos || eventos.length === 0) {
    eventsBody.innerHTML = '<tr><td colspan="3">Nenhum evento recente</td></tr>';
    return;
  }

  eventos.slice(0, 10).forEach(e => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
            <td>${e.horario}</td>
            <td><span style="color: ${e.severidade.includes('Crítico') ? '#e74c3c' : '#f1c40f'}">${e.mensagem}</span></td>
            <td>${e.duracao}</td>
        `;
    eventsBody.appendChild(tr);
  });
}