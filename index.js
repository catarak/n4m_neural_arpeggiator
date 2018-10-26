
// This file is the single-entrypoint for the Max patch.
// When this file is executed via `node.script start` in the Max patch,
// this program will launch an Electron app as a child process, and connect to it by socket.io

const MaxAPI = require('max-api');
const io = require('socket.io')();
const electron = require('electron');
const proc = require('child_process');
const child = proc.spawn(electron, ['./electron']);
const Tonal = require('tonal');

// io.on('connection', (socket) => {

//   console.log('Socket is connected with Electron App');

//   socket.on('dispatch', (data) => { 
//     console.log('dispatch: ', data);
//     MaxAPI.outlet(data);
//   });

// });

// io.listen(3000);

// // This will ensure that when this parent process is killed in maxpat (either by `node.script stop` or Max is shutdown for some reason),
// // it will terminate the child process, the Electron app.
// process.on('exit', () => {
//   child.kill();
// });

let notes = [];

MaxAPI.addHandler('note', (midiNote, velocity) => {
  applyKeyChanges(midiNote, velocity);
  let chords = detectChord();
  let chord = chords[0] ||
    Tonal.Note.pc(Tonal.Note.fromMidi(notes[0])) + 'M'; // does notes need to be sorted here??
});

const applyKeyChanges = (midiNote, velocity) => {
  // MaxAPI.post(`${midiNote}, ${velocity}`);
  if (velocity === 0) {
    notes = notes.filter(note => note !== midiNote);
  } else {
    notes.push(midiNote);
  }
  MaxAPI.post(notes);
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
