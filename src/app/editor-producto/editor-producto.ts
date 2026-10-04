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

    // Accesorio que estamos arrastrando
    const accesorio = event.item.data as Accesorio;

    // Elemento HTML del visor
    const visor = event.container.element.nativeElement;

    // Posición y tamaño del visor en la pantalla
    const rect = visor.getBoundingClientRect();

    // Punto donde se soltó el accesorio
    const punto = event.dropPoint;

    // Coordenadas relativas al visor
    const x = punto.x - rect.left;
    const y = punto.y - rect.top;

    const nuevo: AccesorioColocado = {

      id: this.siguienteId++,

      accesorioId: accesorio.id,

      nombre: accesorio.nombre,

      imagen: accesorio.imagen,

      x: x,

      y: y,

      ancho: 140,

      alto: 90

    };

    this.accesoriosColocados.update(lista => [
      ...lista,
      nuevo
    ]);

  }


  terminarMovimiento(event: CdkDragEnd): void {

    const posicion =
      event.source.getFreeDragPosition();

    this.posicion.set({
      x: Math.round(posicion.x),
      y: Math.round(posicion.y)
    });

    /* this.cdr.detectChanges(); */
    console.log('signal', this.posicion());
    console.log('X:', this.posicion().x);
    console.log('Y:', this.posicion().y);
  }


  guardarConfiguracion(): void {

    const configuracion = {
      x: this.posicion().x,
      y: this.posicion().y,
      width: this.ancho,
      height: this.alto
    };

    console.log(
      'Configuración:',
      configuracion
    );
  }

  onDragEnded(event: CdkDragEnd): void {

    const nuevaPosicion =
      event.source.getFreeDragPosition();

    this.posicion.set({
      x: Math.round(nuevaPosicion.x),
      y: Math.round(nuevaPosicion.y)
    });

    console.log('X:', this.posicion().x);
    console.log('Y:', this.posicion().y);
  }





}
