import { NgOptimizedImage } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { GameService } from '../../feature/game/game.service';
import { BreadcrumbsComponent } from '../../layouts/breadcrumbs/breadcrumbs.component';

const PLATFORM_NAMES: Record<string, string> = {
	windows: 'Windows',
	android: 'Android',
	ios: 'iOS',
	web: 'Web',
};

/** /game/<slug>: one game with its picture, links, release info and what is inside. */
@Component({
	imports: [BreadcrumbsComponent, NgOptimizedImage, RouterLink, TranslateDirective],
	template: `
		@if (game(); as game) {
			<article class="mx-auto max-w-[var(--container)] px-4 sm:px-6 t-page">
				<app-breadcrumbs
					[items]="[
						{ label: 'Ігри', link: '/games', translate: true },
						{ label: game.title },
					]"
				/>

				<header class="mt-8 max-w-[var(--reading)]">
					<h1 class="t-display">{{ game.title }}</h1>
					<p class="mt-5 t-lead">{{ game.summary }}</p>
				</header>

				<img
					class="mt-8 aspect-[1200/630] w-full rounded-[var(--t-radius-btn)] border border-[var(--c-border)] object-cover"
					[ngSrc]="game.image"
					width="1200"
					height="630"
					[alt]="game.title"
					priority
				/>

				<div class="mt-8 flex flex-wrap gap-3">
					@if (game.download) {
						<a class="btn btn--primary" [href]="game.download" rel="noopener">
							<span class="material-symbols-outlined" aria-hidden="true"
								>download</span
							>
							<span translate>Завантажити для Windows</span>
						</a>
					}
					@if (game.url) {
						<a
							class="btn"
							[class.btn--primary]="!game.download"
							[href]="game.url"
							target="_blank"
							rel="noopener"
						>
							<span class="material-symbols-outlined" aria-hidden="true"
								>open_in_new</span
							>
							<span translate>Відкрити сайт гри</span>
						</a>
					}
					@if (game.repo) {
						<a class="btn" [href]="game.repo" target="_blank" rel="noopener">
							<span class="material-symbols-outlined" aria-hidden="true">code</span>
							<span translate>Код на GitHub</span>
						</a>
					}
				</div>

				<div class="mt-12 grid gap-10 lg:grid-cols-[1fr_20rem]">
					<div>
						@if (game.paragraphs.length) {
							<div class="t-prose">
								@for (paragraph of game.paragraphs; track $index) {
									<p>{{ paragraph }}</p>
								}
							</div>
						}

						@if (game.features?.length) {
							<h2 class="mt-12 t-item" translate>Що всередині</h2>
							<ul class="mt-4 grid gap-3">
								@for (feature of game.features; track $index) {
									<li class="flex gap-3 leading-7">
										<span
											class="material-symbols-outlined mt-0.5 text-[var(--c-primary)]"
											aria-hidden="true"
											>check_circle</span
										>
										<span>{{ feature }}</span>
									</li>
								}
							</ul>
						}
					</div>

					<aside class="t-card h-fit">
						<h2 class="t-item" translate>Про гру</h2>
						<dl class="mt-4 grid gap-4">
							<div>
								<dt class="text-sm opacity-70" translate>Стан</dt>
								<dd class="font-semibold text-[var(--c-text-strong)]">
									@if (game.version) {
										<span translate>У розробці</span> · v{{ game.version }}
									} @else {
										<span translate>У розробці</span>
									}
								</dd>
							</div>
							@if (game.platforms.length) {
								<div>
									<dt class="text-sm opacity-70" translate>Платформи</dt>
									<dd class="font-semibold text-[var(--c-text-strong)]">
										{{ platformNames(game.platforms) }}
									</dd>
								</div>
							}
							@if (game.players) {
								<div>
									<dt class="text-sm opacity-70" translate>Гравці</dt>
									<dd class="font-semibold text-[var(--c-text-strong)]">
										1–{{ game.players }}
									</dd>
								</div>
							}
						</dl>
					</aside>
				</div>

				@if (game.screenshots.length) {
					<h2 class="mt-12 t-item" translate>Знімки з гри</h2>
					<ul class="mt-4 grid gap-4 sm:grid-cols-2">
						@for (shot of game.screenshots; track shot) {
							<li>
								<img
									class="aspect-video w-full rounded-[var(--t-radius-btn)] border border-[var(--c-border)] object-cover"
									[ngSrc]="shot"
									width="1280"
									height="720"
									[alt]="game.title"
								/>
							</li>
						}
					</ul>
				}

				<p class="mt-12">
					<a class="btn" routerLink="/games">
						<span class="material-symbols-outlined" aria-hidden="true">apps</span>
						<span translate>Усі ігри</span>
					</a>
				</p>
			</article>
		}
	`,
})
export class GameComponent {
	protected readonly game = inject(GameService).game(
		inject(ActivatedRoute).snapshot.data['gameSlug'],
	);

	protected platformNames(platforms: string[]): string {
		return platforms.map((platform) => PLATFORM_NAMES[platform] ?? platform).join(', ');
	}
}
