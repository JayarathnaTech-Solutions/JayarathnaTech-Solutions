// Runtime stand-in for Vite's `import.meta.glob` under Jest (see
// babel-plugin-vite-meta.cjs). Only the form the app actually uses is
// supported — eager raw-text imports, e.g. src/lib/blog.ts:
//   import.meta.glob('./dir/*.md', { query: '?raw', import: 'default', eager: true })
// Resolved at runtime rather than at transform time so adding a matching file
// doesn't leave a stale result in Jest's transform cache.
const { globSync, readFileSync } = require('node:fs')
const path = require('node:path')

module.exports = function viteGlob(dir, patterns, options = {}) {
    if (!options.eager || options.query !== '?raw') {
        throw new Error('jest/vite-glob: only eager `?raw` import.meta.glob calls are supported')
    }

    const modules = {}
    for (const pattern of [].concat(patterns)) {
        for (const file of globSync(path.resolve(dir, pattern))) {
            // Keys mirror Vite's: the path relative to the importing file,
            // always starting with ./ or ../
            let key = path.relative(dir, file).split(path.sep).join('/')
            if (!key.startsWith('.')) key = `./${key}`
            modules[key] = readFileSync(file, 'utf-8')
        }
    }
    return modules
}
