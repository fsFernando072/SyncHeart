DROP DATABASE IF EXISTS syncheart;
CREATE DATABASE IF NOT EXISTS syncheart;
USE syncheart;

SET NAMES 'utf8mb4';
SET CHARACTER SET utf8mb4;

-- ============================================
-- Estrutura das Tabelas
-- ============================================

CREATE TABLE Fabricantes (
    fabricante_id INT AUTO_INCREMENT PRIMARY KEY,
    nome_fabricante VARCHAR(255) NOT NULL UNIQUE,
    pais VARCHAR(100),
    site VARCHAR(255) NULL,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO Fabricantes (nome_fabricante, pais) VALUES
('Medtronic', 'Irlanda/EUA'),
('Abbott Laboratories', 'EUA'),
('Boston Scientific Corporation', 'EUA'),
('Biotronik', 'Alemanha'),
('LivaNova PLC', 'Reino Unido');

CREATE TABLE Clinicas (
    clinica_id INT AUTO_INCREMENT PRIMARY KEY,
    nome_fantasia VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) NOT NULL UNIQUE,
    email_contato VARCHAR(255) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    status ENUM('Pendente','Ativo','Inativo') DEFAULT 'Pendente',
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Cargos (
    cargo_id INT AUTO_INCREMENT PRIMARY KEY,
    nome_cargo VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT
);

CREATE TABLE EquipesCuidado (
    equipe_id INT AUTO_INCREMENT PRIMARY KEY,
    nome_equipe VARCHAR(255) NOT NULL,
    clinica_id INT NOT NULL,
    FOREIGN KEY (clinica_id) REFERENCES Clinicas(clinica_id) ON DELETE CASCADE
);

CREATE TABLE Usuarios (
    usuario_id INT AUTO_INCREMENT PRIMARY KEY,
    clinica_id INT NULL, 
    email VARCHAR(255) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    nome_completo VARCHAR(255),
    cargo_id INT NOT NULL,
    ativo TINYINT(1) DEFAULT 1,
    ultimo_login DATETIME NULL,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (clinica_id) REFERENCES Clinicas(clinica_id) ON DELETE CASCADE,
    FOREIGN KEY (cargo_id) REFERENCES Cargos(cargo_id)
);

CREATE TABLE UsuarioEquipe (
    usuario_id INT NOT NULL,
    equipe_id INT NOT NULL,
    PRIMARY KEY (usuario_id, equipe_id),
    FOREIGN KEY (usuario_id) REFERENCES Usuarios(usuario_id) ON DELETE CASCADE,
    FOREIGN KEY (equipe_id) REFERENCES EquipesCuidado(equipe_id) ON DELETE CASCADE
);

CREATE TABLE Modelos (
    modelo_id INT AUTO_INCREMENT PRIMARY KEY,
    fabricante_id INT NOT NULL,
    nome_modelo VARCHAR(255) NOT NULL,
    vida_util_projetada_anos INT,
    dimensoes VARCHAR(50),
	frequencia_basica VARCHAR(50),
	prazo_garantia VARCHAR(50),
	tipo_bateria VARCHAR(50),
    FOREIGN KEY (fabricante_id) REFERENCES Fabricantes(fabricante_id) ON DELETE RESTRICT,
    clinica_id INT NOT NULL,
 FOREIGN KEY (clinica_id) REFERENCES Clinicas(clinica_id)
);

CREATE TABLE Pacientes (
    paciente_id INT AUTO_INCREMENT PRIMARY KEY,
    id_paciente_na_clinica VARCHAR(50) NOT NULL,
    clinica_id INT NOT NULL,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (id_paciente_na_clinica, clinica_id),
    FOREIGN KEY (clinica_id) REFERENCES Clinicas(clinica_id) ON DELETE CASCADE
);

CREATE TABLE Dispositivos (
    dispositivo_id INT AUTO_INCREMENT PRIMARY KEY,
    dispositivo_uuid VARCHAR(36) NOT NULL UNIQUE,
    modelo_id INT NOT NULL,
    token_registro VARCHAR(255) UNIQUE,
    status ENUM('Pendente', 'Registrado - Aguardando Dados', 'Ativo/Monitorando', 'Descomissionado') NOT NULL DEFAULT 'Pendente',
    equipe_id INT NOT NULL,
    paciente_id INT,
    data_provisionamento DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (modelo_id) REFERENCES Modelos(modelo_id),
    FOREIGN KEY (equipe_id) REFERENCES EquipesCuidado(equipe_id),
    FOREIGN KEY (paciente_id) REFERENCES Pacientes(paciente_id)
);

/* Para caso armazenemos os dados de exibição no banco
CREATE TABLE DadosHardware (
    dado_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    dispositivo_id INT NOT NULL,
    timestamp_utc DATETIME NOT NULL,
    arritmia_detectada BOOLEAN,
    cpu_porcentagem DECIMAL(5, 2),
    ram_porcentagem DECIMAL(5, 2),
    disco_uso_kb DECIMAL(10, 4),
    bateria_porcentagem DECIMAL(7, 4),
    total_tarefas_ativas INT,
    lista_tarefas_ativas TEXT,
    INDEX idx_dispositivo_timestamp (dispositivo_id, timestamp_utc),
    FOREIGN KEY (dispositivo_id) REFERENCES Dispositivos(dispositivo_id) ON DELETE CASCADE
);
*/

CREATE TABLE ModelosAlertaParametros (
    parametro_id INT AUTO_INCREMENT PRIMARY KEY,
    modelo_id INT NOT NULL,
    metrica ENUM('CPU', 'RAM', 'Bateria', 'Disco') NOT NULL,
    condicao ENUM('MAIOR_QUE', 'MENOR_QUE') NOT NULL,
    limiar_valor DECIMAL(5, 2) NOT NULL,
    duracao_minutos INT DEFAULT 0,
    criticidade ENUM('Atencao', 'Critico') NOT NULL DEFAULT 'Atencao',
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (modelo_id) REFERENCES Modelos(modelo_id) ON DELETE CASCADE
);

CREATE TABLE Alertas (
    alerta_id INT AUTO_INCREMENT PRIMARY KEY,
    dispositivo_id INT NOT NULL,
    tipo_alerta VARCHAR(100) NOT NULL,
    severidade ENUM('baixa','media','alta','critica') DEFAULT 'media',
    mensagem TEXT NOT NULL,
    detectado_em DATETIME NOT NULL,
    status_alerta ENUM('Novo', 'Em Analise', 'Resolvido', 'Ignorado') NOT NULL DEFAULT 'Novo',
    usuario_responsavel_id INT NULL,
    resolvido_em DATETIME NULL,
    notas_resolucao TEXT NULL,
    FOREIGN KEY (dispositivo_id) REFERENCES Dispositivos(dispositivo_id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_responsavel_id) REFERENCES Usuarios(usuario_id)
);

-- ============================================
-- DADOS INICIAIS 
-- ============================================

-- Inserindo os cargos padrao do sistema
INSERT INTO Cargos (cargo_id, nome_cargo, descricao) VALUES
(1, 'Admin SyncHeart', 'Administrador geral do sistema, responsável por gerenciar as clínicas.'),
(2, 'Admin da Clínica', 'Usuário administrativo da clínica, responsável por gerenciar a equipe.'),
(3, 'Eletrofisiologista', 'Médico responsável pela análise clínica e acompanhamento de dispositivos.'),
(4, 'Engenharia Clínica', 'Responsável pela gestão técnica e operacional dos equipamentos médicos.');



-- Inserindo o usuario administrador principal do sistema
INSERT INTO Usuarios (nome_completo, email, senha_hash, cargo_id, clinica_id, ativo) VALUES
('Administrador SyncHeart', 'admin@syncheart.com', 'admin123', 1, NULL, 1);

SELECT * FROM cargos;
SELECT * FROM usuarios;
SELECT * FROM usuarioEquipe;
SELECT * FROM EquipesCuidado;


-- ============================================
-- Criação do usuário de banco
-- ============================================
CREATE USER IF NOT EXISTS 'heart'@'%' IDENTIFIED BY 'Sptech#2024';
GRANT ALL PRIVILEGES ON syncheart.* TO 'heart'@'%';
FLUSH PRIVILEGES;


select * from ModelosAlertaParametros;
select * from Modelos;

select * from dispositivos;

 


