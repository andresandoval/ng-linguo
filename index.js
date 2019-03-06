const path = require('path');
const fs = require('fs');
const utils = require('./utils.js');
const propertiesReader = require('properties-reader');
const xmlBuilder = require('xmlbuilder');

const error = (msg) => {
    return new Error(msg);
};

const process = (inputDirectory, outputDirectory) => {
    inputDirectory = path.resolve(process.cwd(), inputDirectory);

    if (!fs.statSync(inputDirectory).isDirectory()) throw error('Input parameter is not a directory');
    if (!fs.existsSync(inputDirectory)) throw error('Input directory not exists');

    outputDirectory = path.resolve(process.cwd(), outputDirectory);
    if (!fs.existsSync(outputDirectory)) {
        fs.mkdirSync(outputDirectory);
    }
    if (!fs.statSync(outputDirectory).isDirectory()) throw error('Output parameter is not a directory');

    const propertiesRegexp = new RegExp('^(?:[^_]+_)([^.]+)(?:.properties)$', 'i');

    const inputFiles = fs.readdirSync(inputDirectory)
        .filter(file => propertiesRegexp.test(file));

    const inputLocaleFileMap = new Map();

    inputFiles.forEach(file => {
        const localeCode = propertiesRegexp.exec(file)[1].toLowerCase();
        if (!inputLocaleFileMap.has(localeCode)) {
            inputLocaleFileMap.set(localeCode, []);
        }
        inputLocaleFileMap.get(localeCode).push(path.resolve(inputDirectory, file));
    });

    const inputPropertiesMap = new Map();
    inputLocaleFileMap.forEach((files, code) => {
        let properties = null;
        files.forEach(file => {
            if (utils.isNullOrUndefined(properties)) {
                properties = propertiesReader(file);
            } else {
                properties.append(file);
            }
        });
        inputPropertiesMap.set(code, properties);
    });

    inputPropertiesMap.forEach((properties, code) => {

        const xmlObject = {
            xliff: {
                '@version': '1.2',
                '@xmlns': 'urn:oasis:names:tc:xliff:document:1.2',
                file: {
                    '@source-language': code,
                    '@datatype': 'plaintext',
                    '@original': 'ng2.template',
                    body: {
                        'trans-unit': []
                    }
                }
            }
        };

        properties.each((key, value) => {
            xmlObject.xliff.file.body["trans-unit"].push({
                '@id': key,
                '@datatype': 'html',
                source: {
                    '#text': value
                },
                target: {
                    '#text': value
                }
            });
        });

        const xliffString = xmlBuilder.create(xmlObject, {encoding: 'utf-8'}).end({pretty: true});
        fs.writeFileSync(path.resolve(outputDirectory, `translate.${code}.xlf`), xliffString);
    });
};

module.exports = process;