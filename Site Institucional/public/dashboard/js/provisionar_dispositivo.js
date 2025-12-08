// js/provisionar_dispositivo.js

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. SELEÇÃO DE ELEMENTOS ---
    const form = document.getElementById('form_provisionamento');
    const selectModelo = document.getElementById('select_modelo');
    const selectEquipe = document.getElementById('select_equipe');
    const resultadoContainer = document.getElementById('resultado_provisionamento');
    const linkDownload = document.getElementById('link_download_script');
    const divFeedback = document.getElementById('div_feedback');
    let feedbackTimeout;

    // --- 2. FUNÇÃO DE FEEDBACK ---
    function mostrarFeedback(mensagem, tipo = 'error') {
        clearTimeout(feedbackTimeout);
        divFeedback.textContent = mensagem;
        divFeedback.className = '';
        divFeedback.classList.add(tipo, 'show');
        feedbackTimeout = setTimeout(() => {
            divFeedback.classList.remove('show');
        }, 5000);
    }

    // --- 3. LÓGICA DE INICIALIZAÇÃO E PERMISSÃO ---
    function iniciarPagina() {
        const dadosUsuarioLogado = JSON.parse(sessionStorage.getItem("USUARIO_LOGADO"));
        const CARGO_ELETROFISIOLOGISTA = 3;

        if (!dadosUsuarioLogado || dadosUsuarioLogado.usuario.cargoId !== CARGO_ELETROFISIOLOGISTA) {
            document.body.innerHTML = `<div style="text-align: center; padding: 50px;"><h2>Acesso Negado</h2><p>Apenas um Eletrofisiologista pode provisionar novos dispositivos.</p><a href="dash_geral.html">← Voltar</a></div>`;
            return;
        }
        // Preenche o cabeçalho
        document.getElementById('header_user_info').innerHTML = `<div class="user-info"><span class="user-name">${dadosUsuarioLogado.usuario.nome}</span><span class="user-email">${dadosUsuarioLogado.usuario.email}</span></div>`;
        document.getElementById('breadcrumb_path').textContent = dadosUsuarioLogado.clinica.nome;

        // Carrega os dados reais da API para os dropdowns
        carregarModelos();
        carregarEquipes(dadosUsuarioLogado.clinica.id);

        // Configura o evento do formulário
        configurarEventListeners();
    }

    // --- 4. CONFIGURAÇÃO DE EVENTOS ---
    function configurarEventListeners() {
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            provisionarDispositivo();
        });
    }

    // --- 5. FUNÇÕES DE CARREGAMENTO (CONECTADAS AO BACKEND) ---
    async function carregarModelos() {
        const token = sessionStorage.getItem('authToken');
        try {
            const resposta = await fetch(`/modelos/listar`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!resposta.ok) throw new Error('Falha ao carregar modelos.');
            const modelos = await resposta.json();
            selectModelo.innerHTML = '<option value="">Selecione um modelo...</option>';
            modelos.forEach(modelo => {
                selectModelo.innerHTML += `<option value="${modelo.modelo_id}">${modelo.nome_fabricante} - ${modelo.nome_modelo}</option>`;
            });

        } catch (erro) {
            console.error("Erro ao carregar modelos:", erro);
            selectModelo.innerHTML = '<option value="">Erro ao carregar</option>';
            mostrarFeedback(erro.message, 'error');
        }
    }

    async function carregarEquipes(idClinica) {
        const token = sessionStorage.getItem('authToken');
        try {
            const resposta = await fetch(`/equipes/por-clinica/${idClinica}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!resposta.ok) throw new Error('Falha ao carregar equipes.');

            const equipes = await resposta.json();

            selectEquipe.innerHTML = '<option value="">Selecione uma equipe...</option>';
            equipes.forEach(equipe => {
                selectEquipe.innerHTML += `<option value="${equipe.equipe_id}">${equipe.nome_equipe}</option>`;
            });

        } catch (erro) {
            console.error("Erro ao carregar equipes:", erro);
            selectEquipe.innerHTML = '<option value="">Erro ao carregar</option>';
            mostrarFeedback(erro.message, 'error');
        }
    }

    // --- 6. FUNÇÃO PRINCIPAL DE PROVISIONAMENTO ---
    async function provisionarDispositivo() {
        const token = sessionStorage.getItem('authToken');
        const dados = {
            idPacienteNaClinica: document.getElementById('input_id_paciente').value,
            modeloId: selectModelo.value,
            equipeId: selectEquipe.value
        };

        if (!dados.idPacienteNaClinica || !dados.modeloId || !dados.equipeId) {
            mostrarFeedback("Todos os campos são obrigatórios!", "error");
            return;
        }

        try {
            const resposta = await fetch('/dispositivos/provisionar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(dados)
            });

            const resultado = await resposta.json();
            if (!resposta.ok) throw new Error(resultado.erro);

            mostrarFeedback("Dispositivo provisionado com sucesso!", "success");
            // Simula a geração e o download do script
            // #BE-ALTERACOES Falta adicionar o script python de captura
            const scriptConteudo = `
# Script de Instalação SyncHeart
# 
# UUID do Dispositivo: ${resultado.dispositivoUuid}
# Token de Registro: ${resultado.tokenRegistro}
# 
# # +===============================================================+
# | SCRIPT DE CAPTURA DE DADOS DO MARCAPASSO - PROJETO SYNC-HEART |
# +===============================================================+
#!!!!!ALERTA!!!!! Ainda falta a lógica de geração automatica do script, especifico por dispositivo, 
# por parte do backend (Ele deve realizar a injeção do UUID do dispositivo)

#region !!IMPORTANTE!! Comunicado sobre alterações Sprint 3
#Para a sprint 2, os arquivos serão armazenados localmente, já na Sprint 3...
#deverão ser enviados para os buckets(S3) da AWS

#Essas alterações da sprint 3 já foram implementadas aqui, basta descomentar
#Para encontrar as alterações comentadas basta pesquisar "#AWS"

#endregion

#region --- 1. IMPORTACOES ---
# Bibliotecas necessarias para o funcionamento do script
import time
from datetime import datetime
import random
import os

# Biblioteca para coletar dados reais da maquina
import psutil

# Biblioteca para criar e manipular os arquivos CSV 
import pandas

# #AWS Biblioteca para interagir com a AWS (comentada para a Sprint 2)
import boto3
#endregion

#region --- 2. FUNCÕES DE APOIO ---

#UUID será injetado pelo backend quando ele gerar o script python dedicado ao dispositivo
UUID = "${resultado.dispositivoUuid}"
def receber_uuid():
    """
    Função placeholder - falta implementar lógica de receber a injeção de UUID igual ao inserido no BD (parte do Backend)
    """
    return UUID

def enviar_arquivos_pendentes_para_s3():
    """
    (Pronta para sprint3) Ela vai olhar a pasta de CSVs,
    tentar enviar cada um para a nuvem da AWS e apagar o local se conseguir.
    NO MOMENTO, ESTA APENAS SIMULANDO E NAO EXECUTA O ENVIO REAL.
    """
    print("--- [INICIO DO CICLO DE ENVIO PARA A NUVEM] ---")
    print("Verificando arquivos pendentes para envio...")
    
    # #AWS
    # Para ativar o envio real, descomente a linha 'import boto3' no inicio do arquivo
    # e as linhas marcadas como 'DESCOMENTAR PARA ATIVAR' abaixo.
    s3_client = boto3.client('s3') # DESCOMENTAR PARA ATIVAR

    try:
        arquivos_na_pasta = os.listdir(PASTA_SAIDA_CSVS)
        if not arquivos_na_pasta:
            print("Nenhum arquivo pendente para enviar.")
            return

        for nome_arquivo in arquivos_na_pasta:
            caminho_completo = os.path.join(PASTA_SAIDA_CSVS, nome_arquivo)
            try:
                print(f"Tentando enviar o arquivo {nome_arquivo} para o S3...")
                # #AWS
                s3_client.upload_file(caminho_completo, NOME_DO_BUCKET_S3, nome_arquivo) # DESCOMENTAR PARA ATIVAR O ENVIO
                os.remove(caminho_completo) # DESCOMENTAR PARA ATIVAR A EXCLUSAO APOS ENVIO
                
                print(f"SUCESSO: O arquivo {nome_arquivo} seria enviado e excluido.")

            except Exception as e:
                print(f"FALHA: Nao foi possivel enviar o arquivo {nome_arquivo}. Tentaremos novamente no proximo ciclo. Erro: {e}")
    except FileNotFoundError:
        print("Pasta de dados gerados ainda nao foi criada.")
    finally:
        print("--- [FIM DO CICLO DE ENVIO PARA A NUVEM] ---")
#endregion

#region --- 3. CONFIGURACOES E PARAMETROS GLOBAIS ---

PASTA_SAIDA_CSVS = "dados_gerados_csv/"
NOME_DO_BUCKET_S3 = "INSERIR_NOME" 
TEMPO_GERACAO_CSV_SEGUNDOS = 5 * 60
INTERVALO_LEITURA_SEGUNDOS = 10
UUID = receber_uuid()

CPU_PICO_ARRITMIA = 15.0
RAM_PICO_ARRITMIA = 20.0
TAREFAS_FIRMWARE = [
    "task_monitor_heartbeat",
    "task_pacing_control",
    "task_data_logging",
    "task_communication",
    "task_battery_management"
]
#endregion

#region --- 4. INICIALIZACAO DO SCRIPT ---

if not os.path.exists(PASTA_SAIDA_CSVS):
    os.makedirs(PASTA_SAIDA_CSVS)

print(f"ID Unico do Dispositivo (UUID): {UUID}")

disco_atual_kb = psutil.disk_usage('/').used / 1024
bateria_simulada = 99.0
dados_para_o_proximo_csv = []
inicio_do_ciclo_csv = time.time()

print(">>> Monitoramento Iniciado <<<")
#endregion

#region --- 5. LOOP PRINCIPAL DE MONITORAMENTO ---
while True:
    
    #region --Coleta dos dados da máquina--
    horario_atual = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cpu_real = psutil.cpu_percent(interval=1)
    ram_real = psutil.virtual_memory().percent
    bateria_coletada = None
    try:
        bateria_coletada = psutil.sensors_battery().percent
    except (AttributeError, TypeError):
        bateria_simulada -= 0.001 
        bateria_coletada = bateria_simulada
    #endregion
   
    #region --Simulação de funcionamento do marcapasso 
    arritmia_detectada = random.random() < 0.2
    tarefas_ativas_neste_ciclo = ["task_monitor_heartbeat", "task_data_logging"]
    
    if arritmia_detectada:
        print(f"-- {horario_atual}: Arritmia detectada! --")
        cpu_simulada = cpu_real + random.uniform(CPU_PICO_ARRITMIA, CPU_PICO_ARRITMIA + 5.0)
        ram_simulada = ram_real + random.uniform(RAM_PICO_ARRITMIA, RAM_PICO_ARRITMIA + 5.0)
        disco_atual_kb += random.uniform(0.015, 0.040)
        tarefas_ativas_neste_ciclo.append("task_pacing_control")
    else:
        print(f"--- {horario_atual}: Monitoramento normal ---")
        cpu_simulada = cpu_real + random.uniform(-1.0, 1.0)
        ram_simulada = ram_real + random.uniform(-1.0, 1.0)
        disco_atual_kb += random.uniform(0.00010, 0.00012)
    
    if random.random() < 0.1:
        tarefas_ativas_neste_ciclo.append("task_battery_management")
    if random.random() < 0.05:
        tarefas_ativas_neste_ciclo.append("task_communication")
        
    #endregion    
   
    cpu_final = max(0, min(100, cpu_simulada))
    ram_final = max(0, min(100, ram_simulada))
    bateria_final = max(0, min(100, bateria_coletada))

    #region --Armazenamento dos dados (temporário)--
    dados_para_o_proximo_csv.append({
        "timestamp_utc": horario_atual,
        "uuid": UUID,
        "arritmia_detectada": arritmia_detectada,
        "cpu_porcentagem": round(cpu_final, 2),
        "ram_porcentagem": round(ram_final, 2),
        "disco_uso_kb": round(disco_atual_kb, 4),
        "bateria_porcentagem": round(bateria_final, 4),
        "total_tarefas_ativas": len(tarefas_ativas_neste_ciclo),
        "lista_tarefas_ativas": ",".join(tarefas_ativas_neste_ciclo)
    })

    print(f"CPU: {cpu_final:.1f}% | RAM: {ram_final:.1f}% | Bateria: {bateria_final:.3f}% | Tarefas Ativas: {len(tarefas_ativas_neste_ciclo)}")
    #endregion

    #region --Geração de CSV--
    if time.time() - inicio_do_ciclo_csv >= TEMPO_GERACAO_CSV_SEGUNDOS:
        print(f"--- [CICLO DE 5 MINUTOS COMPLETO] ---")
        
        nome_arquivo_csv = f"dados_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        caminho_completo_csv = os.path.join(PASTA_SAIDA_CSVS, nome_arquivo_csv)

        if dados_para_o_proximo_csv:
            print(f"Gerando arquivo CSV: {nome_arquivo_csv}...")
            df = pandas.DataFrame(dados_para_o_proximo_csv)
            df.to_csv(caminho_completo_csv, index=False)
            print(f"Arquivo salvo com sucesso em: '{caminho_completo_csv}'")
        
        dados_para_o_proximo_csv = []
        inicio_do_ciclo_csv = time.time()
        
        # #AWS
        # !! ATENCAO !!: A linha abaixo esta comentada para a Sprint atual.
        # Chama a função de enviar os arquivos que ainda não foram enviados
        enviar_arquivos_pendentes_para_s3()
        #endregion
    
    print("-" * 100)
    time.sleep(INTERVALO_LEITURA_SEGUNDOS)
    #endregion
print("Script de provisionamento gerado com sucesso.")
            `;
            const blob = new Blob([scriptConteudo], { type: 'text/plain' });
            linkDownload.href = URL.createObjectURL(blob);
            linkDownload.download = `install_script_${dados.idPacienteNaClinica}.py`;

            resultadoContainer.style.display = 'block';
            form.reset();

        } catch (erro) {
            console.error("Erro ao provisionar:", erro);
            mostrarFeedback(`Erro: ${erro.message}`, "error");
        }
    }

    // --- 7. EXECUÇÃO ---
    iniciarPagina();
});