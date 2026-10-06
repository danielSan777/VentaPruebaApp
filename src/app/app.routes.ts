import { Routes } from '@angular/router';
import { EditorProducto } from './editor-producto/editor-producto';
import { Cliente } from './cliente/cliente';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'editor-producto',
    pathMatch: 'full'
  },
  {
    path: 'editor-producto',
    component: EditorProducto
  },
  {
    path: 'cliente',
    component: Cliente
  }

];


