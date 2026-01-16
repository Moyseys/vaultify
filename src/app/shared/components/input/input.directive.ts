import type { ClassValue } from 'clsx';

import { computed, Directive, ElementRef, inject, input } from '@angular/core';

import { mergeClasses, transform } from '@shared/utils/merge-classes';
import { inputVariants, InputVariants } from './input.variants';

@Directive({
  selector: 'input[app-input], textarea[app-input]',
  exportAs: 'appInput',
  host: {
    '[class]': 'classes()',
  },
})
export class InputDirective {
  readonly elementRef = inject(ElementRef);
  private readonly isTextarea = this.elementRef.nativeElement.tagName.toLowerCase() === 'textarea';

  readonly zBorderless = input(false, { transform });
  readonly zSize = input<InputVariants['zSize']>('default');
  readonly zStatus = input<InputVariants['zStatus']>();

  readonly class = input<ClassValue>('');

  protected readonly classes = computed(() =>
    mergeClasses(
      inputVariants({
        zType: !this.isTextarea ? 'default' : 'textarea',
        zSize: this.zSize(),
        zStatus: this.zStatus(),
        zBorderless: this.zBorderless(),
      }),
      this.class(),
    ),
  );
}
