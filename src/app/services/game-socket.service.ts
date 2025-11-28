import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject, interval, map, takeUntil, tap, withLatestFrom } from 'rxjs';
import { SocketPayload } from '../models/game.models';

@Injectable({ providedIn: 'root' })
export class GameSocketService implements OnDestroy {
  private static readonly INITIAL_PAYLOAD: SocketPayload = { caughtObjects: 0, timeRemaining: 0 };

  private readonly destroy$ = new Subject<void>();
  private readonly payloadSubject = new BehaviorSubject<SocketPayload>(GameSocketService.INITIAL_PAYLOAD);
  readonly payload$: Observable<SocketPayload> = this.payloadSubject.asObservable();

  connect(source$: Observable<SocketPayload>): Observable<SocketPayload> {
    this.stop();
    interval(1000)
      .pipe(
        withLatestFrom(source$),
        map(([, payload]) => payload),
        tap((payload) => this.payloadSubject.next(payload)),
        takeUntil(this.destroy$)
      )
      .subscribe();

    return this.payload$;
  }

  stop(): void {
    this.destroy$.next();
    this.payloadSubject.next(GameSocketService.INITIAL_PAYLOAD);
  }

  ngOnDestroy(): void {
    this.stop();
    this.destroy$.complete();
    this.payloadSubject.complete();
  }
}
