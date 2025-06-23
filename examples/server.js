import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const folderName = process.argv[2];

app.use(express.static(path.join(__dirname, folderName)));
app.use(express.static('dist'));

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});