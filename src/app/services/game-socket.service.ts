import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject, interval, map, takeUntil, tap, withLatestFrom } from 'rxjs';
import { SocketPayload } from '../models/game.models';

@Injectable({ providedIn: 'root' })
export class GameSocketService implements OnDestroy {
  private destroy$ = new Subject<void>();
  private readonly payloadSubject = new BehaviorSubject<SocketPayload>({ caughtObjects: 0, timeRemaining: 0 });

  connect(source$: Observable<SocketPayload>): Observable<SocketPayload> {
    this.stop();
    this.destroy$ = new Subject<void>();
    interval(1000)
      .pipe(
        withLatestFrom(source$),
        map(([, payload]) => payload),
        tap((payload) => this.payloadSubject.next(payload)),
        takeUntil(this.destroy$)
      )
      .subscribe();

    return this.payloadSubject.asObservable();
  }

  stop(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnDestroy(): void {
    this.stop();
  }
}
