# deploy2-cli 
[![build status](https://badgen.net/travis/vladimyr/deploy2-cli/master)](https://travis-ci.com/vladimyr/deploy2-cli) [![install size](https://badgen.net/packagephobia/install/{{name})](https://packagephobia.now.sh/result?p={{name}) [![npm package version](https://badgen.net/npm/v/deploy2-cli)](https://npm.im/deploy2-cli) [![github license](https://badgen.net/github/license/vladimyr/deploy2-cli)](https://github.com/vladimyr/deploy2-cli/blob/master/LICENSE) [![js semistandard style](https://badgen.net/badge/code%20style/semistandard/pink)](https://github.com/Flet/semistandard)

> Deploy apps using [`pm2-deploy`](https://github.com/Unitech/pm2-deploy) :rocket:

## Run
```
$ npx vladimyr/deploy2-cli <env> <command>
```

## Usage
```
$ npx vladimyr/deploy2-cli --help

deploy2-cli v0.0.0 - Standalone CLI for PM2 deployment system

Usage
  $ deploy2 <env> <command>

Commands
  setup                  run remote setup commands
  revert [n]             revert to [n]th last deployment or 1
  config [key]           output config file or [key]
  curr[ent]              output current release commit
  prev[ious]             output previous release commit
  exec|run <cmd>         execute the given <cmd>
  list                   list previous deploy commits
  ref [ref]              deploy [ref]

Options
  -c, --config <path>    Set the path to config file
  -h, --help             Show help
  -v, --version          Show version number

Homepage:     https://github.com/vladimyr/deploy2-cli
Report issue: https://github.com/vladimyr/deploy2-cli/issues
```
