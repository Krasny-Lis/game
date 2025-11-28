import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject, map, shareReplay, takeUntil, timer, withLatestFrom } from 'rxjs';
import { SocketPayload } from '../models/game.models';

@Injectable({ providedIn: 'root' })
export class GameSocketService implements OnDestroy {
  private disconnect$ = new Subject<void>();

  createPayloadStream(source$: Observable<SocketPayload>): Observable<SocketPayload> {
    this.resetConnection();
    return timer(0, 1000).pipe(
      withLatestFrom(source$),
      map(([, payload]) => payload),
      takeUntil(this.disconnect$),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  stop(): void {
    this.resetConnection();
  }

  ngOnDestroy(): void {
    this.stop();
    this.disconnect$.complete();
  }

  private resetConnection(): void {
    this.disconnect$.next();
    this.disconnect$.complete();
    this.disconnect$ = new Subject<void>();
  }
}
