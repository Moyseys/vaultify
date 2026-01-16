import type { ClassValue } from 'clsx';

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  TemplateRef,
  ViewEncapsulation,
} from '@angular/core';

import { mergeClasses } from '@shared/utils/merge-classes';
import { StringTemplateOutletDirective } from '../core/directives/string-template-outlet/string-template-outlet.directive';
import { cardBodyVariants, cardHeaderVariants, cardVariants } from './card.variants';

@Component({
  selector: 'app-card',
  exportAs: 'appCard',
  imports: [StringTemplateOutletDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    @if (zTitle()) {
      <div [class]="headerClasses()">
        <div class="text-2xl font-semibold leading-none tracking-tight">
          <ng-container *appStringTemplateOutlet="zTitle()">{{ zTitle() }}</ng-container>
        </div>

        @if (zDescription()) {
          <div class="text-sm text-muted-foreground">
            <ng-container *appStringTemplateOutlet="zDescription()">{{
              zDescription()
            }}</ng-container>
          </div>
        }
      </div>
    }

    <div [class]="bodyClasses()">
      <ng-content></ng-content>
    </div>
  `,
  host: {
    '[class]': 'classes()',
  },
})
export class CardComponent {
  readonly zTitle = input<string | TemplateRef<void>>();
  readonly zDescription = input<string | TemplateRef<void>>();

  readonly class = input<ClassValue>('');

  protected readonly classes = computed(() => mergeClasses(cardVariants(), this.class()));
  protected readonly headerClasses = computed(() => mergeClasses(cardHeaderVariants()));
  protected readonly bodyClasses = computed(() => mergeClasses(cardBodyVariants()));
}
