import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { LandingService } from '../services/landing.service';

@Component({
  selector: 'app-landing-preview',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './landing-preview.component.html',
  styleUrls: ['./landing-preview.component.scss']
})
export class LandingPreviewComponent implements OnInit {
  landing: any = null;
  loading = true;
  error = '';
  mobileMenuOpen = false;
  currentYear = new Date().getFullYear();

  constructor(
    private route: ActivatedRoute,
    private landingService: LandingService,
    private sanitizer: DomSanitizer
  ) {
    console.log('Componente inicializado');
  }

  ngOnInit(): void {
    console.log('ngOnInit ejecutado');
    this.route.params.subscribe(params => {
      const id = +params['id'];
      console.log('ID recibido:', id);
      this.loadLanding(id);
    });
  }

  loadLanding(id: number): void {
    console.log('Cargando landing con ID:', id);
    this.loading = true;
    this.error = '';
    
    this.landingService.getLandingById(id).subscribe({
      next: (data) => {
        console.log('Datos recibidos:', data);
        
        if (!data.is_active) {
          this.error = 'Esta landing no está disponible actualmente.';
          this.loading = false;
          return;
        }

        if (typeof data.caracteristicas_list === 'string') {
          data.caracteristicas_list = JSON.parse(data.caracteristicas_list);
        }
        if (typeof data.horarios_json === 'string') {
          data.horarios_json = JSON.parse(data.horarios_json);
        }
        if (typeof data.testimonios_json === 'string') {
          data.testimonios_json = JSON.parse(data.testimonios_json);
        }
        if (typeof data.pagos_metodos === 'string') {
          data.pagos_metodos = JSON.parse(data.pagos_metodos);
        }
        if (typeof data.productos_json === 'string') {
          data.productos_json = JSON.parse(data.productos_json);
        }
        if (typeof data.galeria_imagenes === 'string') {
          data.galeria_imagenes = JSON.parse(data.galeria_imagenes);
        }

        this.landing = data;
        this.loading = false;

        if (data.title) {
          document.title = data.title;
        }

        if (data.favicon_url) {
          this.updateFavicon(data.favicon_url);
        }

        if (data.seo_description) {
          this.updateMetaTag('description', data.seo_description);
        }

        if (data.seo_keywords) {
          this.updateMetaTag('keywords', data.seo_keywords);
        }

        if (data.fuente_principal && data.fuente_principal !== 'Poppins') {
          this.loadGoogleFont(data.fuente_principal);
        }
      },
      error: (err) => {
        console.error('Error completo:', err);
        this.error = 'Error al cargar la landing. Por favor, intenta nuevamente.';
        this.loading = false;
      }
    });
  }

  private updateFavicon(faviconUrl: string): void {
    let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'shortcut icon';
      document.getElementsByTagName('head')[0].appendChild(link);
    }
    link.type = 'image/x-icon';
    link.href = faviconUrl;
  }

  private updateMetaTag(name: string, content: string): void {
    let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = name;
      document.getElementsByTagName('head')[0].appendChild(meta);
    }
    meta.content = content;
  }

  private loadGoogleFont(fontName: string): void {
    const fontUrl = `https://fonts.googleapis.com/css2?family=${fontName.replace(' ', '+')}:wght@300;400;500;600;700&display=swap`;
    
    if (!document.querySelector(`link[href="${fontUrl}"]`)) {
      const link = document.createElement('link');
      link.href = fontUrl;
      link.rel = 'stylesheet';
      document.getElementsByTagName('head')[0].appendChild(link);
    }
  }

  scrollTo(sectionId: string): void {
    this.mobileMenuOpen = false; 
    
    setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) {
        const navbarHeight = 70; 
        const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementPosition - navbarHeight;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }, 100);
  }

  openImage(imageUrl: string): void {
    window.open(imageUrl, '_blank');
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    const words = name.trim().split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  }

  getWhatsAppLink(phone: string): string {
    const cleanPhone = phone.replace(/\D/g, '');
    
    const fullPhone = cleanPhone.startsWith('51') ? cleanPhone : '51' + cleanPhone;
    
    return `https://wa.me/${fullPhone}?text=Hola, estoy interesado en sus servicios`;
  }

  getMapUrl(lat: string | number, lng: string | number): SafeResourceUrl {
    const url = `https://maps.google.com/maps?q=${lat},${lng}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  getGoogleMapsLink(lat: string | number, lng: string | number): string {
    return `https://www.google.com/maps?q=${lat},${lng}`;
  }

  sendMessage(event: Event): void {
    event.preventDefault();
        
    if (this.landing.contacto_whatsapp) {
      const form = event.target as HTMLFormElement;
      const nombre = (form.querySelector('input[placeholder="Tu nombre"]') as HTMLInputElement)?.value;
      const email = (form.querySelector('input[placeholder="Tu email"]') as HTMLInputElement)?.value;
      const mensaje = (form.querySelector('textarea') as HTMLTextAreaElement)?.value;
      
      const whatsappMessage = `Hola, mi nombre es ${nombre}. ${mensaje}. Mi email es: ${email}`;
      const whatsappUrl = `${this.getWhatsAppLink(this.landing.contacto_whatsapp)}&text=${encodeURIComponent(whatsappMessage)}`;
      
      window.open(whatsappUrl, '_blank');
      
      form.reset();
    } else {
      alert('Mensaje enviado. Pronto nos pondremos en contacto contigo.');
    }
  }
}