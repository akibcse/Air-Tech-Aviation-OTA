import { Component, inject, OnDestroy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { NavbarComponent } from './components/navbar/navbar.component';
import { routeAnimation } from './animations/route.animations';
import { DynamicMetaTagsService } from './services/dynamic-meta-tags.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
  animations: [routeAnimation]
})
export class AppComponent implements OnDestroy {
  private router = inject(Router);
  private dynamicMetaTags = inject(DynamicMetaTagsService);
  private supportBarIntervalId: ReturnType<typeof setInterval> | null = null;
  private supportBarHideTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private supportBarVisible = false;

  constructor() {
    this.dynamicMetaTags.applyForUrl(this.router.url);
    this.updateSupportBarCycle(this.router.url);

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe((event) => {
        this.dynamicMetaTags.applyForUrl(event.urlAfterRedirects);
        this.updateSupportBarCycle(event.urlAfterRedirects);
      });
  }

  ngOnDestroy(): void {
    this.clearSupportBarTimers();
  }

  prepareRoute(outlet: RouterOutlet) {
    return outlet && outlet.activatedRouteData && outlet.activatedRouteData['animation'];
  }

  showSupportBar(): boolean {
    return !this.router.url.startsWith('/admin') && this.supportBarVisible;
  }

  private updateSupportBarCycle(url: string): void {
    if (url.startsWith('/admin')) {
      this.supportBarVisible = false;
      this.clearSupportBarTimers();
      return;
    }

    this.clearSupportBarTimers();
    this.showSupportBarForFiveSeconds();

    this.supportBarIntervalId = setInterval(() => {
      this.showSupportBarForFiveSeconds();
    }, 60000);
  }

  private showSupportBarForFiveSeconds(): void {
    this.supportBarVisible = true;

    if (this.supportBarHideTimeoutId) {
      clearTimeout(this.supportBarHideTimeoutId);
    }

    this.supportBarHideTimeoutId = setTimeout(() => {
      this.supportBarVisible = false;
      this.supportBarHideTimeoutId = null;
    }, 5000);
  }

  private clearSupportBarTimers(): void {
    if (this.supportBarIntervalId) {
      clearInterval(this.supportBarIntervalId);
      this.supportBarIntervalId = null;
    }

    if (this.supportBarHideTimeoutId) {
      clearTimeout(this.supportBarHideTimeoutId);
      this.supportBarHideTimeoutId = null;
    }
  }
}
