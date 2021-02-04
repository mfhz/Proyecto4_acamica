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
  name VARCHAR (60) NOT NULL,
  disabled BOOLEAN DEFAULT FALSE
);


---- Tabla de Países
CREATE TABLE countries (
  country_id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR (60) NOT NULL,
  region_id INT NOT NULL DEFAULT "0",
  disabled BOOLEAN DEFAULT FALSE,
  FOREIGN KEY(region_id) REFERENCES regions(region_id)
);


---- Tabla de Ciudades
CREATE TABLE cities (
  city_id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR (60) NOT NULL,
  country_id INT NOT NULL DEFAULT "0",
  disabled BOOLEAN DEFAULT FALSE,
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
  disabled BOOLEAN DEFAULT FALSE,
  FOREIGN KEY(city_id) REFERENCES cities(city_id)
);


---- Tabla de Canales
CREATE TABLE channels (
  channel_id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR (60) NOT NULL,
  disabled BOOLEAN DEFAULT FALSE
);


---- Tabla de Preferencias
CREATE TABLE preferences (
  preference_id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR (60) NOT NULL,
  disabled BOOLEAN DEFAULT FALSE
);


---- Tabla de Cuentas
CREATE TABLE accounts (
  account_id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR (60) NOT NULL,
  channel_id INT NOT NULL DEFAULT "0",
  preference_id INT NOT NULL DEFAULT "0",
  disabled BOOLEAN DEFAULT FALSE,
  FOREIGN KEY(channel_id) REFERENCES channels(channel_id),
  FOREIGN KEY(preference_id) REFERENCES preferences(preference_id)
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
  account_id INT,
  disabled BOOLEAN DEFAULT FALSE,
  FOREIGN KEY(company_id) REFERENCES companies(company_id),
  FOREIGN KEY(city_id) REFERENCES cities(city_id),
  FOREIGN KEY(account_id) REFERENCES accounts(account_id)
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
    "America",
    FALSE
  );

INSERT INTO
  regions
VALUES
  (
    NULL,
    "Europa",
    FALSE
  );

INSERT INTO
  regions
VALUES
  (
    NULL,
    "Asia",
    FALSE
  );


-- Creación de Países
INSERT INTO
  countries
VALUES
  (
    NULL,
    "Colombia",
    1,
    FALSE
  ),
  (
    NULL,
    "Mexico",
    1,
    FALSE
  ),
  (
    NULL,
    "España",
    2,
    FALSE
  ),
  (
    NULL,
    "Belgica",
    2,
    FALSE
  ),
  (
    NULL,
    "Japon",
    3,
    FALSE
  ),
  (
    NULL,
    "China",
    3,
    FALSE
  );


-- Creación de Ciudades
INSERT INTO
  cities
VALUES
  (
    NULL,
    "Bogota",
    1,
    FALSE
  ),
  (
    NULL,
    "Medellin",
    1,
    FALSE
  ),
  (
    NULL,
    "Monterrey",
    2,
    FALSE
  ),
  (
    NULL,
    "Tijuana",
    2,
    FALSE
  ),
  (
    NULL,
    "Barcelona",
    3,
    FALSE
  ),
  (
    NULL,
    "Madrid",
    3,
    FALSE
  ),
  (
    NULL,
    "Bruselas",
    4,
    FALSE
  ),
  (
    NULL,
    "Brujas",
    4,
    FALSE
  ),
  (
    NULL,
    "Tokio",
    5,
    FALSE
  ),
  (
    NULL,
    "Osaka",
    5,
    FALSE
  ),
  (
    NULL,
    "Pekin",
    6,
    FALSE
  ),
  (
    NULL,
    "Macao",
    6,
    FALSE
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
    6,
    FALSE
  ),
  (
    NULL,
    "K2k",
    "Crr46 A",
    "k2k@k2k.com",
    364126,
    9,
    FALSE
  );


-- Creación de Canales
INSERT INTO
  channels
VALUES
  (
    NULL,
    "Whatsapp",
    FALSE
  ),
  (
    NULL,
    "Facebook",
    FALSE
  );


-- Creación de Preferencias
INSERT INTO
  preferences
VALUES
  (
    NULL,
    "Sin preferencia",
    FALSE
  ),
  (
    NULL,
    "No molestar",
    FALSE
  ),
  (
    NULL,
    "Canal favorito",
    FALSE
  );


-- Creación de Cuentas
INSERT INTO
  accounts
VALUES
  (
    NULL,
    "3218011550",
    1,
    1,
    FALSE
  ),
  (
    NULL,
    "https://www.facebook.com",
    2,
    1,
    FALSE
  );


-- Creación de Contactos
INSERT INTO
  contacts
VALUES
  (
    NULL,
    "Juanito",
    "Lopez",
    "Desarrollador FullStack",
    "juan@juan.com",
    2,
    2,
    "Crr 54 # 6-21",
    1,
    FALSE
  ),
  (
    NULL,
    "Sebastian",
    "Rodriguez",
    "Diseñador Grafico",
    "sebas@sebas.com",
    1,
    4,
    "Crr 78 Sur # 61-1",
    2,
    FALSE
  );


