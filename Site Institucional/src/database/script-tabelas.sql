DROP DATABASE IF EXISTS syncheart;
CREATE DATABASE IF NOT EXISTS syncheart;
USE syncheart;

-- Organizações (clínicas / hospitais)
CREATE TABLE organizacoes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  cnpj VARCHAR(64), 
  status ENUM('pendente','aprovada','recusada') DEFAULT 'pendente',
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  criado_por_usuario_id INT  NULL,
  atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Usuários (médicos, técnicos, administradores, representante da organizacao, etc.)
-- papeis suporte e superadmin são para usuários da empresa SyncHeart
CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  organizacao_id INT NULL,
  usuario VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  senha_hash VARCHAR(255) NOT NULL,
  nome_completo VARCHAR(255), 
  papel ENUM('admin','medico','tecnico','visualizador', 'representante', 'superadmin', 'suporte') DEFAULT 'visualizador',
  ativo BOOLEAN DEFAULT 1,
  ultimo_login DATETIME NULL,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (organizacao_id) REFERENCES organizacoes(id) ON DELETE CASCADE
);

INSERT INTO usuarios (organizacao_id, usuario, email, senha_hash, nome_completo, papel, ativo)
VALUES (NULL, 'admin_syncheart', 'admin@syncheart.com', 'Sptech#2024', 'Admin SyncHeart', 'superadmin', 1);


-- Pacientes (APENAS identificador gerenciado pela clínica; sem dados pessoais)
CREATE TABLE pacientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  organizacao_id INT NOT NULL,
  cod_paciente VARCHAR(128) NOT NULL, -- Ainda não sei se é melhor definir direto como o ID da tabela
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE (organizacao_id, cod_paciente),
  FOREIGN KEY (organizacao_id) REFERENCES organizacoes(id) ON DELETE CASCADE
);

-- Fabricantes (apenas para consultas)
CREATE TABLE fabricantes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL UNIQUE,
  pais VARCHAR(100) NULL,
  site VARCHAR(255) NULL,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Modelos de dispositivo (ligados a fabricante, para definir padrão de consulta)
CREATE TABLE modelos_dispositivo (
  id INT  AUTO_INCREMENT PRIMARY KEY,
  fabricante_id INT  NOT NULL,
  nome_modelo VARCHAR(255) NOT NULL,
  codigo_modelo VARCHAR(128) NULL, -- se houver um código do fabricante
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE (fabricante_id, nome_modelo),
  FOREIGN KEY (fabricante_id) REFERENCES fabricantes(id) ON DELETE RESTRICT
);

-- Dispositivos (dados do marca-passo; sem dados clínicos sensíveis)
CREATE TABLE dispositivos (
  id INT  AUTO_INCREMENT PRIMARY KEY,
  cod_serial VARCHAR(128) NOT NULL, -- identificador do dispositivo
  modelo_id INT NULL,
  organizacao_id INT NOT NULL,
  instalado_em DATE NULL,
  paciente_id INT  NULL, -- referencia ao cod_paciente interno
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE (cod_serial, organizacao_id),
  FOREIGN KEY (modelo_id) REFERENCES modelos_dispositivo(id) ON DELETE SET NULL,
  FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE SET NULL,
  FOREIGN KEY (organizacao_id) REFERENCES organizacoes(id) ON DELETE CASCADE
);

-- Alertas (inseridos pelo ETL depois da análise dos CSVs)
-- Está faltando mais informações de rastreio, fica para quando tivermos acesso às etapas de ETL
-- Não sei como vai funcionar questões de resolução (será tudo parte do Jira/Slack ou tratado no próprio sistema também)
-- Por enquanto, tabela alertas mantém informações de tratamento de alertas
CREATE TABLE alertas (
  id INT  AUTO_INCREMENT PRIMARY KEY,
  dispositivo_id INT  NULL,
  tipo_alerta VARCHAR(100) NOT NULL, 
  severidade ENUM('baixa','media','alta','critica') DEFAULT 'media',
  mensagem TEXT,
  detectado_em DATETIME NOT NULL,    -- timestamp do evento detectado no CSV
  inserido_em DATETIME DEFAULT CURRENT_TIMESTAMP, -- quando entrou no BD
  reconhecido TINYINT(1) DEFAULT 0,
  reconhecido_em DATETIME NULL,
  resolvido_em DATETIME NULL,
  notas_resolucao TEXT NULL,
  FOREIGN KEY (dispositivo_id) REFERENCES dispositivos(id) ON DELETE SET NULL
);



CREATE USER heart IDENTIFIED BY "Sptech#2024";
GRANT ALL PRIVILEGES ON syncheart.* TO heart;
FLUSH PRIVILEGES; 


