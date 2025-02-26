import { parseArgs } from 'util';
import { dirname, join } from 'path';
import { realpathSync } from 'fs';
import { readFile } from 'fs/promises';

const { hasOwn } = Object;

/** @type {(e: unknown) => e is import('./pargs.mjs').ParseArgsError} */
function isParseArgsError(e) {
	return !!e
		&& typeof e === 'object'
		&& 'code' in e
		&& (
			e.code === 'ERR_PARSE_ARGS_UNKNOWN_OPTION'
			|| e.code === 'ERR_PARSE_ARGS_INVALID_OPTION_VALUE'
			|| e.code === 'ERR_INVALID_ARG_TYPE'
			|| e.code === 'ERR_INVALID_ARG_VALUE'
			|| e.code === 'ERR_PARSE_ARGS_UNEXPECTED_POSITIONAL'
		);
}

/* eslint max-lines-per-function: 0, max-statements: 0, complexity: 0, sort-keys: 0, no-magic-numbers: 0 */

/** @type {import('./pargs.mjs').default} */
export default async function pargs(entrypointPath, obj) {
	const argv = process.argv.flatMap((arg) => {
		try {
			const realpathedArg = realpathSync(arg);
			if (
				realpathedArg === process.execPath
				|| realpathedArg === entrypointPath
			) {
				return [];
			}
		} catch (e) { /**/ }
		return arg;
	});

	if ('help' in obj || (obj.options && 'help' in obj.options)) {
		throw new TypeError('The "help" option is reserved');
	}

	/** @type {string[]} */
	const errors = [];

	if ('subcommands' in obj && (!obj.subcommands || typeof obj.subcommands !== 'object')) {
		throw new TypeError('Error: `subcommands` must be an object');
	}

	const { subcommands, ...passedConfig } = obj;

	if ('subcommands' in obj && Object.keys(obj.subcommands).length === 0) {
		throw new TypeError('Error: `subcommands` must be an object with at least one key');
	}

	if ('subcommands' in obj && 'allowPositionals' in passedConfig) {
		throw new TypeError('Error: `allowPositionals` is not allowed when `subcommands` is defined');
	}

	const enums = { __proto__: null };

	/** @type {{ options: import('./pargs.mjs').ParseArgsConfig['options'] & { help: { default: false, type: 'boolean' } } }} */
	const normalizedOptions = Object.fromEntries(Object.entries(passedConfig.options ?? {}).flatMap(([key, value]) => {
		if (value.type !== 'enum') {
			return [[key, value]];
		}

		if (!Array.isArray(value.choices) || !value.choices.every((x) => typeof x === 'string')) {
			throw new TypeError(`Error: enum choices must be an array of strings; \`${key}\` is invalid`);
		}

		enums[key] = value;
		return [[key, { ...value, type: 'string' }]];
	}).concat([
		[
			'help',
			{
				default: false,
				type: 'boolean',
			},
		],
	]));

	/** @type {import('./pargs.mjs').ParseArgsConfig & { tokens: true, allowNegative: true, strict: true, options: typeof normalizedOptions }} */
	const newObj = {
		args: subcommands ? argv.slice(0, 1) : argv,
		...passedConfig,
		options: normalizedOptions,
		tokens: true,
		allowNegative: true,
		allowPositionals: !!subcommands || typeof passedConfig.allowPositionals !== 'undefined',
		minPositionals: 0,
		strict: true,
	};

	// console.log(newObj.options);

	try {
		const { tokens, ...results } = parseArgs(newObj);

		const enumEntries = Object.entries(enums);
		if (enumEntries.length > 0) {
			enumEntries.forEach(([key, config]) => {
				const value = results.values[key];
				// console.log(key, config, value);

				if (!config.choices.includes(value)) {
					errors.push(`Error: Invalid value for option "${key}"`);
				}
			});
		}

		// eslint-disable-next-line no-inner-declarations
		async function help() {
			if (('help' in results.values && results.values.help) || errors.length > 0) {
				const helpText = await `${await readFile(join(dirname(entrypointPath), './help.txt'), 'utf-8')}`;
				if (errors.length === 0) {
					console.log(helpText);
				} else {
					console.error(`${helpText}${errors.length === 0 ? '' : '\n'}`);

					process.exitCode ||= parseInt('1'.repeat(errors.length), 2);
					errors.forEach((error) => console.error(error));
				}

				process.exit();
			}
		}

		const { allowPositionals, minPositionals } = passedConfig;

		const posCount = typeof allowPositionals === 'number' ? allowPositionals : allowPositionals || subcommands ? Infinity : 0;
		if (results.positionals.length > posCount) {
			errors.push(`Only ${posCount} positional arguments allowed; got ${results.positionals.length}`);
		}
		if (!results.values.help && typeof minPositionals === 'number' && results.positionals.length < minPositionals) {
			errors.push(`At least ${posCount} positional arguments are required; got ${results.positionals.length}`);
		}

		const optionTokens = tokens.filter(/** @type {(token: typeof tokens[number]) => token is import('./pargs.mjs').OptionToken} */ (token) => token.kind === 'option');

		const bools = obj.options ? Object.entries(obj.options).filter(([, { type }]) => type === 'boolean') : [];
		const boolMap = new Map(bools.concat([['help', newObj.options.help]]));
		for (let i = 0; i < optionTokens.length; i += 1) {
			const { name, value } = optionTokens[i];
			if (boolMap.has(name) && typeof value !== 'boolean' && typeof value !== 'undefined') {
				errors.push(`Error: Argument --${name} must be a boolean`);
			}
		}

		const passedArgs = new Set(optionTokens.map(({ name, rawName }) => (rawName === '--no-help' ? rawName : name)));

		const groups = Object.groupBy(passedArgs, (x) => x.replace(/^no-/, ''));
		for (let i = 0; i < bools.length; i++) {
			const [key] = bools[i];
			if ((groups[key]?.length ?? 0) > 1) {
				errors.push(`Error: Arguments \`--${key}\` and \`--no-${key}\` are mutually exclusive`);
			}
			if (passedArgs.has(`no-${key}`)) {
				results.values[key] = !results.values[`no-${key}`];
			}
			delete results.values[`no-${key}`];
		}

		const knownOptions = Object.keys(newObj.options);
		const unknownArgs = knownOptions.length > 0 ? passedArgs.difference(new Set(knownOptions)) : passedArgs;
		if (unknownArgs.size > 0) {
			errors.push(`Error: Unknown option(s): ${Array.from(unknownArgs, (x) => `\`${x}\``).join(', ')}`);
		}

		/** @type {undefined | import('./pargs.mjs').PargsParsed<import('./pargs.mjs').PargsConfig>} */
		let command;
		if (subcommands) {
			const subcommand = argv[0];
			// eslint-disable-next-line no-extra-parens
			if (hasOwn(/** @type {object} */ (subcommands), subcommand)) {
				process.argv.splice(process.argv.indexOf(subcommand), 1);
				command = await pargs(entrypointPath, subcommands[subcommand]);
			} else {
				errors.push(`Error: unknown command "${command}"`);
			}
		}

		return {
			help,
			errors,
			...results,
			...command && {
				help: ('help' in command && command.help) || help,
				command: {
					name: argv[0],
					...command,
				},
			},
			...obj.tokens && { tokens },
		};
	} catch (e) {
		const fakeErrors = [`Error: ${!!e && typeof e === 'object' && 'message' in e && e.message}`];
		if (isParseArgsError(e)) {
			return {
				async help() {
					const helpText = await `${await readFile(join(dirname(entrypointPath), './help.txt'), 'utf-8')}`;
					console.error(`${helpText}'\n`);

					process.exitCode ||= parseInt('1', 2);
					console.error(fakeErrors[0]);

					process.exit();
				},
				values: {},
				positionals: [],
				errors: fakeErrors,
			};
		}
		throw e;
	}
}
