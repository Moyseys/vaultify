import type { ClassValue } from 'clsx';

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';

import { mergeClasses, transform } from '@shared/utils/merge-classes';
import { buttonVariants, ButtonVariants } from './button.variants';

@Component({
  selector: 'app-button, button[app-button], a[app-button]',
  exportAs: 'appButton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    @if (zLoading()) {
      <span zType="cached" class="icon-loader-circle animate-spin"></span>
    }

    <ng-content></ng-content>
  `,
  host: {
    '[class]': 'classes()',
  },
})
export class ButtonComponent {
  private readonly elementRef = inject(ElementRef);

  readonly zType = input<ButtonVariants['zType']>('default');
  readonly zSize = input<ButtonVariants['zSize']>('default');
  readonly zShape = input<ButtonVariants['zShape']>('default');

  readonly class = input<ClassValue>('');

  readonly zFull = input(false, { transform });
  readonly zLoading = input(false, { transform });

  protected readonly classes = computed(() =>
    mergeClasses(
      buttonVariants({
        zType: this.zType(),
        zSize: this.zSize(),
        zShape: this.zShape(),
        zFull: this.zFull(),
        zLoading: this.zLoading(),
      }),
      this.class(),
    ),
  );
}
