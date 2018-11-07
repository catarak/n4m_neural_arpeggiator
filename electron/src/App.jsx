import { Component } from 'react';
import io from './utils/io';
import * as mm from '@magenta/music';

// will need to io.emit to send sequence back, will need some io event to receive sequence
// lol this doesn't actually need react, can probably take this out

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loaded: false
    };
    this.seq = [];
  }

	componentDidMount() {
	  

	  // load pre-trained model
    this.rnn = new mm.MusicRNN(
      'https://storage.googleapis.com/download.magenta.tensorflow.org/tfjs_checkpoints/music_rnn/chord_pitches_improv'
    );
    this.rnn.initialize().then(() => {
      console.log('initialized');
      this.setState({loaded: true});
    });
    io.on("generate", (data) => {
      let genSeq = [];
      let generateNext = (data) => {
        let { seq, chord, temperature, patternLength } = data;
        this.rnn.continueSequence(seq, 20, temperature, [chord]).then(response => {
          let flatNotes = response.notes.map(note => note.pitch);
          genSeq = genSeq.concat(flatNotes);
          io.emit("generatedComplete", genSeq);
          if (genSeq.length < patternLength) {
            setTimeout(generateNext.bind(this, data), 25); // 125 MS is for 8n at 120 BPM
          }
        });
      }
      generateNext(data);
    });
  }

  render() {
    return (
      <div className="container" style={{margin:'20px'}}>
        <h1>Neural Arpeggiator in Node For Max</h1>
        <p>{this.state.loaded && "loaded"}</p>
      </div>
    );
  }
}

