import {
    Directive, ElementRef, AfterViewInit, OnDestroy, effect, inject, input
} from '@angular/core';

@Directive({
    selector: 'canvas[appTextoCanvas]',
    standalone: true
})

export class TextoCanvas implements AfterViewInit, OnDestroy {

    texto = input<string>('Ingrese su nombre', { alias: 'appTextoCanvas' });
    color = input<string>('#000000');

    private canvas = inject<ElementRef<HTMLCanvasElement>>(ElementRef).nativeElement;
    private observer?: ResizeObserver;

    constructor() {
        // Redibuja cuando cambia el texto o el color
        effect(() => {
            this.texto();
            this.color();
            this.dibujar();
        });
    }

    ngAfterViewInit(): void {
        // Redibuja cuando cambia el tamaño en pantalla (sliders, ventana)
        this.observer = new ResizeObserver(() => this.dibujar());
        this.observer.observe(this.canvas);
        // Pide la fuente y redibuja cuando esté lista
        document.fonts.load('bold 35px Lobster').then(() => this.dibujar());
    }

    ngOnDestroy(): void {
        this.observer?.disconnect();
    }

    private dibujar(): void {
        const c = this.canvas;
        const w = Math.round(c.clientWidth);
        const h = Math.round(c.clientHeight);
        if (!w || !h) return;

        c.width = w;
        c.height = h;

        const ctx = c.getContext('2d');
        if (!ctx) return;

        const texto = this.texto() || ' ';

        ctx.clearRect(0, 0, w, h);

        // Medir el texto con un tamaño base fijo
        ctx.font = `bold 100px Lobster, cursive`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';

        const m = ctx.measureText(texto);
        const izq = m.actualBoundingBoxLeft;
        const anchoTexto = izq + m.actualBoundingBoxRight;
        const altoTexto = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;

        if (!anchoTexto || !altoTexto) return;

        // Estirar el texto para que ocupe todo el canvas
        ctx.save();
        ctx.scale(w / anchoTexto, h / altoTexto);
        ctx.fillStyle = this.color();
        ctx.fillText(texto, izq, m.actualBoundingBoxAscent);
        ctx.restore();
    }




}