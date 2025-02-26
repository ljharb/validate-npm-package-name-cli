#!/usr/bin/env node

import { styleText } from 'util';
import pargs from './pargs.mjs';

const {
	positionals: [packageName],
	help,
} = await pargs(import.meta.filename, {
	allowPositionals: 1,
	minPositionals: 1,
});

await help();

import validate from 'validate-npm-package-name';

const {
	validForNewPackages,
	warnings,
	errors,
} = validate(packageName);

if (validForNewPackages) {
	console.log(styleText('green', packageName));
} else {
	warnings?.forEach((warning) => console.warn(styleText('yellow', warning)));
	errors?.forEach((error) => console.error(styleText('red', error)));

	process.exitCode = 1;
}
