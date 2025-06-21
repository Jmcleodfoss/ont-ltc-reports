// Copyright (c) James McLeod 2025
// MIT licence
"use strict";

import { createWriteStream, existsSync } from 'node:fs';
import { appendFile, closeSync, openSync, writeSync } from 'node:fs';
import { basename } from 'node:path';
import { mkdirSync } from 'node:fs';
import { resolve } from 'path';
import { Readable } from 'stream';
import { finished } from 'stream/promises';
import { launch } from 'puppeteer';
import commandLineArgs from 'command-line-args';
import commandLineUsage from 'command-line-usage';

const INSPECTION_REPORTS_SEARCH_BY_NAME_PAGE = 'https://publicreporting.ltchomes.net/en-ca/Search_Selection.aspx';

const OPTION_DEFINITIONS = [
	{ name: 'help',			alias: 'h',	type: Boolean,	description: 'Display this usage guide' },
	{ name: 'startat',		alias: 's',	type: String,	description: 'Start with this home' },
	{ name: 'agentconsole',		alias: 'A',	type: Boolean,	description: `Display user agent console logging` },
	{ name: 'nonheadless',		alias: 'H',	type: Boolean,	description: 'Run puppeteer in non-Headless mode' },
	{ name: 'verbose',		alias: 'v',	type: Boolean,	description: 'Show verbose progress' },
];

const COMMAND_LINE = basename(process.argv[1], '.js') + '[--help] [--verbose]';
const OPTIONS = commandLineArgs(OPTION_DEFINITIONS, { partial: true });
if (OPTIONS.help) {
	const USAGE = commandLineUsage([
		{
			header: 'Description',
			content: `Scrape the list of LTC inspection reports from ${INSPECTION_REPORTS_SEARCH_BY_NAME_PAGE} saving each PDF report`
		},
		{
			header: 'Usage',
			content: COMMAND_LINE
		},
		{
			header: 'Options',
			optionList: OPTION_DEFINITIONS
		}
	]);
	console.log(USAGE);
	process.exit(0);
}

if (OPTIONS.hasOwnProperty('_unknown')) {
	console.log(`use: ${COMMAND_LINE}`);
	process.exit(0);
}

const FIRST_HOME = OPTIONS.hasOwnProperty('startat') ? OPTIONS.startat : '';
const AGENT_CONSOLE_DEBUGGING = OPTIONS.hasOwnProperty('agentconsole') ? OPTIONS.agentconsole : false;
const HEADLESS = OPTIONS.hasOwnProperty('nonheadless') ? !OPTIONS.nonheadless : true;
const VERBOSE = OPTIONS.hasOwnProperty('verbose') ? OPTIONS.verbose : false;
const JSON_INDENTATION = OPTIONS.hasOwnProperty('pretty') ? 2 : 0;
const RECORDS_LIST_FILENAME = 'ltc-records.json';
const N_RETRIES = 5;

let nRetrieved = 0;

const delay = ms => new Promise(res => setTimeout(res, ms));
function click(e) { e.click() };
function getInnerTextAndHref(e) { return [ e.innerText, e.href ]; }

let records = [];

function ioError(description, error) {
	if (error) {
		console.log(`IO error: ${description}`);
		console.log(error);
		throw error;
	}
}

async function gotoPage(page, url) {
	for (let i = 0; i < N_RETRIES; ++i) {
		try {
			await page.goto(url);
			return true;
		} catch (err) {
			if (VERBOSE)
				console.log(`${err} going to ${url}, retrying`);
			await delay(1000);
		}
	}
	return false;
}

const recordList = openSync(RECORDS_LIST_FILENAME, 'w');
writeSync(recordList, '[', (err) => { ioError('writing first character of records list', err) });

async function getDocument(path, title, uri) {
	if(VERBOSE)
		console.log(`retrieving ${path}/${title} (${uri})`);

	// From https://stackoverflow.com/questions/37614649/how-can-i-download-and-save-a-file-using-the-fetch-api-node-js
	const res = await fetch(uri);
	async function downloadFile(uri, path, title) {
		const res = await fetch(uri);
		const destination = resolve(path, `${title}`);
		const fs = createWriteStream(destination, { flags: 'w' });
		await finished(Readable.fromWeb(res.body).pipe(fs));
	};

	await downloadFile(uri, path, title);
	++nRetrieved;
}

function getDocumentInstance(ltcName, docTitle) {
	let instance = 0;
	for (const i in records) {
		if (records[i].home == ltcName && records[i].title == docTitle)
			++instance;
	}
	return instance
}

async function processLTCHomePage(ltcName, ltcUrl, browser) {
	if (VERBOSE)
		console.log(`Retrieving reports for ${ltcName} (${ltcUrl})`);

	const page = await browser.newPage();
	await gotoPage(page, ltcUrl);
	await delay(1000);

	const inspectionsLinkElement = await page.$('#ctl00_ContentPlaceHolder1_aInspection');
	await inspectionsLinkElement.evaluate(click);
	await delay(1000);

	const docElements = await page.$$('div.divInspectionFileDataCol>a');

	if (!existsSync(ltcName))
		mkdirSync(ltcName);
	else if (VERBOSE)
		console.log(`Directory ${ltcName} already exists`);

	for (const docElement of docElements) {
		const [ text, href ] = await docElement.evaluate(getInnerTextAndHref)
		const docInstance = getDocumentInstance(ltcName, text);
		const instanceSuffix = docInstance == 0 ? '' : `-${docInstance}`;

		const fn = `${text}${instanceSuffix}.pdf`
		const path_and_fn = `${ltcName}/${fn}`;
		if (!existsSync(path_and_fn))
			await getDocument(ltcName, fn, href);
		else if (VERBOSE)
			console.log(`Skipping already retrieved file ${fn}`);
		const entry = {uri: href, home: ltcName, title: text, instance: docInstance };
		records.push(entry);
		await appendFile(recordList, (nRetrieved > 0 ? ',' : '') + JSON.stringify(entry, null, JSON_INDENTATION) + "\n", (err) => { ioError('appending record to records list', err) });
	}

	await page.close();
}

async function run() {
	const browser = await launch( { headless: HEADLESS, args: ['--no-sandbox', '--disable-setuid-sandbox'], timeout: 100_000} );
	const page = await browser.newPage();
	if (AGENT_CONSOLE_DEBUGGING)
		page.on('console', msg => console.log('PAGE LOG', msg.text()));

	if (VERBOSE)
		console.log(`loading ${INSPECTION_REPORTS_SEARCH_BY_NAME_PAGE}`);

	// Navigate to main inspection reports page
	await gotoPage(page, INSPECTION_REPORTS_SEARCH_BY_NAME_PAGE);

	const ltcHomesElements = await page.$$('#ctl00_ContentPlaceHolder1_rsResults>ol>li>a');
	if (VERBOSE)
		console.log(`found ${ltcHomesElements.length} homes`);

	let firstFound = false;
	for (const ltcHomeElement of ltcHomesElements) {
		const [ text, href ] = await ltcHomeElement.evaluate(getInnerTextAndHref);
		if (FIRST_HOME.length === 0 || (FIRST_HOME == text || firstFound)) {
			firstFound = FIRST_HOME.length > 0;
			for (let i = 0; i < N_RETRIES; ++i) {
				try {
					await processLTCHomePage(text, href, browser);
					i = N_RETRIES;
				} catch (err) {
					console.log(`Exception for ${text} (${href}`);
					console.log(err);
					delay(1000);
					++i;
					if (i === N_RETRIES)
						console.log(`Failed to retrieve information for ${text} after ${i} tries`);
				}
			}
		}
	}

	console.log(`retrieved ${nRetrieved} reports`);
	await page.close();

	console.log(records);
}

await run();
await appendFile(recordList, ']', (err) => { ioError('writing final character of records list', err) });
delay(100);
closeSync(recordList, (err) => { ioError('closing records list', err) });
