interface Accesorio{
  
  id: number;
  
  nombre: string;
  
  imagen: string;
  
}

interface AccesorioColocado{
  
  id: number;
  
  accesorioId: number;
  
  nombre: string;
  
  imagen: string;
  
  x: number;

  y: number;
  
  ancho: number;

  alto: number;

}