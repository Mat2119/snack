import { Producto } from './types';

export const PRODUCTOS_INICIALES: Producto[] = [
  {
    id_producto: 1,
    nombre_producto: 'Papas Fritas Onduladas Clasicas',
    precio_venta: 0.50,
    stock_actual: 50,
    categoria: 'Papas Fritas',
    imagen: '🍟'
  },
  {
    id_producto: 2,
    nombre_producto: 'Doritos Queso Atrevido Mega 150g',
    precio_venta: 1.20,
    stock_actual: 35,
    categoria: 'Tortillas de Maíz',
    imagen: '🔺'
  },
  {
    id_producto: 3,
    nombre_producto: 'Chifles Platanitos Salados Crujientes',
    precio_venta: 0.75,
    stock_actual: 20,
    categoria: 'Plátano',
    imagen: '🍌'
  },
  {
    id_producto: 4,
    nombre_producto: 'Cheetos Horneados Flamin Hot',
    precio_venta: 0.90,
    stock_actual: 40,
    categoria: 'Churritos',
    imagen: '🔥'
  },
  {
    id_producto: 5,
    nombre_producto: 'Maní Con Sal Tostado Premium',
    precio_venta: 0.60,
    stock_actual: 15,
    categoria: 'Frutos Secos',
    imagen: '🥜'
  },
  {
    id_producto: 6,
    nombre_producto: 'Gomitas de Oso Frutales Ácidas',
    precio_venta: 0.80,
    stock_actual: 5, // Stock bajo para probar rollback fácilmente!
    categoria: 'Dulces',
    imagen: '🧸'
  }
];

export const SQL_SCHEMA = `-- =========================================================
-- SCRIPT DE INICIALIZACIÓN DE LA BASE DE DATOS
-- Base de datos: \`inventariosnacks\`
-- phpMyAdmin / MariaDB / MySQL Estándar
-- =========================================================

-- Crear base de datos si no existe
CREATE DATABASE IF NOT EXISTS \`inventariosnacks\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE \`inventariosnacks\`;

-- ---------------------------------------------------------
-- 1. Tabla: \`productos\`
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`productos\` (
  \`id_producto\` INT AUTO_INCREMENT PRIMARY KEY,
  \`nombre_producto\` VARCHAR(150) NOT NULL,
  \`precio_venta\` DECIMAL(10, 2) NOT NULL,
  \`stock_actual\` INT NOT NULL DEFAULT 0,
  CONSTRAINT \`chk_stock\` CHECK (\`stock_actual\` >= 0)
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- 2. Tabla: \`ventas\`
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`ventas\` (
  \`id_venta\` INT AUTO_INCREMENT PRIMARY KEY,
  \`fecha_venta\` DATETIME NOT NULL,
  \`total_venta\` DECIMAL(10, 2) NOT NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- 3. Tabla: \`detalle_venta\`
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`detalle_venta\` (
  \`id_detalle\` INT AUTO_INCREMENT PRIMARY KEY,
  \`id_venta\` INT NOT NULL,
  \`id_producto\` INT NOT NULL,
  \`cantidad\` INT NOT NULL,
  \`precio_unitario\` DECIMAL(10, 2) NOT NULL,
  \`subtotal\` DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (\`id_venta\`) REFERENCES \`ventas\`(\`id_venta\`) ON DELETE CASCADE,
  FOREIGN KEY (\`id_producto\`) REFERENCES \`productos\`(\`id_producto\`)
) ENGINE=InnoDB;

-- =========================================================
-- INSERTAR PRODUCTOS SEMILLA DE PRUEBA
-- =========================================================
INSERT INTO \`productos\` (\`id_producto\`, \`nombre_producto\`, \`precio_venta\`, \`stock_actual\`) VALUES
(1, 'Papas Fritas Onduladas Clasicas', 0.50, 50),
(2, 'Doritos Queso Atrevido Mega 150g', 1.20, 35),
(3, 'Chifles Platanitos Salados Crujientes', 0.75, 20),
(4, 'Cheetos Flamin Hot Horneados', 0.90, 40),
(5, 'Maní Con Sal Tostado Premium', 0.60, 15),
(6, 'Gomitas de Oso Frutales Ácidas', 0.80, 5);
`;

export const PHP_CODE = `<?php
/**
 * Sistema de Ventas de Snacks - Procesador de Compras
 * 
 * Este script procesa una compra de forma segura utilizando PHP 8 y una base de datos MariaDB/MySQL.
 * Implementa Transacciones PDO para mantener la consistencia e integridad de los datos
 * (ventas, detalle_venta y actualización de stock).
 * 
 * Autor: Ingeniero de Software Backend (PHP & MySQL Expert)
 * Fecha: Junio 2026
 */

// Establecer cabeceras para responder en formato JSON y manejar CORS en caso de ser necesario
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Configuración de la Base de Datos
$db_host    = '127.0.0.1';
$db_name    = 'inventariosnacks';
$db_user    = 'root';
$db_pass    = '';
$db_charset = 'utf8mb4';

// Respuesta inicial
$response = [
    "success" => false,
    "message" => "Ocurrió un error inesperado al procesar la compra.",
    "data" => null
];

try {
    // 1. Establecer conexión mediante PDO con manejo estricto de excepciones
    $dsn = "mysql:host=$db_host;dbname=$db_name;charset=$db_charset";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION, // Lanzar excepciones en errores SQL
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,       // Retornar resultados como arrays asociativos
        PDO::ATTR_EMULATE_PREPARES   => false,                  // Usar preparaciones reales para mayor seguridad
    ];
    
    $pdo = new PDO($dsn, $db_user, $db_pass, $options);

    // Obtener y sanitizar entradas (soporta JSON raw y formularios POST estándar)
    $input_json = file_get_contents("php://input");
    $data_input = json_decode($input_json, true);

    // Priorizar parámetros JSON, si no, usar $_POST, y finalmente valores por defecto para pruebas
    $id_producto_crudo = isset($data_input['id_producto']) ? $data_input['id_producto'] : (isset($_POST['id_producto']) ? $_POST['id_producto'] : 1);
    $cantidad_cruda    = isset($data_input['cantidad']) ? $data_input['cantidad'] : (isset($_POST['cantidad']) ? $_POST['cantidad'] : 1);

    // Sanitización y validación estricta de variables de entrada
    $id_producto = filter_var($id_producto_crudo, FILTER_VALIDATE_INT);
    $cantidad    = filter_var($cantidad_cruda, FILTER_VALIDATE_INT);

    if ($id_producto === false || $id_producto <= 0) {
        throw new Exception("El ID de producto proporcionado no es válido.");
    }
    if ($cantidad === false || $cantidad <= 0) {
        throw new Exception("La cantidad debe ser un entero positivo mayor a cero.");
    }

    // 2. Iniciar Transacción SQL para asegurar consistencia atómica
    $pdo->beginTransaction();

    // 3. Consultar y verificar la existencia del producto y su precio/stock actual
    // Seleccionamos con "FOR UPDATE" para bloquear la fila contra lecturas sucias y concurrencia (evitar sobreventa)
    $sql_check = "SELECT nombre_producto, precio_venta, stock_actual FROM productos WHERE id_producto = :id_producto FOR UPDATE";
    $stmt_check = $pdo->prepare($sql_check);
    $stmt_check->execute([':id_producto' => $id_producto]);
    $producto = $stmt_check->fetch();

    if (!$producto) {
        throw new Exception("El producto seleccionado con ID {$id_producto} no existe en el inventario.");
    }

    $precio_unitario = (float) $producto['precio_venta'];
    $stock_actual    = (int) $producto['stock_actual'];
    $nombre_producto = $producto['nombre_producto'];

    // Verificar si hay stock suficiente
    if ($stock_actual < $cantidad) {
        throw new Exception("Stock insuficiente para '{$nombre_producto}'. Disponible: {$stock_actual}, Solicitado: {$cantidad}.");
    }

    // Calcular el total de la venta de forma automática y precisa en el servidor
    $subtotal = $precio_unitario * $cantidad;
    $total_venta = $subtotal; // En este caso simple con 1 solo producto, el total es igual al subtotal

    // 4. Insertar la cabecera de la venta en la tabla \`ventas\`
    $fecha_actual = date("Y-m-d H:i:s");
    $sql_venta = "INSERT INTO ventas (fecha_venta, total_venta) VALUES (:fecha_venta, :total_venta)";
    $stmt_venta = $pdo->prepare($sql_venta);
    $stmt_venta->execute([
        ':fecha_venta' => $fecha_actual,
        ':total_venta' => $total_venta
    ]);

    // Recupere el ID de venta generado automáticamente
    $id_venta = $pdo->lastInsertId();

    if (!$id_venta) {
        throw new Exception("No se pudo obtener el ID de la venta generada.");
    }

    // 5. Insertar el registro correspondiente en \`detalle_venta\`
    $sql_detalle = "INSERT INTO detalle_venta (id_venta, id_producto, cantidad, precio_unitario, subtotal) 
                    VALUES (:id_venta, :id_producto, :cantidad, :precio_unitario, :subtotal)";
    $stmt_detalle = $pdo->prepare($sql_detalle);
    $stmt_detalle->execute([
        ':id_venta'        => $id_venta,
        ':id_producto'     => $id_producto,
        ':cantidad'        => $cantidad,
        ':precio_unitario' => $precio_unitario,
        ':subtotal'        => $subtotal
    ]);

    // 6. Ejecutar UPDATE en la tabla \`productos\` reduciendo el \`stock_actual\`
    $nuevo_stock = $stock_actual - $cantidad;
    $sql_update_stock = "UPDATE productos SET stock_actual = :nuevo_stock WHERE id_producto = :id_producto";
    $stmt_update_stock = $pdo->prepare($sql_update_stock);
    $stmt_update_stock->execute([
        ':nuevo_stock' => $nuevo_stock,
        ':id_producto' => $id_producto
    ]);

    // Confirmar (Commit) la transacción de forma permanente si todo salió de forma exitosa
    $pdo->commit();

    // Responder con éxito y retornar los datos procesados
    $response["success"] = true;
    $response["message"] = "¡Compra procesada con éxito! Su pedido de '{$nombre_producto}' ha sido registrado.";
    $response["data"] = [
        "id_venta"     => (int) $id_venta,
        "id_producto"  => $id_producto,
        "producto"     => $nombre_producto,
        "cantidad"     => $cantidad,
        "precio_unit"  => $precio_unitario,
        "total"        => $total_venta,
        "stock_previo" => $stock_actual,
        "stock_nuevo"  => $nuevo_stock,
        "fecha"        => $fecha_actual
    ];

} catch (PDOException $e) {
    // Si la transacción está activa, revertir todos los cambios realizados
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    
    // Registrar error del driver de Base de Datos para seguridad
    error_log("Error de BD PHP PDO: " . $e->getMessage());
    
    $response["success"] = false;
    $response["message"] = "Error de base de datos al realizar la transacción: " . $e->getMessage();

} catch (Exception $e) {
    // Si la transacción está activa, revertir todos los cambios realizados
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    
    // Registrar error general para auditoría interna
    error_log("Error General PHP: " . $e->getMessage());
    
    $response["success"] = false;
    $response["message"] = "No se pudo procesar la compra: " . $e->getMessage();
}

// Retornar la respuesta JSON limpia al cliente
echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>`;
