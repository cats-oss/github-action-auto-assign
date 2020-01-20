/*eslint-env commonjs*/

'use strict';

module.exports = function resolveAvaConfig() {
    return {
        'files': [
            'src/**/__tests__/**/*.js'
        ],
        'babel': {
            'testOptions': {
                'presets': [],
                'babelrc': false
            }
        }
    };
};