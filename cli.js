#!/usr/bin/env node

'use strict';

const { format, promisify } = require('util');
const { readFileSync } = require('fs');
const git = require('git-rev-sync');
const kleur = require('kleur');
const logSymbols = require('log-symbols');
const meow = require('meow');
const deploy = promisify(require('pm2-deploy').deployForEnv);
const JoyCon = require('joycon');
const path = require('path');
const pkg = require('./package.json');

const stripJsonComments = require('strip-json-comments');
const toml = require('toml');

const CONFIG_FILES = ['.deploy', '.deployrc.js', 'deploy.toml'];
const SHELL_OP_AND = '&&';

const isValidationError = err => err.constructor.name === 'ValidationError';
const formatCode = arg => `\`${arg}\``;
const formatError = msg => msg.replace(/^\w*Error:\s+/, match => kleur.red().bold(match));
const noop = () => {};
const parseJSON = str => JSON.parse(stripJsonComments(str));

const supportsEmoji = process.platform !== 'win32' || process.env.TERM === 'xterm-256color';
const emoji = char => supportsEmoji ? `${char} ` : '';

if (supportsEmoji) {
  Object.assign(logSymbols, {
    info: 'ℹ️ ',
    success: '✅ ',
    warning: '⚠️ ',
    error: '🚨 '
  });
}

const logError = (msg, ...args) => console.error(logSymbols.error, formatError(format(msg, ...args)));
const logWarning = (msg, ...args) => console.error(logSymbols.warning, format(msg, ...args));
const logSuccess = (msg, ...args) => console.error(logSymbols.success, format(msg, ...args));

const joycon = new JoyCon({
  files: CONFIG_FILES,
  parseJSON
});
joycon.addLoader({
  test: /^\.[^.]*rc$/,
  loadSync: path => parseJSON(readFileSync(path, 'utf-8'))
});
joycon.addLoader({
  test: /\.toml$/,
  loadSync: path => toml.parse(readFileSync(path, 'utf-8'))
});

const description = `${kleur.bold(pkg.name)} v${pkg.version} - ${pkg.description}`;
const version = `
${kleur.inverse().cyan().bold(` ${pkg.name} `)} v${kleur.bold(pkg.version)}

pm2-deploy         v${kleur.bold(require('pm2-deploy/package.json').version)}
visionmedia/deploy v${kleur.bold(getDeployVersion())}
`.trim();

const help = `
Usage
  $ ${pkg.name} <env> <command>

Commands
${showCommands()}

Options
  -h, --help       Show help
  -v, --version    Show version number

Homepage:     ${kleur.cyan(pkg.homepage)}
Report issue: ${kleur.cyan(pkg.bugs.url)}`;

const flags = {
  help: { alias: 'h' },
  version: { alias: 'v' }
};

program(meow(help, { description, version, flags }))
  .then(() => logSuccess('Success'))
  .catch(err => {
    if (isValidationError(err)) {
      logError('Error: Malformed configuration file.\n%s', err.message);
      return process.exit(1);
    }
    logError(
      'Error: %s\n%s',
      err.message || 'Deploy error',
      err.stack || ''
    );
    process.exit(1);
  });

function program(cli) {
  const [env] = cli.input;
  if (!env) {
    logError('Error: Missing required argument: env');
    cli.showHelp();
    process.exit(1);
  }

  const { path: configPath, data: config } = joycon.loadSync();
  if (!config) {
    logError(
      'Error: Configuration file not found.\n[Allowed file names: %s]',
      CONFIG_FILES.join(', ')
    );
    process.exit(1);
  }

  const envConfig = config[env];
  if (!config[env]) {
    logError(
      'Error: %s environment is not defined inside configuration file: %s',
      kleur.white(env),
      kleur.white(path.basename(configPath))
    );
    process.exit(1);
  }

  if (!envConfig.ref) {
    const ref = git.branch();
    logWarning(
      '%s is not set, using current branch: %s',
      kleur.white(formatCode(`${env}.ref`)),
      kleur.white(JSON.stringify(ref))
    );
    envConfig.ref = ref;
  }
  if (!envConfig.repo) {
    const repo = git.remoteUrl();
    logWarning(
      '%s is not set, using current remote: %s',
      kleur.white(formatCode(`${env}.repo`)),
      kleur.white(JSON.stringify(repo))
    );
    envConfig.repo = repo;
  }

  if (!envConfig['post-deploy']) {
    envConfig['post-deploy'] = [
      'npm install',
      'npm run build',
      'pm2 startOrRestart ecosystem.config.js'
    ].join(` ${SHELL_OP_AND} `);
  }

  console.error(emoji('🚚'), format('Deploying to %s on host %s',
    kleur.cyan(env),
    kleur.cyan(envConfig.host)
  ));

  const { log } = console.log;
  console.log = noop;
  return deploy(config, env, cli.input).finally(() => (console.log = log));
}

function showCommands(indent = '  ') {
  const commands = getCommands();
  const colWidth = Math.max(...commands.map(it => it.name.length), 16);
  return commands.map(({ name, desc }) => {
    return `${indent}${name.padEnd(colWidth)} ${desc}`;
  }).join('\n');
}

function getCommands() {
  const contents = readFileSync(require.resolve('pm2-deploy/deploy'), 'utf-8');
  const lines = contents.split(/\r?\n/g);
  return lines.slice(42, 50).map(line => {
    line = line.trim();
    const [name, desc] = line.split(/\s{2,}/);
    return { name, desc };
  });
}

function getDeployVersion() {
  const contents = readFileSync(require.resolve('pm2-deploy/deploy'), 'utf-8');
  const lines = contents.split(/\r?\n/g);
  const versionInfo = lines.find(it => it.startsWith('VERSION='));
  if (!versionInfo) return;
  const [, version] = versionInfo.split('=');
  return version && JSON.parse(version);
}
