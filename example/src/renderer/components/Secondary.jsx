import React from 'react';
import { connect } from 'react-redux';

class Secondary extends React.Component {

  static propTypes = {
    clickCount: React.PropTypes.number.isRequired
  }

  render() {
    return (
      <div className="Secondary">
        Hello Mars!  You've clicked {this.props.clickCount} number of times
      </div>
    );
  }

}

export default connect((state) => ({
  clickCount: state.clickCount
}))(Secondary);
