import midi from 'midi'
import osc from 'osc'
import exitHook from 'exit-hook'
import STATICS from './statics'

const MIDI_ON = 0x90 & 0xF0;  // mask off all but top 4 bits
const MIDI_OFF = 0x80 & 0xF0; //and yes, this shift is dumb, but it is to remember that it is Command / Channel as one set of bytes in the messeage format
let PORT = -1;
let PORT_NAME_INSTANCE = -1;

let MAP_1_TO = 1
let MAP_2_TO = 1
let MAP_3_TO = 1
let MAP_4_TO = 1

const output = new midi.Output();
const input = new midi.Input();

let oscListener = new osc.UDPPort({
    localAddress: "0.0.0.0",
    localPort: STATICS.REMAP_PORT,
    remoteAddress: "127.0.0.1",
    remotePort: STATICS.REMAP_REPLY_PORT,
    metadata:true,
})

