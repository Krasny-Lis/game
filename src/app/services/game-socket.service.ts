import { DestroyRef, Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject, map, shareReplay, switchMap, takeUntil, takeUntilDestroyed, timer, withLatestFrom } from 'rxjs';
import { SocketPayload } from '../models/game.models';

@Injectable({ providedIn: 'root' })
export class GameSocketService implements OnDestroy {
  private readonly stopRequests$ = new Subject<number>();

  constructor(private readonly destroyRef: DestroyRef) {}

  createPayloadStream(source$: Observable<SocketPayload>): Observable<SocketPayload> {
    const stop$ = this.stopRequests$.pipe(switchMap((delayMs) => timer(delayMs)));

    return timer(0, 1000).pipe(
      withLatestFrom(source$),
      map(([, payload]) => payload),
      takeUntil(stop$),
      takeUntilDestroyed(this.destroyRef),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  stop(delayMs = 0): void {
    this.stopRequests$.next(delayMs);
  }

  ngOnDestroy(): void {
    this.stop();
    this.stopRequests$.complete();
  }
}
