import React, { useState, useEffect, useRef } from 'react';
import { 
  Database, 
  Terminal, 
  RefreshCw, 
  Server, 
  Cpu, 
  ShoppingCart,
  CheckCircle2,
  AlertTriangle,
  Code2,
  ExternalLink,
  ChevronRight,
  BookOpen,
  UserCheck,
  LogOut,
  Lock,
  History,
  Store,
  ShieldCheck,
  User,
  Coffee,
  Check,
  AlertCircle,
  MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Importar Componentes Modulares
import Storefront from './components/Storefront';
import DbSimulator from './components/DbSimulator';

// Importar Datos Semilla e Interfaces
import { PRODUCTOS_INICIALES } from './data';
import { Producto, Venta, DetalleVenta, TrazaPaso, LogSimulacion } from './types';

export default function App() {
  // --- Estado de Acceso Seguro por Roles (Cerradura de Entrada) ---
  const [userRole, setUserRole] = useState<'guest' | 'cliente' | 'vendedor'>('guest');
  const [clientName, setClientName] = useState<string>('');
  const [staffPin, setStaffPin] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');

  // --- Estados de la Base de Datos Virtual (MySQL) ---
  const [productos, setProductos] = useState<Producto[]>(() => {
    return JSON.parse(JSON.stringify(PRODUCTOS_INICIALES));
  });
  const [ventas, setVentas] = useState<Venta[]>([
    { id_venta: 101, fecha_venta: '2026-06-16 18:24:10', total_venta: 1.50 },
    { id_venta: 102, fecha_venta: '2026-06-17 09:15:30', total_venta: 2.40 }
  ]);
  const [detallesVenta, setDetallesVenta] = useState<DetalleVenta[]>([
    { id_detalle: 501, id_venta: 101, id_producto: 1, cantidad: 3, precio_unitario: 0.50, subtotal: 1.50 },
    { id_detalle: 502, id_venta: 102, id_producto: 2, cantidad: 2, precio_unitario: 1.20, subtotal: 2.40 }
  ]);

  // --- Estado del Carrito en Memoria ---
  const [cart, setCart] = useState<{ producto: Producto; cantidad: number }[]>([]);

  // SKU Seleccionado actualmente para enfocar en la tabla de la base de datos
  const [skuSeleccionado, setSkuSeleccionado] = useState<number>(1);

  // --- Estados del Control / Formularios de Edición Directa de BD ---
  const [editandoProdId, setEditandoProdId] = useState<number | null>(null);
  const [editStock, setEditStock] = useState<number>(0);
  const [editPrecio, setEditPrecio] = useState<number>(0);

  // --- Estados del Simulador PHP/MySQL ---
  const [simulando, setSimulando] = useState<boolean>(false);
  const [pasoActivoIdx, setPasoActivoIdx] = useState<number>(-1);
  const [ejecucionExitosa, setEjecucionExitosa] = useState<boolean | null>(null);
  const [errorSimulacionMsg, setErrorSimulacionMsg] = useState<string>('');
  
  // --- Metadatos de Factura y Modal Exitoso ---
  const [numeroTarjetaUtilizada, setNumeroTarjetaUtilizada] = useState<string>('');
  const [pedidoExitosoModal, setPedidoExitosoModal] = useState<boolean>(false);
  const [ultimoTotalPedido, setUltimoTotalPedido] = useState<number>(0);
  const [ultimoItemsPedido, setUltimoItemsPedido] = useState<{ nombre: string; cant: number }[]>([]);
  
  // --- Tab Activa de Código (Se mantiene en estado interno de App pero no se despliega el visor físico) ---
  const [tabActivaCode, setTabActivaCode] = useState<'php' | 'sql' | 'ayuda'>('php');
  const [copiadoPHP, setCopiadoPHP] = useState<boolean>(false);
  const [copiadoSQL, setCopiadoSQL] = useState<boolean>(false);

  // --- Bitácora de Consola ---
  const [logs, setLogs] = useState<LogSimulacion[]>([
    { timestamp: '07:05:21', tipo: 'info', mensaje: 'Controlador de simulación del Servidor de Ventas listo en puerto local 80.' },
    { timestamp: '07:05:22', tipo: 'database', mensaje: 'Establecida conexión local a la base de datos (inventariosnacks) de forma segura.' }
  ]);

  // --- Trazado del Flujo de la Transacción ---
  const [pasosTransaccion, setPasosTransaccion] = useState<TrazaPaso[]>([]);

  // Log helper
  const agregarLog = (tipo: LogSimulacion['tipo'], mensaje: string) => {
    const ahora = new Date();
    const strTime = ahora.toTimeString().split(' ')[0];
    setLogs(prev => [...prev, { timestamp: strTime, tipo, mensaje }]);
  };

  // Agregar al Carrito
  const handleAddToCart = (producto: Producto) => {
    setCart(prev => {
      const existe = prev.find(item => item.producto.id_producto === producto.id_producto);
      if (existe) {
        return prev.map(item => 
          item.producto.id_producto === producto.id_producto 
            ? { ...item, cantidad: Math.min(producto.stock_actual, item.cantidad + 1) }
            : item
        );
      }
      return [...prev, { producto, cantidad: 1 }];
    });
    setSkuSeleccionado(producto.id_producto);
    agregarLog('info', `Snack "${producto.nombre_producto}" agregado al carrito.`);
  };

  // Remover del Carrito
  const handleRemoveFromCart = (prodId: number) => {
    setCart(prev => prev.filter(item => item.producto.id_producto !== prodId));
    agregarLog('warn', `Eliminado del carrito el producto ID: ${prodId}`);
  };

  // Actualizar cantidad o vaciar carrito si qty es 0
  const handleUpdateCartQty = (prodId: number, qty: number) => {
    if (prodId === -1) {
      setCart([]);
      agregarLog('info', 'Carrito de compras vaciado completamente.');
      return;
    }
    
    if (qty <= 0) {
      handleRemoveFromCart(prodId);
      return;
    }
    
    setCart(prev => prev.map(item => 
      item.producto.id_producto === prodId 
        ? { ...item, cantidad: qty }
        : item
    ));
  };

  // Agregar Snack de tu gusto
  const handleAddCustomProduct = (nombre: string, precio: number, categoria: string, imagen: string) => {
    const nuevoId = productos.length > 0 ? Math.max(...productos.map(p => p.id_producto)) + 1 : 1;
    const nuevoProducto: Producto = {
      id_producto: nuevoId,
      nombre_producto: nombre,
      precio_venta: precio,
      stock_actual: 30,
      categoria,
      imagen
    };
    setProductos(prev => [...prev, nuevoProducto]);
    agregarLog('database', `Nuevo snack cargado a la base de datos local: "${nombre}" ($${precio.toFixed(2)}).`);
  };

  // Reiniciar BD
  const restablecerBaseDeDatos = () => {
    setProductos(JSON.parse(JSON.stringify(PRODUCTOS_INICIALES)));
    setVentas([
      { id_venta: 101, fecha_venta: '2026-06-16 18:24:10', total_venta: 1.50 },
      { id_venta: 102, fecha_venta: '2026-06-17 09:15:30', total_venta: 2.40 }
    ]);
    setDetallesVenta([
      { id_detalle: 501, id_venta: 101, id_producto: 1, cantidad: 3, precio_unitario: 0.50, subtotal: 1.50 },
      { id_detalle: 502, id_venta: 102, id_producto: 2, cantidad: 2, precio_unitario: 1.20, subtotal: 2.40 }
    ]);
    setPasoActivoIdx(-1);
    setEjecucionExitosa(null);
    setSimulando(false);
    setCart([]);
    agregarLog('warn', 'Se ha refrescado el esquema de Base de Datos inventariosnacks. Tablas purgadas.');
  };

  // Editar Stock / Precios Manualmente en la simulación
  const iniciarEdicion = (prod: Producto) => {
    setEditandoProdId(prod.id_producto);
    setEditStock(prod.stock_actual);
    setEditPrecio(prod.precio_venta);
  };

  const guardarEdicionProducto = (id: number) => {
    setProductos(prev => prev.map(p => {
      if (p.id_producto === id) {
        return {
          ...p,
          stock_actual: Math.max(0, editStock),
          precio_venta: Math.max(0.01, editPrecio)
        };
      }
      return p;
    }));
    setEditandoProdId(null);
    agregarLog('database', `Stock/Precio modificado directamente en DB para el producto ID ${id}.`);
  };

  const copiarAlPortapapeles = (texto: string, tipo: 'php' | 'sql') => {
    navigator.clipboard.writeText(texto);
    if (tipo === 'php') {
      setCopiadoPHP(true);
      setTimeout(() => setCopiadoPHP(false), 2000);
    } else {
      setCopiadoSQL(true);
      setTimeout(() => setCopiadoSQL(false), 2000);
    }
    agregarLog('info', `Copiado bloque de código de ${tipo.toUpperCase()}.`);
  };

  // --- CONTROL DE ACCESO SIMULADO ---
  const handleLogin = (role: 'cliente' | 'vendedor') => {
    setLoginError('');
    if (role === 'vendedor') {
      if (staffPin.trim() === 'admin123') {
        setUserRole('vendedor');
        agregarLog('info', 'Sesión iniciada con éxito como Personal Administrador.');
      } else {
        setLoginError('Clave incorrecta. Pista: admin123');
      }
    } else {
      setUserRole('cliente');
      const nombreFinal = clientName.trim() || 'Cliente Distinguido';
      agregarLog('info', `Cliente registrado para compra: "${nombreFinal}"`);
    }
  };

  const handleLogout = () => {
    setUserRole('guest');
    setStaffPin('');
    setClientName('');
    setLoginError('');
    setCart([]);
    agregarLog('info', 'Sesión finalizada. Retornando a la pantalla de entrada.');
  };

  // --- EJECUCIÓN SIMULADA DE LA COMPRA ---
  const ejecutarProcesarCompraCart = async (cardNum: string = '') => {
    if (simulando || cart.length === 0) return;

    setSimulando(true);
    setEjecucionExitosa(null);
    setErrorSimulacionMsg('');
    setNumeroTarjetaUtilizada(cardNum);
    
    // Guardar detalles del pedido actual para el modal de éxito
    const totalVentaCálculo = cart.reduce((total, item) => total + item.producto.precio_venta * item.cantidad, 0);
    setUltimoTotalPedido(totalVentaCálculo);
    setUltimoItemsPedido(cart.map(item => ({
      nombre: item.producto.nombre_producto,
      cant: item.cantidad
    })));

    const checkoutItem = cart[0];
    const prodId = checkoutItem.producto.id_producto;
    const qty = checkoutItem.cantidad;

    const originalProduct = productos.find(p => p.id_producto === prodId);

    // Inicializar los pasos de traza seguros
    const pasosIniciales: TrazaPaso[] = [
      {
        id: '1_card_validation',
        titulo: 'Validación de Tarjeta Bancaria',
        codigoAsociado: `SELECT card_number, balance FROM bank_accounts WHERE card = '${cardNum.replace(/\s/g, '')}';`,
        descripcion: 'Verificando validez del número de tarjeta provisto y saldo suficiente.',
        estado: 'procesando',
        tipoOperacion: 'conexion'
      },
      {
        id: '2_order_integrity',
        titulo: 'Generación e Integridad de Pedido',
        codigoAsociado: `Assert($pedido_total > 0 && String($cart_items_json));`,
        descripcion: 'Verificando consistencia del carrito de snacks y datos de facturación.',
        estado: 'esperando',
        tipoOperacion: 'sanitizacion'
      },
      {
        id: '3_reserve_inventory',
        titulo: 'Inicio de Reserva de Inventario',
        codigoAsociado: `START TRANSACTION ISOLATION LEVEL SERIALIZABLE;`,
        descripcion: 'Estableciendo transaction id. Suspendiendo escrituras concurrentes.',
        estado: 'esperando',
        tipoOperacion: 'transaccion'
      },
      {
        id: '4_stock_inspection',
        titulo: 'Reserva e Inspección de Stock',
        codigoAsociado: `SELECT stock_actual \nFROM productos \nWHERE id_producto = :id_producto FOR UPDATE;`,
        descripcion: 'Asegurando que el stock cubra el pedido y reteniendo el lote de snacks temporalmente.',
        estado: 'esperando',
        tipoOperacion: 'consulta'
      },
      {
        id: '5_payment_gateway',
        titulo: 'Aprobación de la Pasarela Bancaria',
        codigoAsociado: `CALL ProcessSecureCharge(:card, :total, :merchant_id);`,
        descripcion: 'Procesando cargo seguro inmediato y reteniendo fondos de la compra.',
        estado: 'esperando',
        tipoOperacion: 'insercion'
      },
      {
        id: '6_invoice_emission',
        titulo: 'Emisión Contable de Factura',
        codigoAsociado: `INSERT INTO ventas (fecha_venta, total_venta) \nVALUES (NOW(), :total);`,
        descripcion: 'Registrando la boleta comercial en el libro de ventas local.',
        estado: 'esperando',
        tipoOperacion: 'insercion'
      },
      {
        id: '7_update_physical',
        titulo: 'Descuento Físico y Actualización',
        codigoAsociado: `UPDATE productos \nSET stock_actual = :nuevo_stock \nWHERE id_producto = :id_producto;`,
        descripcion: 'Disminuyendo de forma definitiva el inventario físico disponible en bodega.',
        estado: 'esperando',
        tipoOperacion: 'update'
      },
      {
        id: '8_whatsapp_readiness',
        titulo: 'Consolidar Reserva de Pedido',
        codigoAsociado: `COMMIT;`,
        descripcion: 'Haciendo permanentes los cambios e iniciando orden de despacho.',
        estado: 'esperando',
        tipoOperacion: 'commit'
      }
    ];

    setPasosTransaccion(pasosIniciales);
    agregarLog('info', `Petición de pago seguro recibida. Tarjeta seleccionada: ${cardNum ? '**** **** **** ' + cardNum.slice(-4) : 'N/D'}. Item principal: ID ${prodId} (${qty} uds).`);

    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    // --- PASO 1: VALIDACIÓN DE TARJETA ---
    setPasoActivoIdx(0);
    await delay(1000);
    setPasosTransaccion(prev => prev.map((p, idx) => idx === 0 ? { ...p, estado: 'exito', descripcion: `Tarjeta de red bancaria verificada correctamente usando token seguro.` } : p));
    agregarLog('success', 'Número de tarjeta y credenciales bancarias validadas.');

    // --- PASO 2: INTEGRIDAD DE PEDIDO ---
    setPasoActivoIdx(1);
    setPasosTransaccion(prev => prev.map((p, idx) => idx === 1 ? { ...p, estado: 'procesando' } : p));
    await delay(900);
    
    if (!originalProduct || isNaN(qty) || qty <= 0) {
      setPasosTransaccion(prev => prev.map((p, idx) => idx === 1 ? { ...p, estado: 'error', descripcion: 'Error de integridad: Parámetros del carrito incorrectos.' } : p));
      agregarLog('error', 'Fallo de integridad de datos en el filtro del pedido.');
      handleDispararRollback('Error: Datos inválidos en los parámetros del pedido.');
      return;
    }
    
    setPasosTransaccion(prev => prev.map((p, idx) => idx === 1 ? { ...p, estado: 'exito', descripcion: `Estructura validada. Pedido sano para el ID ${prodId}.` } : p));
    agregarLog('info', 'Parámetros del pedido saneados contra SQL Injection.');

    // --- PASO 3: INICIAR RESERVA ---
    setPasoActivoIdx(2);
    setPasosTransaccion(prev => prev.map((p, idx) => idx === 2 ? { ...p, estado: 'procesando' } : p));
    await delay(800);
    setPasosTransaccion(prev => prev.map((p, idx) => idx === 2 ? { ...p, estado: 'exito', descripcion: 'Reserva activa iniciada en el hilo transaccional local.' } : p));
    agregarLog('database', 'Reserva abierta comercialmente. Stock retenido temporalmente.');

    // --- PASO 4: INSPECCIÓN DE STOCK ---
    setPasoActivoIdx(3);
    setPasosTransaccion(prev => prev.map((p, idx) => idx === 3 ? { ...p, estado: 'procesando' } : p));
    await delay(1150);

    const checkProduct = productos.find(p => p.id_producto === prodId);
    
    if (!checkProduct) {
      setPasosTransaccion(prev => prev.map((p, idx) => idx === 3 ? { ...p, estado: 'error', descripcion: 'El ID de snack solicitado no se encuentra en el inventario.' } : p));
      agregarLog('error', `El producto ID: ${prodId} no existe en inventariosnacks.`);
      handleDispararRollback(`Excepción: El snack solicitado no existe.`);
      return;
    }

    if (checkProduct.stock_actual < qty) {
      setPasosTransaccion(prev => prev.map((p, idx) => idx === 3 ? { ...p, estado: 'error', descripcion: `Stock Insuficiente. Disponible: ${checkProduct.stock_actual}, Solicitado: ${qty}` } : p));
      agregarLog('warn', `¡¡ERROR DE STOCK CONCURRENTE!! Quedan ${checkProduct.stock_actual} unidades e intentas reservar: ${qty}.`);
      handleDispararRollback(`Stock insuficiente para '${checkProduct.nombre_producto}'. Disponible: ${checkProduct.stock_actual}, Solicitado: ${qty}.`);
      return;
    }

    setPasosTransaccion(prev => prev.map((p, idx) => idx === 3 ? { ...p, estado: 'exito', descripcion: `Lote confirmado. Snack: "${checkProduct.nombre_producto}" - Stock disponible: ${checkProduct.stock_actual}. Fila lockeada.` } : p));
    agregarLog('success', `Stock verificado: Hay ${checkProduct.stock_actual} unidades de "${checkProduct.nombre_producto}".`);

    // --- PASO 5: PASARELA DE PAGO ---
    setPasoActivoIdx(4);
    setPasosTransaccion(prev => prev.map((p, idx) => idx === 4 ? { ...p, estado: 'procesando' } : p));
    await delay(1000);

    const totalCalculado = checkProduct.precio_venta * qty;
    const nuevaIdVenta = ventas.length > 0 ? Math.max(...ventas.map(v => v.id_venta)) + 1 : 103;
    const fechaHora = new Date().toISOString().replace('T', ' ').substring(0, 19);

    setPasosTransaccion(prev => prev.map((p, idx) => idx === 4 ? { ...p, estado: 'exito', descripcion: `Transacción aprobada. Código autorización: SEC-${nuevaIdVenta}. Monto: $${totalCalculado.toFixed(2)}` } : p));
    agregarLog('database', `Pasarela aprobó el pago. Alistando inserción de boleta.`);

    // --- PASO 6: EMISIÓN CONTABLE ---
    setPasoActivoIdx(5);
    setPasosTransaccion(prev => prev.map((p, idx) => idx === 5 ? { ...p, estado: 'procesando' } : p));
    await delay(1000);

    const nuevaIdDetalle = detallesVenta.length > 0 ? Math.max(...detallesVenta.map(d => d.id_detalle)) + 1 : 503;

    setPasosTransaccion(prev => prev.map((p, idx) => idx === 5 ? { ...p, estado: 'exito', descripcion: `Factura ingresada. ID generada: ${nuevaIdVenta}. Detalle #${nuevaIdDetalle} guardado.` } : p));
    agregarLog('database', `Detalle de preventa creado para snack ID ${prodId}.`);

    // --- PASO 7: DESCUENTO FÍSICO ---
    setPasoActivoIdx(6);
    setPasosTransaccion(prev => prev.map((p, idx) => idx === 6 ? { ...p, estado: 'procesando' } : p));
    await delay(1000);

    const nuevoStock = checkProduct.stock_actual - qty;

    setPasosTransaccion(prev => prev.map((p, idx) => idx === 6 ? { ...p, estado: 'exito', descripcion: `Inventario actualizado para el ID ${prodId}. Stock previo: ${checkProduct.stock_actual} -> Nuevo stock: ${nuevoStock}` } : p));
    agregarLog('database', `Stock de ID ${prodId} actualizado de forma tentativa en memoria de base de datos.`);

    // --- PASO 8: AUTO REDIRECCIÓN Y PAGO ---
    setPasoActivoIdx(7);
    setPasosTransaccion(prev => prev.map((p, idx) => idx === 7 ? { ...p, estado: 'procesando' } : p));
    await delay(1200);

    // Consolidación de cambios en base de datos local
    setProductos(prev => prev.map(p => {
      if (p.id_producto === prodId) {
        return { ...p, stock_actual: nuevoStock };
      }
      return p;
    }));

    setVentas(prev => [
      ...prev,
      { id_venta: nuevaIdVenta, fecha_venta: fechaHora, total_venta: totalCalculado }
    ]);

    setDetallesVenta(prev => [
      ...prev,
      {
        id_detalle: nuevaIdDetalle,
        id_venta: nuevaIdVenta,
        id_producto: prodId,
        amount: qty,
        cantidad: qty,
        precio_unitario: checkProduct.precio_venta,
        subtotal: totalCalculado
      } as any
    ]);

    setPasosTransaccion(prev => prev.map((p, idx) => idx === 7 ? { ...p, estado: 'exito', descripcion: '¡Transacción resguardada con éxito! Su pedido está listo.' } : p));
    agregarLog('success', '¡Commit exitoso! Base de datos persistente consolidada de forma segura.');

    // Completado exitosamente
    setCart([]); // Vaciar carrito
    setEjecucionExitosa(true);
    setSimulando(false);
    setPasoActivoIdx(-1);
    setPedidoExitosoModal(true); // Abrir notificación de pedido listo
    agregarLog('success', `¡Pedido listo! Factura #${nuevaIdVenta} creada. Total cobrado: $${totalCalculado.toFixed(2)}.`);
  };

  // Reversión / Rollback en caso de error
  const handleDispararRollback = async (errorMsg: string) => {
    setErrorSimulacionMsg(errorMsg);
    agregarLog('error', `Excepción capturada: "${errorMsg}"`);
    
    const pasoRollback: TrazaPaso = {
      id: '9_rollback',
      titulo: 'Rollback Automatic Execution',
      codigoAsociado: 'if ($pdo->inTransaction()) {\n    $pdo->rollBack();\n}',
      descripcion: 'Haciendo reversión total de las operaciones anteriores para mantener la consistencia.',
      estado: 'procesando',
      tipoOperacion: 'rollback'
    };

    setPasosTransaccion(prev => [...prev, pasoRollback]);
    setPasoActivoIdx(pasosTransaccion.length);

    await new Promise(res => setTimeout(res, 1300));

    setPasosTransaccion(prev => prev.map(p => p.id === '9_rollback' ? { ...p, estado: 'error', descripcion: 'Reversión exitosa de PDO. Base de datos resguardada intacta sin mutar.' } : p));
    agregarLog('database', 'Resguardo ACID finalizado de forma limpia.');

    setEjecucionExitosa(false);
    setSimulando(false);
    setPasoActivoIdx(-1);
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-[#f8fafc] font-sans flex flex-col selection:bg-amber-500 selection:text-slate-900" id="app_root_container">
      
      {/* HEADER PRINCIPAL */}
      <header className="border-b border-slate-900 bg-[#060a12] px-6 py-4 sticky top-0 z-40 shadow-sm" id="sales_header">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-amber-500 to-amber-600 p-2.5 rounded-xl shadow-md">
              <Store className="h-5.5 w-5.5 text-slate-950" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                {userRole !== 'guest' && (
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border capitalize ${
                    userRole === 'vendedor' 
                      ? 'bg-rose-950/40 text-rose-400 border-rose-900/30' 
                      : 'bg-emerald-950/40 text-emerald-400 border-emerald-900/30'
                  }`}>
                    Sesión: {userRole}
                  </span>
                )}
              </div>
              <h1 className="text-sm sm:text-base md:text-xl italic font-black font-fancy tracking-wider bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 bg-clip-text text-transparent uppercase drop-shadow-[0_2px_10px_rgba(245,158,11,0.25)] mt-1">
                SNACKFEST DISTRIBUIDORA DE VENTAS DE ROBERT DONDE CUMPLE CON SUS EXPECTATIVAS
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {userRole !== 'guest' && (
              <button 
                id="btn_logout"
                onClick={handleLogout}
                className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold font-sans text-xs px-3.5 py-2 rounded-lg transition border border-slate-800 shadow-sm"
              >
                <LogOut className="h-3.5 w-3.5 text-rose-500" />
                <span>Salir</span>
              </button>
            )}
          </div>

        </div>
      </header>

      {/* RENDERIZADO CONDICIONAL DE SESIÓN */}
      <AnimatePresence mode="wait">
        {userRole === 'guest' ? (
          /* PANTALLA DE INICIO DE SESIÓN EXCLUSIVA */
          <motion.div 
            key="login_screen"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="flex-1 flex items-center justify-center p-6 bg-gradient-to-b from-[#090d16] to-[#04060b]"
            id="session_entrance"
          >
            <div className="w-full max-w-md bg-[#0a0f1d] border border-slate-800 rounded-3xl p-6 md:p-8 text-center space-y-6 shadow-2xl relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#090d16] p-3 rounded-full border border-slate-800 shadow-xl">
                <Coffee className="h-7 w-7 text-amber-500" />
              </div>

              <div className="pt-4 text-center">
                <h2 className="text-2xl font-black text-white tracking-tight">Iniciar Sesión</h2>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Defina si ingresa como cliente comprador para pedir snacks, o como personal para dar atención y gestionar inventarios.
                </p>
              </div>

              {loginError && (
                <div className="p-3 bg-red-950/40 border border-red-900/30 text-rose-400 text-xs rounded-xl flex items-center gap-2 text-left" id="login_error_box">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                  <span>{loginError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 text-left">
                {/* OPCIÓN A: CLIENTE */}
                <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800 hover:border-amber-500/50 transition duration-150 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-amber-500/10 text-amber-500 rounded-lg">
                      <User className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Modo Cliente Comprador</h3>
                      <p className="text-[10px] text-slate-500 font-sans">Visualiza el catálogo, la reseña y el canasto de compras</p>
                    </div>
                  </div>
                  
                  <div className="space-y-1.5" id="client_name_form">
                    <label className="text-[10px] text-slate-400 font-mono block uppercase">Su Nombre (Opcional)</label>
                    <input 
                      id="input_client_name"
                      type="text" 
                      placeholder="Ej. Roberto Gómez" 
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full bg-[#0a0f1d] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition"
                    />
                  </div>

                  <button
                    id="btn_enter_client"
                    onClick={() => handleLogin('cliente')}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold py-2 rounded-xl transition flex items-center justify-center gap-1"
                  >
                    <span>Ingresar como Cliente</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* OPCIÓN B: TRABAJADOR / PERSONAL DE ATENCIÓN */}
                <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800 hover:border-rose-500/50 transition duration-150 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-rose-500/10 text-rose-500 rounded-lg">
                      <ShieldCheck className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Personal de Ventas</h3>
                      <p className="text-[10px] text-slate-500 font-sans">Administra stocks directos de MariaDB y tablas en vivo</p>
                    </div>
                  </div>

                  <div className="space-y-1.5" id="staff_password_form">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] text-slate-400 font-mono block uppercase">Clave de Acceso</label>
                      <span className="text-[9px] text-slate-500 font-mono italic">Pista: admin123</span>
                    </div>
                    <div className="relative">
                      <input 
                        id="input_staff_pin"
                        type="password" 
                        placeholder="••••••••" 
                        value={staffPin}
                        onChange={(e) => setStaffPin(e.target.value)}
                        className="w-full bg-[#0a0f1d] border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-rose-500 transition"
                      />
                      <Lock className="h-3.5 w-3.5 text-slate-600 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <button
                    id="btn_enter_staff"
                    onClick={() => handleLogin('vendedor')}
                    className="w-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-2 rounded-xl transition flex items-center justify-center gap-1 border border-rose-500/20"
                  >
                    <span>Autenticar y Gestionar Inventario</span>
                    <ChevronRight className="h-3.5 w-3.5 text-rose-300" />
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 font-sans border-t border-slate-900 pt-4 text-center">
                Bienvenido a nuestra página de ventas
              </div>
            </div>
          </motion.div>
        ) : (
          /* WORKSPACE PRINCIPAL CLIENTE O VENDEDOR */
          <motion.div 
            key="workspace_screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col"
            id="workspace_root"
          >
            {/* Cabecera Informativa Contextual */}
            <div className="bg-[#0b101c] border-b border-slate-900 px-6 py-3" id="intro_alert">
              <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs leading-relaxed text-slate-300 text-left">
                {userRole === 'cliente' ? (
                  <div className="flex items-center gap-2">
                    <Coffee className="h-4 w-4 text-amber-500 shrink-0" />
                    <span>
                      Bienvenido, <strong className="text-amber-400">{clientName.trim() || 'Cliente'}</strong>. Explora nuestro menú con total seguridad, lee la reseña histórica o haz tu pedido inmediato.
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-rose-400 shrink-0" />
                    <span>
                      Modo Operador de Ventas: Puedes modificar directamente stocks e importes. La simulación está vinculada para ver cambios de tupla en tiempo real.
                    </span>
                  </div>
                )}
                
                <div className="flex items-center gap-3 shrink-0">
                  {userRole === 'vendedor' && (
                    <button 
                      id="btn_db_reload_nav"
                      onClick={restablecerBaseDeDatos}
                      disabled={simulando}
                      className="flex items-center gap-1 text-[10px] bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white px-2.5 py-1 rounded-md border border-slate-800 transition"
                    >
                      <RefreshCw className="h-3 w-3 text-amber-500" />
                      Reiniciar Almacén
                    </button>
                  )}
                  <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-500">
                    <span className="h-2 w-2 bg-emerald-500 rounded-full"></span>
                    <span>Consistencia Activa</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SECCIÓN DEL WORKSPACE SEGÚN ROL */}
            <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6" id="app_main_grid">
              {userRole === 'cliente' ? (
                /* VISTA CLIENTE: EXCLUSIVAMENTE STOREFRONT CON SU RESEÑA HISTÓRICA */
                <div className="max-w-2xl mx-auto" id="client_centered_column">
                  <Storefront 
                    productos={productos}
                    cart={cart}
                    onAddToCart={handleAddToCart}
                    onRemoveFromCart={handleRemoveFromCart}
                    onUpdateCartQty={handleUpdateCartQty}
                    onCheckout={ejecutarProcesarCompraCart}
                    simulando={simulando}
                    onAddCustomProduct={handleAddCustomProduct}
                  />
                </div>
              ) : (
                /* VISTA STAFF: EXCLUSIVAMENTE GESTIÓN DE SNACKS E INVENTARIO MAS TABLAS SQL */
                <div className="max-w-5xl mx-auto" id="staff_centered_layout">
                  <div className="bg-[#0b101c]/80 rounded-2xl border border-slate-850 p-6 space-y-4">
                    <div className="text-left">
                      <h2 className="text-base font-extrabold text-white flex items-center gap-2 font-mono">
                        <Database className="h-4.5 w-4.5 text-rose-500" />
                        TABLAS RELACIONALES DEL PUNTO DE VENTA (MARIADB)
                      </h2>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Edite stocks y verifique cómo el motor transaccional actualiza ventas, detalles y tuplas de productos. El código fuente y la consola técnica se encuentran completamente ocultos para seguridad del entorno comercial.
                      </p>
                    </div>

                    <DbSimulator 
                      productos={productos}
                      ventas={ventas}
                      detallesVenta={detallesVenta}
                      logs={logs}
                      pasosTransaccion={pasosTransaccion}
                      pasoActivoIdx={pasoActivoIdx}
                      ejecucionExitosa={ejecucionExitosa}
                      errorSimulacionMsg={errorSimulacionMsg}
                      editandoProdId={editandoProdId}
                      editStock={editStock}
                      editPrecio={editPrecio}
                      tabActivaCode={tabActivaCode}
                      copiadoPHP={copiadoPHP}
                      copiadoSQL={copiadoSQL}
                      onStartEdicion={iniciarEdicion}
                      onSaveEdicion={guardarEdicionProducto}
                      onSetEditStock={setEditStock}
                      onSetEditPrecio={setEditPrecio}
                      onCancelEdicion={() => setEditandoProdId(null)}
                      onTabChange={setTabActivaCode}
                      onCopiar={copiarAlPortapapeles}
                      onClearConsole={() => setLogs([])}
                      skuSeleccionado={skuSeleccionado}
                      onSelectSku={setSkuSeleccionado}
                    />
                  </div>
                </div>
              )}
            </main>
          </motion.div>
        )}
      </AnimatePresence>

      {/* OVERLAY / DIALOG DE SIMULACIÓN DE TRANSACCIÓN PARA CLIENTES */}
      <AnimatePresence>
        {simulando && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#04060b]/95 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            id="transaction_running_dialog"
          >
            <div className="bg-[#0a0f1d] border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl text-left relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-amber-500"></div>
              
              <div className="flex items-center gap-3">
                <div className="bg-amber-500/10 p-2.5 rounded-xl text-amber-500 shrink-0">
                  <Database className="h-5.5 w-5.5 animate-bounce" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                    Procesando Compra Atómica
                    <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                  </h3>
                  <p className="text-[11px] text-slate-500">Servidor autorizando el cobro con encriptación: <span className="text-amber-500 font-mono">SSL / HTTPS Secure Channel</span></p>
                </div>
              </div>

              {/* Lista compacta de pasos de transacción */}
              <div className="space-y-2 max-h-[290px] overflow-y-auto pr-1 font-mono" id="transaction_trace_steps">
                {pasosTransaccion.map((paso, idx) => {
                  const esActivo = pasoActivoIdx === idx;
                  const esExito = paso.estado === 'exito';
                  const esError = paso.estado === 'error';
                  const esProcesando = paso.estado === 'procesando';
                  
                  let badgeColor = "bg-slate-900 text-slate-500 border-slate-850";
                  let badgeText = "Esperando";
                  if (esActivo || esProcesando) { badgeColor = "bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse"; badgeText = "Ejecutando"; }
                  if (esExito) { badgeColor = "bg-emerald-950/40 text-emerald-400 border-emerald-900/30"; badgeText = "Ok PDO"; }
                  if (esError) { badgeColor = "bg-rose-950 text-rose-400 border-rose-900/20"; badgeText = "Falló"; }

                  return (
                    <div 
                      key={paso.id}
                      className={`p-2.5 rounded-xl border transition-all text-xs flex flex-col gap-1 ${
                        esActivo ? 'bg-slate-900 border-amber-500/40' : 'bg-slate-950/60 border-slate-850/60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={`font-extrabold text-[11px] ${esActivo ? 'text-amber-400' : 'text-slate-300'}`}>
                          {paso.titulo}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded border uppercase font-bold shrink-0 ${badgeColor}`}>
                          {badgeText}
                        </span>
                      </div>
                      
                      <p className="text-[10px] text-slate-500 italic leading-relaxed">{paso.descripcion}</p>
                      
                      {esActivo && (
                        <pre className="text-[9px] bg-[#0d1117] p-1.5 rounded border border-slate-850 text-amber-300/90 overflow-x-auto mt-1 whitespace-pre">
                          {paso.codigoAsociado}
                        </pre>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="text-[11px] text-slate-500 text-center font-mono py-1.5 border-t border-slate-900">
                La base de datos se mantendrá íntegra en caso de fallos.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* OVERLAY DE ÉXITO O ROLLBACK DE TRANSACCIÓN */}
      <AnimatePresence>
        {ejecucionExitosa !== null && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#04060b]/95 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            id="transaction_status_overlay"
          >
            <div className="bg-[#0a0f1d] border border-slate-800 rounded-3xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl relative">
              {ejecucionExitosa ? (
                <>
                  <div className="mx-auto w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center border border-emerald-500/20">
                    <Check className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">¡Compra Procesada con Éxito!</h3>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      El pedido se ha registrado de forma segura en nuestro sistema. El inventario se ha actualizado y el comprobante está listo para ser emitido.
                    </p>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-[11px] font-mono text-left space-y-1 text-slate-400">
                    <div><span className="text-slate-500">Estatus:</span> <strong className="text-emerald-400">Transacción Aprobada</strong></div>
                    <div><span className="text-slate-500">Operación:</span> <strong className="text-slate-200">Verificación y Pago Seguro</strong></div>
                    <div><span className="text-slate-500">Consistencia:</span> <span className="text-emerald-400">Excelente (100%)</span></div>
                  </div>
                  
                  <button
                    id="btn_close_status_success"
                    onClick={() => setEjecucionExitosa(null)}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition uppercase tracking-wider"
                  >
                    Entendido (Consolidados)
                  </button>
                </>
              ) : (
                <>
                  <div className="mx-auto w-14 h-14 bg-red-500/10 text-rose-400 rounded-full flex items-center justify-center border border-red-500/20">
                    <AlertTriangle className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-rose-400">¡Transacción Revertida (Rollback)!</h3>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed font-sans">
                      Se detectó una discrepancia (Falla de inventario o validación). El script ejecutó un <strong className="text-rose-400 font-mono">rollBack()</strong> automático para dejar el almacén tal como estaba.
                    </p>
                  </div>
                  
                  <div className="p-3 bg-red-950/20 rounded-xl border border-red-900/10 text-[11px] font-mono text-left text-slate-400">
                    <span className="text-red-400 font-bold block">★ Error Capturado:</span>
                    <p className="mt-1 leading-relaxed text-rose-300">{errorSimulacionMsg}</p>
                  </div>

                  <button
                    id="btn_close_status_fail"
                    onClick={() => setEjecucionExitosa(null)}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2.5 rounded-xl text-xs transition uppercase tracking-wider"
                  >
                    Revisar y Corregir
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NOTIFICACIÓN MODAL: TU PEDIDO ESTÁ LISTO (Enlace a WhatsApp para Confirmar) */}
      <AnimatePresence>
        {pedidoExitosoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-55 flex items-center justify-center p-4 font-sans"
            id="order_success_notificacion_modal"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-[#090e1a] border-2 border-amber-500/30 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-[0_0_50px_rgba(245,158,11,0.15)] text-center space-y-6 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 to-amber-600"></div>
              
              {/* Icono de Campana / Regalo Animado */}
              <div className="mx-auto w-16 h-16 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                <span className="text-3xl animate-bounce">🎉</span>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-mono text-emerald-400 font-bold tracking-widest uppercase bg-emerald-500/10 px-2.5 py-1 rounded-full">
                  ⚡ ¡NOTIFICACIÓN: PEDIDO PREPARADO!
                </span>
                <h3 className="text-xl font-extrabold text-white tracking-tight">
                  ¡Tu pedido está listo para salir!
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                  Hemos verificado el pago seguro de forma atómica. Haz clic en el botón inferior para confirmar tu envío directamente con un operador a través de WhatsApp.
                </p>
              </div>

              {/* Detalle y desglose de Items */}
              <div className="bg-[#04060c] rounded-2xl p-4 border border-slate-850/70 text-left space-y-3">
                <div className="flex justify-between items-center text-xs text-slate-500 font-mono pb-2 border-b border-slate-900">
                  <span>MÉTODO DE PAGO</span>
                  <span className="text-slate-300">👤 Tarjeta terminada en {numeroTarjetaUtilizada.slice(-4) || '****'}</span>
                </div>

                <div className="space-y-1.5 font-mono">
                  <span className="text-[9px] text-slate-500 block font-bold">DESGLOSE DEL PEDIDO:</span>
                  {ultimoItemsPedido.map((item, i) => (
                    <div key={i} className="flex justify-between text-xs text-slate-300">
                      <span>• {item.nombre}</span>
                      <span className="text-slate-500 font-sans">x{item.cant}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-2.5 border-t border-slate-900 text-sm font-bold">
                  <span className="text-slate-400">TOTAL PAGADO:</span>
                  <span className="text-amber-500 font-mono">${ultimoTotalPedido.toFixed(2)}</span>
                </div>
              </div>

              {/* Botón Principal: Confirmar en WhatsApp del Dueño */}
              <a
                href={`https://wa.me/593991729808?text=${encodeURIComponent(
                  `¡Hola! 👋 He realizado un pedido en la Distribuidora de Snacks Atómica.\n\n` +
                  `*Detalles del Pedido:*\n` +
                  ultimoItemsPedido.map(item => `• ${item.nombre} (x${item.cant})`).join('\n') +
                  `\n\n*Total Pagado:* $${ultimoTotalPedido.toFixed(2)}\n` +
                  `*Tarjeta:* Terminada en **** ${numeroTarjetaUtilizada.replace(/\s/g, '').slice(-4) || '****'}\n\n` +
                  `Por favor confirmar mi pedido y coordinar el despacho. ¡Muchas gracias! 🍿🚚`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-gradient-to-r from-[#25D366] to-[#1ebd5e] text-white hover:from-[#20ba5a] hover:to-[#17a14e] font-bold py-3.5 px-6 rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition duration-200 shadow-lg hover:shadow-emerald-950/20 cursor-pointer"
              >
                <svg className="h-4.5 w-4.5 fill-current text-white shrink-0" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.1 1.45 4.7 1.452 5.4 0 9.8-4.385 9.8-9.776 0-2.61-1.02-5.066-2.87-6.92C16.42 2.056 13.968 1.03 11.36 1.03c-5.4 0-9.8 4.386-9.8 9.778 0 1.948.51 3.841 1.48 5.51L2.01 21.97l5.3-1.39a1.6 1.6 0 0 0-1.74-.216zm11.23-4.321c-.24-.12-1.41-.696-1.63-.776-.22-.08-.38-.12-.54.12-.16.24-.62.776-.76.936-.14.16-.28.18-.52.06-.24-.12-1.01-.372-1.92-1.184-.71-.63-1.19-1.41-1.33-1.65-.14-.24-.015-.37.105-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.195-.476-.39-.413-.54-.42l-.46-.008c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2 0 1.18.86 2.32.98 2.48.12.16 1.69 2.58 4.1 3.62.57.25 1.02.4 1.37.51.58.18 1.1.16 1.52.1.47-.07 1.41-.576 1.61-1.136.2-.56.2-.1.14-.2-.06-.1-.22-.16-.46-.28z"/>
                </svg>
                <span>Confirmar Pedido vía WhatsApp</span>
              </a>

              <button
                id="btn_cerrar_notif_modal"
                onClick={() => setPedidoExitosoModal(false)}
                className="w-full text-[11px] font-mono text-slate-500 hover:text-slate-300 transition uppercase tracking-widest pt-1"
              >
                Cerrar Ventana [Esc]
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FOOTER DESCRIPTIVO */}
      <footer className="bg-[#05080e] border-t border-slate-900/80 p-5 text-center text-xs text-slate-500 font-sans mt-auto" id="app_footer">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 font-sans">
          <div className="text-left">
            <p className="font-bold text-slate-400 text-xs">Distribuidora de Snacks Atómica</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Bienvenido a nuestra página de ventas • Todos los derechos reservados.</p>
          </div>
          <div className="text-slate-500 text-right text-[11px] font-mono leading-relaxed">
            Año de Creación: <strong className="text-amber-500">1998</strong> <br />
            © 1998 - {new Date().getFullYear()} • Todos los derechos reservados
          </div>
        </div>
      </footer>

      {/* Botón Flotante de WhatsApp para Consultas */}
      <a
        href="https://wa.me/593991729808?text=Hola!%20Deseo%20realizar%20una%20consulta%20sobre%20SnackFest"
        target="_blank"
        rel="noopener noreferrer"
        id="floating_whatsapp_btn"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebd5e] text-white font-bold px-4 py-3 rounded-full shadow-2xl transition duration-200 hover:scale-105 active:scale-[0.98] cursor-pointer group"
        title="WhatsApp Directo"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
        </span>
        <svg className="h-5 w-5 fill-current text-white transition-transform group-hover:rotate-12 shrink-0" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.1 1.45 4.7 1.452 5.4 0 9.8-4.385 9.8-9.776 0-2.61-1.02-5.066-2.87-6.92C16.42 2.056 13.968 1.03 11.36 1.03c-5.4 0-9.8 4.386-9.8 9.778 0 1.948.51 3.841 1.48 5.51L2.01 21.97l5.3-1.39a1.6 1.6 0 0 0-1.74-.216zm11.23-4.321c-.24-.12-1.41-.696-1.63-.776-.22-.08-.38-.12-.54.12-.16.24-.62.776-.76.936-.14.16-.28.18-.52.06-.24-.12-1.01-.372-1.92-1.184-.71-.63-1.19-1.41-1.33-1.65-.14-.24-.015-.37.105-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.195-.476-.39-.413-.54-.42l-.46-.008c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2 0 1.18.86 2.32.98 2.48.12.16 1.69 2.58 4.1 3.62.57.25 1.02.4 1.37.51.58.18 1.1.16 1.52.1.47-.07 1.41-.576 1.61-1.136.2-.56.2-.1.14-.2-.06-.1-.22-.16-.46-.28z"/>
        </svg>
        <span className="text-xs tracking-wide">Consultas WhatsApp</span>
      </a>
    </div>
  );
}
