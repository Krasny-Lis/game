import { Injectable, OnDestroy } from '@angular/core';
import { EMPTY, Observable, Subject, map, shareReplay, takeUntil, timer, withLatestFrom } from 'rxjs';
import { SocketPayload } from '../models/game.models';

@Injectable({ providedIn: 'root' })
export class GameSocketService implements OnDestroy {
  private activeDisconnect$?: Subject<void>;

  createPayloadStream(source$: Observable<SocketPayload>): Observable<SocketPayload> {
    const disconnect$ = new Subject<void>();
    this.stop();
    this.activeDisconnect$ = disconnect$;
    return timer(0, 1000).pipe(
      withLatestFrom(source$),
      map(([, payload]) => payload),
      takeUntil(disconnect$),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  stop(): Observable<never> {
    if (this.activeDisconnect$) {
      this.activeDisconnect$.next();
      this.activeDisconnect$.complete();
      this.activeDisconnect$ = undefined;
    }
    return EMPTY;
  }

  ngOnDestroy(): void {
    this.stop();
    this.activeDisconnect$?.complete();
  }
}
