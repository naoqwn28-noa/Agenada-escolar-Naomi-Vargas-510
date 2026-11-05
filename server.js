const express = require('express');
const mysql = require('mysql2');
require('dotenv').config();

const app = express();

// Configuración de EJS y archivos estáticos
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

// Conexión a la base de datos MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'gestor_tareas_db'
});

db.connect((err) => {
    if (err) {
        console.error('Error al conectar a MySQL:', err);
        return;
    }
    console.log('✅ Conectado exitosamente a la base de datos MySQL');
});

// 1. Ruta de Login
app.get('/', (req, res) => {
    res.render('login');
});

app.post('/login', (req, res) => {
    const { nombre, correo } = req.body;
    if (!nombre || !correo) return res.status(400).send("Faltan campos");

    const query = 'INSERT INTO alumnos (nombre, correo) VALUES (?, ?)';
    db.execute(query, [nombre, correo], (err) => {
        res.redirect(`/dashboard?nombre=${encodeURIComponent(nombre)}`);
    });
});

// 2. Ruta del Dashboard principal
app.get('/dashboard', (req, res) => {
    const nombreAlumno = req.query.nombre || "Estudiante";
    res.render('index', { alumno: nombreAlumno });
});

// 3. Ruta de la Ventana de Pendientes con Filtro
app.get('/pendientes', (req, res) => {
    const nombreAlumno = req.query.nombre || "Estudiante";
    const materiaFiltro = req.query.materia || "";
    
    let query = 'SELECT * FROM tareas';
    let queryParams = [];

    if (materiaFiltro) {
        query += ' WHERE materia = ?';
        queryParams.push(materiaFiltro);
    }

    query += ' ORDER BY fecha_entrega ASC';
    
    db.query(query, queryParams, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Error al obtener las tareas");
        }
        res.render('pendientes', { 
            tareas: results, 
            alumno: nombreAlumno, 
            materiaSeleccionada: materiaFiltro 
        });
    });
});

// 4. Ruta para Agregar Tarea
app.post('/agregar-tarea', (req, res) => {
    const { titulo, descripcion, materia, fecha_entrega } = req.body;
    const nombreAlumno = req.query.nombre || "";
    
    const query = 'INSERT INTO tareas (titulo, descripcion, materia, fecha_entrega) VALUES (?, ?, ?, ?)';
    db.execute(query, [titulo, descripcion, materia, fecha_entrega], (err) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Error al guardar la tarea");
        }
        res.redirect(`/dashboard?nombre=${encodeURIComponent(nombreAlumno)}`);
    });
});

// 5. Ruta para Eliminar Tarea (Palomita / Tache)
app.post('/eliminar-tarea/:id', (req, res) => {
    const tareaId = req.params.id;
    const nombreAlumno = req.query.nombre || "";
    
    const query = 'DELETE FROM tareas WHERE id = ?';
    db.execute(query, [tareaId], (err) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Error al eliminar la tarea");
        }
        res.redirect(`/pendientes?nombre=${encodeURIComponent(nombreAlumno)}`);
    });
});

// Escuchar en el puerto 3005
const PORT = 3005;
app.listen(PORT, () => {
    console.log(`🚀 Servidor activo en http://localhost:${PORT}`);
});