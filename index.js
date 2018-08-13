#!/usr/bin/env node

const { spawn } = require('child_process')
const { existsSync, readFileSync } = require('fs')
const { copy } = require('copy-paste')
const { safeLoad } = require('js-yaml')
const { homedir } = require('os')
const { argv } = require('yargs')
const Twit = require('twit')

const usage = () => {
  console.log('gran [ -c path/to/config.yaml ] # ./gran.yaml or ~/gran.yaml by default')
  process.exit()
}

const id = x => x

const regExp = x => new RegExp(x)

const defaultConfig = {
  alert: true,
  console: true,
  copy: true,
  format: /(.+?)\s*:(?:参戦ID|Battle ID)\n.+?\n(.+?)\n/,
  player: 'mpg123'
}

const configPath = process.env.dev ?
  `${__dirname}/config.yaml` :
  argv.c ?
    argv.c :
    existsSync('./gran.yaml') ?
      './gran.yaml' :
      `${homedir()}/gran.yaml`

const config = existsSync(configPath) ? safeLoad(readFileSync(configPath)) : usage()

const setConfig = (key, parseEnv = id, parseConfig = id) => {
  config[key] = process.env[key] ?
    parseEnv(process.env[key]) :
    typeof config[key] === 'undefined' ?
      defaultConfig[key] :
      parseConfig(config[key])
}

setConfig('alert', JSON.parse)
setConfig('console', JSON.parse)
setConfig('copy', JSON.parse)
setConfig('format', regExp, regExp)
setConfig('player')

const args = argv._

if (args.length > 0) {
  config.raids = {}
  for (const arg of args) {
    const [, raid, keysString] = arg.match(/^\s*(.+?)\s*=\s*(.+)$/) || []
    const keys = keysString && keysString.split(',').map(e => e.trim())
    if (raid && keys) {
      config.raids[raid] = {
        search: keys,
        alert: config.alert,
        console: config.console,
        copy: config.copy
      }
    }
  }
}

const raidSearches = {}

for (const raidName of Object.keys(config.raids).sort()) {
  const raid = config.raids[raidName]
  if (raid.disable === true) {
    continue
  }
  raid.alert = typeof raid.alert === 'undefined' ? config.alert : raid.alert
  raid.console = typeof raid.console === 'undefined' ? config.console : raid.console
  raid.copy = typeof raid.copy === 'undefined' ? config.copy : raid.copy
  const searches = (typeof raid.search === 'string' ? raid.search.split(',') : raid.search).map(e => e.trim())
  for (const search of searches) {
    raidSearches[search] = Object.assign({}, raid)
    delete raidSearches[search].search
    raidSearches[search].name = raidName
  }
  console.log(`${raidName} : ${searches.join(', ')}${raid.alert ? ' [alert]' : ''}${raid.console ? ' [console]' : ''}${raid.copy ? ' [copy]' : ''}`)
}

if (process.env.dev) {
  console.log(config)
  console.log(raidSearches)
}

const twitter = new Twit(config.twitter)

twitter.stream('statuses/filter', { track: Object.keys(raidSearches) }).on('tweet', tweet => {
  if (process.env.dev) {
    console.log('----------')
    console.log(tweet.text)
  }
  const parts = tweet.text.match(config.format)
  if (!parts) {
    return
  }
  const id = parts[1]
  const raid = raidSearches[parts[2]]
  if (!id || !raid) {
    return
  }
  if (config.alert === true && raid.alert !== false || raid.alert) {
    spawn(config.player, [typeof raid.alert === 'string' ? raid.alert : `${__dirname}/assets/alert.mp3`])
  }
  if (config.console === true && raid.console !== false || raid.console === true) {
    console.log(`${raid.name} : ${id}`)
  }
  if (config.copy === true && raid.copy !== false || raid.copy === true) {
    copy(id)
  }
})
