import { LineaCredito, TipoLineaCredito } from '../types/lineasDeCredito';

// Interfaz para cuota calculada
export interface CuotaCalculada {
  numero: number;
  fecha: Date;
  saldo_inicial: number;
  interes: number;
  capital: number;
  cuota_total: number;
  saldo_final: number;
}

// Interfaz para resultados de cálculos
export interface ResultadosCalculo {
  cuota_mensual?: number;
  total_intereses: number;
  total_pagos: number;
  tasa_efectiva?: number;
  calendario_pagos?: CuotaCalculada[];
}

// Función para calcular cuota de préstamo a plazo fijo (sistema francés)
export const calcularCuotaTerminoFijo = (
  monto: number,
  tasaAnual: number,
  plazoMeses: number
): number => {
  if (tasaAnual === 0) return monto / plazoMeses;
  
  const tasaMensual = tasaAnual / 100 / 12;
  const factor = Math.pow(1 + tasaMensual, plazoMeses);
  return (monto * tasaMensual * factor) / (factor - 1);
};

// Función para calcular cuota de leasing
export const calcularCuotaLeasing = (
  valorActivo: number,
  valorResidual: number,
  tasaAnual: number,
  plazoMeses: number
): number => {
  const montoFinanciado = valorActivo - valorResidual;
  return calcularCuotaTerminoFijo(montoFinanciado, tasaAnual, plazoMeses);
};

// Función para calcular tabla de amortización
export const generarTablaAmortizacion = (
  monto: number,
  tasaAnual: number,
  plazoMeses: number,
  fechaInicio: Date
): CuotaCalculada[] => {
  const tabla: CuotaCalculada[] = [];
  const cuotaMensual = calcularCuotaTerminoFijo(monto, tasaAnual, plazoMeses);
  const tasaMensual = tasaAnual / 100 / 12;
  
  let saldoPendiente = monto;
  
  for (let i = 1; i <= plazoMeses; i++) {
    const fecha = new Date(fechaInicio);
    fecha.setMonth(fecha.getMonth() + i);
    
    const interesMes = saldoPendiente * tasaMensual;
    const capitalMes = cuotaMensual - interesMes;
    const nuevoSaldo = saldoPendiente - capitalMes;
    
    tabla.push({
      numero: i,
      fecha,
      saldo_inicial: saldoPendiente,
      interes: interesMes,
      capital: capitalMes,
      cuota_total: cuotaMensual,
      saldo_final: Math.max(0, nuevoSaldo)
    });
    
    saldoPendiente = nuevoSaldo;
  }
  
  return tabla;
};

// Función principal para calcular según tipo de línea
export const calcularLinea = (linea: LineaCredito): ResultadosCalculo => {
  const monto = linea.monto_total_linea;
  const tasa = linea.interest_rate || 0;
  const fechaInicio = new Date(linea.fecha_inicio);
  
  switch (linea.tipo_linea as TipoLineaCredito) {
    case 'TERMINO_FIJO':
    case 'PRESTAMO_HIPOTECARIO':
    case 'PRESTAMO_VEHICULAR':
      if (!linea.plazo_meses) {
        return { total_intereses: 0, total_pagos: monto };
      }
      
      const cuotaMensual = calcularCuotaTerminoFijo(monto, tasa, linea.plazo_meses);
      const totalPagos = cuotaMensual * linea.plazo_meses;
      const totalIntereses = totalPagos - monto;
      const tabla = generarTablaAmortizacion(monto, tasa, linea.plazo_meses, fechaInicio);
      
      return {
        cuota_mensual: cuotaMensual,
        total_intereses: totalIntereses,
        total_pagos: totalPagos,
        calendario_pagos: tabla
      };
      
    case 'LEASING_OPERATIVO':
    case 'LEASING_FINANCIERO':
      if (!linea.plazo_meses || !linea.valor_activo) {
        return { total_intereses: 0, total_pagos: monto };
      }
      
      const valorResidual = linea.valor_residual || 0;
      const cuotaLeasing = calcularCuotaLeasing(linea.valor_activo, valorResidual, tasa, linea.plazo_meses);
      const totalPagosLeasing = cuotaLeasing * linea.plazo_meses;
      const totalInteresesLeasing = totalPagosLeasing - (linea.valor_activo - valorResidual);
      
      return {
        cuota_mensual: cuotaLeasing,
        total_intereses: totalInteresesLeasing,
        total_pagos: totalPagosLeasing + valorResidual
      };
      
    case 'FACTORING':
      // En factoring, el costo es por cada factura descontada
      const porcentaje = linea.porcentaje_financiamiento || 80;
      const costoAnualEstimado = monto * (tasa / 100) * (porcentaje / 100);
      
      return {
        total_intereses: costoAnualEstimado,
        total_pagos: monto + costoAnualEstimado,
        tasa_efectiva: (costoAnualEstimado / monto) * 100
      };
      
    case 'SOBREGIRO':
      // En sobregiro, el costo depende del uso promedio
      const limiteUsado = linea.limite_sobregiro || monto;
      const costoAnualSobregiro = limiteUsado * (tasa / 100) * 0.5; // Asumiendo 50% de uso promedio
      
      return {
        total_intereses: costoAnualSobregiro,
        total_pagos: limiteUsado + costoAnualSobregiro
      };
      
    case 'CARTA_CREDITO':
      // Carta de crédito usualmente tiene comisión fija + tasa
      const comisionCartaCredito = monto * 0.015; // 1.5% típico
      const costoAnualCarta = monto * (tasa / 100);
      
      return {
        total_intereses: comisionCartaCredito + costoAnualCarta,
        total_pagos: monto + comisionCartaCredito + costoAnualCarta
      };
      
    case 'LINEA_CREDITO':
    default:
      // Línea de crédito tradicional - costo variable según uso
      const costoAnualLinea = monto * (tasa / 100) * 0.7; // Asumiendo 70% de uso promedio
      
      return {
        total_intereses: costoAnualLinea,
        total_pagos: monto + costoAnualLinea
      };
  }
};

// Función para formatear moneda
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('es-PA', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

// Función para calcular métricas de rendimiento
export const calcularMetricas = (linea: LineaCredito): {
  costo_efectivo_anual: number;
  aprovechamiento_estimado: number;
  riesgo_nivel: 'BAJO' | 'MEDIO' | 'ALTO';
} => {
  const resultados = calcularLinea(linea);
  const monto = linea.monto_total_linea;
  const plazoAnos = (linea.plazo_meses || 12) / 12;
  
  // Calcular costo efectivo anual
  const costoEfectivoAnual = (resultados.total_intereses / monto / plazoAnos) * 100;
  
  // Estimar aprovechamiento según tipo
  let aprovechamientoEstimado = 70; // Por defecto 70%
  switch (linea.tipo_linea as TipoLineaCredito) {
    case 'TERMINO_FIJO':
    case 'PRESTAMO_HIPOTECARIO':
    case 'PRESTAMO_VEHICULAR':
      aprovechamientoEstimado = 100; // Se usa el 100% desde el inicio
      break;
    case 'FACTORING':
      aprovechamientoEstimado = 60; // Depende del flujo de facturas
      break;
    case 'SOBREGIRO':
      aprovechamientoEstimado = 30; // Uso ocasional
      break;
    case 'CARTA_CREDITO':
      aprovechamientoEstimado = 90; // Se usa cuando se necesita
      break;
  }
  
  // Calcular nivel de riesgo
  let nivelRiesgo: 'BAJO' | 'MEDIO' | 'ALTO' = 'MEDIO';
  if (linea.garantia_tipo && ['HIPOTECARIA', 'VEHICULAR', 'PRENDARIA'].includes(linea.garantia_tipo)) {
    nivelRiesgo = 'BAJO';
  } else if (linea.tipo_linea === 'SOBREGIRO' || linea.tipo_linea === 'FACTORING') {
    nivelRiesgo = 'ALTO';
  }
  
  return {
    costo_efectivo_anual: costoEfectivoAnual,
    aprovechamiento_estimado: aprovechamientoEstimado,
    riesgo_nivel: nivelRiesgo
  };
}; 