import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription, filter, map } from 'rxjs';
import { GameService } from './services/game.service';
import { GameSocketService } from './services/game-socket.service';
import { FallingObject, GameSettings, GameSnapshot, SocketPayload } from './models/game.models';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  form: FormGroup;
  snapshot?: GameSnapshot;
  socketPayload?: SocketPayload;
  private subs: Subscription[] = [];
  private lastGameTime: number | null = null;

  constructor(
    private readonly fb: FormBuilder,
    readonly gameService: GameService,
    private readonly gameSocketService: GameSocketService
  ) {
    this.form = this.fb.group({
      fallingSpeed: [2, [Validators.required, Validators.min(0.5)]],
      fallingFrequency: [800, [Validators.required, Validators.min(100)]],
      playerSpeed: [8, [Validators.required, Validators.min(1)]],
      gameTime: [30, [Validators.required, Validators.min(5)]]
    });
  }

  ngOnInit(): void {
    this.subs.push(
      this.gameService.snapshot$.subscribe((snapshot) => {
        this.snapshot = snapshot;
        if (!snapshot.running) {
          this.gameSocketService.stop();
        }
      })
    );

    this.subs.push(
      this.form.valueChanges.subscribe((value) => {
        if (this.form.valid) {
          const settings = value as GameSettings;
          this.applySettings(settings);
        }
      })
    );
  }

  start(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const settings = this.form.value as GameSettings;
    this.lastGameTime = settings.gameTime;
    this.gameService.startGame(settings);
    this.subs.push(
      this.gameSocketService
        .connect(
          this.gameService.snapshot$.pipe(
            filter((snapshot) => snapshot.running),
            map((snapshot) => ({ caughtObjects: snapshot.score, timeRemaining: snapshot.timeRemaining }))
          )
        )
        .subscribe((payload) => (this.socketPayload = payload))
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
      this.gameService.movePlayer(-1);
    }
    if (event.key === 'ArrowRight') {
      this.gameService.movePlayer(1);
    }
  }

  @HostListener('window:keyup', ['$event'])
  handleKeyUp(event: KeyboardEvent): void {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      this.gameService.movePlayer(0);
    }
  }

  trackByObject(_: number, obj: FallingObject): number {
    return obj.id;
  }

  ngOnDestroy(): void {
    this.subs.forEach((sub) => sub.unsubscribe());
    this.gameService.stopGame();
    this.gameSocketService.stop();
  }
}
