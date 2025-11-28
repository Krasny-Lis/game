import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, Subject, distinctUntilChanged, filter, map, takeUntil } from 'rxjs';
import { FallingObject, GameSettings, GameSnapshot, SocketPayload } from './models/game.models';
import { GameService } from './services/game.service';
import { GameSocketService } from './services/game-socket.service';

type GameSettingsForm = {
  fallingSpeed: FormControl<number>;
  fallingFrequency: FormControl<number>;
  playerSpeed: FormControl<number>;
  gameTime: FormControl<number>;
};

const settingsEqual = (a: GameSettings, b: GameSettings): boolean =>
  a.fallingSpeed === b.fallingSpeed &&
  a.fallingFrequency === b.fallingFrequency &&
  a.playerSpeed === b.playerSpeed &&
  a.gameTime === b.gameTime;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit, OnDestroy {
  readonly snapshot$: Observable<GameSnapshot> = this.gameService.snapshot$;
  socketPayload$?: Observable<SocketPayload>;
  form: FormGroup<GameSettingsForm>;

  private readonly destroy$ = new Subject<void>();
  private lastGameTime: number | null = null;

  constructor(
    private readonly fb: FormBuilder,
    readonly gameService: GameService,
    private readonly gameSocketService: GameSocketService
  ) {
    this.form = this.fb.nonNullable.group({
      fallingSpeed: this.fb.nonNullable.control(2, [Validators.required, Validators.min(0.5)]),
      fallingFrequency: this.fb.nonNullable.control(800, [Validators.required, Validators.min(100)]),
      playerSpeed: this.fb.nonNullable.control(8, [Validators.required, Validators.min(1)]),
      gameTime: this.fb.nonNullable.control(30, [Validators.required, Validators.min(5)])
    });
  }

  ngOnInit(): void {
    this.form.valueChanges
      .pipe(
        filter(() => this.form.valid),
        map(() => this.form.getRawValue() as GameSettings),
        distinctUntilChanged(settingsEqual),
        takeUntil(this.destroy$)
      )
      .subscribe((settings) => this.applySettings(settings));
  }

  start(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const settings = this.form.getRawValue() as GameSettings;
    this.lastGameTime = settings.gameTime;
    this.gameService.startGame(settings);
    this.socketPayload$ = this.gameSocketService.connect(
      this.snapshot$.pipe(
        filter((snapshot) => snapshot.running),
        map((snapshot) => ({ caughtObjects: snapshot.score, timeRemaining: snapshot.timeRemaining })),
        distinctUntilChanged((a, b) => a.caughtObjects === b.caughtObjects && a.timeRemaining === b.timeRemaining)
      )
    );
  }

  stop(): void {
    this.gameService.stopGame();
    this.gameSocketService.stop();
  }

  private applySettings(settings: GameSettings): void {
    if (this.lastGameTime !== null && settings.gameTime !== this.lastGameTime) {
      this.start();
      return;
    }
    this.gameService.updateSettings(settings);
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'ArrowLeft') {
      this.gameService.updateDirection(-1);
    }
    if (event.key === 'ArrowRight') {
      this.gameService.updateDirection(1);
    }
  }

  @HostListener('window:keyup', ['$event'])
  handleKeyUp(event: KeyboardEvent): void {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      this.gameService.updateDirection(0);
    }
  }

  trackByObject(_: number, obj: FallingObject): number {
    return obj.id;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.gameService.stopGame();
    this.gameSocketService.stop();
  }
}
