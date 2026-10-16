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

    // Abrir la primera categoría para que ya se vean los checks
    this.categoriaActual.set(this.categorias()[0] ?? '');
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

    // Si los lentes no están en el visor, solo se recuerda el color:
    // se aplicará cuando se agreguen (dibujarLentes lo lee)
    if (!this.canvasLentes) return;

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


  // ==========================================
  // CATEGORÍAS Y CHECKS
  // ==========================================

  // Categoría elegida en la lista desplegable ('' = ninguna)
  categoriaActual = signal('');

  // Categorías disponibles (sin repetir, en el orden en que aparecen)
  categorias = computed(() =>
    [...new Set(this.configuracion().map(a => a.categoria ?? 'Otros'))]
  );

  // Accesorios de la categoría elegida
  accesoriosDeCategoria = computed(() =>
    this.configuracion().filter(a => (a.categoria ?? 'Otros') === this.categoriaActual())
  );

  // Ids marcados con el check (de todas las categorías), en el orden en que se marcaron
  idsMarcados = signal<number[]>([]);

  // Accesorios marcados: son las tarjetas que se muestran con Agregar / Quitar
  accesoriosMarcados = computed(() =>
    this.idsMarcados()
      .map(id => this.configuracion().find(a => a.accesorioId === id))
      .filter((a): a is AccesorioColocado => !!a)
  );

  estaMarcado(accesorioId: number): boolean {
    return this.idsMarcados().includes(accesorioId);
  }

  // Check marcado = aparece la tarjeta; desmarcado = desaparece y se quita del visor
  alternarMarcado(accesorio: AccesorioColocado, marcado: boolean): void {
    if (marcado) {
      this.idsMarcados.update(ids =>
        ids.includes(accesorio.accesorioId) ? ids : [...ids, accesorio.accesorioId]
      );
    } else {
      this.quitarAccesorio(accesorio.accesorioId);
      this.idsMarcados.update(ids => ids.filter(i => i !== accesorio.accesorioId));
    }
  }


  // Rotación y modo espejo guardados en el editor (si no tiene, queda normal)
  transformar(a: AccesorioColocado): string {
    const espejo = a.espejo ? ' scaleX(-1)' : '';
    return `perspective(600px) rotateX(${a.rotX ?? 0}deg) rotateY(${a.rotY ?? 0}deg) rotateZ(${a.rotZ ?? 0}deg)${espejo}`;
  }


  private agregarPorDefecto(lista: AccesorioColocado[]): void {
    // Accesorios que aparecen marcados desde el inicio (si existen en la configuración)
    const porDefecto = [1, 2, 3];
    const elegidos = lista.filter(a => porDefecto.includes(a.accesorioId));

    this.accesoriosSeleccionados.set(
      elegidos.map(a => ({ ...a, id: this.siguienteId++ }))
    );

    // Sus checks salen marcados y sus tarjetas visibles desde el inicio
    this.idsMarcados.set(elegidos.map(a => a.accesorioId));
  }










}