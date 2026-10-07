import {
  Component, ViewChild,
  ElementRef,
  AfterViewInit,
  signal,
  NgZone,
  inject,
  ChangeDetectorRef
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  CdkDrag,
  CdkDragDrop,
  CdkDragEnd,
  CdkDragStart,
  CdkDropList,
  CdkDragPreview
} from '@angular/cdk/drag-drop';
import { JsonPipe } from '@angular/common';

@Component({
  standalone: true,
  imports: [CdkDrag, FormsModule, JsonPipe, CdkDropList, CdkDragPreview],
  selector: 'app-editor-producto',
  styleUrl: './editor-producto.css',
  templateUrl: './editor-producto.html',
})

export class EditorProducto {

  @ViewChild('canvasLentes')
  canvasLentes!: ElementRef<HTMLCanvasElement>;

  colorSeleccionado = '#0000ff';

  private imagenLentes = new Image();


  private rectPreview: DOMRect | null = null;

  posicionesIniciales = new Map<number, { x: number; y: number }>();

  posicion = signal({
    x: 150,
    y: 100
  });

  // Tamaño de los lentes
  ancho = 140;
  alto = 90;

  // Color seleccionado
  color = '#000000';


  // ==========================================
  // ACCESORIOS DISPONIBLES
  // ==========================================

  accesorios = signal<Accesorio[]>([

    {
      id: 1,
      nombre: 'Lentes',
      imagen: 'accesorios/lentes.png'
    },

    {
      id: 2,
      nombre: 'caja-herramienta',
      imagen: 'accesorios/caja_herramientas.png'
    },
    {
      id: 3,
      nombre: 'regalo',
      imagen: 'accesorios/regalo.png'
    },
    {
      id: 4,
      nombre: 'vaso de café',
      imagen: 'accesorios/vaso_cafe.png'
    }

  ]);

  // ==========================================
  // ACCESORIOS COLOCADOS
  // ==========================================

  accesoriosColocados =
    signal<AccesorioColocado[]>([]);


  // ==========================================
  // GENERAR ID
  // ==========================================

  private siguienteId = 1;





  ngAfterViewInit(): void {

    this.imagenLentes.src = '/accesorios/lentes.png';

    this.imagenLentes.onload = () => {
      this.dibujarLentes();
    };

  }


  dibujarLentes(): void {

    const canvas = this.canvasLentes.nativeElement;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    canvas.width = this.imagenLentes.width;
    canvas.height = this.imagenLentes.height;

    console.log("ancho-->" + canvas.width);
    console.log("alto-->" + canvas.height);

    ctx.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    ctx.drawImage(
      this.imagenLentes,
      0,
      0
    );
  }


  cambiarColor(): void {

    const canvas = this.canvasLentes.nativeElement;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    const imageData = ctx.getImageData(
      0,
      0,
      canvas.width,
      canvas.height
    );

    const pixels = imageData.data;

    const r = parseInt(
      this.colorSeleccionado.substring(1, 3),
      16
    );

    const g = parseInt(
      this.colorSeleccionado.substring(3, 5),
      16
    );

    const b = parseInt(
      this.colorSeleccionado.substring(5, 7),
      16
    );

    for (let i = 0; i < pixels.length; i += 4) {

      const alpha = pixels[i + 3];

      // Solo modificamos los píxeles visibles
      if (alpha > 0) {

        pixels[i] = r;
        pixels[i + 1] = g;
        pixels[i + 2] = b;

        // NO modificamos alpha
      }
    }

    ctx.putImageData(
      imageData,
      0,
      0
    );
  }


  soltarAccesorio(event: CdkDragDrop<AccesorioColocado[]>): void {

    // Si viene del mismo visor, no crear otro accesorio
    if (event.previousContainer === event.container) {
      return;
    }

    const accesorio = event.item.data as Accesorio;

    // Zona de drop (cubre todo el visor)
    const visor = event.container.element.nativeElement;
    const rect = visor.getBoundingClientRect();

    // Ancho del accesorio como % del visor (≈140px en un visor de 600px)
    const anchoPct = 23;

    // Tamaño aproximado en píxeles, solo para el respaldo y el límite
    const anchoPx = rect.width * anchoPct / 100;
    const altoPx = anchoPx * (90 / 140);   // misma proporción que 140x90

    // 1. Posición en PÍXELES, relativa al visor
    let xPx: number;
    let yPx: number;

    if (this.rectPreview) {
      // Donde el usuario vio el preview al arrastrar
      xPx = this.rectPreview.left - rect.left;
      yPx = this.rectPreview.top - rect.top;
    } else {
      // Respaldo: centrar el accesorio en el cursor
      xPx = event.dropPoint.x - rect.left - anchoPx / 2;
      yPx = event.dropPoint.y - rect.top - altoPx / 2;
    }

    this.rectPreview = null;

    // 2. Limitar para que no quede fuera del visor
    xPx = Math.min(Math.max(xPx, 0), rect.width - anchoPx);
    yPx = Math.min(Math.max(yPx, 0), rect.height - altoPx);

    // 3. Convertir a PORCENTAJE
    const x = +((xPx / rect.width) * 100).toFixed(2);
    const y = +((yPx / rect.height) * 100).toFixed(2);

    // 4. Agregar el accesorio (solo uno por tipo)
    this.accesoriosColocados.update(lista => {

      const existe = lista.some(a => a.accesorioId === accesorio.id);

      if (existe) {
        return lista;
      }

      return [
        ...lista,
        {
          id: this.siguienteId++,
          accesorioId: accesorio.id,
          nombre: accesorio.nombre,
          imagen: accesorio.imagen,
          x,
          y,
          ancho: anchoPct,
          alto: 0  // ya no se usa; el alto sale de la proporción de la imagen
        }
      ];

    });
    console.log('colocados:', JSON.stringify(this.accesoriosColocados()));

  }


  iniciarArrastre(event: PointerEvent, a: AccesorioColocado): void {

    const el = event.currentTarget as HTMLElement;
    const visor = el.closest('.visor') as HTMLElement;

    // Dónde agarraste el accesorio, en píxeles
    const elRect = el.getBoundingClientRect();
    const offsetX = event.clientX - elRect.left;
    const offsetY = event.clientY - elRect.top;

    el.setPointerCapture(event.pointerId);

    const mover = (e: PointerEvent) => {
      const r = visor.getBoundingClientRect();
      const w = el.offsetWidth;
      const h = el.offsetHeight;

      const pxX = Math.min(Math.max(e.clientX - r.left - offsetX, 0), r.width - w);
      const pxY = Math.min(Math.max(e.clientY - r.top - offsetY, 0), r.height - h + h * 0.2);

      this.accesoriosColocados.update(lista =>
        lista.map(i => i.id === a.id
          ? {
            ...i,
            x: +((pxX / r.width) * 100).toFixed(2),
            y: +((pxY / r.height) * 100).toFixed(2)
          }
          : i)
      );
    };

    const soltar = () => {
      el.removeEventListener('pointermove', mover);
      el.removeEventListener('pointerup', soltar);
      el.removeEventListener('pointercancel', soltar);
    };

    el.addEventListener('pointermove', mover);
    el.addEventListener('pointerup', soltar);
    el.addEventListener('pointercancel', soltar);
  }



  estaColocado(accesorioId: number): boolean {

    return this.accesoriosColocados().some(
      a => a.accesorioId === accesorioId
    );

  }

  iniciarMovimientoAccesorio(
    event: CdkDragStart,
    accesorio: AccesorioColocado
  ): void {

    this.posicionesIniciales.set(accesorio.id, {
      x: accesorio.x,
      y: accesorio.y
    });

  }


  guardarConfiguracion(): void {

    const configuracion = {
      productoId: 1,
      accesorios: this.accesoriosColocados()
    };

    localStorage.setItem(
      'configuracionProducto',
      JSON.stringify(configuracion)
    );

    console.log(
      'Configuración:',
      configuracion
    );

  }


  registrarPreview(): void {
    const preview = document.querySelector('.cdk-drag-preview');
    if (preview) {
      this.rectPreview = preview.getBoundingClientRect();
    }
  }






}
