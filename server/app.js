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



/**** Regiones ****/


///Endpoint para obtener todas las regiones
server.get("/warehouse/v1/regions/", validateToken, async (req, res) => {
    const admin = req.tokenInfo.isAdmin;
    try {
        if (admin) {
            const getRegions = await obtenerDatosBD('regions', true, true, true);
            if (getRegions.length > 0) {
                res.status(200).json({data: getRegions, status: 200});
            } else {
                res.status(404).send("No hay regiones creadas");
            }
        } else {
            res.status(401).json("Acceso denegado, la cuenta debe ser administrador");
        }
    } catch (error) {
        res.status(500).send("Ah ocurrido un error...." + error);
    }
})


///Endpoint para crear una región
server.post("/warehouse/v1/regions/", validateToken, async (req, res) => {
    const admin = req.tokenInfo.isAdmin;
    const { name } = req.body;	
    try {
        if (admin) {            
            const nameRegionBD = await obtenerDatosBD("regions", "name", name);
            if (nameRegionBD) {
                res.status(409).json("El nombre ingresado ya existe, por favor intente con otro");
                return;
            }
            if (name) {
                const updateBD = await sequelize.query(
                    "INSERT INTO regions (name) VALUES (:name)",
                    { replacements: { name } }
                );
                res.status(200).json("Región creada correctamente");
            } else {
                res.status(400).send("Debe ingresar un nombre para crear la región");
            }
        } else {
            res.status(401).json("Acceso denegado, la cuenta debe ser administrador");
        }
    } catch (error) {
        res.status(500).send("Ah ocurrido un error...." + error);
    }
})


///Endpoint para buscar una región en especifico (Solo Administrador)
server.get("/warehouse/v1/regions/:name", validateToken, async (req, res) => {
    const admin = req.tokenInfo.isAdmin;
	const nameRegion = req.params.name;
	try {
		if (admin) {
            const nameBD = await obtenerDatosBD("regions", "name", nameRegion);
		    if (nameBD) {
		    	res.status(200).json({data: nameBD, status: 200});
		    } else {
		    	res.status(404).json("El nombre ingresado no existe");
		    }
        } else {
            res.status(401).json("Acceso denegado, la cuenta debe ser administrador");
        }
	} catch (error) {
		res.status(500).send("Ah ocurrido un error...." + error);
	}
});


///Endpoint para actualizar una región en especifico (Solo Administrador)
server.put("/warehouse/v1/regions/:name", validateToken, async (req, res) => {
    const admin = req.tokenInfo.isAdmin;
	const nameRegion = req.params.name;
	try {
		if (admin) {
            const nameBD = await obtenerDatosBD("regions", "name", nameRegion);
            const regionId = nameBD.region_id;
		    if (nameBD) {
                const { name, disabled } = req.body;
                if (name || disabled) {
                    const regionFilter = filterProps({ name, disabled });
                    const updateRegion = { ...nameBD, ...regionFilter };
                    const updateBD = await sequelize.query (
                        "UPDATE regions SET name = :nameUpdate, disabled = :isDisabled WHERE region_id = :regionId",
                        {
                            replacements: {
                                nameUpdate: updateRegion.name,
                                isDisabled: updateRegion.disabled,
                                regionId: regionId,
                            },
                        }
                    );
                    res.status(200).send("La región ha sido actualizada correctamente");
                } else {
                    res.status(400).send("Debe haber por lo menos un campo para actualizar");
                }		    	
		    } else {
		    	res.status(404).json("El nombre ingresado no existe");
		    }
        } else {
            res.status(401).json("Acceso denegado, la cuenta debe ser administrador");
        }
	} catch (error) {
		res.status(500).send("Ah ocurrido un error...." + error);
	}
});


///Endpoint para eliminar una región en especifico (Solo Administrador)
server.delete("/warehouse/v1/regions/:name", validateToken, async (req, res) => {
    admin = req.tokenInfo.isAdmin;
    nameRegion = req.params.name;
    if (admin) {
        nameBD = await obtenerDatosBD("regions", "name", nameRegion);
        regionId = nameBD.region_id;
        if (nameBD) {
            const updateBD = await sequelize.query(`UPDATE regions set disabled = true WHERE region_id = :regionId`, {
                replacements: {
                    regionId: regionId,
                },
            });
            res.status(200).send("La región ha sido eliminada correctamente");
        } else {
            res.status(404).json("El nombre ingresado no existe");
        }
    } else {
        res.status(401).json("Acceso denegado, la cuenta debe ser administrador");
    }
});



/**** Países ****/


///Endpoint para obtener todas las regiones
server.get("/warehouse/v1/countries/", validateToken, async (req, res) => {
    const admin = req.tokenInfo.isAdmin;
    try {
        if (admin) {
            const getcountries = await obtenerDatosBD('countries', true, true, true);
            if (getcountries.length > 0) {
                res.status(200).json({data: getcountries, status: 200});
            } else {
                res.status(404).send("No hay regiones creadas");
            }
        } else {
            res.status(401).json("Acceso denegado, la cuenta debe ser administrador");
        }
    } catch (error) {
        res.status(500).send("Ah ocurrido un error...." + error);
    }
})


///Endpoint para crear una región
server.post("/warehouse/v1/countries/", validateToken, async (req, res) => {
    const admin = req.tokenInfo.isAdmin;
    const { name, regionId } = req.body;	
    try {
        if (admin) {            
            const nameCountryBD = await obtenerDatosBD("countries", "name", name);
            if (nameCountryBD) {
                res.status(409).json("El nombre ingresado ya existe, por favor intente con otro");
                return;
            }
            if (name && regionId) {
                const updateBD = await sequelize.query(
                    "INSERT INTO countries (name, region_id) VALUES (:name, :regionId)",
                    { replacements: { name, regionId } }
                );
                res.status(200).json("País creado correctamente");
            } else {
                res.status(400).send("Se debe ingresar todos los parametros para crear el país");
            }
        } else {
            res.status(401).json("Acceso denegado, la cuenta debe ser administrador");
        }
    } catch (error) {
        res.status(500).send("Ah ocurrido un error...." + error);
    }
})


///Endpoint para buscar una región en especifico (Solo Administrador)
server.get("/warehouse/v1/countries/:name", validateToken, async (req, res) => {
    const admin = req.tokenInfo.isAdmin;
	const nameCountry = req.params.name;
	try {
		if (admin) {
            const nameBD = await obtenerDatosBD("countries", "name", nameCountry);
		    if (nameBD) {
		    	res.status(200).json({data: nameBD, status: 200});
		    } else {
		    	res.status(404).json("El nombre ingresado no existe");
		    }
        } else {
            res.status(401).json("Acceso denegado, la cuenta debe ser administrador");
        }
	} catch (error) {
		res.status(500).send("Ah ocurrido un error...." + error);
	}
});


///Endpoint para actualizar una región en especifico (Solo Administrador)
server.put("/warehouse/v1/countries/:name", validateToken, async (req, res) => {
    const admin = req.tokenInfo.isAdmin;
	const nameCountry = req.params.name;
	try {
		if (admin) {
            const nameBD = await obtenerDatosBD("countries", "name", nameCountry);
            const countryId = nameBD.country_id;
		    if (nameBD) {
                const { name, disabled } = req.body;
                if (name || disabled) {
                    const countryFilter = filterProps({ name, disabled });
                    const updatecountry= { ...nameBD, ...countryFilter };
                    const updateBD = await sequelize.query (
                        "UPDATE countries SET name = :nameUpdate, disabled = :isDisabled WHERE country_id = :countryId",
                        {
                            replacements: {
                                nameUpdate: updatecountry.name,
                                isDisabled: updatecountry.disabled,
                                countryId: countryId,
                            },
                        }
                    );
                    res.status(200).send("El país ha sido actualizado correctamente");
                } else {
                    res.status(400).send("Debe haber por lo menos un campo para actualizar");
                }		    	
		    } else {
		    	res.status(404).json("El nombre ingresado no existe");
		    }
        } else {
            res.status(401).json("Acceso denegado, la cuenta debe ser administrador");
        }
	} catch (error) {
		res.status(500).send("Ah ocurrido un error...." + error);
	}
});


///Endpoint para eliminar una región en especifico (Solo Administrador)
server.delete("/warehouse/v1/countries/:name", validateToken, async (req, res) => {
    admin = req.tokenInfo.isAdmin;
    nameCountry = req.params.name;
    if (admin) {
        nameBD = await obtenerDatosBD("countries", "name", nameCountry);
        countryId = nameBD.country_id;
        if (nameBD) {
            const updateBD = await sequelize.query(`UPDATE countries set disabled = true WHERE country_id = :countryId`, {
                replacements: {
                    countryId: countryId,
                },
            });
            res.status(200).send("El país ha sido eliminado correctamente");
        } else {
            res.status(404).json("El nombre ingresado no existe");
        }
    } else {
        res.status(401).json("Acceso denegado, la cuenta debe ser administrador");
    }
});



/**** Ciudades ****/


///Endpoint para obtener todas las ciudades
server.get("/warehouse/v1/cities/", validateToken, async (req, res) => {
    const admin = req.tokenInfo.isAdmin;
    try {
        if (admin) {
            const getCities = await obtenerDatosBD('cities', true, true, true);
            if (getCities.length > 0) {
                res.status(200).json({data: getCities, status: 200});
            } else {
                res.status(404).send("No hay ciudades creadas");
            }
        } else {
            res.status(401).json("Acceso denegado, la cuenta debe ser administrador");
        }
    } catch (error) {
        res.status(500).send("Ah ocurrido un error...." + error);
    }
})


///Endpoint para crear una ciudad
server.post("/warehouse/v1/cities/", validateToken, async (req, res) => {
    const admin = req.tokenInfo.isAdmin;
    const { name, countryId } = req.body;	
    try {
        if (admin) {            
            const nameCityBD = await obtenerDatosBD("cities", "name", name);
            if (nameCityBD) {
                res.status(409).json("El nombre ingresado ya existe, por favor intente con otro");
                return;
            }
            if (name && countryId) {
                const updateBD = await sequelize.query(
                    "INSERT INTO cities (name, country_id) VALUES (:name, :countryId)",
                    { replacements: { name, countryId } }
                );
                res.status(200).json("Ciudad creada correctamente");
            } else {
                res.status(400).send("Se debe ingresar todos los parametros para crear la ciudad");
            }
        } else {
            res.status(401).json("Acceso denegado, la cuenta debe ser administrador");
        }
    } catch (error) {
        res.status(500).send("Ah ocurrido un error...." + error);
    }
})


///Endpoint para buscar una ciudad en especifico (Solo Administrador)
server.get("/warehouse/v1/cities/:name", validateToken, async (req, res) => {
    const admin = req.tokenInfo.isAdmin;
	const nameCity = req.params.name;
	try {
		if (admin) {
            const nameBD = await obtenerDatosBD("cities", "name", nameCity);
		    if (nameBD) {
		    	res.status(200).json({data: nameBD, status: 200});
		    } else {
		    	res.status(404).json("El nombre ingresado no existe");
		    }
        } else {
            res.status(401).json("Acceso denegado, la cuenta debe ser administrador");
        }
	} catch (error) {
		res.status(500).send("Ah ocurrido un error...." + error);
	}
});


///Endpoint para actualizar una ciudad en especifico (Solo Administrador)
server.put("/warehouse/v1/cities/:name", validateToken, async (req, res) => {
    const admin = req.tokenInfo.isAdmin;
	const nameCity= req.params.name;
	try {
		if (admin) {
            const nameBD = await obtenerDatosBD("cities", "name", nameCity);
            const cityId = nameBD.city_id;
		    if (nameBD) {
                const { name, disabled } = req.body;
                if (name || disabled) {
                    const cityFilter = filterProps({ name, disabled });
                    const updateCity= { ...nameBD, ...cityFilter };
                    const updateBD = await sequelize.query (
                        "UPDATE cities SET name = :nameUpdate, disabled = :isDisabled WHERE city_id = :cityId",
                        {
                            replacements: {
                                nameUpdate: updateCity.name,
                                isDisabled: updateCity.disabled,
                                cityId: cityId,
                            },
                        }
                    );
                    res.status(200).send("La ciudad ha sido actualizada correctamente");
                } else {
                    res.status(400).send("Debe haber por lo menos un campo para actualizar");
                }		    	
		    } else {
		    	res.status(404).json("El nombre ingresado no existe");
		    }
        } else {
            res.status(401).json("Acceso denegado, la cuenta debe ser administrador");
        }
	} catch (error) {
		res.status(500).send("Ah ocurrido un error...." + error);
	}
});


///Endpoint para eliminar una ciudad en especifico (Solo Administrador)
server.delete("/warehouse/v1/cities/:name", validateToken, async (req, res) => {
    admin = req.tokenInfo.isAdmin;
    nameCity = req.params.name;
    if (admin) {
        nameBD = await obtenerDatosBD("cities", "name", nameCity);
        cityId = nameBD.city_id;
        if (nameBD) {
            const updateBD = await sequelize.query(`UPDATE cities set disabled = true WHERE city_id = :cityId`, {
                replacements: {
                    cityId: cityId,
                },
            });
            res.status(200).send("La ciudad ha sido eliminada correctamente");
        } else {
            res.status(404).json("El nombre ingresado no existe");
        }
    } else {
        res.status(401).json("Acceso denegado, la cuenta debe ser administrador");
    }
});



/**** Compañias ****/



///Endpoint para obtener todas las compañias
server.get("/warehouse/v1/companies", validateToken, async (req, res) => {
    try {
        const companyBD = await obtenerDatosBD("companies", true, true, true);
    
        if (companyBD.length > 0) {
            res.status(200).json({data: companyBD, status: 200});
        } else { 
            res.status(404).json("No hay compañias registradas");
        }
    } catch (error) {
        res.status(500).send("Ah ocurrido un error...." + error);
    }
});
 

///Endpoint para crear compañias
server.post("/warehouse/v1/companies", validateToken, async (req, res) => {
	const { name, address, email, phone, city } = req.body;	
	try {
		const companyBD = await obtenerDatosBD("companies", "mail", email);            
        if (companyBD) {
            res.status(409).json("Ya existe una compañía con este correo electrónico");
            return;
        }
        if ((name && address && email && phone && city)) {
            const updateBD = await sequelize.query(
                "INSERT INTO companies (name, address, mail, phone, city_id) VALUES (:name, :address, :email, :phone, :city)",
                { replacements: { name, address, email, phone, city } }
            );
            res.status(200).json("Compañía creada correctamente");
        } else {
            res.status(400).send("Todos los campos son necesarios para crear la compañia");
        }
	} catch (error) {
		res.status(500).send("Ah ocurrido un error...." + error);
	}
});


///Endpoint para actualizar informacion de la compañia creada
server.put("/warehouse/v1/companies/:email", validateToken, async (req, res) => {
	const emailCompany = req.params.email;
    try {
        const companyBD = await obtenerDatosBD("companies", "mail", emailCompany);
        const companyId = companyBD.company_id;
        if (companyBD) {
            const { name, address, phone } = req.body;
            if (name || address || phone) {
                const companyFilter = filterProps({ name, address, phone });
                const updateCompany = { ...companyBD, ...companyFilter };
                console.log(updateCompany);
                const updateBD = await sequelize.query(
                    "UPDATE companies SET name = :updateName, address = :updateAddress, phone = :updatePhone WHERE company_id = :cityId",
                    {
                        replacements: {
                            updateName: updateCompany.name,
                            updateAddress: updateCompany.address,
                            updatePhone: updateCompany.phone,
                            cityId: companyId,
                        },
                    }
                );
                res.status(200).send("Compañia actualizada correctamente");
            } else {
                res.status(400).send("Debe haber por lo menos un campo para actualizar");
            }
        } else {
            res.status(404).json("La compañía ingresada no existe");
        }
    } catch (error) {
        res.status(500).send("Ah ocurrido un error...." + error);
    }
});
 

///Endpoint para eliminar compañias
server.delete("/warehouse/v1/companies/:email", validateToken, async (req, res) => {
    const emailCompany = req.params.email;	
    try {
        const companyBD = await obtenerDatosBD("companies", "mail", emailCompany);
        console.log(companyBD);
        const companyId = companyBD.company_id;
        if (companyBD) {
            const updateBD = await sequelize.query(`UPDATE companies SET disabled = true WHERE company_id = :companyId`, {
                replacements: {
                    companyId: companyId,
                },
            });
            res.status(200).json("La compañia se eliminó correctamente");
        } else {
            res.status(404).json("La compañia ingresada no existe");
        }
    } catch (error) {
        res.status(500).send("Ah ocurrido un error...." + error);
    }
});
  

///Endpoint para buscar compañias en especifico (Solo Administrador)
server.get("/warehouse/v1/companies/:id", validateToken, async (req, res) => {
    const admin = req.tokenInfo.isAdmin;
	const companyId = req.params.id;
	try {
		if (admin) {
            const companyBD = await obtenerDatosBD("companies", "company_id", companyId);
		    if (companyBD) {
		    	res.status(200).json({data: companyBD, status: 200});
		    } else {
		    	res.status(404).json("El ID ingresado no existe");
		    }
        } else {
            res.status(401).json("Acceso denegado, la cuenta debe ser administrador");
        }
	} catch (error) {
		res.status(500).send("Ah ocurrido un error...." + error);
	}
});



/**** Contactos ****/



///Endpoint para: traer todos los contactos.
server.get("/warehouse/v1/contacts", validateToken, async (req, res) => {
    try {
        const contactBD = await obtenerDatosBD("contacts", true, true, true);
    
        if (contactBD.length > 0) {
            res.status(200).json({data: contactBD, status: 200});
        } else { 
            res.status(404).json("No hay contactos creados");
        }
    } catch (error) {
        res.status(500).send("Ah ocurrido un error...." + error);
    }
});
 

///Endpoint para crear contactos
server.post("/warehouse/v1/contacts", validateToken, async (req, res) => {
    const { name, lastname, role, email, company, city, address, account } = req.body;
	try {
        const nameAccount = account[0].name;
        const channelAccount = account[0].channel;
        const preferenceAccount = account[0].preference;
		const emailBD = await obtenerDatosBD("contacts", "mail", email);            
		let accountBD = await obtenerDatosBD("accounts", "name", nameAccount);            
        if (emailBD) {
            res.status(409).json("El contacto a crear ya se encuentra registrado");
            return;
        } else if (accountBD) {
            res.status(409).json("Error ya hay un contacto con la misma cuenta");
            return;
        }
        if ((name && lastname && role && email && company && city && address && account)) {            
            if (nameAccount && channelAccount && preferenceAccount) {
                let updateBD = await sequelize.query(
                    "INSERT INTO accounts (name, channel_id, preference_id) VALUES (:nameAccount, :channelAccount, :preferenceAccount)",
                    { replacements: { nameAccount, channelAccount, preferenceAccount} }
                );
                accountBD = await obtenerDatosBD("accounts", "name", nameAccount);
                accountId = accountBD.account_id;
                updateBD = await sequelize.query(
                    "INSERT INTO contacts (name, lastname, role, mail, company_id, city_id, address, account_id) VALUES (:name, :lastname, :role, :email, :company, :city, :address, :accountId)",
                    { replacements: { name, lastname, role, email, company, city, address, accountId} }
                );
                res.status(200).json("Usuario creado correctamente");
            } else {
                res.status(400).send("Todos los campos son necesarios para registrarse");
            }
            
        } else {
            res.status(400).send("Todos los campos son necesarios para registrarse");
        }
	} catch (error) {
		res.status(500).send("Ah ocurrido un error...." + error);
	}
});


///Endpoint para actualizar informacion de los contactos
server.put("/warehouse/v1/contacts/:id", validateToken, async (req, res) => {
    const idContact = req.params.id;
    try {
        const { name, lastname, role, email, company, city, address, account } = req.body;
        let contactBD = await obtenerDatosBD("contacts", "contact_id", idContact);
        const contactId = contactBD.contact_id;       
        if (contactBD) {            
            if ((name || lastname || role || email || company || city || address || account)) {
                if (account) {
                    const nameAccount = account[0].name;
                    const channel_id = account[0].channel;
                    const preference_id = account[0].preference; 

                    if (nameAccount || channel_id || preference_id) {
                        const accountId = contactBD.account_id;
                        const accountBD = await obtenerDatosBD("accounts", "account_id", accountId);
                        const accountFilter = filterProps({ nameAccount, channel_id, preference_id});
                        const updateAccount = { ...accountBD, ...accountFilter };
                        console.log(updateAccount);
                        let updateBD = await sequelize.query(
                            "UPDATE accounts SET name = :updateName, channel_id = :updateChannel, preference_id = :updatePreference WHERE account_id = :accountId",
                            {
                                replacements: {
                                    updateName: updateAccount.nameAccount,
                                    updateChannel: updateAccount.channel_id,
                                    updatePreference: updateAccount.preference_id,
                                    accountId: accountId,
                                },
                            }
                        );
                        
                        contactBD = await obtenerDatosBD("contacts", "contact_id", idContact);
    
                        const contactFilter = filterProps({ name, lastname, role , email, company, city, address});
                        const updateContact = { ...contactBD, ...contactFilter };
                        console.log(updateContact);
                        updateBD = await sequelize.query(
                            "UPDATE contacts SET name = :updateName, lastname = :updateLastName, role = :updateRole, mail = :updateEmail, company_id = :updateCompany, city_id = :updateCity, address = :updateAddress, account_id = :updateAccount WHERE contact_id = :contactId",
                            {
                                replacements: {
                                    updateName: updateContact.name,
                                    updateLastName: updateContact.lastname,
                                    updateRole: updateContact.role,
                                    updateEmail: updateContact.mail,
                                    updateCompany: updateContact.company_id,
                                    updateCity: updateContact.city_id,
                                    updateAddress: updateContact.address,
                                    updateAccount: updateContact.account_id,
                                    contactId: contactId,
                                },
                            }
                        );
                        res.status(200).send("Contacto actualizado correctamente");
                    } else {
                        res.status(400).send("Debe haber por lo menos un parametro para actualiar");
                    }
                } else {
                    const contactFilter = filterProps({ name, lastname, role , email, company, city, address, account});
                        const updateContact = { ...contactBD, ...contactFilter };
                        console.log(updateContact);
                        let updateBD = await sequelize.query(
                            "UPDATE contacts SET name = :updateName, lastname = :updateLastName, role = :updateRole, mail = :updateEmail, company_id = :updateCompany, city_id = :updateCity, address = :updateAddress, account_id = :updateAccount WHERE contact_id = :contactId",
                            {
                                replacements: {
                                    updateName: updateContact.name,
                                    updateLastName: updateContact.lastname,
                                    updateRole: updateContact.role,
                                    updateEmail: updateContact.mail,
                                    updateCompany: updateContact.company_id,
                                    updateCity: updateContact.city_id,
                                    updateAddress: updateContact.address,
                                    updateAccount: updateContact.account_id,
                                    contactId: contactId,
                                },
                            }
                        );
                        res.status(200).send("Contacto actualizado correctamente");
                }          
                
            } else {
                res.status(400).send("Debe haber por lo menos un parametro para actualiar");
            }
        } else {
            res.status(404).json("El ID ingresado no existe");
        }
    } catch (error) {
        res.status(500).send("Ah ocurrido un error...." + error);
    }
});
 

///Endpoint para eliminar contactos
server.delete("/warehouse/v1/contacts/:id", validateToken, async (req, res) => {
    const idContact = req.params.id;	
    try {
        const contactBD = await obtenerDatosBD("contacts", "contact_id", idContact);
        if (contactBD) {
            const updateBD = await sequelize.query(`UPDATE contacts SET disabled = true WHERE contact_id = :contactId`, {
                replacements: {
                    contactId: idContact,
                },
            });
            res.status(200).json("La cuenta se eliminó correctamente");
        } else {
            res.status(404).json("El ID ingresado no existe");
        }
        
    } catch (error) {
        res.status(500).send("Ah ocurrido un error...." + error);
    }
});
  

///Endpoint para buscar contactos en especifico
server.get("/warehouse/v1/contacts/:id", validateToken, async (req, res) => {
    const idContact = req.params.id;
	try {
		const contactBD = await obtenerDatosBD("contacts", "contact_id", idContact);
        if (contactBD) {
            res.status(200).json({data: contactBD, status: 200});
        } else {
            res.status(404).json("El ID ingresado no existe");
        }
	} catch (error) {
		res.status(500).send("Ah ocurrido un error...." + error);
	}
});



/**** Canales ****/



///Endpoint para obtener todos los canales
server.get("/warehouse/v1/channels/", validateToken, async (req, res) => {
    try {
        const getChannels = await obtenerDatosBD('channels', true, true, true);
            if (getChannels.length > 0) {
                res.status(200).json({data: getChannels, status: 200});
            } else {
                res.status(404).send("No hay regiones creadas");
            }
    } catch (error) {
        res.status(500).send("Ah ocurrido un error...." + error);
    }
})


///Endpoint para crear un canal
server.post("/warehouse/v1/channels/", validateToken, async (req, res) => {
    const { name } = req.body;	
    try {
        const channelBD = await obtenerDatosBD("channels", "name", name);
        if (channelBD) {
            res.status(409).json("El nombre ingresado ya existe, por favor intente con otro");
            return;
        }
        if (name) {
            const updateBD = await sequelize.query(
                "INSERT INTO channels (name) VALUES (:name)",
                { replacements: { name } }
            );
            res.status(200).json("Canal creado correctamente");
        } else {
            res.status(400).send("Debe ingresar un nombre para crear el canal");
        }
    } catch (error) {
        res.status(500).send("Ah ocurrido un error...." + error);
    }
})


///Endpoint para buscar un canal en especifico
server.get("/warehouse/v1/channels/:id", validateToken, async (req, res) => {
	const idChannel = req.params.id;
	try {
		const nameBD = await obtenerDatosBD("channels", "channel_id", idChannel);
        if (nameBD) {
            res.status(200).json({data: nameBD, status: 200});
        } else {
            res.status(404).json("El ID ingresado no existe");
        }
	} catch (error) {
		res.status(500).send("Ah ocurrido un error...." + error);
	}
});


///Endpoint para actualizar un canal en especifico
server.put("/warehouse/v1/channels/:id", validateToken, async (req, res) => {
	const idParamChannel = req.params.id;
	try {
		const channelBD = await obtenerDatosBD("channels", "channel_id", idParamChannel);
        const channelId = channelBD.channel_id;
        const { name } = req.body;
        
        if (channelBD) { 
            if (channelBD.name === name) {
                res.status(409).json("El nombre ingresado ya existe, por favor intente con otro");
                return;
            }           
            if (name) {
                const channelFilter = filterProps({ name });
                const updateChannel = { ...channelBD, ...channelFilter };
                const updateBD = await sequelize.query (
                    "UPDATE channels SET name = :nameUpdate WHERE channel_id = :channelId",
                    {
                        replacements: {
                            nameUpdate: updateChannel.name,
                            channelId: channelId,
                        },
                    }
                );
                res.status(200).send("El canal ha sido actualizado correctamente");
            } else {
                res.status(400).send("Debe haber un campo para actualizar");
            }		    	
        } else {
            res.status(404).json("El ID ingresado no existe");
        }
	} catch (error) {
		res.status(500).send("Ah ocurrido un error...." + error);
	}
});


///Endpoint para eliminar un canal en especifico
server.delete("/warehouse/v1/channels/:id", validateToken, async (req, res) => {
    const idParamChannel = req.params.id;
    const channelBD = await obtenerDatosBD("channels", "channel_id", idParamChannel);
    const channelId = channelBD.channel_id;
    if (channelBD) {
        const updateBD = await sequelize.query(`UPDATE channels set disabled = true WHERE channel_id = :channelId`, {
            replacements: {
                channelId: channelId,
            },
        });
        res.status(200).send("El canal ha sido eliminado correctamente");
    } else {
        res.status(404).json("El ID ingresado no existe");
    }
});



/**** Preferencias ****/



///Endpoint para obtener todas las preferencias
server.get("/warehouse/v1/preferences/", validateToken, async (req, res) => {
    try {
        const getPreferences = await obtenerDatosBD('preferences', true, true, true);
            if (getPreferences.length > 0) {
                res.status(200).json({data: getPreferences, status: 200});
            } else {
                res.status(404).send("No hay regiones creadas");
            }
    } catch (error) {
        res.status(500).send("Ah ocurrido un error...." + error);
    }
})


///Endpoint para crear una prefencia
server.post("/warehouse/v1/preferences/", validateToken, async (req, res) => {
    const { name } = req.body;	
    try {
        const preferenceBD = await obtenerDatosBD("preferences", "name", name);
        if (preferenceBD) {
            res.status(409).json("El nombre ingresado ya existe, por favor intente con otro");
            return;
        }
        if (name) {
            const updateBD = await sequelize.query(
                "INSERT INTO preferences (name) VALUES (:name)",
                { replacements: { name } }
            );
            res.status(200).json("La preferencia ha sido creada correctamente");
        } else {
            res.status(400).send("Debe ingresar un nombre para crear la preferencia");
        }
    } catch (error) {
        res.status(500).send("Ah ocurrido un error...." + error);
    }
})


///Endpoint para buscar una preferencia en especifico
server.get("/warehouse/v1/preferences/:id", validateToken, async (req, res) => {
	const idPreference = req.params.id;
	try {
		const preferenceBD = await obtenerDatosBD("preferences", "preference_id", idPreference);
        if (preferenceBD) {
            res.status(200).json({data: preferenceBD, status: 200});
        } else {
            res.status(404).json("El ID ingresado no existe");
        }
	} catch (error) {
		res.status(500).send("Ah ocurrido un error...." + error);
	}
});


///Endpoint para actualizar una preferencia en especifico
server.put("/warehouse/v1/preferences/:id", validateToken, async (req, res) => {
	const idParamPreference = req.params.id;
	try {
		const preferenceBD = await obtenerDatosBD("preferences", "preference_id", idParamPreference);
        const preferenceId = preferenceBD.preference_id;
        console.log(preferenceBD);
        const { name } = req.body;
        
        if (preferenceBD) { 
            if (preferenceBD.name === name) {
                res.status(409).json("El nombre ingresado ya existe, por favor intente con otro");
                return;
            }           
            if (name) {
                const preferenceFilter = filterProps({ name });
                const updatePreference = { ...preferenceBD, ...preferenceFilter };
                const updateBD = await sequelize.query (
                    "UPDATE preferences SET name = :nameUpdate WHERE preference_id = :preferenceId",
                    {
                        replacements: {
                            nameUpdate: updatePreference.name,
                            preferenceId: preferenceId,
                        },
                    }
                );
                res.status(200).send("La preferencia ha sido actualizada correctamente");
            } else {
                res.status(400).send("Debe haber un campo para actualizar");
            }		    	
        } else {
            res.status(404).json("El ID ingresado no existe");
        }
	} catch (error) {
		res.status(500).send("Ah ocurrido un error...." + error);
	}
});


///Endpoint para eliminar una preferencia en especifico
server.delete("/warehouse/v1/preferences/:id", validateToken, async (req, res) => {
    const idParamPreference = req.params.id;
    const preferenceBD = await obtenerDatosBD("preferences", "preference_id", idParamPreference);
    const preferenceId = preferenceBD.preference_id;
    if (preferenceBD) {
        const updateBD = await sequelize.query(`UPDATE preferences set disabled = true WHERE preference_id = :preferenceId`, {
            replacements: {
                preferenceId: preferenceId,
            },
        });
        res.status(200).send("La preferencia ha sido eliminada correctamente");
    } else {
        res.status(404).json("El ID ingresado no existe");
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



// server.get("/warehouse/v1/regions/", async (req, res) => {    
//     const num = 1;
//     const orders = await sequelize.query(
//         // "SELECT * FROM countries INNER JOIN regions ON countries.region_id = regions.region_id;",
//         "SELECT * FROM countries WHERE region_id = :id;",
//         {
//             replacements: { id: num },
//             type: QueryTypes.SELECT,
//         }
//     );
//     if (orders.length > 0) {
//         res.status(200).json({data: orders, status: 200});
//     }
// });