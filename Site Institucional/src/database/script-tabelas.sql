create database sync_heart;
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

create table Parametro (
id_parametro int primary key auto_increment,
cpu_parametro float,
ram_parametro float,
flash_parametro float
)auto_increment = 1000;

create table Dispositivo (
id_dispositivo int primary key auto_increment,
fk_fabricante int,
foreign key fk_fabricante(fk_fabricante) references Fabricante(id_fabricante),
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
