
# -------------------------
# Instalação 
# -------------------------
 install.packages(c('tidyverse', 'readr', 'lubridate', 'GGally', 'corrplot', 'pROC', 'effects', 'reshape2'))

install.packages('readr')
# -------------------------
# Bibliotecas
# -------------------------
library(tidyr)   # library(ggplot2) library(dplyr) inclui ggplot2, dplyr, tidyr, etc.
library(readr)
library(lubridate)
library(GGally)
library(corrplot)
library(pROC)
library(effects)
library(reshape2)

# -------------------------
#         limpeza
# -------------------------

# Converte tipos
# Arritmia: True == 1 e False == 0
dados$arritmia_detectada[dados$arritmia_detectada == 'True'] <- '1'
dados$arritmia_detectada[dados$arritmia_detectada == 'False'] <- '0'

dados$arritmia_detectada <- as.numeric(dados$arritmia_detectada)


dados2$arritmia_detectada[dados2$arritmia_detectada == 'True'] <- '1'
dados2$arritmia_detectada[dados2$arritmia_detectada == 'False'] <- '0'

dados2$arritmia_detectada <- as.numeric(dados2$arritmia_detectada)


# Data/hora
if('timestamp_utc' %in% names(dados)){
  dados <- dados %>%
    mutate(horario = ymd_hms(timestamp_utc, tz = 'UTC'))
} else if('horario' %in% names(dados)){
  dados <- dados %>% mutate(horario = ymd_hms(horario, tz = 'UTC'))
} else stop('Coluna timestamp_utc / horario não encontrada no CSV')


numeric_cols <- c('cpu_porcentagem','ram_porcentagem','disco_uso_kb','bateria_porcentagem','total_tarefas_ativas')
for(col in numeric_cols){
  if(col %in% names(dados)) dados[[col]] <- as.numeric(dados[[col]])
}

if('timestamp_utc' %in% names(dados2)){
  dados2 <- dados2 %>%
    mutate(horario = ymd_hms(timestamp_utc, tz = 'UTC'))
} else if('horario' %in% names(dados2)){
  dados2 <- dados2 %>% mutate(horario = ymd_hms(horario, tz = 'UTC'))
} else stop('Coluna timestamp_utc / horario não encontrada no CSV')


numeric_cols2 <- c('cpu_porcentagem','ram_porcentagem','disco_uso_kb','bateria_porcentagem','total_tarefas_ativas')
for(col in numeric_cols2){
  if(col %in% names(dados2)) dados2[[col]] <- as.numeric(dados2[[col]])
}

# -------------------------
# Funções 
# -------------------------

calcular_tempo_acima_limite <- function(valores, limite) { # função que calcula o tempo gasto
  sum(valores > limite, na.rm = TRUE) / length(na.omit(valores)) * 100 # acima de um determinado limite
}


gerar_relatorio <- function(dados){
  cat('=== RELATÓRIO DE MONITORAMENTO ===\n\n')
  cat('Período analisado:', format(min(dados$horario), '%Y-%m-%d %H:%M', tz='UTC'), 'a', format(max(dados$horario), '%Y-%m-%d %H:%M', tz='UTC'), '\n\n')
  
  cat('ESTATÍSTICAS GERAIS:\n')
  cat('CPU - Média:', round(mean(dados$cpu_porcentagem, na.rm = TRUE), 1), '% | Desvio Padrão:', round(sd(dados$cpu_porcentagem, na.rm = TRUE), 1), '\n')
  cat('RAM - Média:', round(mean(dados$ram_porcentagem, na.rm = TRUE), 1), '% | Desvio Padrão:', round(sd(dados$ram_porcentagem, na.rm = TRUE), 1), '\n')
  cat('Disco - Média (kB):', round(mean(dados$disco_uso_kb, na.rm = TRUE), 1), 'kB\n\n')
  
  cat('TEMPO ACIMA DE LIMITES CRÍTICOS (porcentagem do tempo):\n')
  cat('CPU > 15%:', round(calcular_tempo_acima_limite(dados$cpu_porcentagem, 15), 1), '%\n')
  cat('RAM > 80%:', round(calcular_tempo_acima_limite(dados$ram_porcentagem, 80), 1), '%\n')
}

# -------------------------
# Análise exploratória e visualizações
# -------------------------

# Matriz de correlação
num_dados <- dados %>% select(any_of(numeric_cols), arritmia_detectada)
corr_matrix <- cor(num_dados, use = 'complete.obs')
print(corr_matrix)

num_dados2 <- dados2 %>% select(any_of(numeric_cols), arritmia_detectada)
corr_matrix2 <- cor(num_dados2, use = 'complete.obs')
print(corr_matrix2)

# Plota correlograma
corrplot(corr_matrix, method = 'color', type = 'upper', tl.col = 'black', tl.cex = 0.8,
         main = 'Matriz de correlação')


# Histogramas das variáveis principais
dados %>%
  pivot_longer(cols = any_of(c('cpu_porcentagem','ram_porcentagem','disco_uso_kb','bateria_porcentagem')),
               names_to = 'variavel', values_to = 'valor') %>%
  ggplot(aes(x = valor, fill = variavel)) +
  geom_histogram(bins = 30, alpha = 0.7) +
  facet_wrap(~variavel, scales = 'free') +
  theme_minimal() +
  labs(title = 'Distribuições das Variáveis de Recurso')

# Scatter CPU x RAM colorido por arritmia
p1 <- ggplot(dados, aes(x = cpu_porcentagem, y = ram_porcentagem, color = arritmia_detectada)) +
  geom_point(alpha = 0.6) +
  theme_minimal() +
  labs(title = 'CPU vs RAM', color = 'Arritmia')
print(p1)

# CPU ao longo do tempo e RAM ao longo do tempo (linhas juntas)
p_time <- ggplot(dados2, aes(x = horario)) +
  geom_line(aes(y = cpu_porcentagem, color = 'CPU'), linewidth = 0.9) +
  geom_line(aes(y = ram_porcentagem, color = 'RAM'), linewidth = 0.9) +
  labs(title = 'Uso de CPU e RAM ao Longo do Tempo', x = 'Data/Hora', y = 'Uso (%)', color = 'Componente') +
  theme_bw() +
  theme(legend.position = 'top')
print(p_time)


# Pares (scatter matrix) das variáveis selecionadas
if(all(c('cpu_porcentagem','ram_porcentagem','bateria_porcentagem','total_tarefas_ativas',
         'arritmia_detectada') %in% names(dados))){
  
  
  ggpairs(dados %>% select(cpu_porcentagem, ram_porcentagem, bateria_porcentagem, total_tarefas_ativas, arritmia_fac),
          columns = 1:4,
          mapping = ggplot2::aes(color = arritmia_fac, alpha = 0.5))
  
  
}


if(all(c('cpu_porcentagem','ram_porcentagem','bateria_porcentagem','total_tarefas_ativas',
         'arritmia_detectada') %in% names(dados2))){

  
  ggpairs(dados2 %>% select(cpu_porcentagem, ram_porcentagem, bateria_porcentagem, total_tarefas_ativas, arritmia_fac),
          columns = 1:4,
          mapping = ggplot2::aes(color = arritmia_fac, alpha = 0.5))
  
  
}


# densidade por arrtimia
vars <- intersect(c('cpu_porcentagem','ram_porcentagem','disco_uso_kb','bateria_porcentagem'), names(dados))
for(v in vars){
  
  # densidade separada por arritmia
  p2 <- ggplot(dados %>% filter(!is.na(.data[[v]])), aes_string(x = v, fill = "arritmia_fac")) +
    geom_density(alpha = 0.6) +
    labs(title = paste("Densidade de", v, "por arritmia"), x = v) +
    theme_minimal()
  print(p2)
}

# mapa de correlação entre variáveis de leitura
if(ncol(corr_matrix) > 1){
  library(reshape2)
  cm <- reshape2::melt(corr_matrix)
  ggplot(cm, aes(Var1, Var2, fill = value)) +
    geom_tile() +
    geom_text(aes(label = round(value,2)), size = 3) +
    scale_fill_gradient2(low = "pink", mid = "white", high = "red", midpoint = 0) +
    labs(title = "mapa de Correlação") +
    theme_minimal() + theme(axis.text.x = element_text(angle = 45, hjust = 1))
}


if(ncol(corr_matrix2) > 1){
  library(reshape2)
  cm <- reshape2::melt(corr_matrix2)
  ggplot(cm, aes(Var1, Var2, fill = value)) +
    geom_tile() +
    geom_text(aes(label = round(value,2)), size = 3) +
    scale_fill_gradient2(low = "pink", mid = "white", high = "red", midpoint = 0) +
    labs(title = "mapa de Correlação") +
    theme_minimal() + theme(axis.text.x = element_text(angle = 45, hjust = 1))
}



# -------------------------
# Modelagem: Regressão logística
# -------------------------
# Modelo base com 3 preditores
modelo <- glm(arritmia_detectada ~ cpu_porcentagem + ram_porcentagem + total_tarefas_ativas,
              data = dados, family = binomial)
cat('--- Sumário do modelo ---\n')
print(summary(modelo))

# Previsões e avaliação simples
dado_prev <- dados %>% mutate(pred_prob = predict(modelo, type = 'response'),
                          pred_classe = if_else(pred_prob > 0.5, 1, 0))

conf_mat <- table(Predito = dado_prev$pred_classe, Real = dado_prev$arritmia_detectada)
cat('Matriz de confusão (threshold 0.5):\n')
print(conf_mat)


# Modelo univariado (CPU)
modelo_cpu <- glm(arritmia_detectada ~ cpu_porcentagem, data = dado_prev, family = binomial)
print(summary(modelo_cpu))


modelo <- glm(arritmia_detectada ~ cpu_porcentagem,
              data = dado_prev, family = binomial)
print(summary(modelo))

modelo2 <- glm(arritmia_detectada ~ ram_porcentagem,
              data = dado_prev, family = binomial)
print(summary(modelo2))

# Gráfico da relação logística (CPU)
p_log <- ggplot(dados, aes(x = cpu_porcentagem, y = arritmia_detectada)) +
  geom_point(alpha = 0.4, color = "gray50") +
  stat_smooth(method = "glm", method.args = list(family = "binomial"),
              se = TRUE, color = "#E74C3C", linewidth = 1.2) +
  labs(
    title = "Probabilidade de Arritmia em Função do Uso de CPU",
    x = "Uso de CPU (%)",
    y = "Probabilidade de Arritmia"
  ) +
  theme_minimal(base_size = 13)

p_log


# Gráfico da relação logística (RAM)
p_log2 <- ggplot(dados, aes(x = ram_porcentagem, y = arritmia_detectada)) +
  geom_point(alpha = 0.4, color = "gray50") +
  stat_smooth(method = "glm", method.args = list(family = "binomial"),
              se = TRUE, color = "#E74C3C", linewidth = 1.2) +
  labs(
    title = "Probabilidade de Arritmia em Função do Uso de RAM",
    x = "Uso de RAM (%)",
    y = "Probabilidade de Arritmia"
  ) +
  theme_minimal(base_size = 13)

p_log2


# Gráfico da relação logística (Processos)
p_log3 <- ggplot(dados, aes(x = total_tarefas_ativas, y = arritmia_detectada)) +
  geom_point(alpha = 0.4, color = "gray50") +
  stat_smooth(method = "glm", method.args = list(family = "binomial"),
              se = TRUE, color = "#E74C3C", linewidth = 1.2) +
  labs(
    title = "Probabilidade de Arritmia em Função das tarefas ativas",
    x = "Tarefas ativas",
    y = "Probabilidade de Arritmia"
  ) +
  theme_minimal(base_size = 13)

p_log3


# -------------------------
# Relatório final e saída
# -------------------------
gerar_relatorio(dados)

cat('\nAnálise concluída.')
