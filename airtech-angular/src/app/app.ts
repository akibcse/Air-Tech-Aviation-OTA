import { Component, inject } from '@angular/core';
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
export class AppComponent {
  private router = inject(Router);
  private dynamicMetaTags = inject(DynamicMetaTagsService);

  constructor() {
    this.dynamicMetaTags.applyForUrl(this.router.url);

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe((event) => {
        this.dynamicMetaTags.applyForUrl(event.urlAfterRedirects);
      });
  }

  prepareRoute(outlet: RouterOutlet) {
    return outlet && outlet.activatedRouteData && outlet.activatedRouteData['animation'];
  }

  showSupportBar(): boolean {
    return !this.router.url.startsWith('/admin');
  }
}
