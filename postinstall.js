'use strict';

const path = require('path');
const { readFileSync, writeFileSync } = require('fs');

const code = readFileSync(require.resolve('pm2-deploy/deploy'), 'utf-8');
const lines = code.split(/\r?\n/g);
const version = readVersion(lines);
const commands = readCommands(lines);
const json = JSON.stringify({ commands, version });
writeFileSync(path.join(__dirname, './deploy.properties.json'), json);

function readCommands(lines) {
  let sectionStart = lines.findIndex(it => /^\s*Commands:/.test(it));
  if (sectionStart === -1) return [];
  sectionStart = sectionStart += 2;
  const lineCount = lines.slice(sectionStart).findIndex(it => /^\s*$/.test(it));
  return lines.slice(sectionStart, sectionStart + lineCount).map(line => {
    line = line.trim();
    const [name, desc] = line.split(/\s{2,}/);
    return { name, desc };
  });
}

function readVersion(lines) {
  const versionInfo = lines.find(it => it.startsWith('VERSION='));
  if (!versionInfo) return;
  const [, version] = versionInfo.split('=');
  return version && JSON.parse(version);
}
