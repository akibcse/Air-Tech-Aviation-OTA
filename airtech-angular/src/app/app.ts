import { Component, inject } from '@angular/core';
import { RouterOutlet, ActivatedRoute } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { routeAnimation } from './animations/route.animations';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
  animations: [routeAnimation]
})
export class AppComponent {
  prepareRoute(outlet: RouterOutlet) {
    return outlet && outlet.activatedRouteData && outlet.activatedRouteData['animation'];
  }
}
