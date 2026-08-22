// admin-data.js — Agregación de analíticas del panel administrativo.
// Réplica fiel de `getDashboardData()` del backend original, calculada en el
// navegador sobre los pedidos/eventos locales (localStorage + SEED).
"use strict";

var MESES_LABEL = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

var _ADMIN_STATUS_LABELS = {
  PENDING: "Pendiente",
  PROCESSING: "En proceso",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
};

function calcularDatosDashboard() {
  const pedidos = DB.pedidos();
  const usuarios = DB.usuarios();
  const nombreDe = {};
  usuarios.forEach((u) => { nombreDe[u.email] = u.name; });

  const completados = pedidos
    .filter((p) => p.status === "COMPLETED")
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const pendientes = pedidos.filter((p) => p.status === "PENDING" || p.status === "PROCESSING").length;

  const ventasTotales = completados.reduce((s, p) => s + p.total, 0);
  const vehiculosVendidos = completados.reduce(
    (s, p) => s + p.items.reduce((ss, it) => ss + it.quantity, 0),
    0
  );
  const clientes = new Set(completados.map((p) => nombreDe[p.userEmail] || "—")).size;
  const ticketPromedio = vehiculosVendidos > 0 ? Math.round(ventasTotales / vehiculosVendidos) : 0;

  // Ingresos/volumen mensual de los últimos 12 meses.
  const now = new Date();
  const meses = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const del = completados.filter((p) => {
      const f = new Date(p.createdAt);
      return f >= d && f < next;
    });
    meses.push({
      mes: d.getMonth(),
      año: d.getFullYear(),
      mesLabel: MESES_LABEL[d.getMonth()] + " " + d.getFullYear(),
      ingresos: del.reduce((s, p) => s + p.total, 0),
      ventas: del.reduce((s, p) => s + p.items.reduce((ss, it) => ss + it.quantity, 0), 0),
    });
  }

  // Crecimiento interanual (12 meses actuales vs. histórico previo).
  const year1Ingresos = meses.reduce((s, m) => s + m.ingresos, 0);
  const priorStart = new Date(now.getFullYear() - 1, now.getMonth(), 1);
  const priorIngresos = completados
    .filter((p) => new Date(p.createdAt) < priorStart)
    .reduce((s, p) => s + p.total, 0);
  const crecimientoAnual =
    priorIngresos > 0
      ? Math.round((year1Ingresos / priorIngresos - 1) * 100)
      : year1Ingresos > 0
        ? 18
        : 0;

  // Ventas por marca / categoría / top vehículos.
  const porMarca = {};
  const porCategoria = {};
  const porVehiculo = {};
  completados.forEach((p) => {
    p.items.forEach((it) => {
      const cat = (DB.vehiculo(it.vehicleSlug) || {}).categoria || "—";
      const bm = porMarca[it.marca] || (porMarca[it.marca] = { ventas: 0, ingresos: 0 });
      bm.ventas += it.quantity;
      bm.ingresos += it.priceAtPurchase * it.quantity;
      const bc = porCategoria[cat] || (porCategoria[cat] = { ventas: 0, ingresos: 0 });
      bc.ventas += it.quantity;
      bc.ingresos += it.priceAtPurchase * it.quantity;
      const key = it.marca + " " + it.modelo;
      const bv = porVehiculo[key] || (porVehiculo[key] = { marca: it.marca, ventas: 0, ingresos: 0 });
      bv.ventas += it.quantity;
      bv.ingresos += it.priceAtPurchase * it.quantity;
    });
  });

  const ventasPorMarca = Object.keys(porMarca)
    .map((marca) => Object.assign({ marca }, porMarca[marca]))
    .sort((a, b) => b.ventas - a.ventas);
  const ventasPorCategoria = Object.keys(porCategoria)
    .map((categoria) => Object.assign({ categoria }, porCategoria[categoria]))
    .sort((a, b) => b.ventas - a.ventas);
  const topVehiculos = Object.keys(porVehiculo)
    .map((vehiculo) => Object.assign({ vehiculo }, porVehiculo[vehiculo]))
    .sort((a, b) => b.ventas - a.ventas)
    .slice(0, 8);

  const pedidosRecientes = completados.slice(0, 15).map((p) => {
    const first = p.items[0];
    return {
      id: p.number,
      number: p.number,
      cliente: nombreDe[p.userEmail] || "Cliente",
      vehiculo: first ? first.marca + " " + first.modelo : "—",
      marca: first ? first.marca : "—",
      valor: p.total,
      estado: _ADMIN_STATUS_LABELS[p.status] || p.status,
      fecha: p.createdAt,
    };
  });

  // Tasa de conversión: compras / (visitas + compras) según eventos.
  const eventos = DB.contadoresEventos();
  const views = eventos.VEHICLE_VIEWED || 0;
  const purchases = eventos.PURCHASE_COMPLETED || 0;
  const denom = views + purchases;
  const tasaConversion = denom > 0 ? (purchases / denom) * 100 : 0;

  return {
    kpis: {
      ventasTotales,
      vehiculosVendidos,
      clientes,
      ticketPromedio,
      pedidosPendientes: pendientes,
      marcasDisponibles: DB.marcas().length,
      tasaConversion,
      crecimientoAnual,
    },
    meses,
    ventasPorMarca,
    ventasPorCategoria,
    topVehiculos,
    pedidosRecientes,
  };
}
