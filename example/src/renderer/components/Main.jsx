import React from 'react';
import CounterActions from 'actions/CounterActions';
import { connect } from 'react-redux';

class Main extends React.Component {

  static propTypes = {
    counter: React.PropTypes.number.isRequired
  };

  handleClick(e) {
    CounterActions.increment();
  }

  render() {
    return (
      <div className="Main">
        Hello World!
        <button onClick={this.handleClick.bind(this)}> Click count: {this.props.counter} </button>
      </div>
    );
  }

}

export default connect((state) => ({
  counter: state.counter
}))(Main);
