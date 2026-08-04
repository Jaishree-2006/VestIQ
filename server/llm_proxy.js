import express from 'express';
import multer from 'multer';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const upload = multer({ dest: path.join(__dirname, '..', 'tmp') });
const app = express();
app.use(express.json());

app.post('/api/parse-cas', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'no file' });
    const filePath = req.file.path;
    // Call the Python parser in local mode with PDF extraction
    const py = spawn('python', [path.join(__dirname, '..', 'scripts', 'parse_cas_and_call_llm.py'), '--pdf', filePath], {
      env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' }
    });
    let out = '';
    let err = '';
    py.stdout.on('data', (d) => out += d.toString());
    py.stderr.on('data', (d) => err += d.toString());
    py.on('close', (code) => {
      fs.unlink(filePath, () => {});
      if (code !== 0) return res.status(500).json({ error: 'parser_failed', details: err || out });
      try {
        const parsed = JSON.parse(out);
        return res.json(parsed);
      } catch (e) {
        return res.status(500).json({ error: 'invalid_parser_output', raw: out });
      }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const port = process.env.PORT || 4001;
app.listen(port, () => console.log('LLM proxy listening on', port));
