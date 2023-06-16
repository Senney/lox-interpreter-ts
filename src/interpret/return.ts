const ReturnSymbol = Symbol('return');

class Return extends Error {
  public [ReturnSymbol] = true;

  constructor(public readonly value: unknown) {
    super();
  }
}

const isReturnError = (err: unknown): err is Return => {
  return (
    typeof err === 'object' &&
    err !== null &&
    Object.prototype.hasOwnProperty.call(err, ReturnSymbol) &&
    (err as Return)[ReturnSymbol] === true
  );
};

export { Return, isReturnError };
