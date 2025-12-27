import config from '@ljharb/eslint-config/flat/node/latest';

export default [
	...config,
	{
		rules: {
			'func-style': 'off',
			'no-extra-parens': 'off',
		},
	},
];
