import {
    MIDI_NOTES,
    MODULUS_12_OCTIVE
} from './mappings'

import {
    debug,
    verbose,
    critical,
    info,
    warn,
} from './../SimpleLog'

let _EOS = null
let oscSend = (command, args = []) => {
    if(_EOS) {
        _EOS.send(command, args)
    } else {
        info(`\t[EOS-MOCK]${command} ${args}`)
    }
    
}
/**
 * Each bank has a fader and an associated inhibit 
 * (inverted) which is the velocity of the note. We set the inhibitor to the velocity on note start
 * @param {*} bank 
 * @param {*} fader 
 * @param {*} velocity 
 */
let faderSelect = (bank, fader, velocity) => {
    //off
    if(velocity > 0){ 
        //oscSend(`/eos/fader/${bank}/${fader} ${velocity/127}`)
        oscSend(`/eos/fader/${bank}/${fader+100}`, velocity / 127)
        oscSend(`/eos/fader/${bank}/${fader}/full`)
    } else {
//FIXME we need a way to set the intensity to velocity before the bump...
        oscSend(`/eos/fader/${bank}/${fader+100}/out`)
        oscSend(`/eos/fader/${bank}/${fader}/out`)
    }
}

let startup = (device, eos)=> {
    debug('listener has been called')
    _EOS = eos
    //Fire up the Eos faders if needed, I'm allocating 20
    for(let i = 1; i <= 10; i++) {
        // 10 banks of 100 faders
        eos.send(`/eos/fader/${i}/config/200`) 
    }

    //this is the listener
    return (deltaTime, message) =>{
        info(`[${device.number}:${device.name}]\tdeltaTime:${deltaTime} -> ${message}`)
        if(!message || !message.length) {
            console.log('MIDI MESSAGE FORMAT ERROR')
        }

        const mode = message[0]
        const note = message[1]
        const velocity = message[2]
        const time = message.deltaTime
        if(mode == 144) { //note on
            //debug(`\tNOTE: ${message}`)
            let oct = note % 12
            let bank = (oct / 10 | 0) + 1
            let fader = oct + 1
            faderSelect(bank, fader, velocity)
        } else {
            warn(`\tunsupported mode ${mode}`)
        }
    }
}

export default startup