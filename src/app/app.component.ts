import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Observable, distinctUntilChanged, filter, map, switchMap } from 'rxjs';
import {
  DEFAULT_GAME_SETTINGS,
  FallingObject,
  GameSettings,
  GameSnapshot,
  SocketPayload,
  settingsEqual
} from './models/game.models';
import { GameService } from './services/game.service';
import { GameSocketService } from './services/game-socket.service';

type GameSettingsControls = {
  fallingSpeed: FormControl<number>;
  fallingFrequency: FormControl<number>;
  playerSpeed: FormControl<number>;
  gameTime: FormControl<number>;
};

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
  readonly form: FormGroup<GameSettingsControls>;
  readonly socketPayload$: Observable<SocketPayload>;

  @ViewChild('gameArea')
  private readonly gameArea?: ElementRef<HTMLDivElement>;

  private readonly socketSource$: Observable<SocketPayload> = this.snapshot$.pipe(
    filter((snapshot) => snapshot.running),
    map((snapshot) => ({ caughtObjects: snapshot.score, timeRemaining: snapshot.timeRemaining })),
    distinctUntilChanged((a, b) => a.caughtObjects === b.caughtObjects && a.timeRemaining === b.timeRemaining)
  );
  private lastGameTime: number | null = null;

  constructor(
    private readonly fb: FormBuilder,
    readonly gameService: GameService,
    private readonly gameSocketService: GameSocketService,
    private readonly destroyRef: DestroyRef
  ) {
    this.form = this.fb.nonNullable.group({
      fallingSpeed: this.fb.nonNullable.control(DEFAULT_GAME_SETTINGS.fallingSpeed, [Validators.required, Validators.min(0.5)]),
      fallingFrequency: this.fb.nonNullable.control(DEFAULT_GAME_SETTINGS.fallingFrequency, [Validators.required, Validators.min(100)]),
      playerSpeed: this.fb.nonNullable.control(DEFAULT_GAME_SETTINGS.playerSpeed, [Validators.required, Validators.min(1)]),
      gameTime: this.fb.nonNullable.control(DEFAULT_GAME_SETTINGS.gameTime, [Validators.required, Validators.min(5)])
    });

    this.socketPayload$ = this.snapshot$.pipe(
      map((snapshot) => snapshot.running),
      distinctUntilChanged(),
      switchMap((running) => {
        if (running) {
          return this.gameSocketService.createPayloadStream(this.socketSource$);
        }
        this.gameSocketService.stop();
        return EMPTY;
      })
    );
  }

  get fallingSpeedControl(): FormControl<number> {
    return this.form.controls.fallingSpeed;
  }

  get fallingFrequencyControl(): FormControl<number> {
    return this.form.controls.fallingFrequency;
  }

  get playerSpeedControl(): FormControl<number> {
    return this.form.controls.playerSpeed;
  }

  get gameTimeControl(): FormControl<number> {
    return this.form.controls.gameTime;
  }

  ngOnInit(): void {
    this.form.valueChanges
      .pipe(
        filter(() => this.form.valid),
        map(() => this.form.getRawValue()),
        distinctUntilChanged(settingsEqual),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((settings) => this.applySettings(settings));
  }

  start(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const settings = this.form.getRawValue();
    this.lastGameTime = settings.gameTime;
    this.gameService.startGame(settings);
    queueMicrotask(() => this.gameArea?.nativeElement.focus());
  }

  stop(): void {
    this.gameService.stopGame();
    this.gameSocketService.stop();
    this.lastGameTime = null;
  }

  private applySettings(settings: GameSettings): void {
    if (this.lastGameTime !== null && settings.gameTime !== this.lastGameTime) {
      this.start();
      return;
    }
    this.gameService.updateSettings(settings);
  }

  handleKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        this.gameService.updateDirection(-1);
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.gameService.updateDirection(1);
        break;
      default:
        break;
    }
  }

  handleKeyUp(event: KeyboardEvent): void {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      this.gameService.updateDirection(0);
    }
  }

  trackByObject(_: number, obj: FallingObject): number {
    return obj.id;
  }

  ngOnDestroy(): void {
    this.gameService.stopGame();
    this.gameSocketService.stop();
  }
}
