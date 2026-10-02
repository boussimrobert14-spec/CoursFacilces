import express from 'express';
import multer from 'multer';
import OpenAI from 'openai';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT || 3000);
const client = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const ok = file.mimetype?.startsWith('image/') || file.mimetype === 'application/pdf';
    cb(ok ? null : new Error('Seuls les images et PDF sont acceptés.'), ok);
  }
});

app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api/', rateLimit({ windowMs: 60_000, limit: 20, standardHeaders: true, legacyHeaders: false }));

const SYSTEM = `Tu es l’IA pédagogique de CoursFacile, destinée à des élèves.
- Explique en français simple, adapté au niveau indiqué.
- Respecte pays/système, formation, niveau et matière.
- N’invente jamais un programme officiel. Si aucune source officielle n’est fournie, dis que c’est une explication pédagogique générale.
- En mode « Je ne comprends rien », repars de zéro : vocabulaire simple, exemple, étapes, puis mini-exercice.
- Pour une photo/PDF, utilise uniquement ce qui est réellement lisible et signale les incertitudes.
- Aide l’élève à comprendre plutôt que de simplement donner une réponse sans explication.
- Ne demande jamais de données personnelles inutiles.`;

app.post('/api/ask', upload.single('file'), async (req, res) => {
  if (!client) return res.status(503).json({ error: 'IA non configurée sur le serveur.' });
  try {
    const { question = '', country = '', level = '', subject = '', formation = '', mode = 'normal' } = req.body || {};
    if (!question.trim() && !req.file) return res.status(400).json({ error: 'Ajoute une question ou un document.' });

    const content = [{ type: 'input_text', text:
      `Pays/système: ${country}\nFormation: ${formation}\nNiveau: ${level}\nMatière: ${subject}\nMode: ${mode}\nQuestion: ${question}`
    }];

    if (req.file) {
      const b64 = req.file.buffer.toString('base64');
      if (req.file.mimetype.startsWith('image/')) {
        content.push({ type: 'input_image', image_url: `data:${req.file.mimetype};base64,${b64}` });
      } else {
        content.push({ type: 'input_file', filename: req.file.originalname, file_data: `data:application/pdf;base64,${b64}` });
      }
    }

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || 'gpt-6-luna',
      instructions: SYSTEM,
      input: [{ role: 'user', content }],
      max_output_tokens: 1200,
      store: false
    });

    res.json({ answer: response.output_text || 'Je n’ai pas réussi à produire une explication.' });
  } catch (err) {
    console.error(err?.message || err);
    res.status(500).json({ error: 'Erreur pendant la réponse IA.' });
  }
});

app.get('/api/health', (_req, res) => res.json({ ok: true, aiConfigured: Boolean(client) }));
app.get('/', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.use((err, _req, res, _next) => res.status(400).json({ error: err.message || 'Requête invalide.' }));
app.listen(PORT, () => console.log(`CoursFacile serveur sur le port ${PORT}`));
