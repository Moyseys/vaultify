import { Component, signal, computed, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-main-navigator',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './main-navigator.html',
  styleUrl: './main-navigator.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainNavigator {
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly _isSidebarOpen = signal(false);
  private readonly _appTitle = signal('Pass Manager');

  protected readonly isSidebarOpen = computed(() => this._isSidebarOpen());
  protected readonly appTitle = computed(() => this._appTitle());
  protected readonly currentYear = computed(() => new Date().getFullYear());

  toggleSidebar(): void {
    this._isSidebarOpen.update((isOpen) => !isOpen);
  }

  closeSidebar(): void {
    this._isSidebarOpen.set(false);
  }

  openSidebar(): void {
    this._isSidebarOpen.set(true);
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.toastService.success('Logout realizado com sucesso');
      },
      error: () => {
        this.toastService.error('Falha ao fazer logout');
      },
    });
  }
}
