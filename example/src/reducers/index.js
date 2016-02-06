import { combineReducers } from 'redux'
import counter from './counter'
import word from './word'

let rootReducer = combineReducers({
  counter
});

if(process.type === 'renderer') {
  rootReducer = combineReducers({
    counter,
    word
  });
}

console.log(rootReducer(undefined, {type: 'INIT'}));


export default rootReducer
