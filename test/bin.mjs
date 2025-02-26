import test from 'tape';

import { join } from 'path';
import { promisify, styleText } from 'util';
import { execFile as execFileC } from 'child_process';
import { createRequire } from 'module';

const requireX = createRequire(import.meta.url);
const pkgJSON = requireX('../package.json');

const execFile = promisify(execFileC);

const { PATH, DEBUG } = process.env;

const bin = join(import.meta.dirname, '../bin.mjs');

/**
 * @param {test.Test} t
 * @param {string} pkg
 * @param {{ code?: number, out?: string, err?: string, outC?: string, errC?: string }} expected
 */
async function run(t, pkg, expected) {
	t.test(`package: ${pkg}`, async (st) => {
		const [
			{ stdout: outB, stderr: errB, code = 0 },
			{ stdout: stdoutColorB, stderr: stderrColorB },
		] = await Promise.all([
			execFile(bin, [pkg], { env: { PATH, NO_COLORS: '1' } }),
			execFile(bin, [pkg], { env: { PATH, FORCE_COLOR: '1' } }),
		].map((x) => x.catch((e) => e)));

		const stdout = `${outB}`.trim();
		const stderr = `${errB}`.trim();
		const stdoutColor = `${stdoutColorB}`.trim();
		const stderrColor = `${stderrColorB}`.trim();

		st.equal(code, Number(expected.code ?? 0), 'should have expected exit code');

		const { out = '', err = '', outC = '', errC = '' } = expected;
		if (DEBUG) {
			`${stdout}`.split('\n').forEach((line, lineIndex) => {
				st.equal(line, out.split('\n')[lineIndex], `should have expected output ${lineIndex}`);
			});
			`${stdoutColor}`.split('\n').forEach((line, lineIndex) => {
				st.equal(line, outC.split('\n')[lineIndex], `should have expected output ${lineIndex}`);
			});
		} else {
			st.equal(`${stdout}`, out, 'should have expected output');
			st.equal(`${stderr}`, err, 'should have expected error output');
			st.equal(`${stdoutColor}`, outC, 'should have expected color output');
			st.equal(`${stderrColor}`, errC, 'should have expected color error output');
		}
	});
}

test('cli', async (t) => {
	process.env.FORCE_COLOR = '1'; // for faucet etc

	const y = /** @type {const} */ ([
		'es-abstract',
		'jsonstream',
		...Object.keys(pkgJSON.dependencies),
		...Object.keys(pkgJSON.devDependencies),
	]);

	await Promise.all(y.map((pkg) => run(t, pkg, { out: pkg, outC: styleText('green', pkg) })));

	const n = /** @type {const} */ ([
		['foo bar', 'name can only contain URL-friendly characters'],
		['JSONStream', '', 'name can no longer contain capital letters'],
	]);

	await Promise.all(n.map(([
		pkg,
		errors,
		warnings = '',
	]) => run(t, pkg, {
		code: 1,
		err: `${warnings}\n${errors}`.split('\n').filter(Boolean).join('\n'),
		errC: `${warnings && styleText('yellow', warnings)}\n${errors && styleText('red', errors)}`.split('\n').filter(Boolean).join('\n'),
	})));
});
