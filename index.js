
// This file is the single-entrypoint for the Max patch.
// When this file is executed via `node.script start` in the Max patch,
// this program will launch an Electron app as a child process, and connect to it by socket.io

const MaxAPI = require('max-api');
const io = require('socket.io')();
const electron = require('electron');
const proc = require('child_process');
const child = proc.spawn(electron, ['./electron']);
const Tonal = require('tonal');

io.on('connection', (socket) => {

  console.log('Socket is connected with Electron App');

  socket.on('generatedComplete', (genSeq) => {
    // MaxAPI.post(genSeq);
    MaxAPI.outlet(...genSeq);
  });
});

io.listen(3000);

// This will ensure that when this parent process is killed in maxpat (either by `node.script stop` or Max is shutdown for some reason),
// it will terminate the child process, the Electron app.
process.on('exit', () => {
  child.kill();
});

let notes = [];
let temperature = 1.1;
let patternLength = 8;

let generatedSeq = [];

MaxAPI.addHandler('note', (midiNote, velocity) => {
  applyKeyChanges(midiNote, velocity);
  if (notes.length > 0) {
    let chords = detectChord();
    let chord = chords[0] ||
    Tonal.Note.pc(Tonal.Note.fromMidi(notes[0])) + 'M';
    let seq = buildNoteSequence();
    io.emit("generate", { seq, chord, temperature, patternLength });
  }
});

MaxAPI.addHandler('setTemperature', (newTemp) => {
  // is temp a number here?
  temperature = newTemp;
});

MaxAPI.addHandler('setPatternLength', (newPatternLength) => {
  // is pattern length a number here?
  patternLength = newPatternLength;
});

const applyKeyChanges = (midiNote, velocity) => {
  // MaxAPI.post(`${midiNote}, ${velocity}`);
  if (velocity === 0) {
    notes = notes.filter(note => note !== midiNote);
  } else {
    notes.push(midiNote);
  }
  // MaxAPI.post(notes);
}

const detectChord = () => {
  let pcNotes = notes.map(n => Tonal.Note.pc(Tonal.Note.fromMidi(n))).sort();
  return Tonal.PcSet.modes(pcNotes)
    .map((mode, i) => {
      const tonic = Tonal.Note.name(pcNotes[i]);
      const names = Tonal.Dictionary.chord.names(mode);
      return names.length ? tonic + names[0] : null;
    })
    .filter(x => x);
}

const buildNoteSequence = () => {
  let step = 0;
  // let delayProb = pulsePattern ? 0 : 0.3;
  let delayProb = 0;
  let seq = notes.map(n => {
    let dur = 1 + (Math.random() < delayProb ? 1 : 0); //always 1 if delayProb is 0
    let note = {
      pitch: n,
      quantizedStartStep: step,
      quantizedEndStep: step + dur
    };
    step += dur;
    return note;
  });
  return {
    totalQuantizedSteps: seq[seq.length-1].quantizedEndStep,
    quantizationInfo: {
      stepsPerQuarter: 1
    },
    notes: seq
  };
}
