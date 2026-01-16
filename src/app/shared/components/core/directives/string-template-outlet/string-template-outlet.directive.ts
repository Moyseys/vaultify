import {
  Directive,
  EmbeddedViewRef,
  inject,
  Input,
  OnChanges,
  SimpleChange,
  SimpleChanges,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';

export function isTemplateRef<T>(value: TemplateRef<T> | unknown): value is TemplateRef<T> {
  return value instanceof TemplateRef;
}

@Directive({
  selector: '[appStringTemplateOutlet]',
  exportAs: 'appStringTemplateOutlet',
})
export class StringTemplateOutletDirective<_T = unknown> implements OnChanges {
  private viewContainer = inject(ViewContainerRef);
  private templateRef = inject(TemplateRef<unknown>);

  private embeddedViewRef: EmbeddedViewRef<unknown> | null = null;
  private context = new StringTemplateOutletContext();
  @Input() appStringTemplateOutletContext: any | null = null;
  @Input() appStringTemplateOutlet: unknown | TemplateRef<unknown> = null;

  static ngTemplateContextGuard<T>(
    _dir: StringTemplateOutletDirective<T>,
    _ctx: unknown,
  ): _ctx is StringTemplateOutletContext {
    return true;
  }

  private recreateView(): void {
    this.viewContainer.clear();
    if (isTemplateRef(this.appStringTemplateOutlet)) {
      this.embeddedViewRef = this.viewContainer.createEmbeddedView(
        this.appStringTemplateOutlet,
        this.appStringTemplateOutletContext,
      );
    } else {
      this.embeddedViewRef = this.viewContainer.createEmbeddedView(this.templateRef, this.context);
    }
  }

  private updateContext(): void {
    const newCtx = isTemplateRef(this.appStringTemplateOutlet)
      ? this.appStringTemplateOutletContext
      : this.context;
    const oldCtx = this.embeddedViewRef?.context as any;
    if (newCtx) {
      for (const propName of Object.keys(newCtx)) {
        oldCtx[propName] = newCtx[propName];
      }
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    const { appStringTemplateOutletContext, appStringTemplateOutlet } = changes;
    const shouldRecreateView = (): boolean => {
      let shouldOutletRecreate = false;
      if (appStringTemplateOutlet) {
        shouldOutletRecreate =
          appStringTemplateOutlet.firstChange ||
          isTemplateRef(appStringTemplateOutlet.previousValue) ||
          isTemplateRef(appStringTemplateOutlet.currentValue);
      }
      const hasContextShapeChanged = (ctxChange: SimpleChange): boolean => {
        const prevCtxKeys = Object.keys(ctxChange.previousValue || {});
        const currCtxKeys = Object.keys(ctxChange.currentValue || {});
        if (prevCtxKeys.length === currCtxKeys.length) {
          for (const propName of currCtxKeys) {
            if (prevCtxKeys.indexOf(propName) === -1) {
              return true;
            }
          }
          return false;
        } else {
          return true;
        }
      };
      const shouldContextRecreate =
        appStringTemplateOutletContext && hasContextShapeChanged(appStringTemplateOutletContext);
      return shouldContextRecreate || shouldOutletRecreate;
    };

    if (appStringTemplateOutlet) {
      this.context.$implicit = appStringTemplateOutlet.currentValue;
    }

    const recreateView = shouldRecreateView();
    if (recreateView) {
      this.recreateView();
    } else {
      this.updateContext();
    }
  }
}

export class StringTemplateOutletContext {
  public $implicit: unknown;
}
