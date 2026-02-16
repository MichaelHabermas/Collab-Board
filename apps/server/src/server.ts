import { createApp } from './app';

const PORT = process.env['PORT'] ?? 3000;

const app = createApp();

app.listen(PORT, () => {
  process.stdout.write(`Server listening on port ${PORT}\n`);
});
