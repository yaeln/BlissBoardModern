import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), '../data');
const OUT_FILE = path.join(process.cwd(), 'public/data.json');

function parseStoreData() {
  const content = fs.readFileSync(path.join(DATA_DIR, 'storedata.dat'), 'utf-8');
  const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');
  const store = {};
  for (const line of lines) {
    const parts = line.split(',');
    // The last element is usually empty because of trailing comma
    if (parts[parts.length - 1] === '') {
      parts.pop();
    }
    const name = parts[0];
    const type = parts[1];
    const components = parts.slice(2);
    store[name] = { type, parts: components };
  }
  return store;
}

function parseVisualData() {
  const content = fs.readFileSync(path.join(DATA_DIR, 'vd.dat'), 'utf-8');
  const lines = content.split(/\r?\n/);
  const visual = {};
  for (let i = 0; i < lines.length; i += 2) {
    const name = lines[i]?.trim();
    if (!name) continue;
    const instructions = lines[i + 1]?.split(',') || [];
    if (instructions[instructions.length - 1] === '') {
      instructions.pop();
    }
    visual[name] = instructions;
  }
  return visual;
}

function parseTranslation(filename) {
  const content = fs.readFileSync(path.join(DATA_DIR, filename), 'utf-8');
  const lines = content.split(/\r?\n/);
  const trans = {};
  for (let i = 0; i < lines.length; i += 2) {
    const name = lines[i]?.trim();
    if (!name) continue;
    let translation = lines[i + 1] || '';
    if (translation.endsWith(',')) {
      translation = translation.slice(0, -1);
    }
    trans[name] = translation.trim();
  }
  return trans;
}

function main() {
  const data = {
    store: parseStoreData(),
    visual: parseVisualData(),
    translations: {
      en: parseTranslation('trans.en'),
      he: parseTranslation('trans.he')
    }
  };

  if (!fs.existsSync('public')) {
    fs.mkdirSync('public', { recursive: true });
  }

  fs.writeFileSync(OUT_FILE, JSON.stringify(data, null, 2));
  console.log('Successfully generated public/data.json');
}

main();
