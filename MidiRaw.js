const midi = require('midi');

// Set up a new input.
const input = new midi.Input();
const output = new midi.Output();

// Count the available input ports.
input.getPortCount();

for(let i = 0; i < input.getPortCount(); i++) {
    console.log(`${i}-> ${input.getPortName(i)}`)
}

output.openPort(3)
input.openPort(2);

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

// Configure a callback.
input.on('message', (deltaTime, message) => {
  // The message is an array of numbers corresponding to the MIDI bytes:
  //   [status, data1, data2]
  // https://www.cs.cf.ac.uk/Dave/Multimedia/node158.html has some helpful
  // information interpreting the messages.
  // console.log(`m: ${message} d: ${deltaTime}`);
  // console.log('message!!!')
  output.sendMessage(message)
});

// Sysex, timing, and active sensing messages are ignored
// by default. To enable these message types, pass false for
// the appropriate type in the function below.
// Order: (Sysex, Timing, Active Sensing)
// For example if you want to receive only MIDI Clock beats
// you should use
// input.ignoreTypes(true, false, true)
input.ignoreTypes(false, false, false);

// ... receive MIDI messages ...

// Close the port when done.
// setTimeout(function() {
//   // clearInterval(interval)
//   input.closePort();
//   output.closePort();
// }, 150000);



// let sender = () => {
//   output.sendMessage( [176, 22, 1] )
// }

// let interval = setInterval(sender, 1000)


