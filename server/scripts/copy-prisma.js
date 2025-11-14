// Copies the generated Prisma client from src/generated/prisma to dist/generated/prisma
// so that "npm run start" (which runs from dist) has access to the client.
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'src', 'generated', 'prisma');
const dest = path.join(__dirname, '..', 'dist', 'generated', 'prisma');

function copyRecursive(source, target) {
  if (!fs.existsSync(source)) return;
  const stat = fs.statSync(source);
  if (stat.isDirectory()) {
    fs.mkdirSync(target, { recursive: true });
    for (const entry of fs.readdirSync(source)) {
      copyRecursive(path.join(source, entry), path.join(target, entry));
    }
  } else {
    fs.copyFileSync(source, target);
  }
}

try {
  copyRecursive(src, dest);
  console.log(`Prisma client copied to: ${dest}`);
} catch (err) {
  console.error('Failed to copy Prisma client:', err);
  process.exitCode = 1;
}