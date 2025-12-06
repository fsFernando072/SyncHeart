document.addEventListener('DOMContentLoaded', () => {

  // Verifica se o usuário está logado (parsing protegido)
  let dadosSessao;
  try {
    const raw = sessionStorage.getItem('USUARIO_LOGADO');
    dadosSessao = raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error('Erro ao ler sessionStorage USUARIO_LOGADO', err);
    sessionStorage.removeItem('USUARIO_LOGADO');
    window.location.href = '../login.html';
    return;
  }
  if (!dadosSessao) {
    window.location.href = '../login.html';
    return;
  }

  const headerUserInfoEl = document.getElementById('header_user_info');
  const nomeUsuario = (dadosSessao.usuario && dadosSessao.usuario.nome) || '';
  const emailUsuario = (dadosSessao.usuario && dadosSessao.usuario.email) || '';
  const nomeClinica = (dadosSessao.clinica && dadosSessao.clinica.nome) || '';
  // Usar textContent/element creation para evitar injeção
  const userInfoEl = document.createElement('div');
  userInfoEl.className = 'user-info';
  const spanName = document.createElement('span');
  spanName.className = 'user-name';
  spanName.textContent = nomeUsuario;
  const spanEmail = document.createElement('span');
  spanEmail.className = 'user-email';
  spanEmail.textContent = emailUsuario;
  userInfoEl.appendChild(spanName);
  userInfoEl.appendChild(spanEmail);
  if (headerUserInfoEl) headerUserInfoEl.appendChild(userInfoEl);

  const kpiContainer = document.getElementById('kpi_container');
  const listaFilaTriagem = document.getElementById('lista_fila_triagem');
  const divFeedback = document.getElementById('div_feedback');
  const btnLimparFiltro = document.getElementById('btn_limpar_filtro');
  const modalTriagemOverlay = document.getElementById('modal_triagem_overlay');
  const modalTriagemCloseBtn = document.getElementById('modal_triagem_close_btn');
  let feedbackTimeout;

  let graficoHotspotApex = null;
  let graficoHistoricoApex = null;
  let graficoBateriaApex = null;

  //DADOS BASE
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const dailyAlerts = days.map(day => ({
    day,
    cpu: Math.floor(Math.random() * 5),
    bateria: Math.floor(Math.random() * 4),
    ram: Math.floor(Math.random() * 3),
    disco: Math.floor(Math.random() * 1)
  }));

  //DADOS MOCKADOS
  const models = ['Precision R80', 'Azure XT DR', 'Vitalio LDR', 'BioBeacon X1'];
  const hotspots = models.map((model) => ({
    model,
    x: Math.floor(Math.random() * 60) + 20,
    alerts: Math.floor(Math.random() * 50) + 10,
    devices: Math.floor(Math.random() * 25) + 5
  }));
  let dadosMockadosGlobais = {
    "kpis":
      { "total": 29, "atencao": 10, "critico": 2 },

    "matrizStress": [{ "x": 1, "y": "Média Geral", "v": 23 },
    { "x": 2, "y": "Média Geral", "v": 77 },
    { "x": 3, "y": "Média Geral", "v": 50 }],

    "hotspot": hotspots,
    "historico": dailyAlerts,
    "capacidade": { "ativos": 29, "totalSuportado": 1000 },
    "saudeBateria": { "saudavel": [17], "atencao": [10], "critico": [2] },
    "filaTriagem": [
      { "id": 1, "idModelo": 1, "idDispositivo": "680fab1b-5333-4caa-970b-09btnmtdcf7d", "tipo": "critico", "texto": "Alto Consumo de Processador", "tempo": "Agora", "metrica": "CPU", "valor": "27.1%" },
      { "id": 2, "idModelo": 1, "idDispositivo": "120reb1b-5653-4caa-970b-091gth4dcf7d", "tipo": "atencao", "texto": "Alta Demanda de Memória", "tempo": "2 min", "metrica": "RAM", "valor": "84.3%" },
      { "id": 3, "idModelo": 1, "idDispositivo": "310fab1b-5542-4caa-970b-091a4asdff7d", "tipo": "atencao", "texto": "Alta Demanda de Memória", "tempo": "5 min", "metrica": "RAM", "valor": "88.5%" }]
  }




  // --- 2. FUNÇÃO MESTRE DE UPDATE ---
  async function atualizarTodosOsModulos(filtroModeloId) {
    try {
      mostrarFeedback('Sincronizando...', 'loading');
      await new Promise((r) => setTimeout(r, 500));

      const dados = filtrarDados(filtroModeloId);


      carregarKPIsCards(dados.kpis);
      carregarGraficoHotspot(dados.hotspot);
      carregarGraficoHistorico(dados.historico);
      carregarGraficoSaudeBateria(dados.saudeBateria);
      carregarFilaTriagem(dados.filaTriagem);
      configurarBotaoCadastrar();

      btnLimparFiltro.style.display = filtroModeloId ? 'block' : 'none';

      mostrarFeedback('', 'hide');
    } catch (err) {
      console.error(err);
      mostrarFeedback('Erro na atualização', 'error');
    }
  }


  // --- 2. FUNÇÃO MESTRE DE ATUALIZAÇÃO DE DADOS ---
  async function buscarDadosDoArquivo(nomeDoArquivo) {
    // Tenta buscar dados reais. Em caso de falha, mantém o mock local
    const safeClinica = encodeURIComponent(nomeClinica || '');
    const safeFile = encodeURIComponent(nomeDoArquivo || '');
    if (!safeClinica) return;

    const url = `/dados/${safeClinica}/${safeFile}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.warn('Não foi possível obter dados remotos, usando mock. status=', response.status);
        return;
      }
      const dados = await response.json();
      console.log('✅ Dados recebidos com sucesso:', dados);
      if (dados && typeof dados === 'object') {
        dadosMockadosGlobais = dados;
      }
    } catch (error) {
      console.warn('Erro ao buscar dados remotos, mantendo mock local.', error);
    }
  }

  async function carregarJira() {


  }


  function configurarBotaoCadastrar() {
    let dadosUsuarioLogado;
    try { dadosUsuarioLogado = JSON.parse(sessionStorage.getItem('USUARIO_LOGADO')); } catch (e) { dadosUsuarioLogado = null; }
    const cargoId = (dadosUsuarioLogado && dadosUsuarioLogado.usuario && dadosUsuarioLogado.usuario.cargoId) || null;

    const botaoCadastrar = document.getElementById('nav_cadastrar');
    const labelCadastrar = document.getElementById('nav_cadastrar_label');

    // Garante que os elementos existem antes de tentar alterar
    if (!botaoCadastrar || !labelCadastrar) {
      return;
    }

    // Esconde o botão por padrão. Ele só exibe se o cargo tiver uma função de cadastro.
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
      default:
        break;
    }
  }
  // --- 3. RENDERIZAÇÃO DOS MÓDULOS ---

  function carregarKPIsCards(dados) {
    const desconectados = (dados && typeof dados.desconectados === 'number') ? dados.desconectados : 0;
    const total = (dados && typeof dados.total === 'number') ? dados.total : 0;
    const estaveis = Math.max(0, total - ((dados.atencao || 0) + (dados.critico || 0) + desconectados));

    kpiContainer.innerHTML = `
        <div class="kpi-card kpi-red" onclick="aplicarFiltroGlobal('critico')">
            <div class="kpi-text">
                <span class="kpi-title">Marcapassos em Situação Crítica</span>
                <span class="kpi-value" style="color: #e74c3c;">${dados.critico}</span>
                <span style="color:grey; margin-top:5px; padding:0px">
                    <span><span style="color:red; font-size:x-large">⚠</span> Requer ação</span>
            </div>
            <div style="display: flex; flex-direction:row" id="kpi-critico-graph"></div>
        </div>

        <div class="kpi-card kpi-yellow" onclick="aplicarFiltroGlobal('atencao')">
            <div class="kpi-text">
                <span class="kpi-title">Marcapassos em Situação de Atenção</span>
                <span class="kpi-value" style="color: #f1c40f;">${dados.atencao}</span>
                <span style="color:grey; margin-top:5px; padding:0px">Ficar de Olho</span>
            </div>
            <div style="display: flex; flex-direction:row" id="kpi-atencao-graph"></div>
        </div>

        <div class="kpi-card kpi-gray" onclick="aplicarFiltroGlobal('desconectados')">
          <div class="kpi-text">
            <span class="kpi-title">Marcapassos Desconectados</span>
            <span class="kpi-value" style="color: grey">${desconectados}</span>
            <span style="color:grey; margin-top:5px; padding:0px">Sem Atualização de Dados</span>
          </div>
          <div style="display: flex; flex-direction:row" id="kpi-offline-graph"></div>
        </div>

        <div class="kpi-card kpi-green" onclick="aplicarFiltroGlobal('estaveis')">
            <div class="kpi-text">
                <span class="kpi-title">Marcapassos Estáveis</span>
                <span class="kpi-value" style="color: #2ecc71;">${estaveis}</span>
                <span style="color:grey; margin-top:5px; padding:0px">Operando Normalmente</span>
            </div>
            <div style="display: flex; " id="kpi-estavel-graph"></div>
        </div>`;

    // Helper simples para criar opções semelhantes para pequenos sparklines
    const emptyFormatter = () => '';
    const makeSparkOptions = (id, data, extra = {}) => ({
      chart: { id, group: 'sparks', type: 'line', height: 150, sparkline: { enabled: false }, dropShadow: { enabled: true, top: 1, left: 1, blur: 2, opacity: 0.5 } },
      series: [{ data }],
      stroke: { show: true, curve: 'straight', lineCap: 'butt', width: 2 },
      markers: { size: 0 },
      grid: { padding: { top: 40, bottom: 10, left: 0 } },
      tooltip: { x: { show: true }, y: { title: { formatter: emptyFormatter } } },
      ...extra
    });

    const spark1 = makeSparkOptions('spark1', [25, 66, 41, 59, 25, 44, 12, 36, 9, 21], { grid: { padding: { top: 50, left: 0 } } });
    const spark2 = makeSparkOptions('spark2', [12, 14, 2, 47, 32, 44, 14, 55, 41, 69], { colors: ['#ee4731ff'] });
    const spark3 = makeSparkOptions('spark3', [47, 45, 74, 32, 56, 31, 44, 33, 45, 19], { colors: ['#fdb61bff'] });
    // spark4: evitar branco puro sobre fundo branco
    const spark4 = makeSparkOptions('spark4', [15, 75, 47, 65, 14, 32, 19, 54, 44, 61], { colors: ['#7f8c8d'] });

    new ApexCharts(document.querySelector('#kpi-critico-graph'), spark1).render();
    new ApexCharts(document.querySelector('#kpi-atencao-graph'), spark2).render();
    new ApexCharts(document.querySelector('#kpi-offline-graph'), spark3).render();
    new ApexCharts(document.querySelector('#kpi-estavel-graph'), spark4).render();

  }

  function carregarFilaTriagem(dados) {

    listaFilaTriagem.innerHTML = '';

    if (!dados || dados.length === 0) {
      listaFilaTriagem.innerHTML = '<div class="empty-state">Sem alertas pendentes. Tudo operando normalmente.</div>';
      return;
    }

    // --- LÓGICA DE UX: AGRUPAMENTO (GROUP BY) ---
    const grupos = dados.reduce((acc, item) => {
      const chave = item.texto;
      if (!acc[chave]) {
        acc[chave] = {
          tipo: item.tipo,
          texto: item.texto,
          metrica: item.metrica,
          valorRecente: item.valor,
          tempoRecente: item.tempo,
          ids: [],
          todosItens: []
        };
      }
      acc[chave].ids.push(`#${item.idDispositivo}`);
      acc[chave].todosItens.push(item);
      return acc;
    }, {});

    // --- ORDENAÇÃO: CRÍTICOS PRIMEIRO ---
    const gruposArray = Object.values(grupos).sort((a, b) => {
      if (a.tipo === 'critico' && b.tipo !== 'critico') return -1;
      if (a.tipo !== 'critico' && b.tipo === 'critico') return 1;
      return 0;
    });

    let html = '<div class="container-alertas">';

    gruposArray.forEach(grupo => {
      const quantidade = grupo.ids.length;
      const isMultiplo = quantidade > 1;
      const classeTipo = grupo.tipo === 'critico' ? 'card-critico' : 'card-atencao';
      const icone = grupo.tipo === 'critico' ? '⚠️' : '⚡';
      const listaIds = isMultiplo
      ? grupo.ids.slice(0, 3).join(', ') + (quantidade > 3 ? '...' : '')
      : grupo.ids[0];
      const idParaModal = grupo.todosItens[0].idDispositivo;

      // Usar data-attributes e evitar escapar manualmente -> replacer simples para aspas
      const safeTxt = (grupo.texto || '').replace(/"/g, '&quot;').replace(/'/g, "&#39;");

      html += `
        <div class="card-alerta ${classeTipo}" data-dev="${idParaModal}" data-txt="${safeTxt}">
          <div class="alerta-header">
            <div class="alerta-titulo">
              <span class="icone-alerta">${icone}</span>
              <strong>${grupo.texto}</strong>
              ${isMultiplo ? `<span class="badge-contador">+${quantidade} casos</span>` : ''}
            </div>
            <span class="tempo-alerta">${grupo.tempoRecente}</span>
          </div>

          <div class="alerta-body">
            <div class="info-metrica">
              ${grupo.metrica}: <strong>${grupo.valorRecente}</strong>
            </div>
            <div class="info-ids">
              ${isMultiplo ? 'Afetados: ' : 'Dispositivo: '} 
              <span class="ids-texto">${listaIds}</span>
            </div>
          </div>
        </div>`;
    });

    html += '</div>';
    listaFilaTriagem.innerHTML = html;

    const cards = listaFilaTriagem.querySelectorAll('.card-alerta');
    cards.forEach(c => {
      c.addEventListener('click', () => {
      const dev = c.getAttribute('data-dev');
      const txt = c.getAttribute('data-txt');
      window.abrirModal(dev, txt);
      });
    });
  }

 function hslToCss(h, s, l) {
    return `hsl(${h}, ${s}%, ${l}%)`;
 }
function getBubbleColor(x, y) {
    // 1. Calcular o score total
    const score = x + y;

    // 2. Definir o intervalo mínimo e máximo do score esperado
    const MIN_SCORE = 0;
    // Ajuste o MAX_SCORE para o valor máximo possível que X+Y pode atingir (ex: 200, 100, etc.)
    const MAX_SCORE = 120; 

    // 3. Normalizar o score para um valor entre 0 e 1 (porcentagem)
    // 0 = Mínimo (Verde), 1 = Máximo (Vermelho)
    let percentage = (score - MIN_SCORE) / (MAX_SCORE - MIN_SCORE);
    
    // Garantir que a porcentagem fique entre 0 e 1, mesmo se o score exceder os limites
    percentage = Math.max(0, Math.min(1, percentage));

    const startHue = 120; // Verde
    const endHue = 0;     // Vermelho
    const hue = startHue + percentage * (endHue - startHue);

    // 5. Retornar a cor HSL formatada
    // Mantemos saturação (s) e luminosidade (l) constantes para um gradiente de cor pura
    return hslToCss(hue, 80, 50);
}

  function carregarGraficoHotspot(hotspots) {
    // Usa dados centralizados se parâmetro não for fornecido
    const source = hotspots || dadosMockadosGlobais.hotspot;
    // Transforma os dados para o formato do ApexCharts
    const bubbleData = source.map((h) => ({ x: h.x, y: h.devices, z: h.alerts, model: h.model }));
    const bubbleDataWithColor = source.map((h) => ({
      x: h.x,
      y: h.devices,
      z: h.alerts,
      model: h.model,
      fillColor: getBubbleColor(h.x, h.devices) // Calculate color based on x and y
    }));

    const bubbleSeries = [{
      name: 'Dispositivos',
      data: bubbleDataWithColor
    }];

    const options = {
      series: bubbleSeries,
      chart: {
        height: 300,
        type: 'bubble',
        fontFamily: 'Lexend, sans-serif',



        toolbar: { show: true },
        events: {
          dataPointSelection(event, chartContext, config) {
            const seriesIndex = config.seriesIndex;
            const modelName = config.w.config.series[seriesIndex].name;
            btnLimparFiltro.style.display = 'block';
            const filterBadge = document.getElementById('filter_badge');
            if (filterBadge) {
              filterBadge.textContent = `Filtrando: ${modelName}`;
              filterBadge.classList.add('show');
            }
            atualizarTodosOsModulos(modelName);
          }
        }
      },
      dataLabels: { enabled: false },
      fill: { opacity: 0.8 },
      xaxis: {
        tickAmount: 5,
        min: 0, max: 100,
        title: { text: 'Consumo de Bateria' },
        labels: { formatter: val => val.toFixed(0) + '%' }
      },
      yaxis: {
        max: 50,
        title: { text: 'Taxa de Incidentes' }
      },
      theme: {
        palette: 'palette1'
      },
      legend: {
        position: 'bottom',
        markers: { radius: 12 }
      },
      tooltip: {
        custom: function ({ series, seriesIndex, dataPointIndex, w }) {
          const data = w.config.series[seriesIndex].data[dataPointIndex];
          const name = w.config.series[seriesIndex].name;
          return `
                        <div style="padding: 10px; background: white; border: 1px solid #eee; border-radius: 5px;">
                            <strong>${name}</strong><br>
                            Taxa de Alertas: ${data.y}<br>
                            Consumo de Bateria Média: ${data.x}%<br>
                            Quantidade de Dispositivos: ${data.z}
                        </div>
                    `;
        }
      }
    };

    if (graficoHotspotApex) {
      try {
        graficoHotspotApex.updateOptions(options);
        graficoHotspotApex.updateSeries(bubbleSeries);
        return;
      } catch (e) {
        try { graficoHotspotApex.destroy(); } catch (_) {}
        graficoHotspotApex = null;
      }
    }

    graficoHotspotApex = new ApexCharts(document.querySelector('#scatter-chart'), options);
    graficoHotspotApex.render();
  }

  function carregarGraficoHistorico(dadosHistorico) {
    const source = dadosHistorico || dadosMockadosGlobais.historico;
    const seriesData = [
      { name: 'CPU', data: source.map((d) => d.cpu) },
      { name: 'Bateria', data: source.map((d) => d.bateria) },
      { name: 'RAM', data: source.map((d) => d.ram) },
      { name: 'Disco', data: source.map((d) => d.disco) }
    ];

    const options = {
      series: seriesData,
      chart: {
        type: 'bar',
        height: 300,
        stacked: false,
        toolbar: { show: true },
        fontFamily: 'Lexend, sans-serif'
      },
      colors: ['#a71b9bff', '#0fa9f1ff', '#4a10ebff', '#95a5a6'],
      plotOptions: {
        bar: { horizontal: false, columnWidth: '55%', borderRadius: 4 }
      },
      xaxis: {
        categories: source.map((d) => d.day),
        axisBorder: { show: false },
        axisTicks: { show: false }
      },
      yaxis: {
        show: true,
        labels: { style: { colors: '#64748b' } }
      },
      grid: {
        borderColor: '#f1f5f9',
        strokeDashArray: 4,
      },
      legend: { position: 'top' },
      dataLabels: { enabled: false }
    };

    // Se o gráfico já existe, atualizamos os dados para manter a animação
    if (graficoHistoricoApex) {
      graficoHistoricoApex.updateOptions({ xaxis: { categories: source.map((d) => d.day) } });
      graficoHistoricoApex.updateSeries(seriesData);
    } else {
      graficoHistoricoApex = new ApexCharts(document.querySelector('#bar-chart'), options);
      graficoHistoricoApex.render();
    }
  }
  function carregarGraficoSaudeBateria(dados) {
    const source = dados || dadosMockadosGlobais.saudeBateria;
    if (!source) return;

    // Extrai os valores com segurança (usa 0 se estiver vazio)
    const valorSaudavel = (source.saudavel && source.saudavel.length > 0) ? source.saudavel[0] : 0;
    const valorAtencao = (source.atencao && source.atencao.length > 0) ? source.atencao[0] : 0;
    const valorCritico = (source.critico && source.critico.length > 0) ? source.critico[0] : 0;

    const seriesData = [
      { name: 'Nível Alto', data: [valorSaudavel] },
      { name: 'Nível Baixo', data: [valorAtencao] },
      { name: 'Nível Crítico', data: [valorCritico] }
    ];

    const options = {
      series: seriesData,
      chart: {
        type: 'bar',
        height: 300, // Altura fixa para não comprimir
        stacked: false,
        toolbar: { show: false },
        fontFamily: 'Lexend, sans-serif'
      },
      colors: ['#2ecc71', '#f1c40f', '#e74c3c'],
      plotOptions: {
        bar: {
          horizontal: true,
          barHeight: '60%',
          borderRadius: 4,
          dataLabels: { position: 'center' }
        }
      },
      dataLabels: {
        enabled: true,
        textAnchor: 'middle',
        style: {
          colors: ['#fff', '#fff', '#fff'],
          fontSize: '14px',
          fontWeight: 'bold'
        },
        formatter(val) {
          return val > 0 ? val : '';
        }
      },
      xaxis: {
        categories: ['Frota Total'],
        labels: { style: { colors: '#64748b' } }
      },
      yaxis: { show: false },
      grid: {
        borderColor: '#f1f5f9',
        strokeDashArray: 3,
        xaxis: { lines: { show: true } },
        yaxis: { lines: { show: false } }
      },
      legend: {
        position: 'top',
        horizontalAlign: 'left'
      },
      tooltip: {
        y: {
          formatter(val) {
            return val + " Marcapassos";
          }
        }
      }
    };

    if (graficoBateriaApex) {
      graficoBateriaApex.updateSeries(seriesData);
    } else {
      graficoBateriaApex = new ApexCharts(document.querySelector('#grafico_saude_bateria'), options);
      graficoBateriaApex.render();
    }
  }

  function filtrarDados(id) {
    const base = dadosMockadosGlobais || {};
    if (!id) return base;
    return {
      ...base,
      kpis: base.kpis || { total: (base.capacidade && base.capacidade.ativos) || 0, atencao: 0, critico: 0 },
      filaTriagem: (base.filaTriagem || []).filter((f) => f.idModelo === id)
    };
  }

  function mostrarFeedback(msg, tipo) {
    if (tipo === 'loading') {
      divFeedback.style.backgroundColor = '#3498db';
      divFeedback.textContent = msg;
      divFeedback.classList.add('show');
      return;
    }
    if (tipo === 'hide') {
      divFeedback.classList.remove('show');
      return;
    }

    divFeedback.style.backgroundColor = tipo === 'error' ? '#dc3545' : '#28a745';
    divFeedback.textContent = msg;
    divFeedback.classList.add('show');
    clearTimeout(feedbackTimeout);
    feedbackTimeout = setTimeout(() => divFeedback.classList.remove('show'), 3000);
  }

  window.aplicarFiltroGlobal = (t) => {
    mostrarFeedback(`Filtro: ${t}`, 'success');
    if (t === 'critico') atualizarTodosOsModulos(1);
    else atualizarTodosOsModulos(null);
  };

  window.abrirModal = (dev, txt) => {
    const body = document.getElementById('modal_triagem_body');
    body.textContent = '';
    const p1 = document.createElement('p'); p1.textContent = txt || '';
    const p2 = document.createElement('p'); p2.textContent = `Dispositivo: ${dev || ''}`;
    body.appendChild(p1);
    body.appendChild(p2);
    modalTriagemOverlay.style.display = 'flex';
    setTimeout(() => modalTriagemOverlay.classList.add('show'), 10);
  };

  modalTriagemCloseBtn.onclick = () => {
    modalTriagemOverlay.classList.remove('show');
    setTimeout(() => modalTriagemOverlay.style.display = 'none', 300);
  };
  btnLimparFiltro.onclick = () => atualizarTodosOsModulos(null);

  async function carregar() {
    await buscarDadosDoArquivo("dashboardHolistica.json")
    atualizarTodosOsModulos(null);
  }
  carregar();

});