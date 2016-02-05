import React from 'react';
import { connect } from 'react-redux';

class Secondary extends React.Component {

  static propTypes = {
    counter: React.PropTypes.number.isRequired
  };

  render() {
    return (
      <div className="Secondary">
        Hello Mars!  You've clicked {this.props.counter} number of times
      </div>
    );
  }

}

export default connect((state) => ({
  counter: state.counter
}))(Secondary);
