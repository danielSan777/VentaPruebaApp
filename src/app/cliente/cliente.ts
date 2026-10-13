import {
  Component, OnInit, signal, ViewChild, ElementRef, effect,
  afterNextRender,
  computed
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TextoCanvas } from '../directivas/texto-canvas';


@Component({
  imports: [
    FormsModule,
    TextoCanvas
  ],
  selector: 'app-cliente',
  styleUrl: './cliente.css',
  templateUrl: './cliente.html',
})


export class Cliente implements OnInit {

  accesoriosSeleccionados = signal<AccesorioColocado[]>([]);

  configuracion = signal<AccesorioColocado[]>([]);

  colorSeleccionado = 'negro';

  @ViewChild('canvasLentes')
  canvasLentes!: ElementRef<HTMLCanvasElement>;

  private imagenLentes = new Image();

  @ViewChild('visor')
  visor!: ElementRef<HTMLDivElement>;

  nombreCliente = signal('');

  // true cuando el accesorio de texto está agregado al visor
  hayTexto = computed(() =>
    this.accesoriosSeleccionados().some(a => a.tipo === 'texto')
  );



  @ViewChild('canvasLentes')
  set canvasLentesRef(
    referencia: ElementRef<HTMLCanvasElement> | undefined
  ) {
    if (referencia) {

      const lentes = this.accesoriosSeleccionados()
        .find(accesorio => accesorio.accesorioId === 1);

      if (lentes) {

        this.dibujarLentes(
          referencia.nativeElement,
          lentes.ancho,
          lentes.alto
        );
      }

    }
  }



  ngOnInit(): void {

    const datos = localStorage.getItem(
      'configuracionProducto'
    );

    if (!datos) {
      return;
    }

    const datosGuardados = JSON.parse(datos);

    this.configuracion.set(
      datosGuardados.accesorios as AccesorioColocado[]
    );
  }


  agregarAccesorio(
    accesorio: AccesorioColocado
  ): void {

    this.accesoriosSeleccionados.update(lista => [
      ...lista,
      {
        ...accesorio,
        id: Date.now()
      }
    ]);
    /* console.log("accesorios agregados-->", this.accesoriosSeleccionados()); */
  }


  quitarAccesorio(id: number): void {
    console.log('ID que quiero eliminar:', id);

    this.accesoriosSeleccionados.update(lista =>
      lista.filter(accesorio => accesorio.accesorioId !== id)
    );

    console.log("elementos en la lista", this.accesoriosSeleccionados());
  }


  estaSeleccionado(accesorioId: number): boolean {

    return this.accesoriosSeleccionados()
      .some(a => a.accesorioId === accesorioId);

  }


  dibujarLentes(canvas: HTMLCanvasElement, ancho: number,
    alto: number): void {

    const anchoPx = this.visor.nativeElement.clientWidth * ancho / 100;
    const altoPx = this.visor.nativeElement.clientHeight * alto / 100;


    const contexto = canvas.getContext('2d');



    if (!contexto) return;

    this.imagenLentes.onload = () => {
      canvas.width = anchoPx;
      canvas.height = altoPx;

      contexto.clearRect(0, 0, canvas.width, canvas.height);

      contexto.drawImage(
        this.imagenLentes,
        0,
        0,
        canvas.width,
        canvas.height
      );

      // Aplicar el color sin pintar el fondo transparente
      contexto.globalCompositeOperation = 'source-atop';
      contexto.fillStyle = this.colorSeleccionado === 'negro' ? '#000000' : '#795548';
      contexto.fillRect(0, 0, canvas.width, canvas.height);

      contexto.globalCompositeOperation = 'source-over';


    };

    this.imagenLentes.onerror = () => {
      console.error('No se pudo cargar la imagen de los lentes');
    };

    this.imagenLentes.src = '/accesorios/lentes.png';
  }


  cambiarColorLentes(color: string): void {

    /* const existe = this.hayLentes();

    if (!existe) {
      return;
    } */


    this.colorSeleccionado = color;

    const canvas = this.canvasLentes.nativeElement as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Redibujar la imagen original
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(this.imagenLentes, 0, 0, canvas.width, canvas.height);

    // Aplicar el color sin pintar el fondo transparente
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = color === 'negro' ? '#000000' : '#795548';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.globalCompositeOperation = 'source-over';
  }


  hayLentes = computed(() =>
    this.accesoriosSeleccionados().some(
      a => a.accesorioId === 1
    )
  );




}
