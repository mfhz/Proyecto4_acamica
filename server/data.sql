---- Tabla de Usuarios
CREATE TABLE users (
  user_id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR (60) NOT NULL,
  lastname VARCHAR (60) NOT NULL,
  mail VARCHAR(60) NOT NULL,
  password VARCHAR (60) NOT NULL,
  admin BOOLEAN NOT NULL DEFAULT FALSE,
  disabled BOOLEAN DEFAULT FALSE
);


---- Tabla de Regiones
CREATE TABLE regions (
  region_id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR (60) NOT NULL
);


---- Tabla de Países
CREATE TABLE countries (
  country_id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR (60) NOT NULL,
  region_id INT NOT NULL DEFAULT "0",
  FOREIGN KEY(region_id) REFERENCES regions(region_id)
);


---- Tabla de Ciudades
CREATE TABLE cities (
  city_id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR (60) NOT NULL,
  country_id INT NOT NULL DEFAULT "0",
  FOREIGN KEY(country_id) REFERENCES countries(country_id)
);


---- Tabla de Compañias
CREATE TABLE companies (
  company_id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR (60) NOT NULL,
  address VARCHAR (60) NOT NULL,
  mail VARCHAR(60) NOT NULL,
  phone INT NOT NULL,
  city_id INT,
  FOREIGN KEY(city_id) REFERENCES cities(city_id)
);


---- Tabla de Contactos
CREATE TABLE contacts (
  contact_id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR (60) NOT NULL,
  lastname VARCHAR (60) NOT NULL,
  role VARCHAR (60) NOT NULL,
  mail VARCHAR(60) NOT NULL,
  company_id INT,
  city_id INT,
  address VARCHAR (60) NOT NULL,
  FOREIGN KEY(company_id) REFERENCES companies(company_id),
  FOREIGN KEY(city_id) REFERENCES cities(city_id)
);


-- Creación de Usuarios
INSERT INTO
  users
VALUES
  (
    NULL,
    "Martin",
    "Henriquez",
    "martin@martin.com",
    "Mh2020-+",
    TRUE,
    FALSE
  );

INSERT INTO
  users
VALUES
  (
    NULL,
    "Ana",
    "1",
    "ana@ana.com",
    "Mh2020-+",
    FALSE,
    FALSE
  );


-- Creación de Regiones
INSERT INTO
  regions
VALUES
  (
    NULL,
    "America"
  );

INSERT INTO
  regions
VALUES
  (
    NULL,
    "Europa"
  );

INSERT INTO
  regions
VALUES
  (
    NULL,
    "Europa"
  );


-- Creación de Países
INSERT INTO
  countries
VALUES
  (
    NULL,
    "Colombia",
    1
  ),
  (
    NULL,
    "Mexico",
    1
  ),
  (
    NULL,
    "España",
    2
  ),
  (
    NULL,
    "Belgica",
    2
  ),
  (
    NULL,
    "Japon",
    3
  ),
  (
    NULL,
    "China",
    3
  );


-- Creación de Ciudades
INSERT INTO
  cities
VALUES
  (
    NULL,
    "Bogota",
    1
  ),
  (
    NULL,
    "Medellin",
    1
  ),
  (
    NULL,
    "Monterrey",
    2
  ),
  (
    NULL,
    "Tijuana",
    2
  ),
  (
    NULL,
    "Barcelona",
    3
  ),
  (
    NULL,
    "Madrid",
    3
  ),
  (
    NULL,
    "Bruselas",
    4
  ),
  (
    NULL,
    "Brujas",
    4
  ),
  (
    NULL,
    "Tokio",
    5
  ),
  (
    NULL,
    "Osaka",
    5
  ),
  (
    NULL,
    "Pekin",
    6
  ),
  (
    NULL,
    "Macao",
    6
  );


-- Creación de Compañias
INSERT INTO
  companies
VALUES
  (
    NULL,
    "Instalcom",
    "Crr44 A",
    "instal@instal.com",
    56465489,
    6
  ),
  (
    NULL,
    "K2k",
    "Crr46 A",
    "k2k@k2k.com",
    364126,
    9
  );


-- Creación de Contactos
INSERT INTO
  contacts
VALUES
  (
    NULL,
    "Cesar",
    "Arias",
    "Diseñador grafico",
    "cesar@cesar.com",
    1,
    8,
    "Calle 9"
  ),
  (
    NULL,
    "Luis",
    "Bernal",
    "Arquitecto",
    "luis@luis.com",
    2,
    4,
    "Calle 11"
  );



