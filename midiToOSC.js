import midi from 'midi'
import osc from 'osc'
import exitHook from 'exit-hook'
// SETUP
const PORT_NAME = 'UlulationsOSC'
const PULSE_TIME = 1000/20; //assume 60FPS, we might need to drop to 30const MIDI_CHANNEL = 0;
const MIDI_ON = 0x90 & 0xF0;  // mask off all but top 4 bits
const MIDI_OFF = 0x80 & 0xF0; //and yes, this shift is dumb, but it is to remember that it is Command / Channel as one set of bytes in the messeage format
const MIDI_CONTROL = 0xB0 & 0xF0; //and yes, this shift is dumb, but it is to remember that it is Command / Channel as one set of bytes in the messeage format
let PORT = -1;
let PORT_NAME_INSTANCE = -1;


//OSC Startup
let oscListener = new osc.UDPPort({
    localAddress: "0.0.0.0",
    localPort: 53008,
    remoteAddress: "192.168.1.124",//unreal
    remotePort:53007,
    metadata:true,
})

oscListener.on('message', (msg, time, info) => {
    console.log(`[OSC IN] [t:${time} info:${JSON.stringify(info)}]: ${JSON.stringify(msg)}`)
})

oscListener.open();
//MIDI Startup
const input = new midi.Input();
// Count the available input ports.
input.getPortCount();
console.log('LISTING ALL PORTS')
for(let i = 0; i < input.getPortCount(); i++) {
    console.log(`\t${i}-> ${input.getPortName(i)}`)

    let n = input.getPortName(i)
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

input.openPort(PORT)

//We only support hundredths wwhich is a waste of a byte.
const sendOsc = (address, value) => {
    //console.log('send...')
    const data = {
        address: address,
        args: [
            {type : "f", value: value.toFixed(2)}
        ]
    }
    oscListener.send(data)
    console.log("[osc out] \t -> " + JSON.stringify(data))

}

input.on('message', (dT, message) => {
      // The message is an array of numbers corresponding to the MIDI bytes:
  //   [status, data1, data2]
  // https://www.cs.cf.ac.uk/Dave/Multimedia/node158.html has some helpful
  // information interpreting the messages.
  
  //console.log(`hex" ${message[0].toString(16)} m: ${message} d: ${dT}`)
  //console.log(`\tHelpers -> on->${MIDI_ON.toString(16)} off->${MIDI_OFF.toString(16)} control->${MIDI_CONTROL.toString(16)}`)

  //Rough Mappings
  //Upper panel 70, 71, 72, 73
  //Lower panel 74, 75, 76, 77
  //176/74
    const value = message[2]
    if       (message[1] == 70) {
        sendOsc('/ululations/low', value)
    } else if(message[1] == 71) {
        sendOsc('/ululations/middle', value)
    } else if(message[1] == 72) {
        sendOsc('/ululations/high', value)
    } else if(message[1] == 73) {
        sendOsc('/ululations/guiding', value)
    } else if(message[1] == 74) {
        sendOsc('/ululations/bubbles/low', value)
    } else if(message[1] == 75) {
        sendOsc('/ululations/bubbles/middle', value)
    } else if(message[1] == 76) {
        sendOsc('/ululations/bubbles/high', value)
    } else if(message[1] == 77) {
        sendOsc('/ululations/bubbles/guiding', value)
    }
})

//CLEANUP
exitHook(signal=>{
    console.log(`[exit-hook] signal:${signal}`)
    console.log('EXITING....')

    try {
        input.closePort();
        console.log('\tMIDI PORT CLOSED [critical this is a success]')
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