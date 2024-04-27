const express = require('express');
const path = require('path');
const logger = require('morgan');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const donorRoutes = require('./routes/donor');
const adminRoutes = require('./routes/admin');
const productRoutes = require('./routes/product');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const associationRoutes = require('./routes/association');

const app = express();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors());

app.use('/api/donor', donorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/product', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/association', associationRoutes);

app.use(express.static(path.join(__dirname, 'public')));

module.exports = app;
