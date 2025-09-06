create database sync_heart;
use sync_heart;

create table UsuarioSyncHeart (
    id int primary key auto_increment,
    nome varchar(45),
    email varchar(45),
    senha varchar(45)
);

create table Fabricante (
    id_fabricante int primary key auto_increment,
    nome varchar(45),
    cnpj varchar(45),
    email varchar(45),
    acesso tinyint
);

create table Usuario (
    id_usuario int primary key auto_increment,
    nome varchar(45),
    email varchar(45),
    senha varchar(45),
    cargo varchar(45),
    fk_fabricante int,
    foreign key (fk_fabricante) references Fabricante(id_fabricante)
);

create table Modelo (
    id_modelo int primary key auto_increment,
    modelo varchar(45),
    fk_fabricante int,
    cod_numeracao int,
    foreign key (fk_fabricante) references Fabricante(id_fabricante)
);

create table Dispositivo (
    id_dispositivo int primary key auto_increment,
    fk_modelo int,
    foreign key (fk_modelo) references Modelo(id_modelo)
);

create table Tipo_Parametros (
    id_tipo_parametro int primary key auto_increment,
    nome varchar(45)
);

create table Parametros (
    id_parametro int primary key auto_increment,
    fk_modelo int,
    fk_tipo_parametro int,
    limite int,
    foreign key (fk_modelo) references Modelo(id_modelo),
    foreign key (fk_tipo_parametro) references Tipo_Parametros(id_tipo_parametro)
);

insert into UsuarioSyncHeart (nome, email, senha) 
values ('Gabriel', 'gabriel.castilho@sptech.school', '12345');