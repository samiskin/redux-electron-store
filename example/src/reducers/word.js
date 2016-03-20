import { CHANGE_WORD } from '../actions/Actions'

export default function word(state = "", action) {
  switch (action.type) {
    case CHANGE_WORD:
      return action.data;
    default:
      return state;
  }
}
