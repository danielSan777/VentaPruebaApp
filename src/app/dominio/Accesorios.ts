interface Accesorio {

  id: number;

  nombre: string;

  imagen: string;

  tipo?: 'imagen' | 'texto';

  texto?: string;

  categoria?: string;

}



interface AccesorioColocado {

  id: number;

  accesorioId: number;

  nombre: string;

  imagen: string;

  x: number;

  y: number;

  ancho: number;

  alto: number;

  tipo?: 'imagen' | 'texto';

  texto?: string;

  rotX?: number; rotY?: number; rotZ?: number; // grados

  espejo?: boolean;

  categoria?: string;
}

