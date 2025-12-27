#!/usr/bin/env node

import { styleText } from 'util';
import pargs from 'pargs';

const {
	help,
	positionals: [packageName],
} = await pargs(import.meta.filename, {
	allowPositionals: 1,
	minPositionals: 1,
});

await help();

import validate from 'validate-npm-package-name';

const {
	validForNewPackages,
	validForOldPackages,
	warnings,
	errors: validateErrors,
} = validate(packageName);

/** @type {boolean | null} */
let existsOnNpm = null;
if (!validForNewPackages && validForOldPackages) {
	const res = await fetch(`https://registry.npmjs.org/${encodeURIComponent(packageName)}`);
	existsOnNpm = res.ok;
}

if (validForNewPackages) {
	console.log(styleText('green', packageName));
} else if (validForOldPackages && existsOnNpm) {
	warnings?.forEach((warning) => console.warn(styleText('yellow', warning)));
	console.log(styleText(['dim', 'green'], packageName));
} else {
	warnings?.forEach((warning) => console.warn(styleText('yellow', warning)));
	validateErrors?.forEach((error) => console.error(styleText('red', error)));

	process.exitCode = 1;
}
