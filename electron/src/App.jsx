import { Component } from 'react';
import io from './utils/io';
import * as mm from '@magenta/music';

// will need to io.emit to send sequence back, will need some io event to receive sequence

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loaded: false
    };
  }

	componentDidMount() {
	  

	  // load pre-trained model
    this.rnn = new mm.MusicRNN(
      'https://storage.googleapis.com/download.magenta.tensorflow.org/tfjs_checkpoints/music_rnn/chord_pitches_improv'
    );
    this.rnn.initialize().then(() => {
      this.setState({loaded: true});
    });

    // TODO io event handlers
	}

  render() {
    return (
      <div className="container" style={{margin:'20px'}}>
        <h1>Neural Arpeggiator in Node For Max</h1>
        <p>{this.state.loaded}</p>
      </div>
    );
  }
}

