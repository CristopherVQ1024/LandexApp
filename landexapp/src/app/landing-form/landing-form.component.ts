import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LandingService } from '../../services/landing.service';

interface Caracteristica {
  icono: string;
  titulo: string;
  descripcion: string;
}

interface Horario {
  dia: string;
  horario: string;
}

interface Testimonio {
  nombre: string;
  cargo: string;
  comentario: string;
  foto_url?: string;
}

interface MetodoPago {
  nombre: string;
  icono_url: string;
}

interface Producto {
  nombre: string;
  descripcion: string;
  precio: string;
  imagen_url: string;
}

@Component({
  selector: 'app-landing-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './landing-form.component.html',
  styleUrls: ['./landing-form.component.scss']
})
export class LandingFormComponent implements OnInit {
  isEditMode = false;
  landingId: number | null = null;
  loading = false;
  message = '';
  messageType: 'success' | 'error' = 'success';

  // Secciones colapsables
  sectionsOpen = {
    general: true,
    inicio: false,
    descripcion: false,
    caracteristicas: false,
    horarios: false,
    testimonios: false,
    pagos: false,
    productos: false,
    galeria: false,
    contacto: false,
    mapa: false,
    seo: false
  };

  landing = {
    nombre_empresa: '',
    correo_contacto: '',
    telefono_contacto: '',
    title: '',
    main_color: '#21365E',
    logo_url: '',
    favicon_url: '',
    banner_url: '',
    is_active: true,

    // INICIO
    show_inicio: true,
    inicio_title: '',
    inicio_subtitle: '',
    inicio_description: '',
    inicio_background_url: '',

    // DESCRIPCIÓN
    show_descripcion: true,
    descripcion_title: '',
    descripcion_text: '',
    descripcion_image_url: '',

    // CARACTERÍSTICAS
    show_caracteristicas: true,
    caracteristicas_title: '',
    caracteristicas_text: '',
    caracteristicas_list: [] as Caracteristica[],

    // HORARIOS
    show_horarios: true,
    horarios_title: '',
    horarios_json: [] as Horario[],

    // TESTIMONIOS
    show_testimonios: true,
    testimonios_title: '',
    testimonios_json: [] as Testimonio[],

    // PAGOS
    show_pagos: false,
    pagos_title: '',
    pagos_descripcion: '',
    pagos_metodos: [] as MetodoPago[],

    // PRODUCTOS
    show_productos: true,
    productos_title: '',
    productos_descripcion: '',
    productos_json: [] as Producto[],

    // GALERÍA
    show_galeria: true,
    galeria_title: '',
    galeria_imagenes: [] as string[],

    // CONTACTO
    show_contacto: true,
    contacto_title: '',
    contacto_descripcion: '',
    contacto_telefono: '',
    contacto_email: '',
    contacto_direccion: '',
    contacto_whatsapp: '',

    // MAPA
    show_mapa: true,
    mapa_title: '',
    mapa_lat: null as number | null,
    mapa_lng: null as number | null,

    // CONFIGURACIONES EXTRA
    fuente_principal: 'Poppins',
    fondo_color: '',
    fondo_imagen_url: '',
    seo_keywords: '',
    seo_description: ''
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private landingService: LandingService
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.landingId = +params['id'];
        this.loadLanding();
      }
    });
  }

  toggleSection(section: keyof typeof this.sectionsOpen): void {
    this.sectionsOpen[section] = !this.sectionsOpen[section];
  }

  loadLanding(): void {
    if (!this.landingId) return;

    this.loading = true;
    this.landingService.getLandingById(this.landingId).subscribe({
      next: (data) => {
        this.landing = { ...this.landing, ...data };
        this.loading = false;
      },
      error: (err) => {
        this.showMessage('Error al cargar landing', 'error');
        this.loading = false;
      }
    });
  }

  onFileSelected(event: any, field: string): void {
    const file = event.target.files[0];
    if (file) {
      this.landingService.uploadImage(file).subscribe({
        next: (response) => {
          (this.landing as any)[field] = response.url;
          this.showMessage('Imagen subida correctamente', 'success');
        },
        error: () => {
          this.showMessage('Error al subir imagen', 'error');
        }
      });
    }
  }

  // CARACTERÍSTICAS
  addCaracteristica(): void {
    this.landing.caracteristicas_list.push({
      icono: '',
      titulo: '',
      descripcion: ''
    });
  }

  removeCaracteristica(index: number): void {
    this.landing.caracteristicas_list.splice(index, 1);
  }

  // HORARIOS
  addHorario(): void {
    this.landing.horarios_json.push({
      dia: '',
      horario: ''
    });
  }

  removeHorario(index: number): void {
    this.landing.horarios_json.splice(index, 1);
  }

  // TESTIMONIOS
  addTestimonio(): void {
    this.landing.testimonios_json.push({
      nombre: '',
      cargo: '',
      comentario: '',
      foto_url: ''
    });
  }

  removeTestimonio(index: number): void {
    this.landing.testimonios_json.splice(index, 1);
  }

  onTestimonioImageSelected(event: any, index: number): void {
    const file = event.target.files[0];
    if (file) {
      this.landingService.uploadImage(file).subscribe({
        next: (response) => {
          this.landing.testimonios_json[index].foto_url = response.url;
          this.showMessage('Imagen subida correctamente', 'success');
        },
        error: () => {
          this.showMessage('Error al subir imagen', 'error');
        }
      });
    }
  }

  // MÉTODOS DE PAGO
  addMetodoPago(): void {
    this.landing.pagos_metodos.push({
      nombre: '',
      icono_url: ''
    });
  }

  removeMetodoPago(index: number): void {
    this.landing.pagos_metodos.splice(index, 1);
  }

  onMetodoPagoImageSelected(event: any, index: number): void {
    const file = event.target.files[0];
    if (file) {
      this.landingService.uploadImage(file).subscribe({
        next: (response) => {
          this.landing.pagos_metodos[index].icono_url = response.url;
          this.showMessage('Imagen subida correctamente', 'success');
        },
        error: () => {
          this.showMessage('Error al subir imagen', 'error');
        }
      });
    }
  }

  // PRODUCTOS
  addProducto(): void {
    this.landing.productos_json.push({
      nombre: '',
      descripcion: '',
      precio: '',
      imagen_url: ''
    });
  }

  removeProducto(index: number): void {
    this.landing.productos_json.splice(index, 1);
  }

  onProductoImageSelected(event: any, index: number): void {
    const file = event.target.files[0];
    if (file) {
      this.landingService.uploadImage(file).subscribe({
        next: (response) => {
          this.landing.productos_json[index].imagen_url = response.url;
          this.showMessage('Imagen subida correctamente', 'success');
        },
        error: () => {
          this.showMessage('Error al subir imagen', 'error');
        }
      });
    }
  }

  // GALERÍA
  addGaleriaImage(): void {
    this.landing.galeria_imagenes.push('');
  }

  removeGaleriaImage(index: number): void {
    this.landing.galeria_imagenes.splice(index, 1);
  }

  onGaleriaImageSelected(event: any, index: number): void {
    const file = event.target.files[0];
    if (file) {
      this.landingService.uploadImage(file).subscribe({
        next: (response) => {
          this.landing.galeria_imagenes[index] = response.url;
          this.showMessage('Imagen subida correctamente', 'success');
        },
        error: () => {
          this.showMessage('Error al subir imagen', 'error');
        }
      });
    }
  }

  saveLanding(): void {
    this.loading = true;

    if (this.isEditMode && this.landingId) {
      this.landingService.updateLanding(this.landingId, this.landing).subscribe({
        next: () => {
          this.showMessage('Landing actualizada correctamente', 'success');
          this.loading = false;
          setTimeout(() => this.router.navigate(['/dashboard']), 1500);
        },
        error: () => {
          this.showMessage('Error al actualizar landing', 'error');
          this.loading = false;
        }
      });
    } else {
      this.landingService.createLanding(this.landing).subscribe({
        next: () => {
          this.showMessage('Landing creada correctamente', 'success');
          this.loading = false;
          setTimeout(() => this.router.navigate(['/dashboard']), 1500);
        },
        error: () => {
          this.showMessage('Error al crear landing', 'error');
          this.loading = false;
        }
      });
    }
  }

  showMessage(msg: string, type: 'success' | 'error'): void {
    this.message = msg;
    this.messageType = type;
    setTimeout(() => {
      this.message = '';
    }, 3000);
  }

  cancel(): void {
    this.router.navigate(['/dashboard']);
  }
}