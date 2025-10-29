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
                        <button class="btn btn-primary" ${fase.completada ? "disabled" : ""}>
                            ${fase.completada ? "Completada" : "Iniciar"}
                        </button>
                    </div>
                </div>
            `;

            // Agregar comportamiento del botón “Iniciar”
            const boton = card.querySelector("button");
            boton.addEventListener("click", () => {
                if (!fase.completada) {
                    // redirige a la página de la fase (por ejemplo, fase1.html, fase2.html, etc.)
                    window.location.href = `/fase${fase.id}.html`;
                }
            });

            contenedor.appendChild(card);
        });

    } catch (err) {
        console.error("Error al cargar fases:", err);
        main.innerHTML = `<p class="text-danger text-center">Error al cargar las fases.</p>`;
    }
});