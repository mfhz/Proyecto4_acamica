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
                    user: emailBD.mail,
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
 

///Endpoint para: traer todos los usuarios registrados solo por el administrador o si es usuario normal el detalle de la cuenta.
server.get("/warehouse/v1/users", validateToken, async (req, res) => {
    const admin = req.tokenInfo.isAdmin;
    const userId = req.tokenInfo.id;
    try {
        let filterUser = [];
        if (admin) {
            const userBD = await obtenerDatosBD("users", true, true, true);
            filterUser = userBD.map((account) => {
                delete account.password;
                return account;
            });
        } else {
            const userBD = await obtenerDatosBD("users", "user_id", userId, true);
            filterUser = userBD.map((account) => {
                delete account.password;
                delete account.admin;
                delete account.disabled;
                delete account.user_id;
                return account;
            });
        }
    
        if (filterUser.length > 0) {
            res.status(200).json(filterUser);
        } else { 
            res.status(404).json("El usuario ingresado no existe");
        }
    } catch (error) {
        res.status(500).send("Ah ocurrido un error...." + error);
    }
});
 

///Endpoint para crear usuarios (Solo Admin)
server.post("/warehouse/v1/users", validateToken, async (req, res) => {
    const admin = req.tokenInfo.isAdmin;
	const { name, lastname, email, profile, pass, repeatPass } = req.body;	
	try {
		if (admin) {
            const emailBD = await obtenerDatosBD("users", "mail", email);            
            if (emailBD) {
                res.status(409).json("El correo ingresado ya existe");
                return;
            }
            if ((name && lastname && email && profile && pass && repeatPass)) {
                if (pass === repeatPass) {
                    const updateBD = await sequelize.query(
                        "INSERT INTO users (name, lastname, mail, password, admin) VALUES (:name, :lastname, :email, :pass, :profile)",
                        { replacements: { name, lastname, email, pass, profile } }
                    );
                    res.status(200).json("Usuario creado correctamente");
                } else {
                    res.status(409).json("Las contraseñas deben coincidir");
                }
            } else {
                res.status(400).send("Todos los campos son necesarios para registrarse");
            }
        } else {
            res.status(401).json("Acceso denegado, la cuenta debe ser administrador");
        }
	} catch (error) {
		res.status(500).send("Ah ocurrido un error...." + error);
	}
});


///Endpoint para actualizar informacion del usuario logueado
server.put("/warehouse/v1/users", validateToken, async (req, res) => {
    const token = req.tokenInfo;
    const userToken = token.user;
    try {
        const userBD = await obtenerDatosBD("users", "mail", userToken);
        const userId = userBD.user_id;
        if (userBD) {
            const { name, lastname } = req.body;
            if (name || lastname) {
                const userFilter = filterProps({ name, lastname });
                const updateUser = { ...userBD, ...userFilter };
                console.log(updateUser);
                const updateBD = await sequelize.query(
                    "UPDATE users SET name = :updateName, lastname = :updateLastName WHERE user_id = :userId",
                    {
                        replacements: {
                            updateName: updateUser.name,
                            updateLastName: updateUser.lastname,
                            userId: userId,
                        },
                    }
                );
                res.status(200).send("Usuario actualizado correctamente");
            } else {
                res.status(400).send("Debe haber por lo menos un campo para actualizar");
            }
        } else {
            res.status(404).json("El usuario ingresado no existe");
        }
    } catch (error) {
        res.status(500).send("Ah ocurrido un error...." + error);
    }
});
 

///Endpoint para eliminar cuenta del usuario logueado
server.delete("/warehouse/v1/users", validateToken, async (req, res) => {	
    try {
        const token = req.tokenInfo;
        const userId = token.id;
        const updateBD = await sequelize.query(`UPDATE users SET disabled = true WHERE user_id = :userId`, {
            replacements: {
                userId: userId,
            },
        });
        res.status(200).json("La cuenta se eliminó correctamente");
    } catch (error) {
        res.status(500).send("Ah ocurrido un error...." + error);
    }
});
  

///Endpoint para buscar usuarios en especifico (Solo Administrador)
server.get("/warehouse/v1/users/:useremail", validateToken, async (req, res) => {
    const admin = req.tokenInfo.isAdmin;
	const userEmail = req.params.useremail;
	try {
		if (admin) {
            const userBD = await obtenerDatosBD("users", "mail", userEmail);
		    if (userBD) {
		    	res.status(200).json(userBD);
		    } else {
		    	res.status(404).json("El usuario ingresado no existe");
		    }
        } else {
            res.status(401).json("Acceso denegado, la cuenta debe ser administrador");
        }
	} catch (error) {
		res.status(500).send("Ah ocurrido un error...." + error);
	}
});


///Endpoint para actualizar usuario en especifico (Solo Administrador)
server.put("/warehouse/v1/users/:useremail", validateToken, async (req, res) => {
    const userEmail = req.params.useremail;
    const admin = req.tokenInfo.isAdmin;
	try {
        if (admin) {
            const { name, lastname, password, admin, disabled } = req.body;
            if (name || lastname || password || admin || disabled) {
                const emailBD = await obtenerDatosBD("users", "mail", userEmail);
                const userId = emailBD.user_id;
                console.log(emailBD);
                if (!emailBD) {
                    res.status(404).json("El usuario ingresado no existe");
                    return;
                }
                const emailFilter = filterProps({ name, lastname, password, admin, disabled });
                const updateUser = { ...emailBD, ...emailFilter };
                console.log(updateUser);
                const update = await sequelize.query(
                    `UPDATE users SET name = :name, lastname = :lastname, password = :pass, admin = :isAdmin, disabled = :isDisabled WHERE user_id = :userId`,
                    {
                        replacements: {
                            name: updateUser.name,
                            lastname: updateUser.lastname,
                            pass: updateUser.password,
                            isAdmin: updateUser.admin,
                            isDisabled: updateUser.disabled,
                            userId: userId,
                        },
                    }
                );
                res.status(200).send(`El usuario con correo ${emailBD.mail} fue actualizado correctamente`);
            } else {
                res.status(400).send("Debe haber por lo menos un campo para actualizar");
            }
        } else {
            res.status(401).json("Acceso denegado, la cuenta debe ser administrador");
        }
	} catch (error) {
		res.status(500).send("Ah ocurrido un error...." + error);
	}
});


///Endpoint para eliminar un usuario en específico (Solo Administrador)
server.delete("/warehouse/v1/users/:useremail", validateToken, async (req, res) => {
    const userEmail = req.params.useremail;
    const admin = req.tokenInfo.isAdmin;
	try {
		if (admin) {
            const emailBD = await obtenerDatosBD("users", "mail", userEmail);
            const userId = emailBD.user_id;
            if (!emailBD) {
                res.status(404).json("El usuario ingresado no existe");
                return;
            }
            const update = await sequelize.query("UPDATE users SET disabled = true WHERE user_id = :userId", {
                replacements: {
                    userId: userId,
                },
            });
            res.status(200).send(`El usuario con correo ${userEmail} se encuentra deshabilitado`);
        } else {
            res.status(401).json("Acceso denegado, la cuenta debe ser administrador");
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


/**** Función para validar la firma del Token ****/
async function validateToken(req, res, next) {
	const tokenData = req.headers.authorization.split(" ")[1];
	try {
        const verification = jwt.verify(tokenData, signing);
		console.log('TOKEN')
		console.log(verification);
		const userBD = await obtenerDatosBD("users", "user_id", verification.id);
        const isDisabled = userBD.disabled;
		if (isDisabled) {
			res.status(401).send("Acceso denegado, la cuenta está deshabilitada");
		} else {
			req.tokenInfo = verification;
			next();
		}
	} catch (e) {
		res.status(401).json("El token es invalido");
	}
}


/**** Funcion donde verifica si un objeto tiene campos nulos o indefinidos y los que tienen valor los guarda en un nuevo objeto****/
function filterProps(obj) {
    Object.keys(obj).forEach((key) => !obj[key] && delete obj[key]);
	return obj;
}