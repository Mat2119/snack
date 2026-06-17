import React from 'react';
import { 
  Database, 
  Layers, 
  Terminal, 
  Cpu, 
  Check, 
  XCircle, 
  Clock, 
  Code,
  FileCode,
  Copy,
  Plus
} from 'lucide-react';
import { Producto, Venta, DetalleVenta, TrazaPaso, LogSimulacion } from '../types';
import { PHP_CODE, SQL_SCHEMA } from '../data';

interface DbSimulatorProps {
  productos: Producto[];
  ventas: Venta[];
  detallesVenta: DetalleVenta[];
  logs: LogSimulacion[];
  pasosTransaccion: TrazaPaso[];
  pasoActivoIdx: number;
  ejecucionExitosa: boolean | null;
  errorSimulacionMsg: string;
  editandoProdId: number | null;
  editStock: number;
  editPrecio: number;
  tabActivaCode: 'php' | 'sql' | 'ayuda';
  copiadoPHP: boolean;
  copiadoSQL: boolean;
  onStartEdicion: (p: Producto) => void;
  onSaveEdicion: (id: number) => void;
  onSetEditStock: (stock: number) => void;
  onSetEditPrecio: (precio: number) => void;
  onCancelEdicion: () => void;
  onTabChange: (tab: 'php' | 'sql' | 'ayuda') => void;
  onCopiar: (texto: string, tipo: 'php' | 'sql') => void;
  onClearConsole: () => void;
  skuSeleccionado: number;
  onSelectSku: (id: number) => void;
}

export default function DbSimulator({
  productos,
  ventas,
  detallesVenta,
  logs,
  pasosTransaccion,
  pasoActivoIdx,
  ejecucionExitosa,
  errorSimulacionMsg,
  editandoProdId,
  editStock,
  editPrecio,
  tabActivaCode,
  copiadoPHP,
  copiadoSQL,
  onStartEdicion,
  onSaveEdicion,
  onSetEditStock,
  onSetEditPrecio,
  onCancelEdicion,
  onTabChange,
  onCopiar,
  onClearConsole,
  skuSeleccionado,
  onSelectSku
}: DbSimulatorProps) {
  
  // Element Ref for log auto scroll is handled at parent or can be managed automatically
  const logContainerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="flex flex-col gap-6" id="comp_db_simulator">

      {/* BLOQUE A: TABLAS DE BASE DE DATOS LOCAL */}
      <div className="bg-[#131b2e] rounded-1xl border border-slate-800 p-5 shadow-xl text-left" id="card_db_tables">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-amber-500" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              MariaDB / MySQL: <span className="text-emerald-400 font-normal select-all">inventariosnacks</span>
            </h3>
          </div>
          <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700/60">
            InnoDB ACID Engine
          </span>
        </div>

        {/* TABLA 1: PRODUCTOS */}
        <div className="space-y-4">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-amber-500 flex items-center gap-1">
                <Layers className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                tabla: productos
              </span>
              <span className="text-slate-500 text-[10px]">PK: id_producto</span>
            </div>
            
            <div className="overflow-x-auto rounded-xl border border-slate-850 bg-slate-900/40">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#1e293b]/60 border-b border-slate-800 text-slate-400 uppercase text-[9px]">
                  <tr>
                    <th className="p-2 border-r border-slate-800/50 w-10 text-center">PK</th>
                    <th className="p-2 border-r border-slate-800/50">nombre_producto</th>
                    <th className="p-2 border-r border-slate-800/50 w-16 text-right">precio</th>
                    <th className="p-2 border-r border-slate-800/50 w-14 text-center">stock</th>
                    <th className="p-2 w-12 text-center text-slate-500">gestión</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 text-slate-300">
                  {productos.map(p => {
                    const isEditing = editandoProdId === p.id_producto;
                    const isSelectedInLanding = skuSeleccionado === p.id_producto;
                    
                    return (
                      <tr 
                        key={p.id_producto} 
                        onClick={() => !isEditing && onSelectSku(p.id_producto)}
                        className={`transition-colors cursor-pointer ${
                          isSelectedInLanding 
                            ? 'bg-amber-600/10 font-medium text-amber-400 border-l-2 border-l-amber-500' 
                            : 'hover:bg-slate-800/30'
                        }`}
                      >
                        <td className="p-2 border-r border-slate-800/50 text-center text-slate-500 font-bold">{p.id_producto}</td>
                        <td className="p-2 border-r border-slate-800/50 truncate max-w-[140px]" title={p.nombre_producto}>
                          <span className="mr-1.5">{p.imagen}</span>
                          {p.nombre_producto}
                        </td>
                        <td className="p-2 border-r border-slate-800/50 text-right font-mono font-bold">
                          {isEditing ? (
                            <input 
                              id={`input_precio_${p.id_producto}`}
                              type="number" 
                              step="0.05"
                              value={editPrecio}
                              onChange={(e) => onSetEditPrecio(Number(e.target.value))}
                              onClick={(e) => e.stopPropagation()}
                              className="w-14 bg-slate-950 text-xs text-right border border-amber-500 rounded p-1 text-slate-200 font-mono"
                            />
                          ) : (
                            `$${p.precio_venta.toFixed(2)}`
                          )}
                        </td>
                        <td className="p-2 border-r border-slate-800/50 text-center">
                          {isEditing ? (
                            <input 
                              id={`input_stock_${p.id_producto}`}
                              type="number" 
                              value={editStock}
                              onChange={(e) => onSetEditStock(Number(e.target.value))}
                              onClick={(e) => e.stopPropagation()}
                              className="w-12 bg-slate-950 text-xs text-center border border-amber-500 rounded p-1 text-slate-200 font-mono"
                            />
                          ) : (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              p.stock_actual <= 0 
                                ? 'bg-rose-950/60 text-rose-400 border border-rose-900/30' 
                                : p.stock_actual < 10 
                                  ? 'bg-amber-950/60 text-amber-400 border border-amber-900/30 font-extrabold'
                                  : 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30'
                            }`}>
                              {p.stock_actual}
                            </span>
                          )}
                        </td>
                        <td className="p-2 text-center" onClick={(e) => e.stopPropagation()}>
                          {isEditing ? (
                            <div className="flex items-center justify-center gap-1">
                              <button 
                                id={`btn_save_prod_${p.id_producto}`}
                                onClick={() => onSaveEdicion(p.id_producto)}
                                className="text-emerald-400 hover:text-emerald-300 font-bold text-xs bg-slate-950 px-1 py-0.5 rounded border border-emerald-800/40"
                                title="Guardar cambios directos"
                              >
                                ✔
                              </button>
                              <button 
                                id={`btn_cancel_prod_${p.id_producto}`}
                                onClick={onCancelEdicion}
                                className="text-rose-400 hover:text-rose-300 font-bold text-xs bg-slate-950 px-1 py-0.5 rounded border border-rose-800/40"
                                title="Cancelar"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button 
                              id={`btn_edit_prod_${p.id_producto}`}
                              onClick={() => onStartEdicion(p)}
                              className="text-slate-400 hover:text-amber-400 text-[10px] bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700/50"
                              title="Editar inventario de este Snack"
                            >
                              Editar
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-slate-500 italic font-mono">
              💡 Tip: Edita el stock a &quot;0&quot; o reduce el inventario para simular excepciones transaccionales y presenciar la ejecución automática de la reversión (**rollBack()**) para asegurar la consistencia.
            </p>
          </div>

          {/* TABLAS RELACIONADAS - EN PARALELO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* TABLA: VENTAS */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-amber-500 flex items-center gap-1">
                  <Layers className="h-3 w-3 shrink-0 text-amber-500" />
                  tabla: ventas
                </span>
                <span className="text-[10px] text-slate-500">PK: id_venta</span>
              </div>
              
              <div className="overflow-x-auto rounded-xl border border-slate-850 bg-slate-900/40 max-h-[140px] overflow-y-auto">
                <table className="w-full text-left text-[11px] font-mono">
                  <thead className="bg-[#1e293b]/60 border-b border-slate-800 text-slate-400 uppercase text-[8px] sticky top-0 z-10">
                    <tr>
                      <th className="p-1.5 w-8 text-center border-r border-slate-800/50">PK</th>
                      <th className="p-1.5 border-r border-slate-800/50">fecha_venta</th>
                      <th className="p-1.5 text-right w-14 text-amber-400">total_venta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 text-slate-400">
                    {ventas.map(v => (
                      <tr key={v.id_venta} className="hover:bg-slate-800/20">
                        <td className="p-1.5 text-center font-bold text-slate-300">{v.id_venta}</td>
                        <td className="p-1.5 text-slate-500 text-[10px] truncate max-w-[90px]" title={v.fecha_venta}>{v.fecha_venta}</td>
                        <td className="p-1.5 text-right font-medium text-slate-300">${v.total_venta.toFixed(2)}</td>
                      </tr>
                    ))}
                    {ventas.length === 0 && (
                      <tr>
                        <td colSpan={3} className="text-center p-3 text-slate-600 italic">No hay ventas registradas.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* TABLA: DETALLE_VENTA */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-amber-500 flex items-center gap-1">
                  <Layers className="h-3 w-3 shrink-0" />
                  tabla: detalle_venta
                </span>
                <span className="text-[10px] text-slate-500">FK: id_venta</span>
              </div>
              
              <div className="overflow-x-auto rounded-xl border border-slate-850 bg-slate-900/40 max-h-[140px] overflow-y-auto">
                <table className="w-full text-left text-[10px] font-mono">
                  <thead className="bg-[#1e293b]/60 border-b border-slate-800 text-slate-400 uppercase text-[8px] sticky top-0 z-10">
                    <tr>
                      <th className="p-1.5 w-8 text-center border-r border-slate-800/50">FK V</th>
                      <th className="p-1.5 border-r border-slate-800/50">ID Prod</th>
                      <th className="p-1.5 text-center w-8">Cant</th>
                      <th className="p-1.5 text-right w-12">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 text-slate-400">
                    {detallesVenta.map(dv => {
                      return (
                        <tr key={dv.id_detalle} className="hover:bg-slate-800/20">
                          <td className="p-1 text-center text-slate-300 font-bold">{dv.id_venta}</td>
                          <td className="p-1 text-center text-slate-500 border-r border-slate-800/50">Prod #{dv.id_producto}</td>
                          <td className="p-1 text-center text-slate-300">{dv.cantidad}</td>
                          <td className="p-1 text-right text-emerald-400">${dv.subtotal.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                    {detallesVenta.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center p-3 text-slate-600 italic">No hay detalles aún.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
