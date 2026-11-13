import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const studios = [
  'alien-planet.html', 'aquarium.html', 'canal-metropolis.html', 'molten.html',
  'parallax-engine.html', 'rainforest.html'
];
const failures = [];
for (const file of studios) {
  const html = readFileSync(resolve(root, file), 'utf8');
  if (!/studio-shell\.css\?v=4/.test(html)) failures.push(`${file}: missing versioned shell stylesheet`);
  if (!/studio-shell\.js\?v=4/.test(html)) failures.push(`${file}: missing versioned shell script`);
}
const shell = readFileSync(resolve(root, 'studio-shell.js'), 'utf8');
for (const marker of ['QUEUE_URL', 'studio:ready', 'Back to studios', 'Adjust while watching']) {
  if (!shell.includes(marker)) failures.push(`studio-shell.js: missing ${marker}`);
}
if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`Studio shell checks passed for ${studios.length} Render Queue studios.`);
