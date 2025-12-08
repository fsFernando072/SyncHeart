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

    headerUserInfoEl.innerHTML = `
        <div class="user-info">
            <span class="user-name">${usuarioLogado.usuario.nome}</span>
            <span class="user-email">${usuarioLogado.usuario.email}</span>
        </div>`;

    await carregarListaDispositivos();
});

async function carregarListaDispositivos() {
    try {
        const usuarioId = usuarioLogado?.usuario?.id;
        if (!usuarioId) {
            alert("Erro de autenticação. Faça login novamente.");
            return;
        }

        const res = await fetch(`/dashboard-dispositivos/${usuarioId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
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
            tr.dataset.pacienteCodigo = pacienteCodigo;

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

        if (dispositivos.length > 0) {
            listaBody.querySelector('.device-row').click();
        }

    } catch (err) {
        console.error('Erro ao carregar dispositivos:', err);
        listaBody.innerHTML = '<tr><td colspan="3" style="color:red">Erro ao carregar dispositivos</td></tr>';
    }
}

async function selecionarDispositivo(deviceId, elementoTR) {
    document.querySelectorAll('.device-row').forEach(r => r.classList.remove('selected'));
    elementoTR.classList.add('selected');
    headerTitleEl.textContent = `Visão do paciente — ${elementoTR.dataset.pacienteCodigo}`;
    await carregarDashboardBateria(deviceId);
}

async function carregarDashboardBateria(deviceId) {
    try {
        const clinicaUrl = encodeURIComponent(nomeClinica);
        const resposta = await fetch(`/clinicas/${clinicaUrl}/dispositivos/${deviceId}/dashboard-bateria`, {
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

        if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);

        const data = await resposta.json();

        
        const valores = data.bateriaPorHora?.valores || [];
        const ultimas24h = valores.slice(-24);
        const consumos = [];
        for (let i = 1; i < ultimas24h.length; i++) {
            consumos.push(ultimas24h[i-1] - ultimas24h[i]);
        }
        const media = consumos.reduce((a, b) => a + b, 0) / consumos.length || 0.08;
        const variancia = consumos.reduce((a, c) => a + Math.pow(c - media, 2), 0) / consumos.length;
        const desvioPadrao = Math.sqrt(variancia) || 0.03;

        const previsao = [];
        let bateriaAtual = data.bateriaAtual;
        for (let i = 1; i <= 24; i++) {
            const variacao = Math.min(0, (Math.random() - 0.3) * 2 * desvioPadrao);
            const consumo = media + variacao;
            bateriaAtual = Math.max(0, bateriaAtual - Math.max(0, consumo));
            previsao.push(bateriaAtual);
        }

        data.bateriaPorHora.previsao = previsao;
        data.bateriaPorHora.labelsFuturos = Array.from({ length: 24 }, (_, i) => {
            const futuro = new Date(Date.now() + (i + 1) * 60 * 60 * 1000);
            return `${futuro.getHours().toString().padStart(2,'0')}:${futuro.getMinutes().toString().padStart(2,'0')}`;
        });

        data.proximaRecarga = `${previsao[0].toFixed(1)}% na próxima hora`;

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

function limparDashboard() {
    kpiBateriaAtual.textContent = '--%';
    kpiMediaConsumo.textContent = '--%/semana';
    kpiDeltaConsumo.textContent = '--%';
    kpiProximaRecarga.textContent = 'Indeterminado';
    if (chartBateriaHora) chartBateriaHora.destroy();
    if (chartConsumoSemanal) chartConsumoSemanal.destroy();
    eventsBody.innerHTML = '<tr><td colspan="3">Nenhum dado disponível</td></tr>';
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
            <td><span style="color: ${e.severidade === 'critico' ? '#e74c3c' : e.severidade === 'atencao' ? '#f1c40f' : '#27ae60'}">${e.severidade.toUpperCase()}</span></td>
            <td>${e.duracao}</td>
        `;
        eventsBody.appendChild(tr);
    });
}

function atualizarKPIs(data) {
    const valorAtual = data.bateriaAtual || 0;
    const cardBateria = document.querySelector('.kpi-card.battery');
    const textoBateria = document.getElementById('kpi_bateria_atual');
    const deltaBateriaEl = document.getElementById('kpi_delta_bateria');

    textoBateria.textContent = `${valorAtual.toFixed(1)}%`;
    cardBateria.classList.remove('nivel-verde', 'nivel-laranja', 'nivel-vermelho');
    textoBateria.style.color = '';

    if (valorAtual > 50) {
        cardBateria.classList.add('nivel-verde');
        textoBateria.style.color = '#27ae60';
    } else if (valorAtual <= 50) {
        cardBateria.classList.add('nivel-laranja');
        textoBateria.style.color = '#e67e22';
    } else if (valorAtual <= 15) {
        cardBateria.classList.add('nivel-vermelho');
        textoBateria.style.color = '#e74c3c';
    }

    const bateriaPorHora = data.bateriaPorHora?.valores || [];
    const valorOntem = bateriaPorHora[bateriaPorHora.length - 48] || valorAtual;
    const deltaBateria = valorAtual - valorOntem;

    let textoDelta = '';
    let corDelta = '#999';
    if (deltaBateria > 0) {
        textoDelta = `${deltaBateria.toFixed(1)}%`;
        corDelta = '#27ae60';
    } else if (deltaBateria < 0) {
        textoDelta = `${deltaBateria.toFixed(1)}%`;
        corDelta = '#e74c3c';
    } else {
        textoDelta = '0%';
    }
    deltaBateriaEl.textContent = textoDelta;
    deltaBateriaEl.style.color = corDelta;
    deltaBateriaEl.style.fontWeight = 'bold';

    kpiMediaConsumo.textContent = `${data.mediaConsumoSemanal?.toFixed(2) || '--'}% na semana`;
    kpiDeltaConsumo.textContent = `${data.deltaConsumo?.toFixed(2) || '--'}%`;
    kpiProximaRecarga.textContent = data.proximaRecarga || "Indeterminado";
}

function atualizarGraficoConsumoSemanal(historico) {
    const ctx = document.getElementById('graficoConsumoSemanal').getContext('2d');
    if (chartConsumoSemanal) chartConsumoSemanal.destroy();

    chartConsumoSemanal = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: historico.labels || [],
            datasets: [{
                label: 'Consumo semanal (%)',
                data: historico.valores || [],
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
    if (chartBateriaHora) chartBateriaHora.destroy();

    const labels = [...bateriaPorHora.labels, ...bateriaPorHora.labelsFuturos];
    const dadosReais = [...bateriaPorHora.valores, ...Array(24).fill(null)];
    const dadosPrevisao = [...Array(bateriaPorHora.valores.length).fill(null), ...bateriaPorHora.previsao];

    chartBateriaHora = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Bateria (%)',
                    data: dadosReais,
                    borderColor: '#D6166F',
                    backgroundColor: 'rgba(214, 22, 111, 0.1)',
                    borderWidth: 3,
                    pointRadius: 4,
                    pointHoverRadius: 7,
                    tension: 0.3,
                    fill: false
                },
                {
                    label: 'Previsão',
                    data: dadosPrevisao,
                    borderColor: '#043192ff',
                    backgroundColor: 'rgba(52, 152, 219, 0.05)',
                    borderDash: [8, 6],
                    borderWidth: 2.5,
                    pointRadius: 3,
                    pointHoverRadius: 6,
                    tension: 0.3,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' },
                annotation: {
                    annotations: [
                        { type: 'line', yMin: 50, yMax: 50, borderColor: '#e67e22', borderWidth: 2.5, borderDash: [8, 6],
                          label: { content: 'Alerta (50%)', enabled: true, position: 'end', backgroundColor: 'rgba(230,126,34,0.9)', color: 'white', font: { size: 11, weight: 'bold' } } },
                        { type: 'line', yMin: 15, yMax: 15, borderColor: '#e74c3c', borderWidth: 2.5, borderDash: [8, 6],
                          label: { content: 'Crítico (15%)', enabled: true, position: 'end', backgroundColor: '#e74c3c', color: 'white', font: { size: 11, weight: 'bold' } } }
                    ]
                }
            },
            scales: { y: { min: 0, max: 100, ticks: { stepSize: 10 } } }
        }
    });
}

function atualizarListaBateria(deviceId, bateriaAtual) {
    const linha = document.querySelector(`tr[data-device="${deviceId}"]`);
    if (!linha) return;

    const celulaBateria = linha.querySelector(".device-batt");
    if (!celulaBateria) return;

    celulaBateria.textContent = `${bateriaAtual.toFixed(1)}%`;

    if (bateriaAtual > 50) {
        celulaBateria.style.color = '#27ae60';
    } else if (bateriaAtual <= 50) {
        celulaBateria.style.color = '#e67e22';
    } else if (bateriaAtual <= 15) {
        celulaBateria.style.color = '#e74c3c';
    }
}

// === CONTROLE DO MENU HAMBÚRGUER (mantido 100%) ===
document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('devicesSidebar');
    const wrapper = document.querySelector('.devices-sidebar-wrapper');

    if (!toggleBtn || !sidebar || !wrapper) return;

    let isOpen = true;

    toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        isOpen = !isOpen;

        if (isOpen) {
            wrapper.classList.remove('closed');
            sidebar.classList.remove('closed');
            toggleBtn.classList.remove('active');
        } else {
            wrapper.classList.add('closed');
            sidebar.classList.add('closed');
            toggleBtn.classList.add('active');
        }
    });

    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 1000 && isOpen && !wrapper.contains(e.target)) {
            isOpen = false;
            wrapper.classList.add('closed');
            sidebar.classList.add('closed');
            toggleBtn.classList.add('active');
        }
    });

    sidebar.addEventListener('click', e => e.stopPropagation());
});
