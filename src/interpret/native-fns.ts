import { Callable } from './callable';

class ClockCallable implements Callable {
  arity(): number {
    return 0;
  }

  call(): unknown {
    return Date.now() / 1000;
  }
}

export { ClockCallable };
