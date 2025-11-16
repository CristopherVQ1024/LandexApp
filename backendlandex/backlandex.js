require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { Pool } = require('pg');
const fs = require('fs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de PostgreSQL
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'landing_db',
  user: 'postgres',
  password: '1234',
});

// Crear carpeta uploads si no existe
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuración de multer para subida de archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now();
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}_${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido'));
    }
  }
});

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos de la carpeta uploads
app.use('/uploads', express.static(uploadsDir));

// ==================== RUTAS ====================

// Ruta de login/registro con Google
app.post('/api/auth/google', async (req, res) => {
  try {
    const { google_id, name, email, picture } = req.body;

    // Validar datos requeridos
    if (!google_id || !email) {
      return res.status(400).json({
        error: 'Faltan datos requeridos (google_id, email)'
      });
    }

    // Verificar si el usuario ya existe
    const checkQuery = 'SELECT * FROM admins WHERE google_id = $1 OR email = $2';
    const checkResult = await pool.query(checkQuery, [google_id, email]);

    let user;

    if (checkResult.rows.length > 0) {
      // Usuario existe - Actualizar información
      user = checkResult.rows[0];

      const updateQuery = `
        UPDATE admins 
        SET name = $1, picture = $2, updated_at = CURRENT_TIMESTAMP 
        WHERE id = $3 
        RETURNING *
      `;
      const updateResult = await pool.query(updateQuery, [name, picture, user.id]);
      user = updateResult.rows[0];

      console.log('✅ Usuario actualizado:', user.email);
    } else {
      // Usuario nuevo - Registrar
      const insertQuery = `
        INSERT INTO admins (google_id, name, email, picture, role, status) 
        VALUES ($1, $2, $3, $4, 'admin', '1') 
        RETURNING *
      `;
      const insertResult = await pool.query(insertQuery, [google_id, name, email, picture]);
      user = insertResult.rows[0];

      console.log('✅ Nuevo usuario registrado:', user.email);
    }

    // Generar JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Responder con datos del usuario y token
    res.json({
      success: true,
      message: checkResult.rows.length > 0 ? 'Login exitoso' : 'Registro exitoso',
      user: {
        id: user.id,
        google_id: user.google_id,
        name: user.name,
        email: user.email,
        picture: user.picture,
        role: user.role,
        status: user.status
      },
      token
    });

  } catch (error) {
    console.error('❌ Error en /api/auth/google:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      details: error.message
    });
  }
});

// Ruta para verificar token (middleware de autenticación)
app.get('/api/auth/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Buscar usuario en la base de datos
    const query = 'SELECT id, google_id, name, email, picture, role, status FROM admins WHERE id = $1';
    const result = await pool.query(query, [decoded.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = result.rows[0];

    // Verificar si el usuario está activo
    if (user.status !== '1') {
      return res.status(403).json({ error: 'Usuario inactivo' });
    }

    res.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('❌ Error verificando token:', error);
    res.status(401).json({
      error: 'Token inválido',
      details: error.message
    });
  }
});

// Ruta para obtener perfil del usuario
app.get('/api/user/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const query = 'SELECT id, google_id, name, email, picture, role, status, created_at FROM admins WHERE id = $1';
    const result = await pool.query(query, [decoded.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({
      success: true,
      user: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Error obteniendo perfil:', error);
    res.status(401).json({ error: 'Token inválido' });
  }
});


// ============= RUTAS DE LANDINGS =============

// Obtener todas las landings
app.get('/api/landings', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nombre_empresa, title, is_active, created_at, updated_at FROM landings ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener landings:', error);
    res.status(500).json({ error: 'Error al obtener landings' });
  }
});

// Obtener una landing por ID
app.get('/api/landings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM landings WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Landing no encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener landing:', error);
    res.status(500).json({ error: 'Error al obtener landing' });
  }
});

// Crear nueva landing
app.post('/api/landings', async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const {
      nombre_empresa, correo_contacto, telefono_contacto, title, main_color,
      logo_url, favicon_url, banner_url, is_active,
      // INICIO
      show_inicio, inicio_title, inicio_subtitle, inicio_description, inicio_background_url,
      // DESCRIPCIÓN
      show_descripcion, descripcion_title, descripcion_text, descripcion_image_url,
      // CARACTERÍSTICAS
      show_caracteristicas, caracteristicas_title, caracteristicas_text, caracteristicas_list,
      // HORARIOS
      show_horarios, horarios_title, horarios_json,
      // TESTIMONIOS
      show_testimonios, testimonios_title, testimonios_json,
      // PAGOS
      show_pagos, pagos_title, pagos_descripcion, pagos_metodos,
      // PRODUCTOS
      show_productos, productos_title, productos_descripcion, productos_json,
      // GALERÍA
      show_galeria, galeria_title, galeria_imagenes,
      // CONTACTO
      show_contacto, contacto_title, contacto_descripcion, contacto_telefono,
      contacto_email, contacto_direccion, contacto_whatsapp,
      // MAPA
      show_mapa, mapa_title, mapa_lat, mapa_lng,
      // EXTRAS
      fuente_principal, fondo_color, fondo_imagen_url, seo_keywords, seo_description
    } = req.body;

    const query = `
      INSERT INTO landings (
        nombre_empresa, correo_contacto, telefono_contacto, title, main_color,
        logo_url, favicon_url, banner_url, is_active,
        show_inicio, inicio_title, inicio_subtitle, inicio_description, inicio_background_url,
        show_descripcion, descripcion_title, descripcion_text, descripcion_image_url,
        show_caracteristicas, caracteristicas_title, caracteristicas_text, caracteristicas_list,
        show_horarios, horarios_title, horarios_json,
        show_testimonios, testimonios_title, testimonios_json,
        show_pagos, pagos_title, pagos_descripcion, pagos_metodos,
        show_productos, productos_title, productos_descripcion, productos_json,
        show_galeria, galeria_title, galeria_imagenes,
        show_contacto, contacto_title, contacto_descripcion, contacto_telefono,
        contacto_email, contacto_direccion, contacto_whatsapp,
        show_mapa, mapa_title, mapa_lat, mapa_lng,
        fuente_principal, fondo_color, fondo_imagen_url, seo_keywords, seo_description
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
        $31, $32, $33, $34, $35, $36, $37, $38, $39, $40,
        $41, $42, $43, $44, $45, $46, $47, $48, $49, $50,
        $51, $52, $53, $54, $55  -- Agregados los 3 faltantes
      ) RETURNING *`;


    const values = [
      nombre_empresa, // 1
      correo_contacto, // 2
      telefono_contacto, // 3
      title, // 4
      main_color || '#21365E', // 5
      logo_url, // 6
      favicon_url, // 7
      banner_url, // 8
      is_active !== undefined ? is_active : true, // 9
      show_inicio !== undefined ? show_inicio : true, // 10
      inicio_title, // 11
      inicio_subtitle, // 12
      inicio_description, // 13
      inicio_background_url, // 14
      show_descripcion !== undefined ? show_descripcion : true, // 15
      descripcion_title, // 16
      descripcion_text, // 17
      descripcion_image_url, // 18
      show_caracteristicas !== undefined ? show_caracteristicas : true, // 19
      caracteristicas_title, // 20
      caracteristicas_text, // 21
      JSON.stringify(caracteristicas_list || []), // 22
      show_horarios !== undefined ? show_horarios : true, // 23
      horarios_title, // 24
      JSON.stringify(horarios_json || []), // 25
      show_testimonios !== undefined ? show_testimonios : true, // 26
      testimonios_title, // 27
      JSON.stringify(testimonios_json || []), // 28
      show_pagos !== undefined ? show_pagos : false, // 29
      pagos_title, // 30
      pagos_descripcion, // 31
      JSON.stringify(pagos_metodos || []), // 32
      show_productos !== undefined ? show_productos : true, // 33
      productos_title, // 34
      productos_descripcion, // 35
      JSON.stringify(productos_json || []), // 36
      show_galeria !== undefined ? show_galeria : true, // 37
      galeria_title, // 38
      JSON.stringify(galeria_imagenes || []), // 39
      show_contacto !== undefined ? show_contacto : true, // 40
      contacto_title, // 41
      contacto_descripcion, // 42
      contacto_telefono, // 43
      contacto_email, // 44
      contacto_direccion, // 45
      contacto_whatsapp, // 46
      show_mapa !== undefined ? show_mapa : true, // 47
      mapa_title, // 48
      mapa_lat, // 49
      mapa_lng, // 50
      fuente_principal || 'Poppins', // 51
      fondo_color, // 52
      fondo_imagen_url, // 53
      seo_keywords, // 54
      seo_description // 55
    ];

    // Verifica que el array 'values' tenga exactamente 52 elementos
    console.log('Número de valores:', values.length);

    const result = await client.query(query, values);

    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al crear landing:', error);
    res.status(500).json({ error: 'Error al crear landing', details: error.message });
  } finally {
    client.release();
  }
});

// Actualizar landing
app.put('/api/landings/:id', async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const {
      nombre_empresa, correo_contacto, telefono_contacto, title, main_color,
      logo_url, favicon_url, banner_url, is_active,
      show_inicio, inicio_title, inicio_subtitle, inicio_description, inicio_background_url,
      show_descripcion, descripcion_title, descripcion_text, descripcion_image_url,
      show_caracteristicas, caracteristicas_title, caracteristicas_text, caracteristicas_list,
      show_horarios, horarios_title, horarios_json,
      show_testimonios, testimonios_title, testimonios_json,
      show_pagos, pagos_title, pagos_descripcion, pagos_metodos,
      show_productos, productos_title, productos_descripcion, productos_json,
      show_galeria, galeria_title, galeria_imagenes,
      show_contacto, contacto_title, contacto_descripcion, contacto_telefono,
      contacto_email, contacto_direccion, contacto_whatsapp,
      show_mapa, mapa_title, mapa_lat, mapa_lng,
      fuente_principal, fondo_color, fondo_imagen_url, seo_keywords, seo_description
    } = req.body;

    const query = `
      UPDATE landings SET
        nombre_empresa = $1, correo_contacto = $2, telefono_contacto = $3, 
        title = $4, main_color = $5, logo_url = $6, favicon_url = $7, 
        banner_url = $8, is_active = $9,
        show_inicio = $10, inicio_title = $11, inicio_subtitle = $12, 
        inicio_description = $13, inicio_background_url = $14,
        show_descripcion = $15, descripcion_title = $16, descripcion_text = $17, 
        descripcion_image_url = $18,
        show_caracteristicas = $19, caracteristicas_title = $20, 
        caracteristicas_text = $21, caracteristicas_list = $22,
        show_horarios = $23, horarios_title = $24, horarios_json = $25,
        show_testimonios = $26, testimonios_title = $27, testimonios_json = $28,
        show_pagos = $29, pagos_title = $30, pagos_descripcion = $31, 
        pagos_metodos = $32,
        show_productos = $33, productos_title = $34, productos_descripcion = $35, 
        productos_json = $36,
        show_galeria = $37, galeria_title = $38, galeria_imagenes = $39,
        show_contacto = $40, contacto_title = $41, contacto_descripcion = $42, 
        contacto_telefono = $43, contacto_email = $44, contacto_direccion = $45, 
        contacto_whatsapp = $46,
        show_mapa = $47, mapa_title = $48, mapa_lat = $49, mapa_lng = $50,
        fuente_principal = $51, fondo_color = $52, fondo_imagen_url = $53, 
        seo_keywords = $54, seo_description = $55,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $56
      RETURNING *
    `;

    const values = [
      nombre_empresa, correo_contacto, telefono_contacto, title, main_color,
      logo_url, favicon_url, banner_url, is_active,
      show_inicio, inicio_title, inicio_subtitle, inicio_description, inicio_background_url,
      show_descripcion, descripcion_title, descripcion_text, descripcion_image_url,
      show_caracteristicas, caracteristicas_title, caracteristicas_text,
      JSON.stringify(caracteristicas_list || []),
      show_horarios, horarios_title, JSON.stringify(horarios_json || []),
      show_testimonios, testimonios_title, JSON.stringify(testimonios_json || []),
      show_pagos, pagos_title, pagos_descripcion, JSON.stringify(pagos_metodos || []),
      show_productos, productos_title, productos_descripcion, JSON.stringify(productos_json || []),
      show_galeria, galeria_title, JSON.stringify(galeria_imagenes || []),
      show_contacto, contacto_title, contacto_descripcion, contacto_telefono,
      contacto_email, contacto_direccion, contacto_whatsapp,
      show_mapa, mapa_title, mapa_lat, mapa_lng,
      fuente_principal, fondo_color, fondo_imagen_url, seo_keywords, seo_description,
      id
    ];

    const result = await client.query(query, values);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Landing no encontrada' });
    }

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al actualizar landing:', error);
    res.status(500).json({ error: 'Error al actualizar landing', details: error.message });
  } finally {
    client.release();
  }
});

// Eliminar landing
app.delete('/api/landings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM landings WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Landing no encontrada' });
    }

    res.json({ message: 'Landing eliminada correctamente', landing: result.rows[0] });
  } catch (error) {
    console.error('Error al eliminar landing:', error);
    res.status(500).json({ error: 'Error al eliminar landing' });
  }
});

// Cambiar estado de landing (activar/desactivar)
app.patch('/api/landings/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    const result = await pool.query(
      'UPDATE landings SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Landing no encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al cambiar estado:', error);
    res.status(500).json({ error: 'Error al cambiar estado' });
  }
});

// ============= RUTA DE UPLOAD =============

app.post('/api/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se subió ningún archivo' });
    }

    const fileUrl = `http://localhost:${PORT}/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
  } catch (error) {
    console.error('Error al subir archivo:', error);
    res.status(500).json({ error: 'Error al subir archivo' });
  }
});

// Manejo de errores de multer
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'El archivo es demasiado grande (máx 10MB)' });
    }
  }

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  next();
});

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: 'API de Landing Manager funcionando correctamente' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📁 Carpeta de uploads: ${uploadsDir}`);
});

// Manejo de errores de conexión a la base de datos
pool.on('error', (err) => {
  console.error('Error inesperado en el pool de PostgreSQL:', err);
  process.exit(-1);
});