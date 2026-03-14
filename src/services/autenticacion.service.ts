import axiosInstance from "@/config/axios.config.js";
import { Usuario } from "@/types/usuario";

export interface AutenticacionRequest {
  Usuario: string;
  Clave: string;
}

export interface AutenticacionResponse {
  Operacion: number;
  Autenticado: boolean;
  Token: string;
  Mensaje: string;
  Correo: string | null;
  PersonaId: number;
  NumeroDocumento: string | null;
  FotografiaDriveUrl: string | null;
  NombreCompleto: string;
  UsuarioId: number;
}

const BASE_URL = "/Seguridad";

export const autenticarUsuario = async (request: AutenticacionRequest) : Promise<Usuario> => {
  try {
    const url = `${BASE_URL}/login`;
    const response = await axiosInstance.post(url, request);
    return response.data;
  } catch (error) {
    throw error;
  }
};