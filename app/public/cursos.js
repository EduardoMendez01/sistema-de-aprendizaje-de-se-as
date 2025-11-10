document.getElementById("logoutBtn").addEventListener("click", () => {
    window.location.href = "/logout";
});

document.addEventListener("DOMContentLoaded", async () => {
    const main = document.querySelector("main");

    try {
        const res = await fetch("http://localhost:4000/api/fases");
        const fases = await res.json();

        // Estructura base
        main.innerHTML = `
            <div class="container mt-5">
                <h2 class="mb-4 text-center">Fases del curso</h2>
                <div class="row" id="fases-container"></div>
            </div>
        `;

        const contenedor = document.getElementById("fases-container");

        // Mostrar cada fase
        fases.forEach(fase => {
            const card = document.createElement("div");
            card.classList.add("col-md-4", "mb-3");

            card.innerHTML = `
                <div class="card h-100 shadow-sm">
                    <div class="card-body text-center">
                        <h5 class="card-title">${fase.nombre}</h5>
                        <p class="card-text">
                            ${fase.completada ? "✅ Completada" : "⏳ Pendiente"}
                        </p>
                        <div class="d-flex justify-content-center gap-2">
                            <button class="btn btn-primary iniciar-btn" ${fase.completada ? "disabled" : ""}>
                                ${fase.completada ? "Completada" : "Iniciar"}
                            </button>
                            ${
                                fase.completada
                                    ? `<button class="btn btn-warning reiniciar-btn">Reiniciar</button>`
                                    : ""
                            }
                        </div>
                    </div>
                </div>
            `;

            const botonIniciar = card.querySelector(".iniciar-btn");
            botonIniciar.addEventListener("click", () => {
                if (!fase.completada) {
                    window.location.href = `/fase${fase.id}.html`;
                }
            });

            // Agregar comportamiento del botón “Reiniciar”
            const botonReiniciar = card.querySelector(".reiniciar-btn");
            if (botonReiniciar) {
                botonReiniciar.addEventListener("click", async () => {
                    if (confirm(`¿Quieres reiniciar la fase "${fase.nombre}"?`)) {
                        try {
                            const resp = await fetch("http://localhost:4000/api/reiniciar-fase", {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json"
                                },
                                body: JSON.stringify({ faseId: fase.id })
                            });
                            const data = await resp.json();
                            if (data.status === "OK") {
                                alert("La fase se reinició correctamente.");
                                location.reload();
                            } else {
                                alert("Error al reiniciar la fase.");
                            }
                        } catch (error) {
                            console.error("Error al reiniciar fase:", error);
                            alert("Error en el servidor.");
                        }
                    }
                });
            }

            contenedor.appendChild(card);
        });

    } catch (err) {
        console.error("Error al cargar fases:", err);
        main.innerHTML = `<p class="text-danger text-center">Error al cargar las fases.</p>`;
    }
});
