import bcryptjs from "bcryptjs";
import crypto from "crypto";
import jsonwebtoken from "jsonwebtoken";
import { connection } from "../config/databases.js";

const JWT_SECRET = crypto.randomBytes(64).toString("hex");
const JWT_EXPIRATION = "1h";
const JWT_COOKIE_EXPIRES = 1;

async function login(req, res) {
    const { user, password } = req.body;

    if (!user || !password) {
        return res.status(400).send({ status: "Error", message: "Los campos están incompletos" });
    }

    try {
        const [rows] = await connection.execute(
            "SELECT * FROM usuarios WHERE user = ?",
            [user]
        );

        if (rows.length === 0) {
            return res.status(400).send({ status: "Error", message: "Usuario no encontrado" });
        }

        const usuario = rows[0];
        const loginCorrecto = await bcryptjs.compare(password, usuario.password);

        if (!loginCorrecto) {
            return res.status(400).send({ status: "Error", message: "Contraseña incorrecta" });
        }

        const token = jsonwebtoken.sign(
            { user: usuario.user, id: usuario.id },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRATION }
        );

        res.cookie("jwt", token, {
            httpOnly: true,
            secure: false,
            maxAge: JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
        });

        return res.status(201).send({ status: "OK", message: "Logeado", redirect: "/menu" });
    } catch (error) {
        console.error("Error en login:", error);
        return res.status(500).send({ status: "Error", message: "Error en el servidor" });
    }
}

async function registrar(req, res) {
    const { user, password, email } = req.body;

    if (!user || !password || !email) {
        return res.status(400).send({ status: "Error", message: "Campos incompletos" });
    }

    try {
        // Verificar si el usuario ya existe
        const [rows] = await connection.execute(
            "SELECT * FROM usuarios WHERE user = ?",
            [user]
        );

        if (rows.length > 0) {
            return res.status(400).send({ status: "Error", message: "El usuario ya existe" });
        }

        const salt = await bcryptjs.genSalt(5);
        const hashPassword = await bcryptjs.hash(password, salt);

        await connection.execute(
            "INSERT INTO usuarios (user, email, password) VALUES (?, ?, ?)",
            [user, email, hashPassword]
        );

        return res.status(201).send({ status: "OK", message: `Usuario ${user} agregado`, redirect: "/" });
    } catch (error) {
        console.error("Error en registro:", error);
        return res.status(500).send({ status: "Error", message: "Error en el servidor" });
    }
}

function verificarToken(req, res, next) {
    const token = req.cookies.jwt;
    if (!token) return res.redirect("/");

    try {
        const decodificado = jsonwebtoken.verify(token, JWT_SECRET);
        req.user = decodificado;
        next();
    } catch (error) {
        return res.redirect("/");
    }
}

export const method = {
    login,
    registrar,
    verificarToken
};

