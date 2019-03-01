const flatten = require('flat');
const path = require('path');
const fs = require('fs');

const error = (msg) => {
    console.error(msg);
};

if (!process.stdin.isTTY) return error('Invalid call argument');
if(process.argv.length <= 2) return error('Missing file name');

const file = path.resolve(process.cwd(), process.argv.slice(2)[0]);
if (!file) return error(`File ${file} not exists`);
if (!fs.existsSync(file)) return error(`Cant find file ${file}`);

const flattenOptions = {safe: true};

const flatJson = flatten(require(file), flattenOptions);

console.log(flatJson);