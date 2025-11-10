import mysql from "mysql2/promise";

export const connection = await mysql.createConnection({
    host: "localhost",       // o el host de tu servidor
    user: "root",            // tu usuario
    password: "dulceesthela",            // tu contraseña
    database: "lenguaje_senas" // el nombre de tu bases de datos 
});
