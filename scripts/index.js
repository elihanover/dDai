const fs = require('fs')
const glob = require('glob')

const load = async () => {
    console.log(`hi`)
    
    (async () => {
        glob("./scripts/*.js", (err, files) => {
            let exps = await files.map(file => {
                if (file != './scripts/index.js') {
                    const fileName = `./${file.slice(10)}`
                    const req = require(fileName)
                    console.log(req)
                    exps.push(req)
                }
            })
            return exps;
        })
    })();


    console.log(exps)
}




const exps = (async () => {
    await load()
})();
// console.log(Object.keys(exps))
// module.exports = exps