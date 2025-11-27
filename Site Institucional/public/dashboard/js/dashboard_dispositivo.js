
const headerUserInfoEl = document.getElementById("header_user_info");

let chartBateria = null;

 const usuarioLogado = JSON.parse(sessionStorage.getItem("USUARIO_LOGADO"));
  const nome = usuarioLogado.usuario.nome;
  const email = usuarioLogado.usuario.email;

  headerUserInfoEl.innerHTML = `
    <div class="user-info">
      <span class="user-name">${nome}</span>
      <span class="user-email">${email}</span>
    </div>
  `;


// ---------------------------------------------------------------------------
// Inicialização dos gráficos da dashboard
// ---------------------------------------------------------------------------
function inicializarGraficos(dados) {


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
  // Gráfico: Consumo de bateria (por semana)
  // -------------------------------------------------------------------------
  const elementoGraficoConsumo = document.getElementById("consumoBateria");

  if (elementoGraficoConsumo) {
    if (consumoBateria) consumoBateria.destroy();

    const ctx = elementoGraficoConsumo.getContext("2d");

    consumoBateria = new Chart(ctx, {
      type: "bar",
      data: {
        labels: [],
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
function atualizarMiniIndicadores() {


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