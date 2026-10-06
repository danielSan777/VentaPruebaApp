import { Component, OnInit, signal } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-cliente',
  styleUrl: './cliente.css',
  templateUrl: './cliente.html',
})


export class Cliente implements OnInit {

  accesoriosSeleccionados = signal<AccesorioColocado[]>([]);

  configuracion = signal<AccesorioColocado[]>([]);

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
  }

  estaSeleccionado(accesorioId: number): boolean {

    return this.accesoriosSeleccionados()
      .some(a => a.accesorioId === accesorioId);

  }









}
