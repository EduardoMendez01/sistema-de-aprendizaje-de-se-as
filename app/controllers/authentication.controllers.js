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

async function obtenerProgreso(req, res) {
    try {
        const usuarioId = req.user.id;

        const [fases] = await connection.query(`
            SELECT f.*, 
                   IFNULL(pu.completada, 0) AS completada
            FROM fases f
            LEFT JOIN progreso_usuarios pu
            ON pu.fase_id = f.id AND pu.usuario_id = ?
            ORDER BY f.orden ASC
        `, [usuarioId]);

        res.json(fases);
    } catch (error) {
        console.error("Error al obtener fases:", error);
        res.status(500).json({ message: "Error al cargar fases" });
    }
}

async function guardarProgreso(req, res) {
    try {
        const usuarioId = req.user.id;
        const { faseId, resultado } = req.body;

        if (!faseId || resultado === undefined) {
            return res.status(400).json({ status: "Error", message: "Datos incompletos" });
        }

        const [rows] = await connection.query(
            "SELECT * FROM progreso_usuarios WHERE usuario_id = ? AND fase_id = ?",
            [usuarioId, faseId]
        );

        const completada = resultado >= 60 ? 1 : 0;

        if (rows.length > 0) {
            await connection.query(
                "UPDATE progreso_usuarios SET completada = ?, resultado = ? WHERE usuario_id = ? AND fase_id = ?",
                [completada, resultado, usuarioId, faseId]
            );
        } else {
            await connection.query(
                "INSERT INTO progreso_usuarios (usuario_id, fase_id, completada, resultado) VALUES (?, ?, ?, ?)",
                [usuarioId, faseId, completada, resultado]
            );
        }


        res.json({ status: "OK", message: "Progreso guardado correctamente" });
    } catch (error) {
        console.error("Error al guardar progreso:", error);
        res.status(500).json({ status: "Error", message: "Error en el servidor" });
    }
}

async function verPerfil(req, res) {
    try {
        const usuarioId = req.user.id;

        const [usuarioRows] = await connection.query(
            "SELECT id, user, email FROM usuarios WHERE id = ?",
            [usuarioId]
        );

        if (usuarioRows.length === 0) {
            return res.status(404).json({ status: "Error", message: "Usuario no encontrado" });
        }

        const usuario = usuarioRows[0];

        const [progresoRows] = await connection.query(`
            SELECT 
                f.nombre, 
                f.descripcion, 
                IFNULL(p.resultado, 0) AS resultado,
                IFNULL(p.completada, 0) AS completada
            FROM fases f
            LEFT JOIN progreso_usuarios p
            ON p.fase_id = f.id AND p.usuario_id = ?
            ORDER BY f.orden ASC
        `, [usuarioId]);

        res.json({
            status: "OK",
            usuario,
            progreso: progresoRows
        });

    } catch (error) {
        console.error("Error al obtener perfil:", error);
        res.status(500).json({ status: "Error", message: "Error al cargar el perfil" });
    }
}

export const method = {
    login,
    registrar,
    verificarToken,
    obtenerProgreso,
    guardarProgreso,
    verPerfil
};

