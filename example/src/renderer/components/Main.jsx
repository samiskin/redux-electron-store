import React from 'react';
import CounterActions from 'actions/CounterActions';
import { connect } from 'react-redux';

class Main extends React.Component {

  static propTypes = {
    clickCount: React.PropTypes.number.isRequired
  };

  handleClick(e) {
    CounterActions.increment();
  }

  render() {
    return (
      <div className="Main">
        Hello World!
        <button onClick={this.handleClick.bind(this)}> Click count: {this.props.clickCount} </button>
      </div>
    );
  }

}

export default connect((state) => ({
  clickCount: state.clickCount
}))(Main);
