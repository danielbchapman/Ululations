var easymidi = require('easymidi');

var inputs = easymidi.getInputs();

for(var x of inputs) {
    console.log(x)
}

const MIDI_PORT = "Network Production"

var input = new easymidi.Input(MIDI_PORT);
input.on('noteon', function (msg) {
    console.log('note-on:' + JSON.stringify(msg, null, 2));
});

input.on('noteoff', function (msg) {
    console.log('note-off:' + JSON.stringify(msg, null, 2));
});

input.on('cc', function (msg) {
    console.log('cc:' + JSON.stringify(msg, null, 2));
});

console.log("listening");

// //SHUTDOWN
// setTimeout(()=>{
//     input.close();
// }, 100000)

// import midi from midi

