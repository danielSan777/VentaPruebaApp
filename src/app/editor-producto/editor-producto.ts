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
  CdkDropList
} from '@angular/cdk/drag-drop';
import { JsonPipe } from '@angular/common';

@Component({
  standalone: true,
  imports: [CdkDrag, FormsModule, JsonPipe, CdkDropList],
  selector: 'app-editor-producto',
  styleUrl: './editor-producto.css',
  templateUrl: './editor-producto.html',
})

export class EditorProducto {

  @ViewChild('canvasLentes')
  canvasLentes!: ElementRef<HTMLCanvasElement>;

  colorSeleccionado = '#0000ff';

  private imagenLentes = new Image();

  private cdr = inject(ChangeDetectorRef);

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



  soltarAccesorio(
    event: CdkDragDrop<AccesorioColocado[]>
  ): void {

    if (event.previousContainer === event.container) {
      return;
    }

    const accesorio = event.item.data as Accesorio;

    const visor = event.container.element.nativeElement;
    const rect = visor.getBoundingClientRect();

    const punto = event.dropPoint;

    const ancho = 140;
    const alto = 90;

    const x = punto.x - rect.left - ancho / 2;
    const y = punto.y - rect.top - alto / 2;

    this.accesoriosColocados.update(lista => {

      const existe = lista.some(
        a => a.accesorioId === accesorio.id
      );

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
          x: Math.round(x),
          y: Math.round(y),
          ancho,
          alto
        }
      ];

    });

  }




  /* terminarMovimientoAccesorio(
    event: CdkDragEnd,
    id: number
  ): void {

   
    const dx = event.distance.x;
    const dy = event.distance.y;
    console.log('ID:', id);
    console.log('POSICIÓN CDK:', event.distance);

    this.accesoriosColocados.update(lista =>

      lista.map(accesorio => {

        if (accesorio.id !== id) {
          return accesorio;
        }
        const nuevoX =
          accesorio.x + dx;

        const nuevoY =
          accesorio.y + dy;
        

        return {
          ...accesorio,
          x: Math.round(nuevoX),
          y: Math.round(nuevoY)
        };

      })

    );

   
    console.log(
      'Accesorios:',
      this.accesoriosColocados()
    );
    event.source.reset();

  } */


  terminarMovimientoAccesorio(
    event: CdkDragEnd,
    id: number
  ): void {

    const accesorio = this.accesoriosColocados()
      .find(a => a.id === id);

    if (!accesorio) return;

    console.log('ANTES:', accesorio.x, accesorio.y);
    console.log(
      'DISTANCIA:',
      event.distance.x,
      event.distance.y
    );

    this.accesoriosColocados.update(lista =>
      lista.map(a => {

        if (a.id !== id) {
          return a;
        }

        return {
          ...a,
          x: Math.round(a.x + event.distance.x),
          y: Math.round(a.y + event.distance.y)
        };

      })
    );

    event.source.reset();
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

}
