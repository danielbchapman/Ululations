///
/// Connect and OSC input stream and output MIDI notes to a local application. 
///
import midi from 'midi'
import osc from 'osc'
import exitHook from 'exit-hook'
import STATICS from './statics'

//DEV VARIABLES
const DEV_DATA = false

// SETUP
const PORT_NAME = 'UlulationsOSC'
//const PORT_NAME = "E-MU XMidi1X1 Tab"
const PULSE_TIME = 1000/20; //assume 60FPS, we might need to drop to 30
const MIDI_CHANNEL = 0;
const MIDI_ON = 0x90 & 0xF0;  // mask off all but top 4 bits
const MIDI_OFF = 0x80 & 0xF0; //and yes, this shift is dumb, but it is to remember that it is Command / Channel as one set of bytes in the messeage format
let PORT = -1;
let PORT_NAME_INSTANCE = -1;

const output = new midi.Output();
const input = new midi.Input();

// Count the available input ports.
output.getPortCount();


console.log('LISTING ALL PORTS')
for(let i = 0; i < output.getPortCount(); i++) {
    console.log(`\t${i}-> ${output.getPortName(i)}`)

    let n = output.getPortName(i)
    if(n && n.indexOf(PORT_NAME) > -1) {
        PORT = i;
        PORT_NAME_INSTANCE = n;
    }
}

if(PORT < 0) {
    console.log('COULD NOT LOCATE PORT, EXITING--please check the logs');
    process.exit();
} else {
    console.log(`CONNECTING TO PORT ${PORT} ${PORT_NAME_INSTANCE}`)
}

output.openPort(PORT)
input.openPort(PORT)


const clampV = (velocity) => {
    let v = velocity / 127.00
    return v;
}

const lerp = (a, b, by) => {
    if(by <= 0) {
        return a
    } 

    if(by >= 1) {
        return b
    }
    return a + (b-a) * by;
}

input.on('message', (dT, msg) => {
    //console.log(`m: ${msg} d: ${dT}`)
    const channel = msg[0]
    const note = msg[1]
    const velocity = msg[2]

    //DROPLETS
    if(note == STATICS.MIDI_DROPLET_HIGH) {
        console.log('droplet high')
        sendOsc('/ululations/droplet/high')
        sendQlabGo('/cue/droplet-hv/start')
    } else if (note == STATICS.MIDI_DROPLET_MED) {
        console.log('droplet middle')
        sendOsc('/ululations/droplet/middle')
        sendQlabGo('/cue/droplet-mv/start')
    } else if (note == STATICS.MIDI_DROPLET_LOW) {
        console.log('droplet low')
        sendOsc('/ululations/droplet/low')
        sendQlabGo('/cue/droplet-lv/start')
    } else if (note == STATICS.MIDI_DROPLET_GUIDING) {
        console.log('droplet guiding')
        sendOsc('/ululations/droplet/guiding')
        sendQlabGo('/cue/droplet-gv/start')
    }

    //WAVES
    else if(note == STATICS.MIDI_CTRL_HIGH) {
        const clamped = clampV(velocity)
        const qlab = lerp(0.3, 5.0, clamped)
        sendOsc('/ululations/high', clampV(velocity))
        console.log(`HIGH -> \t${channel} ${note} ${velocity} -> ${clamped}: ${qlab}`)
        sendQlabFloat('/cue/wave-icon-high/scale/y/live', qlab)

    } else if(note == STATICS.MIDI_CTRL_MID) {
        const clamped = clampV(velocity)
        const qlab = lerp(0.3, 5.0, clamped)
        sendOsc('/ululations/middle', clampV(velocity))
        sendQlabFloat('/cue/wave-icon-middle/scale/y/live', qlab)
        console.log(`MIDDLE -> \t${channel} ${note} ${velocity} -> ${clamped}: ${qlab}`)

    } else if(note == STATICS.MIDI_CTRL_LOW) {
        const clamped = clampV(velocity)
        const qlab = lerp(0.3, 5.0, clamped)
        sendOsc('/ululations/low', clampV(velocity))
        sendQlabFloat('/cue/wave-icon-high/scale/y/live', qlab)
        console.log(`LOW -> \t${channel} ${note} ${velocity} -> ${clamped}: ${qlab}`)
    }

    else if(note == STATICS.MIDI_CTRL_LOW) {
        const clamped = clampV(velocity)
        const qlab = lerp(0.3, 5.0, clamped)
        sendOsc('/ululations/low', clampV(velocity))
        sendQlabFloat('/cue/wave-icon-high/scale/y/live', qlab)
        console.log(`LOW -> \t${channel} ${note} ${velocity} -> ${clamped}: ${qlab}`)
    }

    //BUBBLES
     else if(note == STATICS.MIDI_CTRL_BUBBLE_LOW) {
        const clamped = clampV(velocity)
        sendOsc('/ululations/bubble/low', clampV(velocity))
        console.log(`LOW -> \t${channel} ${note} ${velocity} -> ${clamped}: ${qlab}`)

    } else if(note == STATICS.MIDI_CTRL_BUBBLE_MIDDLE) {
        const clamped = clampV(velocity)
        sendOsc('/ululations/bubble/middle', clampV(velocity))
        console.log(`MIDDLE -> \t${channel} ${note} ${velocity} -> ${clamped}: ${qlab}`)

    } else if(note == STATICS.MIDI_CTRL_BUBBLE_HIGH) {
        const clamped = clampV(velocity)
        sendOsc('/ululations/bubble/high', clampV(velocity))
        console.log(`HIGH -> \t${channel} ${note} ${velocity} -> ${clamped}: ${qlab}`)

    //BUBLES WITH VOICE
    } else if(note == STATICS.MIDI_CTRL_BUBBLE_WITH_VOICE_HIGH) {
        const clamped = clampV(velocity)
        sendOsc('/ululations/bubble/high', clampV(velocity))
        console.log(`HIGH -> \t${channel} ${note} ${velocity} -> ${clamped}: ${qlab}`)

    } else if(note == STATICS.MIDI_CTRL_BUBBLE_WITH_VOICE_MIDDLE) {
        const clamped = clampV(velocity)
        sendOsc('/ululations/bubble/middle', clampV(velocity))
        console.log(`MIDDLE -> \t${channel} ${note} ${velocity} -> ${clamped}: ${qlab}`)

    } else if(note == STATICS.MIDI_CTRL_BUBBLE_WITH_VOICE_LOW) {
        const clamped = clampV(velocity)
        sendOsc('/ululations/bubble/low', clampV(velocity))
        console.log(`LOW -> \t${channel} ${note} ${velocity} -> ${clamped}: ${qlab}`)

    //MORES CODE
    } else if( note == STATICS.MIDI_MORSE_CODE_LONG) {
        console.log('mores code long')
        sendQlabGo('cue/mores-long/start')
    } else if( note == STATICS.MIDI_MORSE_CODE_SHORT) {
        console.log('mores code short')
        sendQlabGo('cue/mores-short/start')
    }
})


const clamp = (value, min = 0, max = 127) => {
    if(!value) {
        return min //return zero on bad data
    }
    if(value < min) {
        return min
    } else if (value > max) {
        return max
    } else {
        return value
    }
}

const playNote = (note)=> {
    const on = [MIDI_ON, note, 127]
    output.sendMessage(on)
    console.log('[self.playNote] Note On ' + note);
    console.log(on);
    //60 is middle C at full value
    
    setTimeout(()=>{
        const off = [MIDI_OFF, note, 127]
        output.sendMessage(off)
        console.log('[self.playNote.setTimeout] Note Off ' + note);
        console.log(off);
    }, PULSE_TIME)
}

const playValue = (note, value) => {
    if(value < 1) { 
        //OFF
        value = 0
    } else if (value > 127) {
        //ON
        value = 127
    }

    if(value > 0) {
        const on = [MIDI_ON, note, value]
        output.sendMessage(on)
        console.log(`[self.playValue] Note On  [${note}, ${value}]`)
        console.log(on)
    } else {
        const on = [MIDI_OFF, note, 0]
        output.sendMessage(on)
        console.log(`[self.playValue] Note Off [${note}, ${value}]`)
        console.log(on)
    }
}

//OSC Initialization
let oscListener = new osc.UDPPort({
    localAddress: "0.0.0.0",
    localPort: 53017,
    remoteAddress:STATICS.UNREAL,
    remotePort: 53007,
    metadata:true,
})

let qlab = new osc.UDPPort({
    localAddress: "0.0.0.0",
    localPort: 52999,
    remoteAddress:STATICS.MAC,
    remotePort: 53000,
    metadata:true,
})

//We don't need this logic, we are 
oscListener.on("message", function (oscMsg, timeTag, info) {
    console.log("An OSC message just arrived!", oscMsg);
    console.log("Remote info is: ", info);

    const address = oscMsg.address
    const args = oscMsg.args

    //Logic for all commands here
    if(address.indexOf('drop') > -1 && args[0].value) {
        console.log('Drop Received')
        const voice = args[0].value
        if(voice == 'high') {
            console.log('High Voice')
            playNote(60)

        } else if(voice == 'middle') {
            console.log('Middle Voice')
            playNote(61)

        } else if(voice == 'low') {
            console.log('Low Voice')
            playNote(62)
        } else if(voice == 'guiding-voice') {
            console.log('Guiding Voice')
            console.log('\t -> we do not do anythign here')
        } else {
            console.log(`[ignore wave] ${voice}`)
        }
    } else if (address.indexOf('wave') > -1 && args[0].value ) {
        //these are mapped to the unreal simulation, we do the lerp there...
        console.log('Wave Received')
        const voice = args[0].value
        const velocity = clamp(args[1].value, 0, 127); //we probably need to add a lerp here 

        if(voice = 'high') {
            console.log('high voice wave')
            playValue(63, velocity)
        } else if (voice == 'middle') {
            console.log('middle voice wave')
            playValue(64, velocity)
        } else if (voice == 'low') {
            console.log('low voice wave')
            playValue(66, velocity)
        } else if(voice == 'guiding-voice') {
            console.log('Guiding Voice Wave')
            console.log('\t -> we do not do anythign here')
        } else {
            console.log(`[ignore wave] ${voice}@${velocity}`)
        }
    } else if (address.indexOf('bubble') > -1 && args[0].value) {
        const voice = args[0].value
        const velocity = clamp(args[1].value, 0, 127); //we probably need to add a lerp here 
        
        if(voice = 'high') {
            console.log('high voice bubble')
            playValue(63, velocity)
        } else if (voice == 'middle voice bubble') {
            console.log('middle voice wave')
            playValue(64, velocity)
        } else if (voice == 'low') {
            console.log('low voice bubble')
            playValue(66, velocity)
        } else if(voice == 'guiding-voice bubble') {
            console.log('Guiding Voice bubble')
            console.log('\t -> we do not do anythign here')
        } else {
            console.log(`[ignore wave] ${voice}@${velocity}`)
        }
    }

    //
    //High Voice Drop
});

oscListener.open();
qlab.open();
//Test method for dropping something, we want to send one frame of "on"
/*
*/
// let spam = setInterval(()=>{
//     console.log('sending note C');
//     const on = [MIDI_ON, 60, 127]
//     output.sendMessage(on)
//     console.log(on);
//     //60 is middle C at full value
    
//     setTimeout(()=>{
//         const off = [MIDI_OFF, 60, 127]
//         output.sendMessage(off)
//         console.log(off);
//     }, PULSE_TIME)
//     //return [midiCommand.toString(16), 60, 127] 
// },2000)
//*/



//AUTOMATIC SHUTDOWN FOR DEV
// setTimeout(function() {
//   // clearInterval(interval)
//   //input.closePort();
//   console.log('EXITING....')
//   output.closePort()
//   oscListener.close()
//   process.exit();
// }, 150000 * 10);

const message = (typeAndChannel, value, deltaT) => {


    let midiStatus = typeAndChannel
    let midiCommand = typeAndChannel & 0xF0;  // mask off all but top 4 bits
    let midiChannel = -1;
    if (midiCommand >= 0x80 && midiCommand <= 0xE0) {
        // it's a voice message
        // find the channel by masking off all but the low 4 bits
        midiChannel = typeAndChannel & 0x0F;

        // now you can look at the particular midiCommand and decide what to do
    } else {
        console.log("ignoring midi, not a voice command")
    }

    //DEBUG
    // console.log(midiStatus.toString(16))
    // console.log(midiCommand.toString(16))
    // console.log(midiChannel.toString(16))
    // console.log(value)

    return [midiCommand.toString(16), midiChannel, value]
}

//TEST FUNCTIONS DISABLE ME WHEN LIVE

if(DEV_DATA) {
    let intervalIndex = 0
    setInterval( () => {
        let msg = "/ululations/droplet/low"
        if( intervalIndex % 4 == 1) {
            msg = "/ululations/droplet/middle"
        } else if( intervalIndex % 4 == 2) {
            msg = "/ululations/droplet/high"
        } else if( intervalIndex % 4 == 3) {
            msg = "/ululations/droplet/guiding"
        }
        
        intervalIndex++;
        console.log(`sending message ${msg}`)
        oscListener.send({
            address: msg
        })
    }, 1000)

    let loopInterval = 0

    setInterval( () => {
        let msg = "/ululations/high"
        if( intervalIndex % 4 == 1) {
            msg = "/ululations/middle"
        } else if( intervalIndex % 4 == 2) {
            msg = "/ululations/low"
        } else if( intervalIndex % 4 == 3) {
            msg = "/ululations/guiding"
        }
        
        loopInterval = (loopInterval + 0.05) % 1.0
        console.log(`sending message ${msg} ${loopInterval}`)
        oscListener.send({
            address: msg,
            args: [{
                type: "f",
                value: loopInterval
            }]
        })
    }, 100)
}


const sendOsc = (address, fltArg) => {
    oscListener.send({
            address: address,
            args: [{
                type: "f",
                value: fltArg
            }]
        })
}

const sendQlabGo = (address, fltArg) => {
    qlab.send({
            address: address
        })
}

const sendQlabFloat = (address, fltArg) => {
    qlab.send({
            address: address,
            args: [{
                type: "f",
                value: fltArg.toFixed(2)
            }]
        })
}


//END TEST FUNCTIONS
//CLEANUP
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
    console.log('EXIT COMPLETE, ')
})

// // Configure a callback.
// input.on('message', (deltaTime, message) => {
//   // The message is an array of numbers corresponding to the MIDI bytes:
//   //   [status, data1, data2]
//   // https://www.cs.cf.ac.uk/Dave/Multimedia/node158.html has some helpful
//   // information interpreting the messages.
//   // console.log(`m: ${message} d: ${deltaTime}`);
//   // console.log('message!!!')
//   output.sendMessage(message)
// });

// Sysex, timing, and active sensing messages are ignored
// by default. To enable these message types, pass false for
// the appropriate type in the function below.
// Order: (Sysex, Timing, Active Sensing)
// For example if you want to receive only MIDI Clock beats
// you should use
// input.ignoreTypes(true, false, true)
// input.ignoreTypes(false, false, false);

// ... receive MIDI messages ...

// Close the port when done.




// let sender = () => {
//   output.sendMessage( [176, 22, 1] )
// }

// let interval = setInterval(sender, 1000)


