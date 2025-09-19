import midi from 'midi'
import osc from 'osc'
import exitHook from 'exit-hook'
import STATICS from './statics'

//START BITWISE TEST
/*
let x = 0x82

console.log('---------------TESTING')
console.log(x.toString(16))
let type = x & 0xF0;
let channel = x & 0x0F;

console.log(`TEST -> ${type.toString(16)}`)
console.log(`TEST -> ${channel.toString(16)}`)

let nC = type | 0x06;

console.log(`NEW REWRITE -> ${nC.toString(16)}`)
process.exit()
*/
//END TEST
const SOMI_1 = 0x00;
const SOMI_2 = 0x01;
const SOMI_3 = 0x02;
const SOMI_4 = 0x03;

const MIDI_1 = 0x00;
const MIDI_2 = 0x01;
const MIDI_3 = 0x02;
const MIDI_4 = 0x03;
const MIDI_5 = 0x04;
const MIDI_6 = 0x05;

const ONE_TO_SIX = [
    MIDI_1,
    MIDI_2,
    MIDI_3,
    MIDI_4,
    MIDI_5,
    MIDI_6,
]
const MIDI_ON = 0x90 & 0xF0;  // mask off all but top 4 bits
const MIDI_OFF = 0x80 & 0xF0; //and yes, this shift is dumb, but it is to remember that it is Command / Channel as one set of bytes in the messeage format
const CHANNEL_MASK = 0x0F;
let PORT_IN = -1;
let PORT_IN_NAME_INSTANCE = -1;

let PORT_OUT = -1;
let PORT_OUT_NAME_INSTANCE = -1;

let MAP_1_TO = 1
let MAP_2_TO = 2
let MAP_3_TO = 3
let MAP_4_TO = 4

const output = new midi.Output();
const input = new midi.Input();


//MIDI 
let oscListener = new osc.UDPPort({
    localAddress: STATICS.UNREAL,
    localPort: STATICS.REMAP_PORT,
    remoteAddress: STATICS.UNREAL,
    remotePort: STATICS.REMAP_REPLY_PORT,
    metadata:true,
})

oscListener.open();


console.log('MIDI PORTS ARE LISTING ALL PORTS')
for(let i = 0; i < output.getPortCount(); i++) {
    console.log(`\t${i}-> ${output.getPortName(i)}`)

    let n = output.getPortName(i)
    if(n && n.indexOf(STATICS.REMAP_MIDI_SOMI_IN) > -1) {
        PORT_IN = i;
        PORT_IN_NAME_INSTANCE = n;
    }

    if(n && n.indexOf(STATICS.REMAP_MIDI_OUT) > -1) {
        PORT_OUT = i;
        PORT_OUT_NAME_INSTANCE = n;
    }
}

//This is terrible OSC, this is just to make it easy
oscListener.on("message", (oscMsg, timeTag, info) => {
    console.log("An OSC message just arrived!", oscMsg);
    console.log("Remote info is: ", info);

    const address = oscMsg.address
    const args = oscMsg.args
    console.log(`[OSC-in] ${address} + ${JSON.stringify(args)}`)
    //MAP COMMAND
    if(address && address.indexOf(`map-`) > -1) {
        let splits = address.split('-')
        if( splits.length == 3) {
            let id = splits[1]
            let mapped = splits[2]

            if(id == 1) {
                MAP_1_TO = mapped
            } else if (id == 2) {
                MAP_2_TO = mapped
            } else if (id == 3) {
                MAP_3_TO = mapped
            } else if (id == 4) {
                MAP_4_TO = mapped
            }
            console.log(`-> mapping ${id} to ${mapped}`)

        }
    }

    //Logic for all commands here
    // if(address.indexOf('drop') > -1 && args[0].value) {
    //     console.log('Drop Received')
    //     const voice = args[0].value
    //     if(voice == 'high') {
    //         console.log('High Voice')
    //         playNote(60)

})

/**
if(PORT_IN < 0 || PORT_OUT < 0) {
    console.log('COULD NOT LOCATE PORT, EXITING--please check the logs');
    console.log(`\tINPUT ->${PORT_IN}`)
    console.log(`\tOUTPUT->${PORT_OUT}`)
    process.exit();
} else {
    console.log(`CONNECTING TO PORT IN-> ${PORT_IN} ${PORT_IN_NAME_INSTANCE} | OUT -> ${PORT_OUT} ${PORT_OUT_NAME_INSTANCE}`)
}

input.openPort(PORT_IN)
output.openPort(PORT_OUT)
*/

input.openPort(PORT_IN)
output.openPort(PORT_OUT)

const log = (msg) => {
    console.log(`${msg} | MAP \t[1]=>[${MAP_1_TO}]\t[2]=>[${MAP_2_TO}]\t[3]=>[${MAP_3_TO}]\t[4]=>[${MAP_4_TO}]`)
}


const sendOscUpdateToTouchOSC = () =>{
        for(let i = 1; i < 7; i++) {
            //Sensor 1
            if( i == MAP_1_TO ) {
                sendOsc(`/map-1-${i}`, 1.00)
            } else {
                sendOsc(`/map-1-${i}`, 0.00)
            }

            //Sensor 2
            if( i == MAP_2_TO ) {
                sendOsc(`/map-2-${i}`, 1.00)
            } else {
                sendOsc(`/map-2-${i}`, 0.00)
            }
            //Sensor 3
            if( i == MAP_3_TO ) {
                sendOsc(`/map-3-${i}`, 1.00)
            } else {
                sendOsc(`/map-3-${i}`, 0.00)
            }

            //Sensor 4
            if( i == MAP_4_TO ) {
                sendOsc(`/map-4-${i}`, 1.00)
            } else {
                sendOsc(`/map-4-${i}`, 0.00)
            }
        }
        
}

let delay = 0;
setInterval(()=>{
    delay++
    sendOscUpdateToTouchOSC()
    if(delay % 30 == 0) {
        log('STATUS')
    }
    
}, 1000)

log('STARTING REMAPPER')


const sendOsc = (address, fltArg) => {
    oscListener.send({
            address: address,
            args: [{
                type: "f",
                value: fltArg
            }]
        })
}


let activity_pass = [0,0,0,0]

let _dummy = 0



const sendActivity = () => {
    let copy = activity_pass.slice()
    activity_pass = [0,0,0,0]

    //Start dummy sensor code
    const _dFn = (_offset) => {
        let _o = _dummy + _offset
        if(_o % 7 == 0) {
            return 1.00
        } else { 
            return 0.00
        }
    }
    copy = [ _dFn(0), _dFn(1), _dFn(2), _dFn(3) ]
    //end dummy sensor code
    _dummy++
    sendOsc(`/activity-1`, copy[0])
    sendOsc(`/activity-2`, copy[1])
    sendOsc(`/activity-3`, copy[2])
    sendOsc(`/activity-4`, copy[3])
}


const ativityInterval = setInterval(sendActivity, 150)
//MIDI RELAY LOGIC

input.on('message', (dT, msg) => {
    //console.log('message in')
    if(msg && msg[0]) {
        const type = msg[0] & 0xF0;
        const ch = msg[0] & 0x0F;    
        console.log(`type:[${type.toString(16)}->${ch.toString(16)}] m: ${msg} d: ${dT}`)

        const out = [ msg[0], msg[1], msg[2] ]

        if(ch == 1) {
            out[0] = type | ONE_TO_SIX[MAP_1_TO]
        } else if (ch == 2) {
            out[0] = type | ONE_TO_SIX[MAP_2_TO]
        } else if (ch == 3) {
            out[0] = type | ONE_TO_SIX[MAP_3_TO]
        } else if (ch == 4) {
            out[0] = type | ONE_TO_SIX[MAP_4_TO]
        }


        output.sendMessage(out)
    } else {
        console.log(`m: ${msg} d: ${dT}`)
        output.sendMessage(msg)
    }
})



//EXIT LOGIC
exitHook(signal=>{
    console.log(`[exit-hook] signal:${signal}`)
    console.log('EXITING....')
    try {
        output.closePort();
        console.log('\tMIDI PORT CLOSED [critical this is a success]')
    } catch (e) {
        console.log('error closing output port:')
        console.log(e)
    }
    
    try {
        input.closePort();
        console.log('\tMIDI INPUT PORT CLOSED [critical this is a success]')
    } catch (e) {
        console.log('error closing output port:')
        console.log(e)
    }

    try {
        oscListener.close();
        console.log('\tOSC LISENER CLOSED')
    } catch (e) {
        console.log('error closing osc lisnener:')
        console.log(e)
    }
    
    //LET THIS PLAY
    console.log('EXIT COMPLETE')
})

