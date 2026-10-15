import {
  Component, ViewChild,
  ElementRef,
  AfterViewInit,
  signal,
  NgZone,
  inject,
  ChangeDetectorRef,

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
import { TextoCanvas } from '../directivas/texto-canvas';
import Swal from 'sweetalert2'
import { Router } from '@angular/router';


@Component({
  standalone: true,
  imports: [CdkDrag, FormsModule, JsonPipe, CdkDropList, CdkDragPreview, TextoCanvas],
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

  private router = inject(Router);

  posicion = signal({
    x: 150,
    y: 100
  });

  // Tamaño de los lentes
  ancho = 140;
  alto = 90;

  // Color seleccionado
  color = '#000000';

  accesorioSeleccionadoId = signal<number | null>(null);

  porcentajeAncho = signal(23.3);
  porcentajeAlto = signal(18);

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
      nombre: 'Nombre',
      imagen: '',
      tipo: 'texto',
      texto: 'Ingrese su nombre.'
    },
    {
      id: 3,
      nombre: 'caja-herramienta',
      imagen: 'accesorios/caja_herramientas.png'
    },
    {
      id: 4,
      nombre: 'regalo',
      imagen: 'accesorios/regalo.png'
    },
    {
      id: 5,
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





  registrarPreview(): void {
    const preview = document.querySelector('.cdk-drag-preview');
    if (preview) {
      this.rectPreview = preview.getBoundingClientRect();
    }
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

    // Ancho inicial como % del visor
    const anchoPct = 15;

    // Alto en % que mantiene la proporción real de la imagen

    const esTexto = accesorio.tipo === 'texto';
    const img = event.item.element.nativeElement.querySelector('img') as HTMLImageElement | null;

    const proporcion = esTexto
      ? 0.25                                   // alto/ancho del canvas de texto
      : (img && img.naturalWidth ? img.naturalHeight / img.naturalWidth : 0.65);


    const altoPct = +(anchoPct * proporcion * (rect.width / rect.height)).toFixed(2);

    // Tamaño en píxeles, para calcular la posición y los límites
    const anchoPx = rect.width * anchoPct / 100;
    const altoPx = rect.height * altoPct / 100;

    // 1. Posición en PÍXELES, relativa al visor
    let xPx: number;
    let yPx: number;

    if (this.rectPreview) {
      // Donde el usuario vio el preview mientras arrastraba
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
          alto: altoPct,
          tipo: accesorio.tipo ?? 'imagen',
          texto: accesorio.texto,
        }
      ];
    });
  }

  iniciarArrastre(event: PointerEvent, a: AccesorioColocado): void {
    event.preventDefault();

    const el = event.currentTarget as HTMLElement;
    const visor = el.closest('.visor') as HTMLElement;

    if (!visor) return;

    const rect = visor.getBoundingClientRect();

    // Posición actual en píxeles
    const xPixel = (a.x / 100) * rect.width;
    const yPixel = (a.y / 100) * rect.height;

    // Mantener el punto exacto donde agarraste el accesorio
    const offsetX = event.clientX - rect.left - xPixel;
    const offsetY = event.clientY - rect.top - yPixel;

    el.setPointerCapture(event.pointerId);

    const mover = (e: PointerEvent) => {
      const r = visor.getBoundingClientRect();

      // Tamaño del accesorio en píxeles
      const anchoPixel = (a.ancho / 100) * r.width;
      const altoPixel = (a.alto / 100) * r.height;

      // Nueva posición en píxeles
      let x = e.clientX - r.left - offsetX;
      let y = e.clientY - r.top - offsetY;

      // Limitar al visor
      x = Math.max(0, Math.min(x, r.width - anchoPixel));
      y = Math.max(0, Math.min(y, r.height - altoPixel));

      // Convertir a porcentajes
      const xPorcentaje = (x / r.width) * 100;
      const yPorcentaje = (y / r.height) * 100;

      this.accesoriosColocados.update(lista =>
        lista.map(i =>
          i.id === a.id
            ? { ...i, x: xPorcentaje, y: yPorcentaje }
            : i
        )
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


  async guardarConfiguracion(): Promise<void> {

    const configuracion = {
      productoId: 1,
      accesorios: this.accesoriosColocados()
    };

    localStorage.setItem(
      'configuracionProducto',
      JSON.stringify(configuracion)
    );

    await Swal.fire({
      title: '¡Guardado!',
      text: 'La configuración se guardó correctamente.',
      icon: 'success',
      confirmButtonText: 'Aceptar'
    });

    // Navegar después de aceptar
    await this.router.navigate(['/cliente']);

  }



  seleccionarAccesorio(a: AccesorioColocado): void {
    this.accesorioSeleccionadoId.set(a.id);
    this.porcentajeAncho.set(a.ancho);
    this.porcentajeAlto.set(a.alto);
  }

  cambiarAncho(valor: number): void {
    this.porcentajeAncho.set(valor);

    const id = this.accesorioSeleccionadoId();

    if (id === null) return;

    this.accesoriosColocados.update(lista =>
      lista.map(a =>
        a.id === id
          ? { ...a, ancho: valor }
          : a
      )
    );
  }

  cambiarAlto(valor: number): void {
    this.porcentajeAlto.set(valor);

    const id = this.accesorioSeleccionadoId();

    if (id === null) return;

    this.accesoriosColocados.update(lista =>
      lista.map(a =>
        a.id === id
          ? { ...a, alto: valor }
          : a
      )
    );
  }



  async eliminarConfiguracion(): Promise<void> {
    try {
      localStorage.removeItem('configuracionMaceta');

      await Swal.fire({
        title: '¡Eliminada!',
        text: 'Configuración eliminada con éxito.',
        icon: 'success',
        confirmButtonText: 'Aceptar'
      });

    } catch (error) {
      await Swal.fire({
        title: 'Error',
        text: 'No se pudo eliminar la configuración.',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
    }
  }


  iniciarRedimension(
    event: PointerEvent,
    a: AccesorioColocado,
    esquina: 'nw' | 'ne' | 'sw' | 'se'
  ): void {
    event.preventDefault();
    event.stopPropagation(); // evita que se active el arrastre del accesorio

    const handle = event.currentTarget as HTMLElement;
    const visor = handle.closest('.visor') as HTMLElement;
    if (!visor) return;

    const rect = visor.getBoundingClientRect();

    // Estado inicial en píxeles
    const anchoIni = (a.ancho / 100) * rect.width;
    const altoIni = (a.alto / 100) * rect.height;
    const izqIni = (a.x / 100) * rect.width;
    const arrIni = (a.y / 100) * rect.height;
    const proporcion = anchoIni / altoIni;

    const hacia_este = esquina.includes('e');
    const hacia_sur = esquina.includes('s');

    // La esquina opuesta se queda fija
    const anclaX = hacia_este ? izqIni : izqIni + anchoIni;
    const anclaY = hacia_sur ? arrIni : arrIni + altoIni;

    const inicioX = event.clientX;
    const inicioY = event.clientY;

    // Límites: mínimo 5%, máximo 80% (igual que los sliders) y sin salirse del visor
    const minAncho = rect.width * 0.05;
    const espacioX = hacia_este ? rect.width - anclaX : anclaX;
    const espacioY = hacia_sur ? rect.height - anclaY : anclaY;
    const maxAlto = Math.min(espacioY, rect.height * 0.8);
    const maxAncho = Math.min(espacioX, rect.width * 0.8, maxAlto * proporcion);

    handle.setPointerCapture(event.pointerId);

    const mover = (e: PointerEvent) => {
      const dx = (e.clientX - inicioX) * (hacia_este ? 1 : -1);
      const dy = (e.clientY - inicioY) * (hacia_sur ? 1 : -1);

      // Combina ambos ejes para que la diagonal se sienta natural
      let nuevoAncho = anchoIni + (dx + dy * proporcion) / 2;
      nuevoAncho = Math.max(minAncho, Math.min(nuevoAncho, maxAncho));
      const nuevoAlto = nuevoAncho / proporcion;

      const nuevoIzq = hacia_este ? anclaX : anclaX - nuevoAncho;
      const nuevoArr = hacia_sur ? anclaY : anclaY - nuevoAlto;

      const ancho = +((nuevoAncho / rect.width) * 100).toFixed(2);
      const alto = +((nuevoAlto / rect.height) * 100).toFixed(2);
      const x = +((nuevoIzq / rect.width) * 100).toFixed(2);
      const y = +((nuevoArr / rect.height) * 100).toFixed(2);

      this.accesoriosColocados.update(lista =>
        lista.map(i => (i.id === a.id ? { ...i, x, y, ancho, alto } : i))
      );

      // Mantener sliders sincronizados
      this.porcentajeAncho.set(+ancho.toFixed(1));
      this.porcentajeAlto.set(+alto.toFixed(1));
    };

    const soltar = () => {
      handle.removeEventListener('pointermove', mover);
      handle.removeEventListener('pointerup', soltar);
      handle.removeEventListener('pointercancel', soltar);
    };

    handle.addEventListener('pointermove', mover);
    handle.addEventListener('pointerup', soltar);
    handle.addEventListener('pointercancel', soltar);
  }







}
