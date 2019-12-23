'use strict';

const assert = require('assert');

class BackableStringIterator {
    /**
     * @param {string} str
     */
    constructor(str) {
        this._iter = str[Symbol.iterator]();
        this._prevCache = null;
        this._prev = null;
    }

    next() {
        const prev = this._prev;
        if (prev !== null) {
            this._prev = null;
            this._prevCache = prev;
            return {
                done: false,
                value: prev,
            };
        }
        assert.strictEqual(prev, null, 'this._prev must be null');

        const { done, value, } = this._iter.next();
        if (done) {
            this._prevCache = null;
        } else {
            this._prevCache = value;
        }

        return {
            done,
            value,
        };
    }

    back() {
        assert.notStrictEqual(this._prevCache, null, 'this._prev must not be null');
        this._prev = this._prevCache;
        this._prevCache = null;
    }

    [Symbol.iterator]() {
        return this;
    }
}

module.exports = Object.freeze({
    BackableStringIterator,
});
