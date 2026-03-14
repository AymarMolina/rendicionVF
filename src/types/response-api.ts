export type ResponseAPI<T = unknown> = {
  IdOperacion: boolean;
  TipoOperacion: number;
  Rpta1: number;
  Rpta2: null;
  Rpta3: null;
  MensajeOperacion: string | null;
  RptaLista: T;
};