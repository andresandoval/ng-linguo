#! /usr/bin/env node
const ngLinguo = require('../index');

if (!process.stdin.isTTY) throw new Error('Invalid call method, TTY environment is expected...');

/**
 * @type {{in: string, out: string, baseLocale: string}}
 */
const arguments = require('minimist')(process.argv.slice(2));

ngLinguo(arguments.in, arguments.out, arguments.baseLocale);