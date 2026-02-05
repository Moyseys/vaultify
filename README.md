# PassClient

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.3.3.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Vercel Analytics

This project integrates [Vercel Analytics](https://vercel.com/docs/analytics) to track page views and custom events.

### How it works

- **Automatic tracking**: Page views are automatically tracked on every route navigation
- **Initialization**: Analytics is initialized in [main.ts](src/main.ts) before the Angular app bootstraps
- **Router integration**: The [AnalyticsService](src/app/core/services/analytics.service.ts) subscribes to router events to track navigation

### Using Analytics in Components

To track custom events in your components, inject the `AnalyticsService` and use the `trackEvent()` method:

```typescript
import { inject } from '@angular/core';
import { AnalyticsService } from 'src/app/core/services/analytics.service';
import { AnalyticsEvent } from 'src/app/core/interfaces/analytics.interface';

export class MyComponent {
  private readonly analyticsService = inject(AnalyticsService);

  onAction(): void {
    // Track with predefined events
    this.analyticsService.trackEvent(AnalyticsEvent.LOGIN_SUCCESS, {
      email: 'user@example.com',
    });

    // Or track with custom event names
    this.analyticsService.trackEvent('custom_action', {
      property1: 'value1',
      property2: 123,
    });
  }
}
```

### Available Predefined Events

See [analytics.interface.ts](src/app/core/interfaces/analytics.interface.ts) for the complete list of predefined events:

- `LOGIN_SUCCESS` / `LOGIN_FAILED`
- `REGISTER_SUCCESS` / `REGISTER_FAILED`
- `PASSWORD_CREATED` / `PASSWORD_UPDATED` / `PASSWORD_DELETED`
- `SETTINGS_UPDATED`
- And more...

### Viewing Analytics Data

After deploying your application to Vercel:

1. Visit your deployment and navigate through the app
2. Wait ~30 seconds for data to be processed
3. Access the Vercel Analytics dashboard at [vercel.com/dashboard](https://vercel.com)
4. Select your project to view page views and custom events

**Note**: If you don't see data, check for content blockers and ensure you're navigating between different pages.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
