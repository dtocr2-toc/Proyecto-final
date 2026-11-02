

const $ = (id) => document.getElementById(id);




const CLAVE_DB = "nexabank_db";         
const CLAVE_SESION = "nexabank_sesion";  

let db;                  
let cuentaActual = null; 
let saldoVisible = true;  
let ultimoUsuario = "";   


function guardarDB() {
  try { localStorage.setItem(CLAVE_DB, JSON.stringify(db)); } catch (e) {}
}


function cargarDB() {
  let texto = null;
  try { texto = localStorage.getItem(CLAVE_DB); } catch (e) {}

  if (texto) {
    try { return JSON.parse(texto); } catch (e) {}
  }
  return datosIniciales();
}


function datosIniciales() {
  const ahora = Date.now();
  const transacciones = [];
  let contador = 0;

 
  function crearMovimientos(cuenta, operaciones) {
    let saldo = 0;
    operaciones.forEach(function (op) {
      saldo = redondear(saldo + op[3]);
      contador++;
      transacciones.push({
        id: contador,
        cuenta: cuenta,
        fecha: new Date(ahora - op[0] * 86400000).toISOString(),
        tipo: op[1],
        descripcion: op[2],
        monto: op[3],
        saldoDespues: saldo,
      });
    });
    return saldo;
  }

  const saldoAdmin = crearMovimientos("1000-0001", [
    [12, "Depósito", "Depósito inicial", 10000],
    [9, "Depósito", "Depósito de nómina", 5000],
    [7, "Pago de servicio", "Electricidad - Ref. 4470021", -350.75],
    [5, "Transferencia recibida", "De María López (1000-0002)", 1200],
    [3, "Pago de servicio", "Telefonía - Ref. 55550001", -198.75],
    [1, "Pago de servicio", "Agua potable - Ref. 90021345", -120],
  ]);

  const saldoMaria = crearMovimientos("1000-0002", [
    [20, "Depósito", "Depósito inicial", 9000],
    [5, "Transferencia enviada", "A Cliente Demo (1000-0001)", -1200],
    [2, "Depósito", "Depósito en ventanilla", 450],
  ]);

  return {
    clientes: [
      {
        nombre: "Cliente", apellido: "Demo", dpi: "2000123450101",
        correo: "admin@nexabank.com", telefono: "55550001",
        direccion: "Zona 10, Ciudad de Guatemala",
        usuario: "admin", clave: "2026",
        cuenta: "1000-0001", saldo: saldoAdmin,
        registro: new Date(ahora - 90 * 86400000).toISOString(),
      },
      {
        nombre: "María", apellido: "López", dpi: "2000987650101",
        correo: "maria@nexabank.com", telefono: "55550002",
        direccion: "Zona 1, Ciudad de Guatemala",
        usuario: "maria", clave: "1234",
        cuenta: "1000-0002", saldo: saldoMaria,
        registro: new Date(ahora - 60 * 86400000).toISOString(),
      },
    ],
    transacciones: transacciones,
  };
}


function buscarPorCuenta(cuenta) {
  return db.clientes.find((c) => c.cuenta === cuenta);
}


function buscarPorUsuario(usuario) {
  return db.clientes.find((c) => c.usuario.toLowerCase() === usuario.toLowerCase());
}


function clienteActual() {
  return buscarPorCuenta(cuentaActual);
}


function generarNumeroCuenta() {
  let mayor = 0;
  db.clientes.forEach(function (c) {
    const numero = parseInt(c.cuenta.split("-")[1]);
    if (numero > mayor) mayor = numero;
  });
  return "1000-" + String(mayor + 1).padStart(4, "0");
}


function registrarMovimiento(cuenta, tipo, descripcion, monto, saldoDespues) {
  const id = db.transacciones.length
    ? Math.max(...db.transacciones.map((t) => t.id)) + 1
    : 1;

  const movimiento = {
    id: id,
    cuenta: cuenta,
    fecha: new Date().toISOString(),
    tipo: tipo,
    descripcion: descripcion,
    monto: monto,             
    saldoDespues: saldoDespues,
  };
  db.transacciones.push(movimiento);
  return movimiento;
}



function redondear(numero) {
  return Math.round(numero * 100) / 100;
}


function formatear(numero) {
  return "Q " + numero.toLocaleString("es-GT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatearFecha(iso) {
  return new Date(iso).toLocaleString("es-GT", { dateStyle: "medium", timeStyle: "short" });
}

function nombreCompleto(cliente) {
  return cliente.nombre + " " + cliente.apellido;
}


function comprobante(movimiento) {
  return "REF-" + String(movimiento.id).padStart(5, "0");
}


function normalizarCuenta(texto) {
  const limpio = texto.replace(/\s/g, "");
  if (/^\d{8}$/.test(limpio)) return limpio.slice(0, 4) + "-" + limpio.slice(4);
  return limpio;
}


function mostrarMensaje(id, texto, esError) {
  const elemento = $(id);
  elemento.textContent = texto;
  elemento.className = "msg " + (esError ? "error" : "ok");
}


function mostrarAviso(texto) {
  const toast = $("toast");
  toast.textContent = texto;
  toast.classList.add("visible");
  setTimeout(() => toast.classList.remove("visible"), 2800);
}


function dibujarDatos(idContenedor, filas) {
  const contenedor = $(idContenedor);
  contenedor.innerHTML = "";

  filas.forEach(function (fila) {
    const caja = document.createElement("div");
    caja.className = "dato";

    const etiqueta = document.createElement("span");
    etiqueta.textContent = fila[0];

    const valor = document.createElement("strong");
    valor.textContent = fila[1];

    caja.append(etiqueta, valor);
    contenedor.appendChild(caja);
  });
}




function mostrarVista(id) {
  document.querySelectorAll(".vista").forEach((v) => v.classList.add("oculto"));
  $(id).classList.remove("oculto");
  window.scrollTo(0, 0);

  if (id === "vistaLogin") {
    $("mensaje").textContent = ""; 
  }
}


function activarEnlaces() {
  document.querySelectorAll("[data-ir]").forEach(function (elemento) {
    elemento.addEventListener("click", () => mostrarVista(elemento.dataset.ir));
  });
}




function iniciarRegistro() {
  $("formRegistro").addEventListener("submit", function (evento) {
    evento.preventDefault();

   
    const leer = (id) => $(id).value.trim();
    const nombre = leer("regNombre");
    const apellido = leer("regApellido");
    const dpi = leer("regDpi");
    const telefono = leer("regTelefono");
    const correo = leer("regCorreo");
    const direccion = leer("regDireccion");
    const usuario = leer("regUsuario");
    const clave = $("regClave").value;
    const clave2 = $("regClave2").value;
    const textoDeposito = leer("regDeposito");
    const deposito = textoDeposito === "" ? 0 : parseFloat(textoDeposito);

   
    if (!nombre || !apellido || !dpi || !telefono || !correo || !direccion || !usuario || !clave) {
      return mostrarMensaje("regMensaje", "Completa todos los campos.", true);
    }
    if (!/^\d{13}$/.test(dpi)) {
      return mostrarMensaje("regMensaje", "El DPI debe tener 13 dígitos.", true);
    }
    if (!/^\d{8}$/.test(telefono)) {
      return mostrarMensaje("regMensaje", "El teléfono debe tener 8 dígitos.", true);
    }
    if (!/^\S+@\S+\.\S+$/.test(correo)) {
      return mostrarMensaje("regMensaje", "Escribe un correo válido.", true);
    }
    if (!/^[a-zA-Z0-9_]{4,}$/.test(usuario)) {
      return mostrarMensaje("regMensaje", "El usuario debe tener 4 o más letras o números, sin espacios.", true);
    }
    if (buscarPorUsuario(usuario)) {
      return mostrarMensaje("regMensaje", "Ese usuario ya existe. Elige otro.", true);
    }
    if (db.clientes.some((c) => c.dpi === dpi)) {
      return mostrarMensaje("regMensaje", "Ya existe un cliente con ese DPI.", true);
    }
    if (clave.length < 4) {
      return mostrarMensaje("regMensaje", "La contraseña debe tener al menos 4 caracteres.", true);
    }
    if (clave !== clave2) {
      return mostrarMensaje("regMensaje", "Las contraseñas no coinciden.", true);
    }
    if (isNaN(deposito) || deposito < 0) {
      return mostrarMensaje("regMensaje", "El depósito inicial no es válido.", true);
    }

    
    const cuenta = generarNumeroCuenta();
    const cliente = {
      nombre, apellido, dpi, correo, telefono, direccion, usuario, clave,
      cuenta: cuenta,
      saldo: redondear(deposito),
      registro: new Date().toISOString(),
    };
    db.clientes.push(cliente);

    
    if (deposito > 0) {
      registrarMovimiento(cuenta, "Depósito", "Depósito inicial", redondear(deposito), cliente.saldo);
    }
    guardarDB();

    
    dibujarDatos("datosRegistro", [
      ["Nombre", nombreCompleto(cliente)],
      ["DPI", cliente.dpi],
      ["Correo", cliente.correo],
      ["Teléfono", cliente.telefono],
      ["Dirección", cliente.direccion],
      ["Usuario", cliente.usuario],
      ["Número de cuenta", cliente.cuenta],
      ["Saldo inicial", formatear(cliente.saldo)],
    ]);

    ultimoUsuario = cliente.usuario;
    $("formRegistro").reset();
    $("regMensaje").textContent = "";
    mostrarVista("vistaConfirmacion");
  });

  
  $("btnIrLogin").addEventListener("click", function () {
    $("usuario").value = ultimoUsuario; 
    $("clave").value = "";
    mostrarVista("vistaLogin");
    $("clave").focus();
  });
}




function iniciarLogin() {
  $("formLogin").addEventListener("submit", function (evento) {
    evento.preventDefault(); 

    const usuario = $("usuario").value.trim();
    const clave = $("clave").value;

    
    const cliente = buscarPorUsuario(usuario);

    if (cliente && cliente.clave === clave) {
      entrarAlSistema(cliente.cuenta);
    } else {
     
      $("mensaje").textContent = "❌ Usuario o contraseña incorrectos";
      $("formLogin").classList.add("temblar");
      setTimeout(() => $("formLogin").classList.remove("temblar"), 400);
    }
  });

  
  $("btnSalir").addEventListener("click", function () {
    cuentaActual = null;
    try { sessionStorage.removeItem(CLAVE_SESION); } catch (e) {}
    mostrarVista("vistaInicio");
  });
}

function entrarAlSistema(cuenta) {
  cuentaActual = cuenta;
  saldoVisible = true;
  try { sessionStorage.setItem(CLAVE_SESION, cuenta); } catch (e) {}

  $("usuario").value = "";
  $("clave").value = "";

  mostrarVista("vistaSistema");
  mostrarSeccion("secCuentas");
}


function mostrarSeccion(id) {
  document.querySelectorAll(".seccion").forEach((s) => s.classList.add("oculto"));
  $(id).classList.remove("oculto");

  document.querySelectorAll(".tab").forEach(function (tab) {
    tab.classList.toggle("activa", tab.dataset.seccion === id);
  });

  
  ["trfMensaje", "srvMensaje"].forEach(function (m) {
    $(m).textContent = "";
    $(m).className = "msg";
  });

  dibujarSistema();
}


function dibujarSistema() {
  const cliente = clienteActual();

  
  $("nombreUsuario").textContent = cliente.nombre;
  $("nombreSaludo").textContent = cliente.nombre;
  const hora = new Date().getHours();
  $("saludoHora").textContent =
    hora < 12 ? "Buenos días" : hora < 19 ? "Buenas tardes" : "Buenas noches";
  const fechaTexto = new Date().toLocaleDateString("es-GT", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  $("fecha").textContent = fechaTexto.charAt(0).toUpperCase() + fechaTexto.slice(1);

 
  $("numCuenta").textContent = "Cuenta " + cliente.cuenta;
  $("titular").textContent = nombreCompleto(cliente).toUpperCase();
  dibujarSaldo();

 
  let ingresos = 0;
  let egresos = 0;
  db.transacciones.forEach(function (t) {
    if (t.cuenta !== cliente.cuenta) return;
    if (t.monto > 0) ingresos += t.monto;
    else egresos += Math.abs(t.monto);
  });
  $("totalIngresos").textContent = formatear(ingresos);
  $("totalEgresos").textContent = formatear(egresos);

  
  dibujarDatos("datosCliente", [
    ["Nombre", nombreCompleto(cliente)],
    ["DPI", cliente.dpi],
    ["Correo", cliente.correo],
    ["Teléfono", cliente.telefono],
    ["Dirección", cliente.direccion],
    ["Usuario", cliente.usuario],
    ["Número de cuenta", cliente.cuenta],
    ["Tipo de cuenta", "Ahorro"],
    ["Cliente desde", new Date(cliente.registro).toLocaleDateString("es-GT", { dateStyle: "long" })],
  ]);

  
  $("trfSaldo").textContent = formatear(cliente.saldo);
$("srvSaldo").textContent = formatear(cliente.saldo);
$("opSaldo").textContent = formatear(cliente.saldo);

dibujarMovimientos(cliente);
dibujarEstadisticas(cliente);
dibujarBeneficiarios(cliente);
}

function dibujarSaldo() {
  const cliente = clienteActual();
  $("saldo").textContent = saldoVisible ? formatear(cliente.saldo) : "Q ••••••";
}

function celda(texto, clase) {
  const td = document.createElement("td");
  td.textContent = texto;
  if (clase) td.className = clase;
  return td;
}

function dibujarMovimientos(cliente) {
  const cuerpo = $("cuerpoMovimientos");
  cuerpo.innerHTML = "";

  const lista = db.transacciones
    .filter((t) => t.cuenta === cliente.cuenta)
    .sort((a, b) => b.id - a.id)  
    .slice(0, 10);                 

  if (lista.length === 0) {
    const fila = document.createElement("tr");
    const td = celda("Aún no tienes movimientos.", "vacio");
    td.colSpan = 5;
    fila.appendChild(td);
    cuerpo.appendChild(fila);
    return;
  }

  lista.forEach(function (t) {
    const fila = document.createElement("tr");
    const signo = t.monto >= 0 ? "+" : "−";

    fila.append(
      celda(formatearFecha(t.fecha)),
      celda(t.tipo),
      celda(t.descripcion),
      celda(signo + formatear(Math.abs(t.monto)), "der " + (t.monto >= 0 ? "ingreso" : "egreso")),
      celda(formatear(t.saldoDespues), "der")
    );
    cuerpo.appendChild(fila);
  });
}

function iniciarSistema() {
  $("btnEstadoCuenta").addEventListener(
  "click",
  generarEstadoCuenta
);
  
  document.querySelectorAll(".tab").forEach(function (tab) {
    tab.addEventListener("click", () => mostrarSeccion(tab.dataset.seccion));
  });

 
  $("btnOjo").addEventListener("click", function () {
    saldoVisible = !saldoVisible;
    dibujarSaldo();
  });

  iniciarTransferencias();
  iniciarServicios();
  iniciarOperaciones();
  iniciarBeneficiarios();
}


function iniciarTransferencias() {
  $("formTransferir").addEventListener("submit", function (evento) {
    evento.preventDefault();

    const origen = clienteActual();
    if (!origen) return;

    const cuentaDestino = normalizarCuenta($("trfDestino").value);
    const montoIngresado = Number($("trfMonto").value);
    const monto = redondear(montoIngresado);
    const descripcion = $("trfDescripcion").value.trim();

    if (!cuentaDestino) {
      return mostrarMensaje(
        "trfMensaje",
        "Ingresa la cuenta de destino.",
        true
      );
    }

    const destino = buscarPorCuenta(cuentaDestino);

    if (!destino) {
      return mostrarMensaje(
        "trfMensaje",
        "La cuenta de destino no existe.",
        true
      );
    }

    if (destino.cuenta === origen.cuenta) {
      return mostrarMensaje(
        "trfMensaje",
        "No puedes transferir a tu propia cuenta.",
        true
      );
    }

    if (!Number.isFinite(montoIngresado) || monto <= 0) {
      return mostrarMensaje(
        "trfMensaje",
        "Ingresa un monto válido mayor que cero.",
        true
      );
    }

    if (monto > origen.saldo) {
      return mostrarMensaje(
        "trfMensaje",
        "No tienes saldo suficiente.",
        true
      );
    }

    // Actualizar los saldos de ambas cuentas.
    origen.saldo = redondear(origen.saldo - monto);
    destino.saldo = redondear(destino.saldo + monto);

    const detalle = descripcion ? " - " + descripcion : "";

    const movimiento = registrarMovimiento(
      origen.cuenta,
      "Transferencia enviada",
      "A " + nombreCompleto(destino) +
        " (" + destino.cuenta + ")" + detalle,
      -monto,
      origen.saldo
    );

    registrarMovimiento(
      destino.cuenta,
      "Transferencia recibida",
      "De " + nombreCompleto(origen) +
        " (" + origen.cuenta + ")" + detalle,
      monto,
      destino.saldo
    );

    
    guardarDB();

    $("formTransferir").reset();
    dibujarSistema();

    mostrarMensaje(
      "trfMensaje",
      "Transferencia realizada correctamente. Comprobante: " +
        comprobante(movimiento),
      false
    );

    mostrarAviso("Transferencia realizada con éxito");
  });
}




function iniciarServicios() {
  $("formServicios").addEventListener("submit", function (evento) {
    evento.preventDefault();

    const cliente = clienteActual();
    if (!cliente) return;

    const servicio = $("srvServicio").value;
    const referencia = $("srvReferencia").value.trim();
    const montoIngresado = Number($("srvMonto").value);
    const monto = redondear(montoIngresado);

    if (referencia.length < 4) {
      return mostrarMensaje(
        "srvMensaje",
        "Ingresa una referencia válida de al menos 4 caracteres.",
        true
      );
    }

    if (!Number.isFinite(montoIngresado) || monto <= 0) {
      return mostrarMensaje(
        "srvMensaje",
        "Ingresa un monto válido mayor que cero.",
        true
      );
    }

    if (monto > cliente.saldo) {
      return mostrarMensaje(
        "srvMensaje",
        "Saldo insuficiente. Disponible: " +
          formatear(cliente.saldo),
        true
      );
    }

   
    cliente.saldo = redondear(cliente.saldo - monto);

  
    const pago = registrarMovimiento(
      cliente.cuenta,
      "Pago de servicio",
      servicio + " - Ref. " + referencia,
      -monto,
      cliente.saldo
    );

  
    guardarDB();

    $("formServicios").reset();
    dibujarSistema();

    mostrarMensaje(
      "srvMensaje",
      "Pago realizado correctamente. Comprobante: " +
        comprobante(pago),
      false
    );

    mostrarAviso("Pago realizado con éxito");
  });
}


db = cargarDB();


db.clientes.forEach(function (cliente) {
  if (!Array.isArray(cliente.beneficiarios)) {
    cliente.beneficiarios = [];
  }
});

guardarDB();
activarEnlaces();
iniciarRegistro();
iniciarLogin();
iniciarSistema();


$("btnReiniciar").addEventListener("click", function () {
  if (confirm("¿Borrar todos los datos y volver a los datos de demostración?")) {
    try { localStorage.removeItem(CLAVE_DB); sessionStorage.removeItem(CLAVE_SESION); } catch (e) {}
    window.location.reload();
  }
});
$("btnVerDB").addEventListener("click", verBaseDatos);


let cuentaGuardada = null;
try { cuentaGuardada = sessionStorage.getItem(CLAVE_SESION); } catch (e) {}

if (cuentaGuardada && buscarPorCuenta(cuentaGuardada)) {
  entrarAlSistema(cuentaGuardada);
} else {
  mostrarVista("vistaInicio");
}

function generarEstadoCuenta() {
  const cliente = clienteActual();

  if (!cliente) {
    mostrarAviso("Debes iniciar sesión para continuar.");
    return;
  }


  const movimientos = db.transacciones
    .filter(t => t.cuenta === cliente.cuenta)
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

 
  const ingresos = movimientos
    .filter(t => t.monto > 0)
    .reduce((total, t) => total + t.monto, 0);

  const egresos = movimientos
    .filter(t => t.monto < 0)
    .reduce((total, t) => total + Math.abs(t.monto), 0);


  function escapar(texto) {
    return String(texto ?? "").replace(/[&<>"']/g, caracter => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[caracter]);
  }

  const filas = movimientos.length
    ? movimientos.map(t => `
        <tr>
          <td>${escapar(formatearFecha(t.fecha))}</td>
          <td>${escapar(t.tipo)}</td>
          <td>${escapar(t.descripcion)}</td>
          <td class="${t.monto >= 0 ? "ingreso" : "egreso"}">
            ${t.monto >= 0 ? "+" : "−"}${escapar(
              formatear(Math.abs(t.monto))
            )}
          </td>
          <td>${escapar(formatear(t.saldoDespues))}</td>
        </tr>
      `).join("")
    : `<tr><td colspan="5">No hay movimientos registrados.</td></tr>`;

  const ventana = window.open("", "_blank");

  if (!ventana) {
    mostrarAviso(
      "Permite las ventanas emergentes para generar el estado de cuenta."
    );
    return;
  }

  ventana.document.write(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Estado de cuenta - NexaBank</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          color: #172033;
          margin: 30px;
        }
        h1 { color: #075b4b; margin-bottom: 5px; }
        h2 { margin-top: 28px; }
        .subtitulo { color: #596579; }
        .resumen {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin: 24px 0;
        }
        .dato {
          border: 1px solid #d9e1e8;
          border-radius: 8px;
          padding: 14px;
          overflow-wrap: anywhere;
        }
        .dato span {
          display: block;
          color: #596579;
          font-size: 12px;
          margin-bottom: 6px;
        }
        .dato strong { font-size: 16px; }
        .ingreso { color: #087b50; }
        .egreso { color: #c0392b; }
        .tabla-caja { overflow-x: auto; }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }
        th, td {
          padding: 10px 7px;
          border-bottom: 1px solid #d9e1e8;
          text-align: left;
          overflow-wrap: anywhere;
        }
        th { background: #edf5f2; }
        .acciones { margin: 20px 0; }
        button {
          padding: 11px 18px;
          background: #087b62;
          color: white;
          border: 0;
          border-radius: 6px;
          cursor: pointer;
        }
        footer {
          margin-top: 25px;
          color: #596579;
          font-size: 11px;
        }
        @media print {
          body { margin: 10mm; }
          .acciones { display: none; }
          tr { break-inside: avoid; }
        }
        @media (max-width: 600px) {
          body { margin: 12px; }
          .resumen { grid-template-columns: 1fr; }
        }
      </style>
    </head>
    <body>
      <h1>NexaBank</h1>
      <p class="subtitulo">Estado de cuenta · Banca en línea</p>

      <h2>Datos del titular</h2>
      <p><strong>Nombre:</strong>
        ${escapar(nombreCompleto(cliente))}
      </p>
      <p><strong>Número de cuenta:</strong>
        ${escapar(cliente.cuenta)}
      </p>
      <p><strong>Usuario:</strong>
        ${escapar(cliente.usuario)}
      </p>
      <p><strong>Fecha de generación:</strong>
        ${escapar(formatearFecha(new Date().toISOString()))}
      </p>

      <div class="resumen">
        <div class="dato">
          <span>Saldo actual</span>
          <strong>${escapar(formatear(cliente.saldo))}</strong>
        </div>
        <div class="dato">
          <span>Total de ingresos registrados</span>
          <strong class="ingreso">${escapar(formatear(ingresos))}</strong>
        </div>
        <div class="dato">
          <span>Total de egresos registrados</span>
          <strong class="egreso">${escapar(formatear(egresos))}</strong>
        </div>
        <div class="dato">
          <span>Movimientos registrados</span>
          <strong>${movimientos.length}</strong>
        </div>
      </div>

      <h2>Historial de movimientos</h2>
      <div class="tabla-caja">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Descripción</th>
              <th>Monto</th>
              <th>Saldo registrado</th>
            </tr>
          </thead>
          <tbody>${filas}</tbody>
        </table>
      </div>

      <div class="acciones">
        <button onclick="window.print()">
          Imprimir / Guardar como PDF
        </button>
      </div>

      <footer>
        Documento generado por el sistema de demostración NexaBank.
        Este documento no constituye un estado de cuenta bancario oficial.
      </footer>
    </body>
    </html>
  `);

  ventana.document.close();
  ventana.focus();
}

function verBaseDatos() {
  if (typeof db === "undefined" || !db) {
    mostrarAviso("No se encontró la base de datos.");
    return;
  }

  const ventana = window.open("", "_blank");

  if (!ventana) {
    mostrarAviso(
      "Permite las ventanas emergentes para ver los datos."
    );
    return;
  }

  const datos = {
    clientes: db.clientes ?? [],
    transacciones: db.transacciones ?? []
  };

  ventana.document.title = "Datos de NexaBank";

  // Mostrar los datos como texto, sin ejecutar HTML.
  const pre = ventana.document.createElement("pre");
  pre.textContent = JSON.stringify(datos, null, 2);

  ventana.document.body.style.fontFamily = "monospace";
  ventana.document.body.style.padding = "20px";
  ventana.document.body.appendChild(pre);
}

function consultarMovimientosRecientes() {
  const cliente = clienteActual();

  if (!cliente) {
    mostrarAviso("Debes iniciar sesión para consultar tus movimientos.");
    return;
  }

  const movimientos = db.transacciones
    .filter(t => t.cuenta === cliente.cuenta)
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .slice(0, 10);

  const contenido = movimientos.length
    ? movimientos.map(t => `
        <tr>
          <td>${escaparHTML(formatearFecha(t.fecha))}</td>
          <td>${escaparHTML(t.tipo ?? "")}</td>
          <td>${escaparHTML(t.descripcion ?? "")}</td>
          <td class="${t.monto >= 0 ? "ingreso" : "egreso"}">
            ${t.monto >= 0 ? "+" : "−"}${escaparHTML(
              formatear(Math.abs(t.monto))
            )}
          </td>
        </tr>
      `).join("")
    : `<tr><td colspan="4">No tienes movimientos registrados.</td></tr>`;

  const contenedor = document.getElementById("movimientos-recientes");

  if (!contenedor) {
    mostrarAviso("No se encontró el área de movimientos recientes.");
    return;
  }

  contenedor.innerHTML = `
    <h2>Mis últimos movimientos</h2>
    <p>Cuenta: ${escaparHTML(cliente.cuenta)}</p>
    <p>Saldo actual: ${escaparHTML(formatear(cliente.saldo))}</p>

    <div class="tabla-caja">
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Tipo</th>
            <th>Descripción</th>
            <th>Monto</th>
          </tr>
        </thead>
        <tbody>${contenido}</tbody>
      </table>
    </div>
  `;
}

function escaparHTML(texto) {
  return String(texto ?? "").replace(/[&<>"']/g, caracter => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[caracter]);
}


function iniciarOperaciones() {
  $("formOperaciones").addEventListener("submit", function (evento) {
    evento.preventDefault();

    const cliente = clienteActual();
    if (!cliente) return;

    const tipo = $("opTipo").value;
    const montoIngresado = Number($("opMonto").value);
    const monto = redondear(montoIngresado);
    const descripcion = $("opDescripcion").value.trim();

    if (!["deposito", "retiro"].includes(tipo)) {
      return mostrarMensaje(
        "opMensaje", "Selecciona una operación válida.", true
      );
    }

    if (
      $("opMonto").value.trim() === "" ||
      !Number.isFinite(montoIngresado) ||
      !Number.isFinite(monto) ||
      monto <= 0
    ) {
      return mostrarMensaje(
        "opMensaje", "Ingresa un monto mayor que cero.", true
      );
    }

    if (tipo === "deposito") {
      cliente.saldo = redondear(cliente.saldo + monto);
    } else {
      if (monto > cliente.saldo) {
        return mostrarMensaje(
          "opMensaje",
          "Saldo insuficiente. Disponible: " +
            formatear(cliente.saldo),
          true
        );
      }

      cliente.saldo = redondear(cliente.saldo - monto);
    }

    const movimiento = registrarMovimiento(
      cliente.cuenta,
      tipo === "deposito" ? "Depósito" : "Retiro",
      (tipo === "deposito" ? "Depósito" : "Retiro") +
        (descripcion ? " - " + descripcion : "") +
        " (demostración)",
      tipo === "deposito" ? monto : -monto,
      cliente.saldo
    );

    guardarDB();
    $("formOperaciones").reset();

    dibujarSistema();

    mostrarMensaje(
      "opMensaje",
      (tipo === "deposito" ? "Depósito" : "Retiro") +
        " registrado correctamente. Comprobante: " +
        comprobante(movimiento),
      false
    );

    mostrarAviso("Operación registrada correctamente");
  });
}


function dibujarEstadisticas(cliente) {
  const movimientos = db.transacciones.filter(
    t => t.cuenta === cliente.cuenta
  );

  const ingresos = redondear(
    movimientos
      .filter(t => t.monto > 0)
      .reduce((total, t) => total + t.monto, 0)
  );

  const egresos = redondear(
    movimientos
      .filter(t => t.monto < 0)
      .reduce((total, t) => total + Math.abs(t.monto), 0)
  );

  const balance = redondear(ingresos - egresos);

  $("estIngresos").textContent = formatear(ingresos);
  $("estEgresos").textContent = formatear(egresos);
  $("estBalance").textContent = formatear(balance);
  $("estCantidad").textContent = String(movimientos.length);

  $("estBalance").style.color =
    balance >= 0 ? "#7dffd9" : "#ff8a8a";


  const movimientosOrdenados = [...movimientos].sort(
    (a, b) => new Date(a.fecha) - new Date(b.fecha)
  );

  const etiquetas = movimientosOrdenados.map(t =>
    new Date(t.fecha).toLocaleDateString("es-GT", {
      day: "2-digit",
      month: "short"
    })
  );

  const saldos = movimientosOrdenados.map(t => t.saldoDespues);

  const datosIngresos = movimientosOrdenados.map(t =>
    t.monto > 0 ? t.monto : null
  );

  const datosEgresos = movimientosOrdenados.map(t =>
    t.monto < 0 ? Math.abs(t.monto) : null
  );

  const ctx = $("graficaFinanciera").getContext("2d");

  if (window.miGrafica) {
    window.miGrafica.destroy();
  }

  window.miGrafica = new Chart(ctx, {
    data: {
      labels: etiquetas,
      datasets: [
        {
          type: "bar",
          label: "Ingresos (Q)",
          data: datosIngresos,
          backgroundColor: "rgba(0, 217, 165, 0.75)",
          borderRadius: 6,
          order: 2
        },
        {
          type: "bar",
          label: "Egresos (Q)",
          data: datosEgresos,
          backgroundColor: "rgba(255, 138, 138, 0.8)",
          borderRadius: 6,
          order: 2
        },
        {
          type: "line",
          label: "Saldo disponible (Q)",
          data: saldos,
          borderColor: "#f0d36b",
          backgroundColor: "rgba(240, 211, 107, 0.12)",
          borderWidth: 3,
          fill: true,
          tension: 0.35,
          pointRadius: 5,
          pointBackgroundColor: "#f0d36b",
          order: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          display: true,
          labels: { color: "#fff" }
        },
        tooltip: {
          callbacks: {
            label: (c) =>
              c.dataset.label.replace(" (Q)", "") +
              ": " + formatear(c.parsed.y)
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { color: "#fff" },
          grid: { color: "rgba(255,255,255,0.1)" },
          title: { display: true, text: "Quetzales (Q)", color: "#fff" }
        },
        x: {
          ticks: { color: "#fff" },
          grid: { color: "rgba(255,255,255,0.05)" },
          title: { display: true, text: "Fecha de operación", color: "#fff" }
        }
      }
    }
  });


}



function iniciarBeneficiarios() {
  // Guardar un beneficiario nuevo.
  $("formBeneficiario").addEventListener("submit", function (evento) {
    evento.preventDefault();

    const cliente = clienteActual();
    if (!cliente) return;

    const nombre = $("benNombre").value.trim();
    const cuenta = normalizarCuenta($("benCuenta").value.trim());

    if (nombre.length < 2) {
      return mostrarMensaje(
        "benMensaje", "Escribe un nombre válido.", true
      );
    }

    if (!/^\d{4}-\d{4}$/.test(cuenta)) {
      return mostrarMensaje(
        "benMensaje",
        "La cuenta debe tener el formato 1000-0002.",
        true
      );
    }

    const destino = buscarPorCuenta(cuenta);

    if (!destino) {
      return mostrarMensaje(
        "benMensaje",
        "No existe una cuenta con ese número.",
        true
      );
    }

    if (destino.cuenta === cliente.cuenta) {
      return mostrarMensaje(
        "benMensaje",
        "No puedes guardarte como beneficiario.",
        true
      );
    }

    if (!Array.isArray(cliente.beneficiarios)) {
      cliente.beneficiarios = [];
    }

    if (
      cliente.beneficiarios.some(b => b.cuenta === cuenta)
    ) {
      return mostrarMensaje(
        "benMensaje",
        "Ese beneficiario ya está guardado.",
        true
      );
    }

    cliente.beneficiarios.push({
      nombre: nombre,
      cuenta: cuenta
    });

    guardarDB();
    $("formBeneficiario").reset();

    dibujarBeneficiarios(cliente);

    mostrarMensaje(
      "benMensaje",
      "Beneficiario guardado correctamente.",
      false
    );

    mostrarAviso("Beneficiario agregado");
  });

 
  $("trfBeneficiario").addEventListener("change", function () {
    const cuenta = this.value;

    if (cuenta) {
      $("trfDestino").value = cuenta;
    }
  });


  $("listaBeneficiarios").addEventListener("click", function (evento) {
    const boton = evento.target.closest("[data-eliminar-beneficiario]");
    if (!boton) return;

    const cliente = clienteActual();
    if (!cliente) return;

    const cuenta = boton.dataset.eliminarBeneficiario;

    cliente.beneficiarios = (
      cliente.beneficiarios || []
    ).filter(b => b.cuenta !== cuenta);

    if ($("trfBeneficiario").value === cuenta) {
      $("trfBeneficiario").value = "";
    }

    guardarDB();
    dibujarBeneficiarios(cliente);
    mostrarAviso("Beneficiario eliminado");
  });
}


function dibujarBeneficiarios(cliente) {
  const lista = $("listaBeneficiarios");
  const selector = $("trfBeneficiario");

  lista.replaceChildren();

  const seleccionAnterior = selector.value;
  selector.replaceChildren();

  const opcionInicial = document.createElement("option");
  opcionInicial.value = "";
  opcionInicial.textContent = "Seleccionar beneficiario...";
  selector.appendChild(opcionInicial);

  const beneficiarios = cliente.beneficiarios || [];

  if (beneficiarios.length === 0) {
    const vacio = document.createElement("p");
    vacio.className = "texto-suave";
    vacio.textContent = "Todavía no tienes beneficiarios guardados.";
    lista.appendChild(vacio);
    return;
  }

  beneficiarios.forEach(function (beneficiario) {
    const opcion = document.createElement("option");
    opcion.value = beneficiario.cuenta;
    opcion.textContent =
      beneficiario.nombre + " — " + beneficiario.cuenta;
    selector.appendChild(opcion);

    const tarjeta = document.createElement("div");
    tarjeta.className = "beneficiario-item";

    const datos = document.createElement("div");

    const nombre = document.createElement("strong");
    nombre.textContent = beneficiario.nombre;

    const cuenta = document.createElement("span");
    cuenta.textContent = beneficiario.cuenta;

    datos.append(nombre, cuenta);

    const acciones = document.createElement("div");
    acciones.className = "beneficiario-acciones";

    const usar = document.createElement("button");
    usar.type = "button";
    usar.className = "btn-contorno";
    usar.textContent = "Transferir";
    usar.addEventListener("click", function () {
      $("trfDestino").value = beneficiario.cuenta;
      $("trfBeneficiario").value = beneficiario.cuenta;
      mostrarSeccion("secTransferir");
      $("trfMonto").focus();
    });

    const eliminar = document.createElement("button");
    eliminar.type = "button";
    eliminar.className = "btn-contorno";
    eliminar.textContent = "Eliminar";
    eliminar.dataset.eliminarBeneficiario = beneficiario.cuenta;

    acciones.append(usar, eliminar);
    tarjeta.append(datos, acciones);
    lista.appendChild(tarjeta);
  });

  if (beneficiarios.some(b => b.cuenta === seleccionAnterior)) {
    selector.value = seleccionAnterior;
  }
}

