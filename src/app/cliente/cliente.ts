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

  private siguienteId = 1;


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
    const datos = localStorage.getItem('configuracionProducto');
    if (!datos) return;

    const datosGuardados = JSON.parse(datos);
    const lista = datosGuardados.accesorios as AccesorioColocado[];

    this.configuracion.set(lista);
    this.agregarPorDefecto(lista);
  }

  agregarAccesorio(accesorio: AccesorioColocado): void {
    this.accesoriosSeleccionados.update(lista => [
      ...lista,
      { ...accesorio, id: this.siguienteId++ }
    ]);
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
    const visor = canvas.closest('.visor') as HTMLElement;
    if (!visor) return;
    const anchoPx = visor.clientWidth * ancho / 100;
    const altoPx = visor.clientHeight * alto / 100;


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


  private agregarPorDefecto(lista: AccesorioColocado[]): void {
    const obligatorios = [1, 2];

    // Los accesorios con id 1 y 2 (si existen en la configuración)
    const elegidos = lista.filter(a => obligatorios.includes(a.accesorioId));

    // Más otro cualquiera: el primero que no sea 1 ni 2
    const otro = lista.find(a => !obligatorios.includes(a.accesorioId));
    if (otro) elegidos.push(otro);

    this.accesoriosSeleccionados.set(
      elegidos.map(a => ({ ...a, id: this.siguienteId++ }))
    );
  }






}
