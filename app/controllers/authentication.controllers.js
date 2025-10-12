import bcryptjs from "bcryptjs"
import JsonWebToken  from "jsonwebtoken";
import dotenv from "dotenv"

const usuarios = [{
    user: "a",
    password: "a",
    emai: "pepecota161@gmail.com"
}]

async function login(req, res) {
    console.log(req.body);
    const { user, password } = req.body;

    if (!user || !password) {
        return res.status(400).send({ status: "Error", message: "Los campos estan incompletos" })
    }

    const usuarioIguales = usuarios.find(usuario => usuario.user === user)
    if (!usuarioIguales) {
        return res.status(400).send({ status: "Error", message: "Este durante el login" })
    }

    const loginCorrecto = await bcryptjs.compare(password, usuarioIguales.password)
    console.log(loginCorrecto);

    if (!loginCorrecto) {
        return res.status(400).send({ status: "Error", message: "Este durante el login" })
    }


    //const token = JsonWebToken.sign({user:usuarioIguales.user,})

    return res.status(201).send({ status: "OK", message: `Logeado`, redirect: "/menu" })

}

async function registrar(req, res) {
    console.log(req.body)
    const { user, password, email } = req.body;

    if (!user || !password || !email) {
        return res.status(400).send({ status: "Error", message: "Los campos estan incompletos" })
    }

    const usuarioIguales = usuarios.find(usuario => usuario.user === user)
    if (usuarioIguales) {
        return res.status(400).send({ status: "Error", message: "Este usuario ya existe" })
    }

    const salt = await bcryptjs.genSalt(5);
    const hashPassword = await bcryptjs.hash(password, salt);

    const nuevoUsuraio = {
        user, email, password: hashPassword
    };

    usuarios.push(nuevoUsuraio);
    console.log(usuarios);

    return res.status(201).send({ status: "OK", message: `Usuario ${nuevoUsuraio.user} agregado`, redirect: "/" })
}

export const method = {
    login,
    registrar
}