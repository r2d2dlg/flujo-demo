export interface NombresConsultores {
    nombre: string;
}

export interface CostoConsultores {
    consultor: string;
    fecha: string;
    costo: number | null;
}

export interface VCostoConsultores {
    Consultor: string;
    Mes: string;
    Costo: number;
}

export interface CostoConsultoresCreate extends Omit<CostoConsultores, 'costo'> {
    costo?: number;
}

export interface CostoConsultoresUpdate {
    costo?: number;
} 