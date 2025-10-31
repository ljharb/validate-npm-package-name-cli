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
	warnings,
	errors: validateErrors,
} = validate(packageName);

if (validForNewPackages) {
	console.log(styleText('green', packageName));
} else {
	warnings?.forEach((warning) => console.warn(styleText('yellow', warning)));
	validateErrors?.forEach((error) => console.error(styleText('red', error)));

	process.exitCode = 1;
}
