///
/// Connect and OSC input stream and output MIDI notes to a local application. 
///
import midi from 'midi'
import osc from 'osc'
import exitHook from 'exit-hook'
import STATICS from './statics'
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

input.on('message', (dT, msg) => {
    console.log(`m: ${msg} d: ${dT}`)
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
    remoteAddress:"192.168.0.8",
    remotePort: 53007,
    metadata:true,
})

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
setTimeout(function() {
  // clearInterval(interval)
  //input.closePort();
  console.log('EXITING....')
  output.closePort()
  oscListener.close()
  process.exit();
}, 150000 * 10);

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

//TEST FUNCTIONS
let intervalIndex = 0
// setInterval( () => {
//     let msg = "/ululations/droplet/low"
//     if( intervalIndex % 4 == 1) {
//         msg = "/ululations/droplet/middle"
//     } else if( intervalIndex % 4 == 2) {
//         msg = "/ululations/droplet/high"
//     } else if( intervalIndex % 4 == 3) {
//         msg = "/ululations/droplet/guiding"
//     }
    
//     intervalIndex++;
//     console.log(`sending message ${msg}`)
//     oscListener.send({
//         address: msg
//     })
// }, 1000)

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


