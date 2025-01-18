console.log("test midi channels");

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

    console.log(midiStatus.toString(16))
    console.log(midiCommand.toString(16))
    console.log(midiChannel.toString(16))
    console.log(value)

    return [midiCommand.toString(16), midiChannel, value]
}
console.log('->' + message(176,22,1));
console.log('->' + message(177,22,1));