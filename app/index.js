import express from "express";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import { method as authentication } from "./controllers/authentication.controllers.js";
import cookieParser from "cookie-parser";


// Crear servidor
const app = express();
app.set("port", 4000);

//configuracion
app.use(express.static(__dirname + "/public"))
app.use(express.json());
app.use(cookieParser());

//rutas
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "pages", "login.html"));
});
app.get("/registrar", (req, res) => {
    res.sendFile(path.join(__dirname, "pages", "registrar.html"));
});
app.get("/menu", authentication.verificarToken, (req, res) => {
    res.sendFile(path.join(__dirname, "pages", "menu.html"));
});
app.get("/cursos", authentication.verificarToken, (req, res) => {
    res.sendFile(path.join(__dirname, "pages", "cursos.html"));
});


app.get("/logout", (req, res) => {
    res.clearCookie("jwt"); 
    res.redirect("/"); 
});


//rutas api
app.post("/api/login", authentication.login);
app.post("/api/registrar", authentication.registrar);
app.get("/api/fases", authentication.verificarToken, authentication.obtenerProgreso);


// Iniciar servidor
app.listen(app.get("port"), () => {
  console.log("Servidor escuchando en el puerto:", app.get("port"));
});
