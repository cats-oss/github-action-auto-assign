/*eslint-env commonjs*/
/*eslint quote-props: [2, "always"] */

'use strict';

// ESLint Configuration Files enables to include comments.
// http://eslint.org/docs/configuring/#comments-in-configuration-files
module.exports = {
    'extends': [
        './node_modules/eslint-config-fluct/config/eslintrc_core.js',
    ],

    'parserOptions': {
        'ecmaVersion': 2018,
    },

    'env': {
        'es6': true,
    },

    'root': true,

    'rules': {
        'no-magic-numbers': 'off',
    }
};