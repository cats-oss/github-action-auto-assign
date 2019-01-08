'use strict';

const STATUS_LABEL_PREFIX = 'S-';

/**
 *  @param {!Array<{ name: string; }>} input
 *  @returns    {!Array<string>}
 */
function removeStateLabels(input) {
    return input
        .map((obj) => obj.name)
        .filter((label) => {
            return !label.startsWith(STATUS_LABEL_PREFIX);
        });
}

module.exports = Object.freeze({
    removeStateLabels
});
