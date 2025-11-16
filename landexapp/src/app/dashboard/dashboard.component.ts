import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LandingService } from '../../services/landing.service';

interface LandingListItem {
  id: number;
  nombre_empresa: string;
  title: string;
  correo_contacto: string;
  telefono_contacto: string;
  is_active: boolean;
  created_at: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  landings: LandingListItem[] = [];
  loading = false;
  message = '';
  messageType: 'success' | 'error' = 'success';
  showDeleteModal = false;
  landingToDelete: LandingListItem | null = null;

  constructor(
    private landingService: LandingService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadLandings();
  }

  loadLandings(): void {
    this.loading = true;
    this.landingService.getAllLandings().subscribe({
      next: (data) => {
        this.landings = data;
        this.loading = false;
      },
      error: (err) => {
        this.showMessage('Error al cargar las landings', 'error');
        this.loading = false;
      }
    });
  }

  createLanding(): void {
    this.router.navigate(['/landing/new']);
  }

  editLanding(id: number): void {
    this.router.navigate(['/landing/edit', id]);
  }

  viewLanding(id: number): void {
    // Abrir en nueva pestaña la vista previa
    window.open(`http://localhost:4200/preview/${id}`, '_blank');
  }

  confirmDelete(landing: LandingListItem): void {
    this.landingToDelete = landing;
    this.showDeleteModal = true;
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.landingToDelete = null;
  }

  deleteLanding(): void {
    if (!this.landingToDelete) return;

    this.loading = true;
    this.landingService.deleteLanding(this.landingToDelete.id).subscribe({
      next: () => {
        this.showMessage('Landing eliminada correctamente', 'success');
        this.showDeleteModal = false;
        this.landingToDelete = null;
        this.loadLandings();
      },
      error: () => {
        this.showMessage('Error al eliminar landing', 'error');
        this.loading = false;
      }
    });
  }

  toggleStatus(landing: LandingListItem): void {
    const newStatus = !landing.is_active;
    this.landingService.toggleLandingStatus(landing.id, newStatus).subscribe({
      next: () => {
        landing.is_active = newStatus;
        this.showMessage(
          `Landing ${newStatus ? 'activada' : 'desactivada'} correctamente`,
          'success'
        );
      },
      error: () => {
        this.showMessage('Error al cambiar estado', 'error');
      }
    });
  }

  showMessage(msg: string, type: 'success' | 'error'): void {
    this.message = msg;
    this.messageType = type;
    setTimeout(() => {
      this.message = '';
    }, 3000);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}