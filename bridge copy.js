///
/// Connect and OSC input stream and output MIDI notes to a local application. 
///
const midi = require('midi');

// SETUP
const PORT_NAME = 'UlulationsOSC'
const PULSE_TIME = 1000/20; //assume 60FPS, we might need to drop to 30
const MIDI_CHANNEL = 0;
const MIDI_ON = 0x90 & 0xF0;  // mask off all but top 4 bits
const MIDI_OFF = 0x80 & 0xF0; //and yes, this shift is dumb, but it is to remember that it is Command / Channel as one set of bytes in the messeage format
let PORT = -1;
let PORT_NAME_INSTANCE = -1;

const output = new midi.Output();

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

//Test method for dropping something, we want to send one frame of "on"
let spam = setInterval(()=>{
    console.log('sending note C');
    const on = [MIDI_ON, 60, 127]
    output.sendMessage(on)
    console.log(on);
    //60 is middle C at full value
    
    setTimeout(()=>{
        const off = [MIDI_OFF, 60, 127]
        output.sendMessage(off)
        console.log(off);
    }, PULSE_TIME)
    //return [midiCommand.toString(16), 60, 127] 
},2000)



//AUTOMATIC SHUTDOWN FOR DEV
setTimeout(function() {
  // clearInterval(interval)
  //input.closePort();
  console.log('EXITING....')
  output.closePort();
  process.exit();
}, 150000 * 4);

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


