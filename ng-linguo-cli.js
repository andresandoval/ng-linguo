#! /usr/bin/env node

const utils = require('./utils.js');
if (!process.stdin.isTTY) return error('Invalid call argument');

/**
 * @type {{in: string, out: string}}
 */
const arguments = require('minimist')(process.argv.slice(2));

if (utils.isNullOrEmpty(arguments.in) || utils.isNullOrEmpty(arguments.out)) throw error('Missing in/out parameters');