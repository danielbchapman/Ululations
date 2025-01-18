import Eos from './EtcEosConnection'
import fs from 'fs-extra'
import midi from 'midi'
import startup from './engine'
import { 
    critical,
    debug,
    info,
    setLevel,
    LEVELS
} from './SimpleLog'

//////////////////////////////////////////////
// CONFIG
//////////////////////////////////////////////
setLevel(LEVELS.INFO)
//setLevel(LEVELS.DEBUG)
let TIMEOUT = 60000 * 5
let DEVICE_TARGET = 'Network Production'
let EOS = 'localhost'
let input = new midi.Input()
let eos = null

let eosConfig = {
    eosIpAddress: 'localhost',
    eosOscPort: 3032,
    debug: true,
    watchoutIpAddress: 'localhost',
    watchoutPort: 3040, //production, 3039 for Display
}


critical(`Starting up Undulations MIDI to OSC Converter`)

let total = input.getPortCount();
critical(total)
let device = {
    number: -1,
    name: undefined
}

for(let i = 0; i < total; i++) {
    let name = input.getPortName(i)
    critical(`Device ${i} ${name}`)
    if(name.trim() == DEVICE_TARGET) {
        device.number = i
        device.name = name
    }
}

if(device.name) {
    //Initialize a connection
    eos = Eos.connect(eosConfig)
    let listener = startup(device, Eos)
    input.on('message', listener)
    /**
    input.on('message', (deltaTime, message) => {
        // The message is an array of numbers corresponding to the MIDI bytes:
        //   [status, data1, data2]
        // https://www.cs.cf.ac.uk/Dave/Multimedia/node158.html has some helpful
        // information interpreting the messages.
        console.log(`m: ${message} d: ${deltaTime}`);
      });
     */
    input.openPort(device.number)
    
    info(`opening port ${device.number}`)


} else {
    critical(`MIDI DEVICE NOT CONNECTED`)
    input.closePort()
    process.exit()
}

setTimeout(()=>{
    critical(`EXITING NODE after ${TIMEOUT}`)
    input.closePort()
    Eos.shutdown()
    process.exit()
}, TIMEOUT)

