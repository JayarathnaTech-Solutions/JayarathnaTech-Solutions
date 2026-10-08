// jsdom doesn't implement fetch & co., but the Firebase Auth SDK references
// `fetch` at import time (and Contact's tests stub it). Borrow Node's built-in
// implementations for anything jsdom leaves undefined.
const { TestEnvironment } = require('jest-environment-jsdom')

const NODE_GLOBALS = ['fetch', 'Request', 'Response', 'Headers', 'ReadableStream', 'TextEncoder', 'TextDecoder', 'structuredClone']

module.exports = class JsdomWithFetchEnvironment extends TestEnvironment {
    constructor(config, context) {
        super(config, context)
        for (const name of NODE_GLOBALS) {
            if (this.global[name] === undefined) this.global[name] = globalThis[name]
        }
    }
}
