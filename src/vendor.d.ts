declare module NodeJS {
  interface Global {
    __REDUX_ELECTRON_STORE__InitialState: () => string;
  }
  interface Process {
    guestInstanceId?: string;
  }
}
