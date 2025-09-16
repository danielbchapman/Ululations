///
/// Connect and OSC input stream and output MIDI notes to a local application. 
///
import midi from 'midi'
import osc from 'osc'
import exitHook from 'exit-hook'
import STATICS from './../statics'
// SETUP
const PORT_NAME = 'UlulationsOSC'
const PULSE_TIME = 1000/20; //assume 60FPS, we might need to drop to 30
const MIDI_CHANNEL = 0;
const MIDI_ON = 0x90 & 0xF0;  // mask off all but top 4 bits
const MIDI_OFF = 0x80 & 0xF0; //and yes, this shift is dumb, but it is to remember that it is Command / Channel as one set of bytes in the messeage format
let PORT = -1;
let PORT_NAME_INSTANCE = -1;
//OSC Initialization
let oscListener = new osc.UDPPort({
    localAddress: "0.0.0.0",
    localPort: 53017,
    remoteAddress:STATICS.UNREAL,
    remotePort: 53007,
    metadata:true,
})

oscListener.open();

oscListener.on("ready", () => {
    const msg = {
        address: `/ululations/level`,   
        args: [{
            type: "s",
            value: "droplets"
        }]
    }
    console.log('sending message' + JSON.stringify(msg, null, 2))
    oscListener.send(msg)

    setTimeout(()=>{process.exit()}, 150);
})

