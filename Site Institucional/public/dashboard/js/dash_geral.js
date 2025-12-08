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

  // Dados globais (vindos da API /holistica/dashboard)
  let dadosMockadosGlobais = {
    "kpis": { "total": 0, "atencao": 0, "critico": 0, "desconectados": 0 },
    "filaTriagem": [],
    "hotspot": [],
    "historico": [],
    "saudeBateria": { "saudavel": [0], "atencao": [0], "critico": [0] }
  };




  // --- 2. FUNÇÃO MESTRE DE UPDATE ---
  async function atualizarTodosOsModulos(filtroModeloId) {
    try {
      console.log('🔄 Atualizando todos os módulos...', filtroModeloId ? `Filtro: ${filtroModeloId}` : 'Sem filtro');
      mostrarFeedback('Sincronizando...', 'loading');
      await new Promise((r) => setTimeout(r, 0));

      const dados = filtrarDados(filtroModeloId);
      console.log('📦 Dados filtrados:', dados);

      carregarKPIsCards(dados.kpis);
      carregarGraficoHotspot(dados.hotspot);
      carregarGraficoHistorico(dados.historico);
      carregarGraficoSaudeBateria(dados.saudeBateria);
      carregarFilaTriagem(dados.filaTriagem);
      configurarBotaoCadastrar();

      btnLimparFiltro.style.display = filtroModeloId ? 'block' : 'none';

      mostrarFeedback('', 'hide');
      console.log('✅ Todos os módulos atualizados com sucesso');
    } catch (err) {
      console.error('❌ Erro na atualização:', err);
      mostrarFeedback('Erro na atualização', 'error');
    }
  }


  // --- 2. FUNÇÃO MESTRE DE ATUALIZAÇÃO DE DADOS ---
  async function buscarDadosDoAPI() {
    // Busca dados da API backend (Holística Dashboard)
    // Tenta buscar dados reais. Em caso de falha, mantém o mock local
    try {
      mostrarFeedback('Sincronizando dados...', 'loading');
      
      const token = sessionStorage.getItem('authToken');
      if (!token) {
        console.warn('⚠️ Token não encontrado. Redirecionando para login.');
        window.location.href = '/login.html';
        return;
      }
      
      const response = await fetch('/holistica/dashboard', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        console.warn('❌ Não foi possível obter dados da API. Status:', response.status);
        console.warn('Usando dados mockados localmente.');
        mostrarFeedback('Usando dados em cache local', 'info');
        return;
      }

      const dados = await response.json();
      console.log('✅ Dados recebidos com sucesso da API:', dados);
      
      if (dados && typeof dados === 'object') {
        dadosMockadosGlobais = dados;
        mostrarFeedback('Dados sincronizados com sucesso', 'success');
      }
    } catch (error) {
      console.warn('⚠️ Erro ao buscar dados da API, mantendo mock local.', error);
      mostrarFeedback('Usando dados em cache (API indisponível)', 'warning');
    }
  }

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
    // Função reservada para carregamento futuro de dados específicos do Jira
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
        labelCadastrar.textContent = 'Gerenciar Modelos';
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
    const desconectados = parseInt(dados.desconectados) || 0;
    const total = parseInt(dados.total) || 0;
    const atencao = parseInt(dados.atencao) || 0;
    const critico = parseInt(dados.critico) || 0;
    // Estáveis = Total - (Crítico + Atenção + Desconectados)
    const estaveis = Math.max(0, total - critico - atencao - desconectados);

    kpiContainer.innerHTML = `
        <div class="kpi-card kpi-red" onclick="aplicarFiltroGlobal('critico')">
            <div class="kpi-text">
                <span class="kpi-title">Marcapassos em Situação Crítica</span>
                <span class="kpi-value" style="color: #e74c3c;">${critico}</span>
                <span style="color:grey; margin-top:5px;">
                    <span style="color:red; font-size:large">⚠</span> Requer ação
                </span>
            </div>
            <div id="kpi-critico-graph"></div>
        </div>

        <div class="kpi-card kpi-yellow" onclick="aplicarFiltroGlobal('atencao')">
            <div class="kpi-text">
                <span class="kpi-title">Marcapassos em Situação de Atenção</span>
                <span class="kpi-value" style="color: #f39c12;">${atencao}</span>
                <span style="color:grey; margin-top:5px;">Ficar de Olho</span>
            </div>
            <div id="kpi-atencao-graph"></div>
        </div>

        <div class="kpi-card kpi-gray" onclick="aplicarFiltroGlobal('desconectados')">
          <div class="kpi-text">
            <span class="kpi-title">Marcapassos Desconectados</span>
            <span class="kpi-value" style="color: #95a5a6;">${desconectados}</span>
            <span style="color:grey; margin-top:5px;">Sem Atualização de Dados</span>
          </div>
          <div id="kpi-offline-graph"></div>
        </div>

        <div class="kpi-card kpi-green" onclick="aplicarFiltroGlobal('estaveis')">
            <div class="kpi-text">
                <span class="kpi-title">Marcapassos Estáveis</span>
                <span class="kpi-value" style="color: #27ae60;">${estaveis}</span>
                <span style="color:grey; margin-top:5px;">Operando Normalmente</span>
            </div>
            <div id="kpi-estavel-graph"></div>
        </div>`;

    // Gerar dados históricos simulados mantendo a soma consistente
    const generateConsistentTrendData = (currentValue, totalDevices, variance = 0.3) => {
      const data = [];
      const base = Math.max(0, currentValue);
      const maxVariation = Math.min(base, totalDevices * variance);
      
      for (let i = 0; i < 10; i++) {
        const randomVariance = (Math.random() - 0.5) * maxVariation;
        const value = Math.max(0, Math.min(totalDevices, Math.round(base + randomVariance)));
        data.push(value);
      }
      // Garantir que o último valor seja o atual
      data[9] = currentValue;
      return data;
    };

    // Determinar cor predominante baseada na tendência geral
    const getTrendColor = (data, isGoodWhenLower = false) => {
      if (!data || data.length < 2) return '#95a5a6';
      
      const firstValue = data[0];
      const lastValue = data[data.length - 1];
      const diff = lastValue - firstValue;
      
      // Threshold de 10% para considerar mudança significativa
      const threshold = Math.max(1, Math.abs(firstValue * 0.15));
      
      if (Math.abs(diff) < threshold) {
        return '#95a5a6'; // cinza - manteve estável
      }
      
      if (isGoodWhenLower) {
        // Crítico, Atenção, Desconectados: bom quando diminui
        return diff < 0 ? '#27ae60' : '#e74c3c';
      } else {
        // Estáveis: bom quando aumenta
        return diff > 0 ? '#27ae60' : '#e74c3c';
      }
    };

    // Gerar dados com pontos coloridos individualmente
    const generateColoredDataPoints = (data, isGoodWhenLower = false) => {
      if (!data || data.length < 2) return { data, colors: ['#95a5a6'] };
      
      const coloredPoints = [];
      const fillColors = [];
      
      for (let i = 0; i < data.length; i++) {
        coloredPoints.push(data[i]);
        
        if (i === 0) {
          fillColors.push('#95a5a6');
        } else {
          const diff = data[i] - data[i - 1];
          if (diff === 0) {
            fillColors.push('#95a5a6');
          } else if (isGoodWhenLower) {
            fillColors.push(diff < 0 ? '#27ae60' : '#e74c3c');
          } else {
            fillColors.push(diff > 0 ? '#27ae60' : '#e74c3c');
          }
        }
      }
      
      return { data: coloredPoints, colors: fillColors };
    };

    const emptyFormatter = () => '';
    const makeSparkOptions = (id, data, isGoodWhenLower, extra = {}) => {
      const mainColor = getTrendColor(data, isGoodWhenLower);
      const { data: processedData } = generateColoredDataPoints(data, isGoodWhenLower);
      
      return {
        chart: { 
          id, 
          group: 'sparks', 
          type: 'area', 
          height: 80, 
          sparkline: { enabled: true }, 
          animations: { enabled: true, easing: 'easeinout', speed: 800 }
        },
        series: [{ name: 'Dispositivos', data: processedData }],
        stroke: { 
          show: true, 
          curve: 'smooth', 
          lineCap: 'round', 
          width: 2.5 
        },
        colors: [mainColor],
        fill: { 
          type: 'gradient', 
          gradient: { 
            opacityFrom: 0.6, 
            opacityTo: 0.1 
          } 
        },
        markers: { size: 0 },
        tooltip: { 
          enabled: true,
          x: { show: false }, 
          y: { 
            title: { formatter: emptyFormatter },
            formatter: (val) => val ? Math.round(val) : 0
          },
          marker: { show: false }
        },
        ...extra
      };
    };

    // Gerar dados históricos respeitando: Total = Crítico + Atenção + Desconectados + Estáveis
    const criticoData = generateConsistentTrendData(critico, total, 0.4);
    const atencaoData = generateConsistentTrendData(atencao, total, 0.35);
    const desconectadosData = generateConsistentTrendData(desconectados, total, 0.3);
    
    // Estáveis deve ser calculado dinamicamente para cada ponto histórico
    const estaveisData = criticoData.map((crit, i) => {
      const estavel = total - crit - atencaoData[i] - desconectadosData[i];
      return Math.max(0, estavel);
    });

    // Criar sparklines com cores dinâmicas por segmento
    const spark1 = makeSparkOptions('spark1', criticoData, true); // bom quando diminui
    const spark2 = makeSparkOptions('spark2', atencaoData, true); // bom quando diminui
    const spark3 = makeSparkOptions('spark3', desconectadosData, true); // bom quando diminui
    const spark4 = makeSparkOptions('spark4', estaveisData, false); // bom quando aumenta

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
    
    if (!source || source.length === 0) {
      console.warn('⚠️ Nenhum dado de hotspot disponível');
      return;
    }

    console.log('📊 Carregando gráfico Hotspot com', source.length, 'modelos:', source);
    
    // Criar uma série para cada modelo (permite clicar individualmente)
    const bubbleSeries = source.map((h) => ({
      name: h.model,
      data: [{
        x: h.x,
        y: h.alerts, // Taxa de alertas no eixo Y
        z: h.devices, // Tamanho da bolha = quantidade de dispositivos
        fillColor: getBubbleColor(h.x, h.alerts)
      }]
    }));

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

    const chartElement = document.querySelector('#scatter-chart');
    if (!chartElement) {
      console.error('❌ Elemento #scatter-chart não encontrado no DOM');
      return;
    }

    if (graficoHotspotApex) {
      try {
        graficoHotspotApex.updateOptions(options);
        graficoHotspotApex.updateSeries(bubbleSeries);
        console.log('✅ Gráfico Hotspot atualizado');
        return;
      } catch (e) {
        console.warn('⚠️ Erro ao atualizar gráfico, recriando...', e);
        try { graficoHotspotApex.destroy(); } catch (_) {}
        graficoHotspotApex = null;
      }
    }

    graficoHotspotApex = new ApexCharts(chartElement, options);
    graficoHotspotApex.render()
      .then(() => console.log('✅ Gráfico Hotspot renderizado'))
      .catch(err => console.error('❌ Erro ao renderizar Hotspot:', err));
  }

  function carregarGraficoHistorico(dadosHistorico) {
    const source = dadosHistorico || dadosMockadosGlobais.historico;
    
    if (!source || source.length === 0) {
      console.warn('⚠️ Nenhum dado de histórico disponível');
      return;
    }

    console.log('📊 Carregando gráfico Histórico com', source.length, 'dias');
    
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

    const chartElement = document.querySelector('#bar-chart');
    if (!chartElement) {
      console.error('❌ Elemento #bar-chart não encontrado no DOM');
      return;
    }

    // Se o gráfico já existe, atualizamos os dados para manter a animação
    if (graficoHistoricoApex) {
      try {
        graficoHistoricoApex.updateOptions({ xaxis: { categories: source.map((d) => d.day) } });
        graficoHistoricoApex.updateSeries(seriesData);
        console.log('✅ Gráfico Histórico atualizado');
      } catch (e) {
        console.warn('⚠️ Erro ao atualizar gráfico histórico:', e);
      }
    } else {
      graficoHistoricoApex = new ApexCharts(chartElement, options);
      graficoHistoricoApex.render()
        .then(() => console.log('✅ Gráfico Histórico renderizado'))
        .catch(err => console.error('❌ Erro ao renderizar Histórico:', err));
    }
  }
  function carregarGraficoSaudeBateria(dados) {
    const source = dados || dadosMockadosGlobais.saudeBateria;
    if (!source) {
      console.warn('⚠️ Nenhum dado de saúde de bateria disponível');
      return;
    }

    // Extrai os valores com segurança (usa 0 se estiver vazio)
    const valorSaudavel = (source.saudavel && source.saudavel.length > 0) ? source.saudavel[0] : 0;
    const valorAtencao = (source.atencao && source.atencao.length > 0) ? source.atencao[0] : 0;
    const valorCritico = (source.critico && source.critico.length > 0) ? source.critico[0] : 0;

    console.log('📊 Carregando gráfico Saúde Bateria:', { valorSaudavel, valorAtencao, valorCritico });

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

    const chartElement = document.querySelector('#grafico_saude_bateria');
    if (!chartElement) {
      console.error('❌ Elemento #grafico_saude_bateria não encontrado no DOM');
      return;
    }

    if (graficoBateriaApex) {
      try {
        graficoBateriaApex.updateSeries(seriesData);
        console.log('✅ Gráfico Saúde Bateria atualizado');
      } catch (e) {
        console.warn('⚠️ Erro ao atualizar gráfico bateria:', e);
      }
    } else {
      graficoBateriaApex = new ApexCharts(chartElement, options);
      graficoBateriaApex.render()
        .then(() => console.log('✅ Gráfico Saúde Bateria renderizado'))
        .catch(err => console.error('❌ Erro ao renderizar Saúde Bateria:', err));
    }
  }

  function filtrarDados(filtroModeloNome) {
    const base = dadosMockadosGlobais || {};
    if (!filtroModeloNome) return base;
    
    // Filtrar hotspot e fila de triagem pelo nome do modelo
    return {
      ...base,
      hotspot: (base.hotspot || []).filter((h) => h.model === filtroModeloNome),
      filaTriagem: (base.filaTriagem || []).filter((f) => {
        // Encontrar o modelo correspondente ao alerta
        const modeloDoAlerta = base.hotspot.find(h => h.model === filtroModeloNome);
        return modeloDoAlerta && f.idModelo === modeloDoAlerta.modelo_id;
      })
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

  window.aplicarFiltroGlobal = (tipo) => {
    console.log('🔍 Aplicando filtro global:', tipo);
    // Filtros de KPI não filtram por modelo, apenas dão feedback visual
    // O filtro real por modelo vem do clique nas bolhas do gráfico
    mostrarFeedback(`Visualizando: ${tipo}`, 'info');
    // Não aplicar filtro, apenas feedback visual
    // Se quiser implementar filtro por status no futuro, adicionar lógica aqui
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
    await buscarDadosDoAPI();
    atualizarTodosOsModulos(null);
  }
  carregar();

});