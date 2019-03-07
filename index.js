const path = require('path');
const fs = require('fs');
const utils = require('./utils.js');
const propertiesReader = require('properties-reader');
const xmlBuilder = require('xmlbuilder');
const {performance} = require('perf_hooks');

const workingDirectory = process.cwd();
const xlfFileName = 'translate';
const defaultBaseLocaleCode = 'en';

/**
 *
 * @param inputDirectory Input directory where .properties files are
 * @param outputDirectory Output directory where .xlf files are going to be placed
 * @param baseLocaleCode [Optional] Indicates the source locale for the translation units in .xlf files
 */
const transpile = (inputDirectory, outputDirectory, baseLocaleCode) => {
    const startTime = performance.now();

    console.info('Running ng-linguo transpiler...');
    console.info('Validating parameters...');

    if (utils.isNullOrEmpty(inputDirectory)) throw new Error('- Missing input directory path...');
    if (utils.isNullOrEmpty(outputDirectory)) throw new Error('- Missing output directory path...');
    if (utils.isNullOrEmpty(baseLocaleCode)) {
        console.info(`- Missing baseLocale parameter, assuming '${defaultBaseLocaleCode}'`);
        baseLocaleCode = defaultBaseLocaleCode;
    }

    console.info('Resolving directories...');
    inputDirectory = path.resolve(workingDirectory, inputDirectory);
    if (!fs.statSync(inputDirectory).isDirectory()) throw new Error('- Input parameter is not a directory');
    if (!fs.existsSync(inputDirectory)) throw new Error('- Input directory not exists');

    outputDirectory = path.resolve(workingDirectory, outputDirectory);
    if (!fs.existsSync(outputDirectory)) {
        fs.mkdirSync(outputDirectory);
    }
    if (!fs.statSync(outputDirectory).isDirectory()) throw new Error('- Output parameter is not a directory');

    const propertiesRegexp = new RegExp('^(?:[^_]+_)([^.]+)(?:.properties)$', 'i');

    console.info('Looking for .properties files on input directory...');
    const inputFiles = fs.readdirSync(inputDirectory)
        .filter(file => propertiesRegexp.test(file));
    console.info(`- Found ${inputFiles.length} files`);

    console.info('Creating locale groups for .properties files...');
    const inputLocaleFileMap = new Map();
    inputFiles.forEach(file => {
        const localeCode = propertiesRegexp.exec(file)[1].toLowerCase();
        if (!inputLocaleFileMap.has(localeCode)) {
            inputLocaleFileMap.set(localeCode, []);
        }
        inputLocaleFileMap.get(localeCode).push(path.resolve(inputDirectory, file));
    });
    console.info(`- Created ${inputLocaleFileMap.size} locale groups`);

    console.info('Parsing .properties files...');
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
    const baseLocaleProperties = inputPropertiesMap.get(baseLocaleCode);

    console.info('Creating .xlf files...');
    inputPropertiesMap.forEach((properties, code) => {
        console.info(`- Creating ${xlfFileName}.${code}.xlf file`);

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
            const sourceValue = utils.isNullOrUndefined(baseLocaleProperties) ? null : baseLocaleProperties.get(key);
            xmlObject.xliff.file.body["trans-unit"].push({
                '@id': key,
                '@datatype': 'html',
                source: {
                    '#text': utils.isNullOrUndefined(sourceValue) ? value : sourceValue
                },
                target: {
                    '#text': value
                }
            });
        });

        const xliffString = xmlBuilder.create(xmlObject, {encoding: 'utf-8'}).end({pretty: true});
        fs.writeFileSync(path.resolve(outputDirectory, `${xlfFileName}.${code}.xlf`), xliffString);
        console.info(`-- File created OK`);
    });
    const endTime = performance.now();
    console.info(`Process terminated OK after ${endTime - startTime} milliseconds.`);
};

module.exports = transpile;