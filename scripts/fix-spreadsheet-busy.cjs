const fs = require('fs')
const path = 'src/components/platform/SpreadsheetWorkspace.js'
let source = fs.readFileSync(path, 'utf8')
source = source.replace("disabled={saving || mode === 'update'}", "disabled={busy || mode === 'update'}")
source = source.replace("disabled={saving || !file}", "disabled={busy || !file}")
fs.writeFileSync(path, source)
