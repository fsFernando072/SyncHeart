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
    ultima_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (modelo_id) REFERENCES Modelos(modelo_id),
    FOREIGN KEY (equipe_id) REFERENCES EquipesCuidado(equipe_id),
    FOREIGN KEY (paciente_id) REFERENCES Pacientes(paciente_id)
);

CREATE TABLE ModelosAlertaParametros (
    parametro_id INT AUTO_INCREMENT PRIMARY KEY,
    modelo_id INT NOT NULL,
    metrica ENUM('CPU', 'RAM', 'Bateria', 'Disco') NOT NULL,
    condicao ENUM('MAIOR_QUE', 'MENOR_QUE') NOT NULL,
    limiar_valor DECIMAL(5, 2) NOT NULL,
    duracao_minutos INT DEFAULT 0,
    criticidade ENUM('CRITICO', 'ATENCAO') NOT NULL DEFAULT 'ATENCAO',
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

INSERT INTO Clinicas VALUES 
(1, 'Saúde Plena', '11.111.111/1111-11', 'thiago@gmail.com', '123456', 'Ativo', '2025-11-18 17:01:47');

INSERT INTO Usuarios VALUES 
(2, 1, 'thiago@gmail.com', '123456', 'Thiago', 2, 1,NULL, '2025-11-18 17:01:47'),
(3, 1, 'beatriz@gmail.com', '123456', 'Beatriz', 4, 1,NULL, '2025-11-18 17:04:02'),
(4, 1, 'andre@gmail.com', '123456', 'André', 3, 1,NULL, '2025-11-18 17:04:23');

INSERT INTO EquipesCuidado VALUES (1, 'Ômega', 1);

INSERT INTO UsuarioEquipe VALUES (3, 1), (4, 1);

INSERT INTO Modelos VALUES 
(1, 4, 'Amvia', 10, '50', '60', '4', 'Litio', 1),
(2, 5, 'Sentiva', 9, '45', '65', '3', 'Iodo', 1);

INSERT INTO ModelosAlertaParametros VALUES 
(1, 1, 'CPU', 'MAIOR_QUE', 15.00, 2, 'ATENCAO', '2025-11-18 17:10:44', '2025-11-18 17:10:44'),
(2, 1, 'CPU', 'MAIOR_QUE', 20.00, 2, 'CRITICO', '2025-11-18 17:10:44', '2025-11-18 17:10:44'),
(3, 2, 'CPU','MAIOR_QUE', 18.00, 2, 'ATENCAO', '2025-11-18 17:13:02', '2025-11-18 17:13:02'),
(4, 2, 'CPU','MAIOR_QUE', 20.00, 2, 'CRITICO', '2025-11-18 17:13:02', '2025-11-18 17:13:02'),
(5, 1, 'RAM','MAIOR_QUE', 65.00, 2, 'ATENCAO', '2025-11-18 17:13:02', '2025-11-18 17:13:02'),
(6, 1, 'RAM','MAIOR_QUE', 70.00, 2, 'CRITICO', '2025-11-18 17:13:02', '2025-11-18 17:13:02'),
(7, 2, 'RAM','MAIOR_QUE', 75.00, 2, 'ATENCAO', '2025-11-18 17:13:02', '2025-11-18 17:13:02'),
(8, 2, 'RAM','MAIOR_QUE', 80.00, 2, 'CRITICO', '2025-11-18 17:13:02', '2025-11-18 17:13:02'),
(9, 1, 'DISCO','MAIOR_QUE', 40.00, 2, 'CRITICO', '2025-11-18 17:13:02', '2025-11-18 17:13:02'),
(10, 2, 'DISCO','MAIOR_QUE', 40.00, 2, 'CRITICO', '2025-11-18 17:13:02', '2025-11-18 17:13:02'),
(11, 1, 'BATERIA','MENOR_QUE', 20.00, 2, 'CRITICO', '2025-11-18 17:13:02', '2025-11-18 17:13:02'),
(12, 2, 'BATERIA','MENOR_QUE', 20.00, 2, 'CRITICO', '2025-11-18 17:13:02', '2025-11-18 17:13:02');

INSERT INTO Pacientes VALUES 
(1, '1091', 1, '2025-11-18 17:15:30'),
(2, '7701', 1, '2025-11-18 17:16:12'),
(3, '4002', 1, '2025-11-18 17:16:12'),
(4, '7702', 1, '2025-11-18 17:16:39'),
(5, '8922', 1, '2025-11-18 17:16:43'),
(6, '987654', 1, '2025-11-18 17:17:15'),
(7, '9147935', 1, '2025-11-18 17:18:26'),
(8, '7659015', 1, '2025-11-18 17:18:43'),
(9, '7401376', 1, '2025-11-18 17:18:58'),
(10, '1092', 1, '2025-11-18 17:19:10'),
(11, '656789', 1, '2025-11-18 17:22:25'),
(12, '234935', 1, '2025-11-18 17:23:22');

INSERT INTO Dispositivos VALUES 
(1, '680fab1b-5333-4caa-970b-091a484dcf7d', 1, '7663f50869b6d93f48490e23c984c04c5ee94e32', 'Pendente', 1, 1, '2025-11-18 17:15:30', '2025-11-18 17:15:30'),
(2, '5017d328-3322-496b-b6f3-a5ddb1a8492c', 1, '4f2f206510d35fac23770f3bc6789b4cdaf5098e', 'Pendente', 1, 2, '2025-11-18 17:16:12', '2025-11-18 17:16:12'),
(3, '3c7675fd-eaab-46e3-902b-352d41c115f1', 2, 'c4c0962ce523dd2ea160c9d50abb5a2acb676465', 'Pendente', 1, 3, '2025-11-18 17:16:12', '2025-11-18 17:16:12'),
(4, 'e0dd679e-03cf-43ee-b8c9-e54851310e3d', 2, '93dae89c51f24c941f7470fe899470a5c291eb03', 'Pendente', 1, 4, '2025-11-18 17:16:39', '2025-11-18 17:16:39'),
(5, '26b76fd9-beaa-4428-a328-461eed1f2013', 1, '81fc967c1a218e4706595df0805bc8ba69ab7cec', 'Pendente', 1, 5, '2025-11-18 17:16:43', '2025-11-18 17:16:43'),
(6, '6a2eee55-f6b0-4475-b0ba-4ef39211e66e', 1, '4f4aabec34294d0d8206419208139b0abc96e602', 'Pendente', 1, 6, '2025-11-18 17:17:15', '2025-11-18 17:17:15'),
(7, '5a83fe84-3d16-44ed-9dd0-9c21b35a2271', 1, 'c5595b084587b13fddf115c3407aa95e03d4a0fc', 'Pendente', 1, 7, '2025-11-18 17:18:26', '2025-11-18 17:18:26'),
(8, '9df4a175-49d0-4ab7-bd79-a430f39bba51', 2, '89ba689ea24944a3a16d466f0a70bea5c35c2c48', 'Pendente', 1, 8, '2025-11-18 17:18:43', '2025-11-18 17:18:43'),
(9, 'c847582f-e9ad-4862-a406-3fff820c92a0', 2, 'e4096b9f5c105f97b7f9b863d0722e2163b8f1a4', 'Pendente', 1, 9, '2025-11-18 17:18:58', '2025-11-18 17:18:58'),
(10, 'cda57540-260e-41f7-8a41-924263d0e476', 2, '461bfa307679c7013a0f5428c3ea34c68ae4af1e', 'Pendente', 1, 10, '2025-11-18 17:19:10', '2025-11-18 17:19:10'),
(11, '60986df3-7371-40cb-aaa7-2d147a4590f5', 1, '750b1fb04613ea6130f693a337671877b768231b', 'Pendente', 1, 11, '2025-11-18 17:22:25', '2025-11-18 17:22:25'),
(12, '600d9011-c393-4113-85b1-0b1531237226', 2, 'b656bb81be77326c3207b2f4ac9b9023f8094999', 'Pendente', 1, 12, '2025-11-18 17:23:22', '2025-11-18 17:23:22');


-- ============================================
-- Criação do usuário de banco
-- ============================================
CREATE USER IF NOT EXISTS 'heart'@'%' IDENTIFIED BY 'Sptech#2024';
GRANT ALL PRIVILEGES ON syncheart.* TO 'heart'@'%';
FLUSH PRIVILEGES;

select * from Dispositivos;
select * from Pacientes;
select * from Modelos;
