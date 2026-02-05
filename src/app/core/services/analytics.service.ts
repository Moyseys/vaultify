import { inject, Injectable, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { track } from '@vercel/analytics';
import { AnalyticsEventProperties } from '../interfaces/analytics.interface';

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService implements OnDestroy {
  private readonly router = inject(Router);
  private routerSubscription?: Subscription;

  constructor() {
    this.initializeRouteTracking();
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
  }

  private initializeRouteTracking(): void {
    this.routerSubscription = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        if (event instanceof NavigationEnd) {
          this.trackPageView(event.urlAfterRedirects);
        }
      });
  }

  trackEvent(eventName: string, properties?: AnalyticsEventProperties): void {
    try {
      track(eventName, properties);
    } catch (error) {
      console.warn('Failed to track analytics event:', eventName, error);
    }
  }

  trackPageView(url: string): void {
    try {
      track('pageview', { page: url });
    } catch (error) {
      console.warn('Failed to track page view:', url, error);
    }
  }
}
