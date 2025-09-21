import midi from 'midi'
import exitHook from 'exit-hook'
import STATICS from './../statics'

import child_process from 'child_process'

console.log('spawn->' + child_process.spawn)
console.log('exit')

const DROPLETS = `C:\\Users\\chapm\\Desktop\\Ululations\\DROPLETS.bat`
const run = (exe) => {
    const proc = child_process.spawn(DROPLETS)
    proc.on('error', err=>{
        console.log(`[node.js::execute::${exe}]`)
        console.log('\t' + err)
    })

    proc.on('close', code=>{
        console.log(`[node.js::close::${exe}]`)
        console.log('\t' + code)
    })

    proc.stdout.on('data', data=>{
        console.log(`[node.js::stdout::${exe}]`)
        console.log('\t' + data)
    })

    proc.stderr.on('data', err=>{
        console.log(`[node.js::stdout::${exe}]`)
        console.log('\t' + data)
    })
}
