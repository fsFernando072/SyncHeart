-- Criação do banco
create database if not exists sync_heart;
use sync_heart;

-- ===== TABELAS BASE =====

create table Fabricante (
  id_fabricante int primary key auto_increment,
  nome_fabricante varchar(50),
  email_fabricante varchar(50),
  senha_fabricante varchar(50),
  cnpj_fabricante varchar(50),
  acesso tinyint
);

create table Usuario (
  id_usuario int primary key auto_increment,
  nome_usuario varchar(50),
  email_usuario varchar(50),
  senha_usuario varchar(50),
  cargo_usuario varchar(50),
  fk_fabricante int,
  foreign key (fk_fabricante) references Fabricante(id_fabricante)
) auto_increment = 100;

create table Modelo (
  id_modelo int primary key auto_increment,
  modelo varchar(50),
  fk_fabricante int,
  codNumeracao int,
  foreign key (fk_fabricante) references Fabricante(id_fabricante)
);

create table Dispositivo (
  id_dispositivo int primary key auto_increment,
  fk_modelo int,
  foreign key (fk_modelo) references Modelo(id_modelo)
) auto_increment = 10000;

create table Tipo_Parametro (
  idTipo_Parametro int primary key auto_increment,
  nome varchar(50)
);

create table Parametro (
  id_parametro int primary key auto_increment,
  limite int,
  fk_modelo int,
  fk_tipo_parametro int,
  foreign key (fk_modelo) references Modelo(id_modelo),
  foreign key (fk_tipo_parametro) references Tipo_Parametro(idTipo_Parametro)
) auto_increment = 1000;

create table UsuarioSyncHeart (
  id_UsuarioSyncHeart int primary key auto_increment,
  nome varchar(50),
  email varchar(50),
  senha varchar(50)
);

insert into UsuarioSyncHeart (nome, email, senha)
values ('Gabriel', 'gabriel.castilho@sptech.school', '12345');