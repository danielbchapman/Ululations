import Qlab from './LightAsssistantEosModule'
import fs from 'fs-extra'
import osc from 'osc'

import { 
    critical,
    debug,
    info,
    setLevel,
    LEVELS
} from './SimpleLog'

let lines = `Ululations and Gurgles of the Invisible

Welcome to The Mosesian Center for the Arts and Guerilla Opera’s showing of Ululations and Gurgles of the Invisible.

Before we begin, please take a moment to locate the nearest exits. There are two behind you at the top of the stairs and two from which you entered.

In the event of an emergency, please calmly exit and move away from the building.  

Please turn your devices off or to airplane mode with vibrations off, unless needed for accessibility.

There is also the possibility of pulsing or strobing lights and moments where the theater gets extremely dark.

Thank you and enjoy this showing of Ululations and Gurgles of the Invisible!
Ululations and Gurgles of the Invisible


Chapter 1: The Silent Boy
The silent boy is looking for his voice


Voice


Cricket


Droplet


Ring


(sounds: Morse Code, slapping, short and long rhythms)

Voice


Ring


Cricket


Droplet


Silence


Voice


Ring


Cricket


Droplet


Silence


(sounds: vibraphone, ringing high and low, one note at a time, vibrato)

Silence

(sounds: wooden bowls in water, hollow sounds bending)

Voice

Ring

Cricket

Droplet

Silence

(sounds: one note ringing)

V

(sounds: hollow wooden bowls)

O

(sounds: timpani rumbles, quiet, powerful, low resonance)

I

(sounds: alternating vibraphone, bowls and timpani with each letter)

C

E

R  I  N  G


C  R  I  C  K  E  T


D R O P L E T

S  I  L  E  N  C  E 


V  O  I  C  E


Silence


R  I  N  G


Silence


C  R  I  C  K  E  T


Silence


D  R  O  P  L  E T 


Silence


S  I  L  E  N  C  E


Silence


(sounds: solo hollow wooden bowls)

Silence

(sounds: Morse Code)
*slap* *smack*

Silence.


Silence…


Chapter 2: Gurgles
The voice dances underwater


The little boy was looking for his voice.

The king of the crickets had it.

In a drop of water

the little boy was looking for his voice


(sounds: water droplets)
*trickle* *drip drop*


(sounds: gentle splashes)


(electronic music: chimes slowly fade in, gentle pulses)

(motion sensor sounds:
gentle splash, drops of water)


(sounds: water bubbles, gentle excitement)


(piano music: sparkling high notes, one note at a time)

(simultaneous motion sensor sounds: *drip drop* into gurgling bubbles into gentle electronic whirls.)


I do not want it to speak with;

I will make a ring of it

so that he may wear my silence

on his little finger.

In a drop of water

the little boy was
looking for his voice.

The captive voice, far away,

put on a cricket’s clothes.

(“The Shadow's Theme”,
lyrical flowing piano melody)

In a drop of water
the little boy was looking for his voice.
The captive voice, far away,
put on a cricket’s clothes.


In a drop of water
the little boy was looking for his voice.
The captive voice, far away,
put on a cricket’s clothes.


Chapter 3: Betrothal
The Queen of the Crickets is getting married

Her wedding ring is the ring of The Silent Boy.

(piano: romantic wedding march)

(soprano: ululations, vibrant high notes and trills)

*L L L L L*    *Ah Ah Ahhhh*
*R R R R R*

Silence

Water

Ring

(piano music: trills)

(music: soprano pulsing fast high notes, punctuated piano chords both trill high notes)

*Ahhhh*

(piano music: fast, descending)

(soprano: trills low notes)

*Ahhhh*

Throw that ring into the water.

The shadow places its fingers on my back.

(soprano: pulsing fast high notes)

*Ahhhh*

Throw that ring into the water.

I am more than a hundred years old.

(soprano: fast notes into a high trill,
into throated pulsing high note)

*Ah ah ah aaaaaah*

Throw that ring. 

(piano: heavy chords
heavy chords and persistent trills)

(soprano: high note into throated pulsing high note)

*Ah ah aaaah*

Silence! Silence! Silence!

(soprano: pulses and sweeps fast notes)

*Ah ah ah ah aaah*

(soprano: trilled high note)

*Ahhhhhhh*

Don’t ask me anything!

(music: piano pulses energetic chords,
soprano pulses, trills sweeping)

*Ah ah ah aaaaaah*

(soprano: tired low tremolos)

*r r r r r r r    ahhhhh    r r r r r r*

Throw that ring into the water.

(soprano: pulses and trills, sweeping high and low)

*Aaah*

(soprano: tired low tongue tremolos)

* r r r r r r r *

Throw that ring into the water.

Ululations and Gurgles
of the Invisible`

function isEmpty(str){
    return str === null || str.match(/^ *$/) !== null;
}

var separateLines = lines.split(/\r?\n|\r|\n/g);

for(let line of separateLines) {
    console.log(('LINE: ' + line))
}

let slides = []

var slide = ''
for(let line of separateLines) {
    if( isEmpty(line)) {
        slides.push(slide)
        slide = ''
    } else {
        slide += line + '\n';
    }
}

console.log('---------_TO SLIDES--------------')
console.log('---------_TO SLIDES--------------')
console.log('---------_TO SLIDES--------------')
let index = 1;
for(let slide of slides) {
    console.log(slide);
    console.log('>>>>>SLIDE ' + index)
    index++
}

let out =  new osc.TCPSocketPort({
    address: '127.0.0.1',
    port: 53000,
    //useSLIP: version == VERSIONS.VERSION_1_1 ? true : false
})

const data = [1,2,3]


let newLine = '\n'
out.on('ready', () => {
    console.log('READy')
    let delay = 100
    for(let i = 0; i < slides.length; i++) {
        setTimeout(()=>{
            console.log('ending slide: ' + i)
            out.send({
                address: '/workspace/3044EC2E-0945-40C1-8696-459621CDF7BB/new',
                args: ['text']
            })
        
            out.send({
                address: '/cue/selected/text',
                args:[ slides[i] ]
            })
        
            out.send({
                address: '/cue/selected/name',
                args:[ slides[i] ]
            })
        }, delay * i)
    }    
})

out.open()


