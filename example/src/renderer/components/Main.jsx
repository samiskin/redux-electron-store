import React from 'react';
import Actions from 'actions/Actions';
import { connect } from 'react-redux';

class Main extends React.Component {

  static propTypes = {
    counter: React.PropTypes.number.isRequired,
    word: React.PropTypes.string.isRequired
  };

  handleClick(e) {
    Actions.increment();
  }

  handleWordClick(e) {
    Actions.changeWord('Clicked ' + this.props.counter);
  }

  render() {
    return (
      <div className="Main">
        Hello World!
        <button onClick={this.handleClick.bind(this)}> Click count: {this.props.counter} </button>
        <button onClick={this.handleWordClick.bind(this)}> Word: {this.props.word} </button>
      </div>
    );
  }

}

export default connect((state) => ({
  counter: state.counter,
  word: state.word
}))(Main);
