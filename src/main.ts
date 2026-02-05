import { bootstrapApplication } from '@angular/platform-browser';
import { inject } from '@vercel/analytics';
import { appConfig } from './app/app.config';
import { App } from './app/app';

if (typeof window !== 'undefined') {
  inject({
    mode: 'production',
    debug: false,
  });
}

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
