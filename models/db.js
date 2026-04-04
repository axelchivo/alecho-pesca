const fs = require('fs');
const path = require('path');
const config = require('../config');

const dbFilePath = path.join(config.dataDir, 'db.json');

function ensureDataDir() {
  if (!fs.existsSync(config.dataDir)) {
    fs.mkdirSync(config.dataDir, { recursive: true });
  }
}

function ensureDbFile() {
  ensureDataDir();
  if (!fs.existsSync(dbFilePath)) {
    fs.writeFileSync(dbFilePath, JSON.stringify({}, null, 2), 'utf8');
  }
}

function readDb() {
  ensureDbFile();
  try {
    const content = fs.readFileSync(dbFilePath, 'utf8');
    return content ? JSON.parse(content) : {};
  } catch (error) {
    console.error('Error reading DB file:', error);
    return {};
  }
}

function writeDb(data) {
  ensureDataDir();
  try {
    fs.writeFileSync(dbFilePath, JSON.stringify(data || {}, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing DB file:', error);
    throw error;
  }
}

module.exports = {
  readDb,
  writeDb,
};
