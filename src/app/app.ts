import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { EditorProducto } from './editor-producto/editor-producto';

@Component({
  imports: [RouterOutlet,EditorProducto],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})

export class App{
  protected readonly title = signal('ventaApp');
}
