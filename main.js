const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();



const app = express();

// 3. Setup middleware (these are like plugins)
app.use(cors());              // Allows frontend to connect
app.use(express.json());      // Allows server to read JSON data


// 4. Connect to PostgreSQL
const pool = new Pool({
    user: 'postgres',
    password: 'root123',
    host: 'localhost',
    port: 5432,
    database: 'blog_db'
});

// 5. Test database connection
pool.connect((err) => {
    if(err) {
        console.log("error my friend")
    }else  {
        console.log("connected to the postgreSQL my firend")
    }
});

// create your first test route 
app.get('/', (req,res) => {
    res.send('API works');
});


// Signup
app.post('/signup', async (req, res) => {
    const {name, email, password} = req.body;

    const hashedPassword = await bcrypt.hash(password,10);

    try {
        await pool.query(
            'INSERT INTO users (name, email, password_hash) VALUES ( $1, $2 , $3)', [name,email,hashedPassword]
        );
        res.json({message: 'user created'})
    } catch(err) {
        res.json({ error: 'email already exits'});
    }

});


// login

app.post('/login', async (req, res) => {
    const {name, email, password} = req.body;

    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (user.rows.length === 0) {
        return res.json({ error: 'user not founf boy'});
    }

    const valid = await bcrypt.compare(password,user.rows[0].password_hash);

    if (!valid) {
        return res.json({ error: 'worng password'});
    }

    const token = jwt.sign({ userId: user.rows[0].id}, 'secret123');
    res.json({ token: token});
});


//get all posts
app.get('/posts', async (req, res) => {
    const posts = await pool.query('SELECT * FROM posts ORDER BY created_at DESC');
    res.json(posts.rows);
});



// super simple create post 
app.post('/posts', async (req,res) => {
    const token = req.headers['token'];
    if (!token) return res.json({ error: 'no token her brother'});

    try {
        const decoded = jwt.verify(token, 'secret123');
        const {title,content } = req.body;

        await pool.query(
            'INSERT INTO posts (user_id, title, content) VALUES ($1,$2,$3)', [decoded.userId,title,content] 
        );
        res.json({ message: 'post created my boy'});
    } catch(err) {
        res.json({ error: 'Invalid token'});
    }
});

// SUPER SIMPLE DELETE POST (no ownership check)
app.delete('/posts/:id', async (req, res) => {
    const token = req.headers['token'];
    if (!token) return res.json({ error: 'No token' });
    
    try {
        jwt.verify(token, 'secret123');
        await pool.query('DELETE FROM posts WHERE id = $1', [req.params.id]);
        res.json({ message: 'Post deleted!' });
    } catch(err) {
        res.json({ error: 'Invalid token' });
    }
});




//start the server 
const PORT = 5000;
app.listen(PORT,() => {
    console.log(`server is running ,y friend...${PORT}`);
});
