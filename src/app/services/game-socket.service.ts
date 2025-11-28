import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject, finalize, map, shareReplay, takeUntil, timer, withLatestFrom } from 'rxjs';
import { SocketPayload } from '../models/game.models';

@Injectable({ providedIn: 'root' })
export class GameSocketService implements OnDestroy {
  private activeDisconnect$?: Subject<void>;
  private stopTimeoutId?: ReturnType<typeof setTimeout>;

  createPayloadStream(source$: Observable<SocketPayload>): Observable<SocketPayload> {
    const disconnect$ = new Subject<void>();
    this.stop();
    this.activeDisconnect$ = disconnect$;
    return timer(0, 1000).pipe(
      withLatestFrom(source$),
      map(([, payload]) => payload),
      takeUntil(disconnect$),
      finalize(() => {
        if (this.activeDisconnect$ === disconnect$) {
          this.activeDisconnect$ = undefined;
        }
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  stop(delayMs = 0): void {
    this.cancelPendingStop();

    if (delayMs > 0) {
      this.stopTimeoutId = setTimeout(() => {
        this.stopNow();
        this.stopTimeoutId = undefined;
      }, delayMs);
      return;
    }

    this.stopNow();
  }

  private stopNow(): void {
    this.cancelPendingStop();
    if (this.activeDisconnect$) {
      this.activeDisconnect$.next();
      this.activeDisconnect$.complete();
      this.activeDisconnect$ = undefined;
    }
  }

  private cancelPendingStop(): void {
    if (this.stopTimeoutId !== undefined) {
      clearTimeout(this.stopTimeoutId);
      this.stopTimeoutId = undefined;
    }
  }

  ngOnDestroy(): void {
    this.stopNow();
    this.activeDisconnect$?.complete();
  }
}
