// js/dashboard_dispositivo.js

const token = sessionStorage.getItem('authToken');
const usuarioLogado = JSON.parse(sessionStorage.getItem('USUARIO_LOGADO'));
const nomeClinica = usuarioLogado?.clinica?.nome;

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

// Carrega lista de dispositivos (você já tem um endpoint pra isso, ex: /dispositivos)
async function carregarListaDispositivos() {
    try {
        // CORREÇÃO 1: pegue o ID correto do usuário logado
        const usuarioId = usuarioLogado?.usuario?.id;

        if (!usuarioId) {
            console.error("ID do usuário não encontrado no token");
            alert("Erro de autenticação. Faça login novamente.");
            
        }

        console.log("Buscando dispositivos do usuário:", usuarioId); // debug

        const res = await fetch(`/dashboard-dispositivos/${usuarioId}`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!res.ok) {
            const erro = await res.text();
            console.error("Erro na resposta:", res.status, erro);
            throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();

        // CORREÇÃO 2: garante que é sempre um array
        const dispositivos = Array.isArray(data) ? data : data.dispositivos || [];

        if (dispositivos.length === 0) {
            listaBody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:#999">Nenhum dispositivo encontrado</td></tr>';
            return;
        }

        listaBody.innerHTML = '';
        dispositivos.forEach(dev => {
            const tr = document.createElement('tr');
            tr.className = 'device-row';
            tr.dataset.device = dev.dispositivo_uuid;

            const pacienteCodigo = dev.id_paciente_na_clinica || dev.paciente_codigo || '—';

            tr.innerHTML = `
                <td class="col-device">
                    <span class="codigo-dispositivo">${dev.dispositivo_uuid}</span>
                    <span class="codigo-paciente">Paciente: ${pacienteCodigo}</span>
                </td>
                <td class="col-batt"><span class="device-batt">—%</span></td>
                <td class="col-alerts"><span class="device-alerts">0</span></td>
            `;

            tr.addEventListener('click', () => selecionarDispositivo(dev.dispositivo_uuid, tr));
            listaBody.appendChild(tr);
        });

        // Seleciona o primeiro automaticamente
        if (dispositivos.length > 0) {
            listaBody.querySelector('.device-row').click();
        }

    } catch (err) {
        console.error('Erro ao carregar dispositivos:', err);
        listaBody.innerHTML = '<tr><td colspan="3" style="color:red">Erro ao carregar dispositivos</td></tr>';
    }
}

// Quando clica em um dispositivo
async function selecionarDispositivo(deviceId, elementoTR) {
  document.querySelectorAll('.device-row').forEach(r => r.classList.remove('selected'));
  elementoTR.classList.add('selected');
  headerTitleEl.textContent = `Visão do paciente — ${pacienteCodigo}`;

  await carregarDashboardBateria(deviceId);
}

const clinicaId = usuarioLogado?.clinica?.id;

async function carregarDashboardBateria(deviceId) {
    try {
        const clinicaUrl = encodeURIComponent(nomeClinica);

        const resposta = await fetch(`/clinicas/${clinicaUrl}/dispositivos/${deviceId}/dashboard-bateria`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (resposta.status === 404) {
            limparDashboard();
            alert("Este dispositivo ainda não possui dados de bateria processados.");
            return;
        }

        if (!resposta.ok) {
            throw new Error(`HTTP ${resposta.status}`);
        }

        const data = await resposta.json();

        atualizarKPIs(data);
        atualizarGraficoBateriaPorHora(data.bateriaPorHora);
        atualizarGraficoConsumoSemanal(data.consumoSemanal);
        atualizarEventosRecentes(data.eventosRecentes || []);
        atualizarListaBateria(deviceId, data.bateriaAtual);

        headerTitleEl.textContent = `Visão do paciente — ${data.uuid || deviceId}`;

    } catch (err) {
        console.error("Erro ao carregar dashboard:", err);
        limparDashboard();
        alert("Erro ao carregar os dados da bateria. Tente novamente.");
    }
}


// <<< ADICIONE ESSA FUNÇÃO NOVA (pra limpar se não tiver dados) >>>
function limparDashboard() {
  kpiBateriaAtual.textContent = '--%';
  kpiMediaConsumo.textContent = '--%/semana';
  kpiDeltaConsumo.textContent = '--%';
  kpiProximaRecarga.textContent = 'Indeterminado';

  if (chartBateriaHora) chartBateriaHora.destroy();
  if (chartConsumoSemanal) chartConsumoSemanal.destroy();

  eventsBody.innerHTML = '<tr><td colspan="3">Nenhum dado disponível</td></tr>';
}

// <<< AJUSTE TAMBÉM A atualizarEventosRecentes (pra usar o campo certo) >>>
// No seu DTO, é .severidade, não .mensagem – ajuste se necessário
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
      <td><span style="color: ${e.severidade === 'critico' ? '#e74c3c' : e.severidade === 'atencao' ? '#f1c40f' : '#27ae60'}">${e.severidade.toUpperCase()}</span></td>
      <td>${e.duracao}</td>
    `;
    eventsBody.appendChild(tr);
  });
}

function atualizarKPIs(data) {
    kpiBateriaAtual.textContent = `${data.bateriaAtual?.toFixed(2) || '--'}%`;

    kpiMediaConsumo.textContent =
        `${data.mediaConsumoSemanal?.toFixed(2) || '--'}%/semana`;

    kpiDeltaConsumo.textContent =
        `${data.deltaConsumo?.toFixed(2) || '--'}%`;

    kpiProximaRecarga.textContent =
        data.proximaRecarga || "Indeterminado";
}



function atualizarGraficoConsumoSemanal(historico) {
  const ctx = document.getElementById('graficoConsumoSemanal').getContext('2d');
  if (chartConsumoSemanal) chartConsumoSemanal.destroy();

  chartConsumoSemanal = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: historico.labels || ["19/11 a 25/11" , "30/11 a 06/12"],  // ex: ["01/12 a 07/12", "08/12 a 14/12"]
      datasets: [{
        label: 'Consumo semanal (%)',
        data: historico.valores || [1.2, 1.5],  // ex: [1.2, 1.5, 0.8]
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

function atualizarGraficoBateriaPorHora(bateriaPorHora) {
    const ctx = document.getElementById('graficoBateriaHora').getContext('2d');

    if (chartBateriaHora) {
        chartBateriaHora.destroy();
    }

    chartBateriaHora = new Chart(ctx, {
        type: 'line',
        data: {
            labels: bateriaPorHora?.labels || [],
            datasets: [
                {
                    label: "Bateria (%)",
                    data: bateriaPorHora?.valores || [],
                    borderColor: "#D6166F",
                    borderWidth: 2,
                    fill: false,
                    tension: 0.2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    suggestedMin: 0,
                    suggestedMax: 100
                }
            }
        }
    });
}

function atualizarListaBateria(deviceId, bateriaAtual) {
    // procura a linha da tabela correspondente ao dispositivo
    const linha = document.querySelector(`tr[data-device="${deviceId}"]`);

    if (!linha) {
        console.warn(`Linha do dispositivo ${deviceId} não encontrada para atualizar bateria.`);
        return;
    }

    // acha o elemento que mostra a bateria (%)
    const celulaBateria = linha.querySelector(".device-batt");

    if (!celulaBateria) {
        console.warn(`Célula de bateria não encontrada na linha do dispositivo ${deviceId}.`);
        return;
    }

    // atualiza o texto
    celulaBateria.textContent = `${bateriaAtual.toFixed(1)}%`;

    // MUDA A COR baseado no nível
    const valor = bateriaAtual;

    if (valor >= 70) {
        celulaBateria.style.color = "green";
    } else if (valor >= 40) {
        celulaBateria.style.color = "#e6a800"; // amarelo
    } else {
        celulaBateria.style.color = "red";
    }
}
