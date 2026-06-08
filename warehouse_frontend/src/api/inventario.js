import client from './client'

// Categorías
export const getCategorias = (params) => client.get('/inventario/categorias', { params })
export const createCategoria = (data) => client.post('/inventario/categorias', data)
export const updateCategoria = (id, data) => client.put(`/inventario/categorias/${id}`, data)
export const deleteCategoria = (id) => client.delete(`/inventario/categorias/${id}`)

// Ubicaciones
export const getUbicaciones = (params) => client.get('/inventario/ubicaciones', { params })
export const createUbicacion = (data) => client.post('/inventario/ubicaciones', data)
export const updateUbicacion = (id, data) => client.put(`/inventario/ubicaciones/${id}`, data)
export const deleteUbicacion = (id) => client.delete(`/inventario/ubicaciones/${id}`)

// Productos
export const getProductos = (params) => client.get('/inventario/productos', { params })
export const buscarProductos = (q) => client.get('/inventario/productos/buscar', { params: { q } })
export const getProducto = (id) => client.get(`/inventario/productos/${id}`)
export const createProducto = (data) => client.post('/inventario/productos', data)
export const updateProducto = (id, data) => client.put(`/inventario/productos/${id}`, data)
export const deleteProducto = (id) => client.delete(`/inventario/productos/${id}`)
export const getLotesProducto = (id, params) => client.get(`/inventario/productos/${id}/lotes`, { params })

// Lotes
export const getLotes = (params) => client.get('/inventario/lotes', { params })

// Movimientos
export const getMovimientos = (params) => client.get('/inventario/movimientos/', { params })
export const registrarEntrada = (data) => client.post('/inventario/movimientos/entrada', data)
export const registrarSalida = (data) => client.post('/inventario/movimientos/salida', data)
export const registrarTraslado = (data) => client.post('/inventario/movimientos/traslado', data)
export const getTimeline = (productoId) => client.get(`/inventario/movimientos/timeline/${productoId}`)

// Alertas inventario
export const getAlertas = () => client.get('/inventario/dashboard/alertas')
