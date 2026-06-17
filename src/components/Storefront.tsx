import React, { useState } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, ArrowRight, Star, Leaf, Clock, Heart, History, Utensils, MapPin, Users } from 'lucide-react';
import { Producto } from '../types';

interface StorefrontProps {
  productos: Producto[];
  cart: { producto: Producto; cantidad: number }[];
  onAddToCart: (p: Producto) => void;
  onRemoveFromCart: (prodId: number) => void;
  onUpdateCartQty: (prodId: number, qty: number) => void;
  onCheckout: (cardNum: string) => void;
  onAddCustomProduct: (nombre: string, precio: number, categoria: string, imagen: string) => void;
  simulando: boolean;
}

export default function Storefront({
  productos,
  cart,
  onAddToCart,
  onRemoveFromCart,
  onUpdateCartQty,
  onCheckout,
  onAddCustomProduct,
  simulando
}: StorefrontProps) {
  const [activeTab, setActiveTab] = useState<'catalogo' | 'nosotros' | 'historia'>('catalogo');
  const [customSnackName, setCustomSnackName] = useState('');
  const [customSnackPrecio, setCustomSnackPrecio] = useState('');
  const [customSnackEmoji, setCustomSnackEmoji] = useState('🍿');
  const [numeroTarjeta, setNumeroTarjeta] = useState('');


  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.producto.precio_venta * item.cantidad, 0);
  };

  const getCartCount = () => {
    return cart.reduce((count, item) => count + item.cantidad, 0);
  };

  return (
    <div className="bg-slate-900/40 rounded-2xl border border-slate-800 p-6 flex flex-col gap-6" id="comp_storefront">
      {/* Hero Header para la Landing de Ventas */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-600/20 via-orange-600/10 to-slate-900 border border-slate-700/40 p-6 text-left" id="store_hero">
        <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-orange-600/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 max-w-xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-amber-500/20 text-amber-400 text-[11px] uppercase tracking-wider font-bold px-2 rounded-full border border-amber-500/30">
              Crujientes, Frescos &amp; Deliciosos
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-xs text-slate-400">Entrega Inmediata</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight">
            Distribuidora <span className="text-amber-500">SnackFest</span> <br />
            ¡Venta de Snacks de Todo Tipo!
          </h2>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Compra en línea con nuestro sistema de inventario optimizado. Consulta nuestro catálogo en tiempo real con total comodidad.
          </p>
          
          <div className="flex items-center gap-4 mt-4 text-[11px] text-slate-300 font-mono">
            <div className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
              <span>4.9 (2.4k Reseñas)</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-amber-500" />
              <span>Envío 24/7</span>
            </div>
          </div>
        </div>
      </div>

      {/* Selector de Sección del Cliente: Catálogo vs Nosotros vs Reseña Histórica */}
      <div className="flex flex-col sm:flex-row border border-slate-800 p-1 bg-slate-950/80 rounded-xl gap-1" id="client_nav_options">
        <button
          id="btn_section_catalogo"
          onClick={() => setActiveTab('catalogo')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'catalogo'
              ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Utensils className="h-4 w-4" />
          Catálogo de Snacks
        </button>
        <button
          id="btn_section_nosotros"
          onClick={() => setActiveTab('nosotros')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'nosotros'
              ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="h-4 w-4" />
          Quiénes Somos &amp; Ubicación
        </button>
        <button
          id="btn_section_historia"
          onClick={() => setActiveTab('historia')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'historia'
              ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="h-4 w-4" />
          Reseña Histórica
        </button>
      </div>

      {activeTab === 'catalogo' ? (
        <>
          {/* Grid del Catálogo de Snacks */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-200 tracking-wider uppercase font-mono flex items-center gap-2">
                <Leaf className="h-4 w-4 text-emerald-400" />
                Catálogo de Productos Disponibles
              </h3>
              <span className="text-xs text-slate-500 font-mono">tabla: productos ({productos.length} items)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" id="snacks_catalog_grid">
              {productos.map((prod) => {
                const isOutOfStock = prod.stock_actual <= 0;
                const itemInCart = cart.find(c => c.producto.id_producto === prod.id_producto);
                
                return (
                  <div 
                    key={prod.id_producto}
                    id={`product_card_${prod.id_producto}`}
                    className={`relative bg-slate-900/60 border rounded-xl overflow-hidden p-4 flex flex-col justify-between transition-all duration-200 ${
                      isOutOfStock ? 'border-slate-800 opacity-60' : 'border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    {/* Badge de Categoría / Stock Bajo */}
                    <div className="flex items-center justify-between gap-2 mb-2 text-[10px]">
                      <span className="text-slate-400 font-mono bg-slate-800 px-2 py-0.5 rounded-md">
                        {prod.categoria || 'Snacks'}
                      </span>
                      {prod.stock_actual <= 0 ? (
                        <span className="text-red-400 font-bold bg-red-950/40 border border-red-900/30 px-1.5 py-0.5 rounded">
                          Agotado
                        </span>
                      ) : prod.stock_actual < 10 ? (
                        <span className="text-amber-400 font-bold bg-amber-950/40 border border-amber-900/30 px-1.5 py-0.5 rounded animate-pulse">
                          ¡Solo {prod.stock_actual} left!
                        </span>
                      ) : (
                        <span className="text-slate-500 font-mono">
                          Stock: <strong className="text-slate-300 font-medium">{prod.stock_actual} uds</strong>
                        </span>
                      )}
                    </div>

                    <div className="flex gap-3 my-1">
                      <span className="text-3xl select-none" role="img" aria-label={prod.nombre_producto}>
                        {prod.imagen || '🍿'}
                      </span>
                      <div className="text-left flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-slate-100 uppercase truncate" title={prod.nombre_producto}>
                          {prod.nombre_producto}
                        </h4>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">ID: {prod.id_producto} • Precio Unitario</p>
                        <p className="text-base font-extrabold text-amber-500 mt-0.5 font-mono">
                          ${prod.precio_venta.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Acciones de Tarjeta */}
                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                      <div className="text-xs text-slate-400 font-medium font-mono">
                        {itemInCart ? (
                          <span className="text-amber-400">{itemInCart.cantidad} x ${prod.precio_venta.toFixed(2)}</span>
                        ) : (
                          <span className="text-slate-600">No seleccionado</span>
                        )}
                      </div>
                      
                      {itemInCart ? (
                        <div className="flex items-center gap-1 bg-slate-800/90 rounded-md border border-slate-700/30 p-0.5">
                          <button
                            id={`btn_qty_dec_${prod.id_producto}`}
                            disabled={simulando}
                            onClick={() => onUpdateCartQty(prod.id_producto, itemInCart.cantidad - 1)}
                            className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-xs font-bold text-slate-200 px-2 font-mono">
                            {itemInCart.cantidad}
                          </span>
                          <button
                            id={`btn_qty_inc_${prod.id_producto}`}
                            disabled={simulando || itemInCart.cantidad >= prod.stock_actual}
                            onClick={() => onUpdateCartQty(prod.id_producto, itemInCart.cantidad + 1)}
                            className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          id={`btn_add_to_cart_${prod.id_producto}`}
                          disabled={isOutOfStock || simulando}
                          onClick={() => onAddToCart(prod)}
                          className="bg-slate-800 hover:bg-amber-500 hover:text-slate-900 disabled:opacity-40 disabled:hover:bg-slate-800 disabled:hover:text-slate-400 text-slate-300 font-semibold px-3 py-1.5 rounded-lg text-xs transition duration-150 flex items-center gap-1.5 border border-slate-700/50"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Añadir
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Formulario para Agregar Snack Personalizado de tu Gusto */}
          <div className="bg-slate-900/40 p-5 rounded-xl border border-slate-800 space-y-4 mt-6 text-left" id="custom_snack_form">
            <div>
              <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <span>🍿 Agregar Snack de tu Gusto</span>
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                ¿Tienes algún snack preferido en mente? Ingrésalo a continuación para añadirlo al catálogo y poder comprarlo.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-mono uppercase">Nombre del Snack</label>
                <input
                  id="input_custom_snack_name"
                  type="text"
                  placeholder="Ej. Toqukes de Queso"
                  value={customSnackName}
                  onChange={(e) => setCustomSnackName(e.target.value)}
                  className="w-full bg-[#070b13] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-amber-500 transition"
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-mono uppercase">Precio ($)</label>
                <input
                  id="input_custom_snack_precio"
                  type="number"
                  step="0.05"
                  placeholder="Ej. 1.25"
                  value={customSnackPrecio}
                  onChange={(e) => setCustomSnackPrecio(e.target.value)}
                  className="w-full bg-[#070b13] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-amber-500 transition font-mono"
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-mono uppercase">Icono / Emoji</label>
                <select
                  id="select_custom_snack_emoji"
                  value={customSnackEmoji}
                  onChange={(e) => setCustomSnackEmoji(e.target.value)}
                  className="w-full bg-[#070b13] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 transition"
                >
                  <option value="🍿">🍿 Popcorn / Maíz</option>
                  <option value="🍟">🍟 Papas Fritas</option>
                  <option value="🍠">🍠 Chifles / Plátano</option>
                  <option value="🧀">🧀 Snacks de Queso</option>
                  <option value="🥨">🥨 Bretzel</option>
                  <option value="🍪">🍪 Galletas</option>
                  <option value="🍬">🍬 Golosinas</option>
                  <option value="🌰">🌰 Frutos Secos</option>
                </select>
              </div>
            </div>
            
            <button
              id="btn_add_custom_snack"
              type="button"
              onClick={() => {
                if (!customSnackName.trim()) {
                  alert("Por favor ingrese un nombre para el snack.");
                  return;
                }
                const price = parseFloat(customSnackPrecio);
                if (isNaN(price) || price <= 0) {
                  alert("Por favor ingrese un precio válido mayor a 0.");
                  return;
                }
                onAddCustomProduct(customSnackName.trim(), price, 'Especiales', customSnackEmoji);
                setCustomSnackName('');
                setCustomSnackPrecio('');
              }}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold py-2 px-4 rounded-xl transition duration-150 transform active:scale-95"
            >
              Registrar Snack de mi Gusto
            </button>
          </div>

          {/* SECCIÓN DEL CARRITO DE COMPRAS / CHECKOUT */}
          <div className="bg-[#0b0f19]/80 p-5 rounded-xl border border-slate-800" id="cart_section">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4.5 w-4.5 text-amber-500" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Carrito de Ventas ({getCartCount()} items)
                </h4>
              </div>
              {cart.length > 0 && (
                <button
                  id="clear_cart_btn"
                  onClick={() => onUpdateCartQty(-1, 0)} // Limpiar todo enviando id -1
                  className="text-[10px] text-red-400 hover:text-red-300 transition"
                >
                  Vaciar Carrito
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="py-6 text-center text-slate-500 text-xs leading-relaxed font-sans" id="empty_cart_block">
                El carrito está vacío. Agrega un snack de tu gusto para realizar una compra.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="max-h-[160px] overflow-y-auto space-y-2 pr-1" id="cart_items_list">
                  {cart.map((item) => (
                    <div key={item.producto.id_producto} className="flex items-center justify-between text-xs bg-slate-900/40 p-2.5 rounded-lg border border-slate-850">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{item.producto.imagen}</span>
                        <div className="text-left">
                          <p className="font-bold text-slate-300 truncate max-w-[140px] uppercase">{item.producto.nombre_producto}</p>
                          <span className="text-[10px] text-slate-500 font-mono">
                            ${item.producto.precio_venta.toFixed(2)} c/u
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-amber-500">
                          ${(item.producto.precio_venta * item.cantidad).toFixed(2)}
                        </span>
                        <button
                          id={`btn_delete_item_${item.producto.id_producto}`}
                          disabled={simulando}
                          onClick={() => onRemoveFromCart(item.producto.id_producto)}
                          className="text-slate-500 hover:text-red-400 p-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total e Información de Envio */}
                <div className="bg-slate-900/90 rounded-lg p-3 border border-slate-850 text-xs font-mono space-y-1.5">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal Snacks:</span>
                    <span>${getCartTotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Envío Courier:</span>
                    <span className="text-emerald-400 font-semibold font-sans">¡GRATIS! (Promoción de Apertura)</span>
                  </div>
                  <div className="flex justify-between text-white font-bold text-sm pt-1.5 border-t border-slate-800">
                    <span>TOTAL A PAGAR:</span>
                    <span className="text-amber-500">${getCartTotal().toFixed(2)}</span>
                  </div>
                </div>

                {/* Formulario de Pago por Tarjeta */}
                <div className="bg-[#05080f] p-4 rounded-xl border border-slate-850 space-y-3 mt-1.5 text-left font-sans">
                  <span className="text-[10px] font-mono text-amber-500 uppercase font-black tracking-wider block">
                    💳 Datos de Tarjeta para Pago Seguro
                  </span>
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400 font-bold block">NÚMERO DE TARJETA</label>
                    <input
                      type="text"
                      placeholder="4000 1234 5678 9010"
                      value={numeroTarjeta}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').substring(0, 16);
                        const formatted = val.replace(/(\d{4})(?=\d)/g, '$1 ');
                        setNumeroTarjeta(formatted);
                      }}
                      className="w-full bg-[#03050a] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-amber-500 transition font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 font-bold block">EXPIRACIÓN</label>
                      <input
                        type="text"
                        placeholder="MM/AA"
                        maxLength={5}
                        className="w-full bg-[#03050a] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-amber-500 transition font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 font-bold block">CVC</label>
                      <input
                        type="text"
                        placeholder="123"
                        maxLength={3}
                        className="w-full bg-[#03050a] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-amber-500 transition font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* BOTÓN REALIZAR PEDIDO */}
                <button
                  id="btn_submit_cart"
                  onClick={() => {
                    if (!numeroTarjeta || numeroTarjeta.trim().length < 15) {
                      alert("Por favor, ingrese un número de tarjeta válido para realizar el pago.");
                      return;
                    }
                    onCheckout(numeroTarjeta);
                  }}
                  disabled={simulando || cart.length === 0}
                  className="w-full mt-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition duration-200 shadow-md active:scale-[0.99] disabled:opacity-50"
                >
                  <span>Realizar Pedido Seguro</span>
                  <ArrowRight className="h-4 w-4 text-slate-900" />
                </button>
                <p className="text-[10px] text-slate-500 text-center font-mono mt-1">
                  * Sus datos están cifrados de forma atómica y segura mediante SSL de 256 bits.
                </p>
              </div>
            )}
          </div>
        </>
      ) : activeTab === 'nosotros' ? (
        /* VISTA: QUIÉNES SOMOS & UBICACIÓN */
        <div className="bg-[#0b0f19]/80 p-5 rounded-2xl border border-slate-800 text-left space-y-6" id="store_nosotros_ubicacion">
          {/* Header */}
          <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
            <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20 text-amber-500">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Distribuidora SnackFest • Atómica
              </h3>
              <p className="text-[11px] text-slate-500">Quiénes Somos y Nuestro Local Físico en Quito</p>
            </div>
          </div>

          {/* Quiénes Somos */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-amber-500 uppercase tracking-widest font-mono flex items-center gap-2">
              <span>👥 Quiénes Somos</span>
            </h4>
            <div className="text-xs text-slate-300 leading-relaxed font-sans space-y-2">
              <p>
                Somos <strong className="text-slate-100 font-bold">Distribuidora de Snacks Atómica (SnackFest)</strong>, el centro líder de provisión de snacks y bocaditos más delicioso y preferido desde 1998. Nos dedicamos a la importación, elaboración artesanal y distribución comercial de snacks crujientes de la más alta calidad para fiestas, eventos comerciales, tiendas locales y consumidores directos.
              </p>
              <p>
                Nuestra misión es simple y poderosa: <strong className="text-amber-400 font-semibold">garantizar el mejor crujido y frescura</strong>, seleccionando meticulosamente nuestras materias primas de productores agrícolas locales y procesándolas bajo rigurosos controles de inocuidad y empaque. Todo respaldado por una plataforma virtual transaccional segura que te permite ordenar tus snacks en tiempo real.
              </p>
            </div>
          </div>

          {/* Dónde Estamos Ubicados */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <h4 className="text-xs font-bold text-amber-500 uppercase tracking-widest font-mono flex items-center gap-2">
              <MapPin className="h-4 w-4 text-amber-400" />
              <span>📍 Nuestra Ubicación Física (Local Principal)</span>
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3 bg-slate-900/50 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
                <div className="space-y-2 text-xs text-slate-300 leading-relaxed font-sans">
                  <div>
                    <span className="text-[10px] text-slate-500 font-mono uppercase block">Localización Central:</span>
                    <strong className="text-slate-200 block text-xs mt-0.5">Av. Amazonas N24-210 y Av. Cristóbal Colón</strong>
                    <p className="text-[11px] text-slate-400 mt-0.5">Sector La Mariscal, planta baja del Edificio Amazonas Plaza (Frente al Ministerio de Relaciones Exteriores), Quito, Ecuador.</p>
                  </div>
                  
                  <div>
                    <span className="text-[10px] text-slate-500 font-mono uppercase block">Horarios de Atención Física:</span>
                    <p className="text-slate-200 font-medium">📅 Lunes a Sábado: <span className="text-amber-400 font-bold">08:30 AM — 09:00 PM</span></p>
                    <p className="text-slate-200 font-medium">📅 Domingos y Feriados: <span className="text-amber-400 font-bold">09:30 AM — 06:00 PM</span></p>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 font-mono uppercase block">Canales Directos de Atención:</span>
                    <p className="text-slate-400">📞 Central Telefónica: <strong className="text-slate-300">+593 (2) 255-0810</strong></p>
                    <p className="text-slate-400">📱 WhatsApp Principal: <strong className="text-slate-300">+593 99 172 9808</strong></p>
                  </div>
                </div>

                <a
                  href="https://maps.google.com/?q=Amazonas+y+Colon+Quito+Ecuador"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 w-full bg-slate-800 hover:bg-slate-700 text-slate-200 py-2 rounded-xl text-xs font-bold font-sans transition flex items-center justify-center gap-1.5 border border-slate-700"
                >
                  <MapPin className="h-3.5 w-3.5 text-amber-500" />
                  <span>Ver en Google Maps</span>
                </a>
              </div>

              {/* Croquis Visual del Local del Diseñador */}
              <div className="bg-[#05080e] rounded-xl border border-slate-800/80 p-4 flex flex-col justify-between text-left relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl"></div>
                
                <div className="space-y-2">
                  <span className="text-[9px] font-mono text-amber-500 uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                    🗺️ Croquis Automático de Vías
                  </span>
                  
                  {/* Grid o maqueta visual que representa las intersecciones de calles */}
                  <div className="h-28 bg-[#020408] rounded-lg border border-slate-800 relative p-2 overflow-hidden flex flex-col justify-between font-mono text-[9px] select-none">
                    {/* Líneas de Calles */}
                    <div className="absolute top-1/2 left-0 right-0 h-4 bg-slate-900 border-y border-slate-800/35 -translate-y-1/2 flex items-center pl-6 text-slate-600 tracking-wider">
                      AV. COLÓN
                    </div>
                    <div className="absolute top-0 bottom-0 left-1/3 w-4 bg-slate-900 border-x border-slate-800/35 flex items-center justify-center text-slate-600 uppercase" style={{ writingMode: 'vertical-lr' }}>
                      AV. AMAZONAS
                    </div>
                    
                    {/* Indicador del Local de SnackFest */}
                    <div className="absolute top-[28%] left-[40%] bg-amber-500/20 text-amber-400 border border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.2)] rounded px-1.5 py-1 z-10 flex items-center gap-1 animate-bounce">
                      <span>🍿</span>
                      <span className="font-extrabold text-[8px]">LOCAL SNACKFEST</span>
                    </div>

                    <div className="absolute bottom-1 right-2 text-slate-600 text-[8px]">
                      Plaza Foch ~ 200m
                    </div>
                    <div className="absolute top-1 left-2 text-slate-600 text-[8px]">
                      Min. Relaciones Ext.
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 leading-relaxed font-sans mt-3">
                  <span className="text-slate-400 font-bold block">🚗 Parqueadero de Cortesía</span>
                  Puedes ingresar al estacionamiento subterráneo por la rampa directa de la calle Amazonas. La primera hora es gratis para clientes de la distribuidora.
                </div>
              </div>
            </div>
          </div>
          
          <button
            id="btn_back_to_shop_now"
            onClick={() => setActiveTab('catalogo')}
            className="w-full mt-2 bg-amber-500 hover:bg-amber-600 text-slate-950 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
          >
            <span>Ir al Catálogo para Realizar un Pedido</span>
            <ArrowRight className="h-3.5 w-3.5 text-slate-950" />
          </button>
        </div>
      ) : (
        /* VISTA: RESEÑA HISTÓRICA DEL PUNTO DE VENTA */
        <div className="bg-[#0b0f19]/80 p-5 rounded-2xl border border-slate-800 text-left space-y-4" id="store_historical_review">
          <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
            <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20 text-amber-500">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Punto de Venta SnackFest Original
              </h3>
              <p className="text-[11px] text-slate-500">Nuestra Trayectoria y Pasión desde 1998</p>
            </div>
          </div>

          <div className="space-y-4 text-xs text-slate-300 leading-relaxed font-sans">
            <p>
              La historia de <strong className="text-amber-400">SnackFest</strong> no empezó en grandes estanterías o sistemas en la nube. Comenzó con un pequeño punto tradicional de madera en la esquina de la plaza de comidas local en <strong className="text-white">1998</strong>.
            </p>
            
            <div className="grid grid-cols-3 gap-3 my-2 text-center">
              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                <span className="text-base font-extrabold text-amber-500 font-mono block">28+</span>
                <span className="text-[9px] text-slate-500 font-medium font-sans">Años Crujiendo</span>
              </div>
              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                <span className="text-base font-extrabold text-emerald-400 font-mono block">100%</span>
                <span className="text-[9px] text-slate-500 font-medium font-sans">Handcrafted</span>
              </div>
              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                <span className="text-base font-extrabold text-amber-500 font-mono block">4.9★</span>
                <span className="text-[9px] text-slate-500 font-medium font-sans">Calificación</span>
              </div>
            </div>

            <p>
              El fundador, don Roberto, seleccionaba minuciosamente las papas locales, los granos de maíz premium y los plátanos frescos. Los freía artesanalmente en ollas de hierro fundido a la temperatura exacta para asegurar ese <strong className="text-amber-400">crujido inconfundible</strong> que los comensales buscaban incansablemente todos los fines de semana.
            </p>

            <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-lg text-[11px] text-slate-400 space-y-1">
              <span className="text-amber-400 font-bold block">★ Calidad Orgánica Certificada</span>
              <p>Ninguno de nuestros snacks de papas, maíz o nachos lleva conservantes artificiales. Sazonados con sal marina, especias naturales, y un toque familiar inigualable.</p>
            </div>

            <p>
              Hoy en día, adaptamos ese mismo compromiso al mundo digital. Cuando seleccionas tus productos, nuestra base de datos con <strong className="text-teal-400">motor InnoDB transaccional</strong> garantiza que tus snacks queden apartados de forma atómica para que siempre tengas el stock correcto reservado.
            </p>
            
            <button
              id="btn_back_to_shop"
              onClick={() => setActiveTab('catalogo')}
              className="w-full mt-3 bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-200 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <span>Ver Catálogo de Snacks</span>
              <ArrowRight className="h-3.5 w-3.5 text-amber-500" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
