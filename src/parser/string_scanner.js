class StringScanner {
    /**
     * @param {string} str
     */
    constructor(str) {
        /**
         * @type {Iterator<string>}
         */
        this._iter = str[Symbol.iterator]();
        /**
         *  @type   {string|null}
         */
        this._lookahead = null;

        this.scan();
    }

    /**
     * @returns {string|null}
     */
    lookahead() {
        return this._lookahead;
    }

    /**
     * @returns {string|null}
     */
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

export {
    StringScanner,
};
