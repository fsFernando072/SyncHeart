create database if not exists sync_heart;
use sync_heart;

create table Fabricante (
id_fabricante int primary key auto_increment,
nome_fabricante varchar(50),
cnpj_fabricante varchar(50),
email_fabricante varchar(50),
senha_fabricante varchar(50)
);

create table Usuario (
id_usuario int primary key auto_increment,
nome_usuario varchar(50),
cpf_usuario varchar(50),
email_usuario varchar(50),
fk_fabricante int,
foreign key fk_fabricante(fk_fabricante) references Fabricante(id_fabricante)
)auto_increment = 100;

create table Modelo (
id_modelo int primary key auto_increment,
modelo varchar(45),
fk_fabricante int,
foreign key fk_fabricante(fk_fabricante) references Fabricante(id_fabricante),
codNumeracao int
);

create table TipoParametro (
id_tipoParametro int primary key auto_increment,
nome varchar(45)
);

create table Parametro (
id_parametro int primary key auto_increment,
fk_modelo int,
foreign key fk_modelo(fk_modelo) references Modelo(id_modelo),
fk_tipoParametro int,
foreign key fk_tipoParametro(fk_tipoParametro) references TipoParametro(id_tipoParametro),
limite int
)auto_increment = 1000;

create table Dispositivo (
id_dispositivo int primary key auto_increment,
fk_parametro int,
foreign key fk_parametro(fk_parametro) references Parametro(id_parametro)
)auto_increment = 10000;

create table Tabela_Aprovacao (
id int primary key auto_increment,
nome_aprovacao varchar(50),
cnpj_aprovacao varchar(50),
email_aprovacao varchar(50),
senha_aprovacao varchar(50)
);

create table Usuario_Syncheart(
	id int primary key auto_increment,
    nome varchar(50),
    email varchar(50),
    senha varchar(50)
);

insert into Usuario_Syncheart (nome, email, senha) values ('Gabriel Castilho', 'gabriel@gmail', '12345');

insert into TipoParametro (nome)
values	("cpu"),("ram"),("disco");