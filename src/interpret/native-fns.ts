import { NativeCallable } from './callable';

class ClockCallable extends NativeCallable {
  arity(): number {
    return 0;
  }

  call(): unknown {
    return Date.now() / 1000;
  }
}

export { ClockCallable };
