require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const path = require('path');
const jwt = require('jsonwebtoken');

// Falha logo na inicialização se o segredo for fraco/ausente
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('ERRO: defina JWT_SECRET (mín. 32 caracteres) no arquivo .env. Gere com: npm run gen-secret');
  process.exit(1);
}

const rateLimit = require('./middlewares/rateLimiter');
const csrf = require('./middlewares/csrf');
const { authRouter } = require('./routes/auth');
const { userRouter } = require('./routes/user');

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';
const publicDir = path.join(__dirname, 'public');

app.disable('x-powered-by');
if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY) || 0);

app.use(helmet({
  hsts: isProd,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      formAction: ["'self'"],
      // sem upgrade-insecure-requests em dev, senão http://localhost quebra
      upgradeInsecureRequests: isProd ? [] : null
    }
  }
}));

// Sem CORS: o front é servido pelo próprio servidor (o original usava origin:true + credentials, que é perigoso)
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
app.use(rateLimit.global);

// API
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});
app.use('/api', csrf);
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);

// Dashboard só é entregue a quem está logado (senão volta para o login)
app.get('/dashboard.html', (req, res) => {
  try {
    jwt.verify(req.cookies.jwt, process.env.JWT_SECRET, { algorithms: ['HS256'], issuer: 'inhackeavel.com' });
  } catch (err) {
    return res.redirect('/');
  }
  res.set('Cache-Control', 'no-store');
  res.sendFile(path.join(publicDir, 'dashboard.html'));
});

// Frontend estático
app.use(express.static(publicDir, { index: 'index.html', dotfiles: 'deny' }));

app.use((req, res) => res.status(404).send('Página não encontrada'));

// Erros (ex.: JSON malformado) sem vazar detalhes
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON inválido' });
  console.error(err.message);
  res.status(500).json({ error: 'Erro interno' });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
