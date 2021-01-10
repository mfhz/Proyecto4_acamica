/* Express */
const express = require('express');
const server = express();
/* JWT */
const jwt = require('jsonwebtoken');
const signing = 'mafhz';
/* DB Connection */
const { db_host, db_name, db_user, db_password, db_port } = require("./conexion.js");
const Sequelize = require('sequelize');
const sequelize = new Sequelize(`mysql://${db_user}:${db_password}@${db_host}:${db_port}/${db_name}`);
const { QueryTypes } = require("sequelize");
/* Middleware */
const bodyParser = require('body-parser');
/* CSP Seguridad */
const helmet = require('helmet');

/* Server Setup */
server.use(helmet());
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: false }));
server.listen(3000, () => {
    console.log('Servivor Inicializado');
})


////------- ENDPOINTS -------\\\\


/**** Usuarios ****/

///Endpoint al hacer login entrega token 
server.get("/warehouse/v1/users/login", async (req, res) => {
	const { email, pass } = req.body;
	try {
		const emailBD = await obtenerDatosBD("users", "mail", email);
        if (email && pass) {
            if (emailBD.disabled) {
                res.status(401).send("La cuenta está deshabilitada");
            } else if (emailBD.password === pass) {
                const token = generateToken({
                    user: emailBD.name,
                    id: emailBD.user_id,
                    isAdmin: emailBD.admin,
                    isDisabled: emailBD.disabled,
                });
                res.status(200).json(token);
            } else {
                res.status(400).send("Correo o contraseña incorrectos");
            }
        } else {
            res.status(400).send("Se debe ingresar correo y contraseña");
        }
		
	} catch (error) {
		res.status(500).send("Ah ocurrido un error...." + error);
	}
});
 












////------- FUNCIONES -------\\\\


/**** Función donde se genera el Token ****/
function generateToken(data) {
	return jwt.sign(data, signing, { expiresIn: "50m" });
}


/**** Función donde consula a la BD ****/
async function obtenerDatosBD(tabla, tablaParametros = 'TRUE', input = 'TRUE', completo = false) {
	const results = await sequelize.query(`SELECT * FROM ${tabla} WHERE ${tablaParametros} = :replacementParam`, {
		replacements: { replacementParam: input },
		type: QueryTypes.SELECT,
    });
    // console.log(results);
	return results.length > 0 ? (completo ? results :  results[0]) : false;
}

