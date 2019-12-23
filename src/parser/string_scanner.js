'use strict';

class StringScanner {
    /**
     * @param {string} str
     */
    constructor(str) {
        this._iter = str[Symbol.iterator]();
        this._lookahead = null;

        this.scan();
    }

    lookahead() {
        return this._lookahead;
    }

    scan() {
        const next = this._lookahead;

        const { done, value, } = this._iter.next();
        if (done) {
            this._lookahead = null;
            return null;
        }

        this._lookahead = value;

        return next;
    }
}

module.exports = Object.freeze({
    StringScanner,
});
