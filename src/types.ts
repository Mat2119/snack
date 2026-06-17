/**
 * Tipos de datos para el simulador del backend PHP y MySQL
 */

export interface Producto {
  id_producto: number;
  nombre_producto: string;
  precio_venta: number;
  stock_actual: number;
  imagen?: string;
  categoria?: string;
}

export interface Venta {
  id_venta: number;
  fecha_venta: string;
  total_venta: number;
}

export interface DetalleVenta {
  id_detalle: number;
  id_venta: number;
  id_producto: number;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface TrazaPaso {
  id: string;
  titulo: string;
  codigoAsociado: string;
  descripcion: string;
  estado: 'esperando' | 'procesando' | 'exito' | 'error';
  tipoOperacion: 'conexion' | 'transaccion' | 'consulta' | 'insercion' | 'update' | 'rollback' | 'commit' | 'sanitizacion';
}

export interface LogSimulacion {
  timestamp: string;
  tipo: 'info' | 'success' | 'warn' | 'error' | 'database';
  mensaje: string;
}
