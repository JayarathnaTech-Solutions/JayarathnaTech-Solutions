// Jest runs source through Babel as CommonJS, where `import.meta` doesn't
// exist — but app code relies on two Vite-only `import.meta` features. This
// rewrites them into plain Node equivalents for tests only (Vite itself never
// sees this plugin):
//   import.meta.env           -> process.env (values seeded in jest/env.cjs)
//   import.meta.glob(...)     -> runtime glob via jest/vite-glob.cjs
//   any other import.meta     -> { url, env } object, so e.g. react-router's
//                                `import.meta.hot` check is just undefined
// It also runs over transformed node_modules (see jest.config.js), where any
// leftover `import.meta` would make Node reject the file as ESM.
const path = require('node:path')

const VITE_GLOB_HELPER = path.join(__dirname, 'vite-glob.cjs')

function isImportMeta(node) {
    return node.type === 'MetaProperty' && node.meta.name === 'import' && node.property.name === 'meta'
}

function isImportMetaMember(node, name) {
    return (
        node.type === 'MemberExpression' &&
        isImportMeta(node.object) &&
        !node.computed &&
        node.property.type === 'Identifier' &&
        node.property.name === name
    )
}

module.exports = function viteImportMetaPlugin({ types: t }) {
    return {
        name: 'vite-import-meta',
        visitor: {
            MemberExpression(nodePath) {
                if (isImportMetaMember(nodePath.node, 'env')) {
                    nodePath.replaceWith(t.memberExpression(t.identifier('process'), t.identifier('env')))
                }
            },
            CallExpression(nodePath) {
                if (isImportMetaMember(nodePath.node.callee, 'glob')) {
                    const helper = t.callExpression(t.identifier('require'), [t.stringLiteral(VITE_GLOB_HELPER)])
                    nodePath.replaceWith(t.callExpression(helper, [t.identifier('__dirname'), ...nodePath.node.arguments]))
                }
            },
            // Visited after the two cases above have already replaced their parents.
            MetaProperty(nodePath) {
                if (!isImportMeta(nodePath.node)) return
                const fileUrl = t.memberExpression(
                    t.callExpression(
                        t.memberExpression(
                            t.callExpression(t.identifier('require'), [t.stringLiteral('node:url')]),
                            t.identifier('pathToFileURL'),
                        ),
                        [t.identifier('__filename')],
                    ),
                    t.identifier('href'),
                )
                nodePath.replaceWith(
                    t.objectExpression([
                        t.objectProperty(t.identifier('url'), fileUrl),
                        t.objectProperty(t.identifier('env'), t.memberExpression(t.identifier('process'), t.identifier('env'))),
                    ]),
                )
            },
        },
    }
}
