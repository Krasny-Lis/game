import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject, Subscription, interval, takeUntil, withLatestFrom } from 'rxjs';
import { SocketPayload } from '../models/game.models';

@Injectable({ providedIn: 'root' })
export class GameSocketService implements OnDestroy {
  private destroy$ = new Subject<void>();
  private payload$ = new BehaviorSubject<SocketPayload>({ caughtObjects: 0, timeRemaining: 0 });
  private intervalSub?: Subscription;

  connect(source$: Observable<SocketPayload>): Observable<SocketPayload> {
    this.destroyStreams();
    this.intervalSub = interval(1000)
      .pipe(withLatestFrom(source$), takeUntil(this.destroy$))
      .subscribe(([, payload]) => this.payload$.next(payload));

    return this.payload$.asObservable();
  }

  stop(): void {
    this.destroyStreams();
  }

  private destroyStreams(): void {
    this.destroy$.next();
    this.intervalSub?.unsubscribe();
  }

  ngOnDestroy(): void {
    this.destroyStreams();
    this.destroy$.complete();
  }
}
