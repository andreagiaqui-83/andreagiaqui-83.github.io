'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const directory = path.join(__dirname, '../downloads/ag-cad-tools');
const output = 'SHA256_AG_CAD_Tools_2.0.txt';
const header = '# SHA-256 dei file distribuiti su andreagiaquinto.it/downloads/ag-cad-tools/\n# Le pagine HTML includono la navigazione del sito. I documenti originali sono nel pacchetto ZIP.\n';
const rows = fs.readdirSync(directory).filter(name => name !== output && fs.statSync(path.join(directory, name)).isFile()).sort().map(name => crypto.createHash('sha256').update(fs.readFileSync(path.join(directory, name))).digest('hex') + '  ' + name);
const expected = header + rows.join('\n') + '\n';
if (process.argv.includes('--check')) {
  if (fs.readFileSync(path.join(directory, output), 'utf8') !== expected) {
    console.error('Le impronte AG CAD Tools richiedono la sincronizzazione.');
    process.exitCode = 1;
  }
} else fs.writeFileSync(path.join(directory, output), expected);
