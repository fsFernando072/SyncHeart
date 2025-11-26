// js/dashboard_dispositivo.js

// ---------------------------------------------------------------------------
// Elementos principais do layout
// ---------------------------------------------------------------------------

// Onde aparecerá o nome e o e-mail do usuário logado no topo da tela
const headerUserInfoEl = document.getElementById("header_user_info");

// ---------------------------------------------------------------------------
// Funções utilitárias (pequenas ajudas usadas em várias partes do código)
// ---------------------------------------------------------------------------

// Gera um número inteiro aleatório entre min e max
function numeroAleatorio(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Calcula média de um array de números (versão mais explícita e legível)
function calcularMedia(valores) {
  const soma = valores.reduce((total, n) => total + n, 0);
  return Math.round(soma / valores.length);
}

// Gera uma lista com horários do dia em formato “0:00”, “1:00” ... “23:00”
const horasDoDia = Array.from({ length: 24 }, (_, i) => `${i}:00`);


// ---------------------------------------------------------------------------
// Gerador de dados simulados (mock) — apenas para exibição dos gráficos
// ---------------------------------------------------------------------------

/*
  Esta função cria dados aleatórios para mostrar nos gráficos.
  Ela usa "deviceSeed" para evitar que todos os dispositivos
  tenham dados idênticos.
*/
function gerarDadosSimulados(deviceSeed = 0) {

  // Simula o desgaste da bateria ao longo do dia
  const bateria = horasDoDia.map((_, hora) => {
    // consumo padrão + uma variação por dispositivo
    const consumoBase = 0.7 + (deviceSeed % 2) * 0.2;
    const ruido = Math.random() * 1.7; // variação natural
    const valor = 100 - hora * consumoBase - ruido;

    return Math.max(2, Math.round(valor)); // nunca abaixo de 2%
  });

  // Quantidade de alertas por tipo
  const alertasTotais = [
    numeroAleatorio(0, 10) + (deviceSeed % 3), // CPU
    numeroAleatorio(0, 8) + (deviceSeed % 2),  // RAM
    numeroAleatorio(0, 6)                      // Flash
  ];

  // Linha do tempo dos últimos 7 dias
  const alertaPorDia = Array.from({ length: 7 }, () =>
    numeroAleatorio(0, 6)
  );

  return {
    batt: bateria,
    alerts: alertasTotais,
    alertsTimeline: alertaPorDia
  };
}


// ---------------------------------------------------------------------------
// Variáveis que armazenam instâncias dos gráficos (para destruir e recriar)
// ---------------------------------------------------------------------------
let chartBateria = null;
let chartAlertas = null;


// ---------------------------------------------------------------------------
// Inicialização dos gráficos da dashboard
// ---------------------------------------------------------------------------
function inicializarGraficos(dados) {

  // -------------------------------------------------------------------------
  // Exibe nome + e-mail do usuário logado
  // -------------------------------------------------------------------------
  const usuarioLogado = JSON.parse(sessionStorage.getItem("USUARIO_LOGADO"));
  const nome = usuarioLogado.usuario.nome;
  const email = usuarioLogado.usuario.email;

  headerUserInfoEl.innerHTML = `
    <div class="user-info">
      <span class="user-name">${nome}</span>
      <span class="user-email">${email}</span>
    </div>
  `;


  // -------------------------------------------------------------------------
  // Gráfico: Bateria ao longo do dia
  // -------------------------------------------------------------------------
  const elementoGraficoBateria = document.getElementById("graficoBateria%PorDia");

if (elementoGraficoBateria) {
  if (chartBateria) chartBateria.destroy();

  const ctx = elementoGraficoBateria.getContext("2d");

  chartBateria = new Chart(ctx, {
    type: "line",
    data: {
      labels: horasDoDia,
      datasets: [
        {
          label: "Bateria (%)",
          data: dados.batt,
          fill: true,
          tension: 0.35,
          borderColor: "#D6166F",
          backgroundColor: "rgba(214,22,111,0.1)"
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true, max: 100 }
      },
      plugins: {
        annotation: {
          annotations: {
            // Linha laranja em 50
            limite50: {
              type: "line",
              yMin: 50,
              yMax: 50,
              borderColor: "orange",
              borderWidth: 2,
              borderDash: [6, 6],
              label: {
                display: true,
                content: "Limite recomendado (50%)",
                backgroundColor: "rgba(255,165,0,0.2)",
                color: "orange"
              }
            },

            // Linha vermelha em 15
            limite15: {
              type: "line",
              yMin: 15,
              yMax: 15,
              borderColor: "red",
              borderWidth: 2,
              borderDash: [6, 6],
              label: {
                display: true,
                content: "Limite crítico (15%)",
                backgroundColor: "rgba(255,0,0,0.2)",
                color: "red"
              }
            }
          }
        }
      }
    }
  });
}




  // -------------------------------------------------------------------------
  // Gráfico: Alertas por dia (últimos 7 dias)
  // -------------------------------------------------------------------------
  // -------------------------------------------------------------------------
  // Gráfico: Consumo de bateria (por semana)
  // -------------------------------------------------------------------------
  const elementoGraficoAlertas = document.getElementById("graficoAlertasPorDia");

  if (elementoGraficoAlertas) {
    if (chartAlertas) chartAlertas.destroy();

    const ctx = elementoGraficoAlertas.getContext("2d");

    chartAlertas = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["D-6", "D-5", "D-4", "D-3", "D-2", "D-1", "Hoje"],
        datasets: [
          {
            label: "Alertas",
            data: dados.alertsTimeline,
            backgroundColor: "#D6166F"
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true }
        },
        plugins: {
          annotation: {
            annotations: {
              linhaMedia: {
                type: "line",
                yMin: 7,
                yMax: 7,
                borderColor: "red",
                borderWidth: 2,
                borderDash: [6, 6],
                label: {
                  display: true,
                  content: "Média (7)",
                  backgroundColor: "rgba(255,0,0,0.15)",
                  color: "red"
                }
              }
            }
          }
        }
      }
    });
  }

}


// ---------------------------------------------------------------------------
// Atualiza os pequenos indicadores no topo do painel
// ---------------------------------------------------------------------------
function atualizarMiniIndicadores(dados, deviceId) {

  // Função simples para trocar texto de um elemento
  function trocarTexto(id, texto) {
    const el = document.getElementById(id);
    if (el) el.textContent = texto;
  }

  // Último valor da bateria
  const bateriaAtual = dados.batt.at(-1) || 0;
  trocarTexto("mini_batt", bateriaAtual + "%");

  // Caso você queira, aqui dá para expandir o cálculo de percentuais de alerta
}


// ---------------------------------------------------------------------------
// Troca os dados exibidos ao selecionar dispositivo
// ---------------------------------------------------------------------------
function atualizarPorDispositivo(deviceId) {

  // Extrai números do ID para gerar uma variação fixa por dispositivo
  const seed = parseInt(deviceId.replace(/\D/g, "") || "0", 10) % 7;

  const dados = gerarDadosSimulados(seed);

  atualizarMiniIndicadores(dados, deviceId);
  inicializarGraficos(dados);

  // Atualiza o título do cabeçalho
  const header = document.getElementById("header_title");
  if (header) header.textContent = `Visão do paciente — ${deviceId}`;
}


// ---------------------------------------------------------------------------
// Configura a interação de clique nos itens da lista lateral
// ---------------------------------------------------------------------------
function configurarSelecaoDeDispositivos() {

  const itens = document.querySelectorAll(".device-row");
  if (!itens.length) return;

  itens.forEach(item => {

    // Clique na linha
    item.addEventListener("click", () => {
      itens.forEach(i => i.classList.remove("selected"));
      item.classList.add("selected");

      const deviceId =
        item.dataset.device ||
        item.querySelector(".device-id")?.textContent?.trim();

      if (deviceId) atualizarPorDispositivo(deviceId);
    });

    // Acessibilidade: Enter ou Espaço selecionam o dispositivo
    item.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        item.click();
      }
    });
  });

  // Seleciona automaticamente o primeiro item
  const inicial =
    document.querySelector(".device-row.selected") || itens[0];

  if (inicial) {
    const deviceId =
      inicial.dataset.device ||
      inicial.querySelector(".device-id")?.textContent?.trim();

    if (deviceId) atualizarPorDispositivo(deviceId);
  }
}


// ---------------------------------------------------------------------------
// Evento principal — DOM carregado
// ---------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {

  configurarSelecaoDeDispositivos();

  // Caso futuramente exista um select de período
  const selectPeriodo = document.getElementById("periodSelect");
  if (selectPeriodo) {
    selectPeriodo.addEventListener("change", () => {
      const atual = document.querySelector(".device-row.selected");
      const deviceId =
        atual?.dataset?.device ||
        atual?.querySelector(".device-id")?.textContent?.trim();

      if (deviceId) atualizarPorDispositivo(deviceId);
    });
  }
});


// ---------------------------------------------------------------------------
// Botão de abrir/fechar a lista lateral
// ---------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {

  const botao = document.getElementById("toggleDeviceListBtn");
  const lista = document.querySelector(".sidebar-list-devices");
  const conteudo = document.querySelector(".main-content");

  if (botao && lista && conteudo) {
    botao.addEventListener("click", () => {
      lista.classList.toggle("hidden");
      conteudo.classList.toggle("expanded");
    });
  }

  // Ajuste automático para telas pequenas
  function ajustarPorTamanho() {
    if (window.innerWidth <= 1000) {
      lista.classList.remove("hidden");
      conteudo.classList.remove("expanded");
    }
  }

  ajustarPorTamanho();
  window.addEventListener("resize", ajustarPorTamanho);


  // -----------------------------------------------------------------------
  // Configura o botão "Cadastrar" conforme o cargo do usuário
  // -----------------------------------------------------------------------
  function configurarBotaoCadastrar() {
    const usuario = JSON.parse(sessionStorage.getItem("USUARIO_LOGADO"));
    const cargo = usuario.usuario.cargoId;

    const botao = document.getElementById("nav_cadastrar");
    const label = document.getElementById("nav_cadastrar_label");

    if (!botao || !label) return;

    botao.style.display = "none";

    switch (cargo) {
      case 2: // Admin
        label.textContent = "Funcionários";
        botao.href = "crud_funcionario.html";
        botao.title = "Gerenciar Funcionários";
        botao.style.display = "flex";
        break;

      case 4: // Engenharia Clínica
        label.textContent = "Modelos";
        botao.href = "crud_modelo.html";
        botao.title = "Gerenciar Modelos";
        botao.style.display = "flex";
        break;

      case 3: // Eletrofisiologista
        label.textContent = "Marcapassos";
        botao.href = "provisionar_dispositivo.html";
        botao.title = "Provisionar Marcapassos";
        botao.style.display = "flex";
        break;
    }
  }

  configurarBotaoCadastrar();
});
