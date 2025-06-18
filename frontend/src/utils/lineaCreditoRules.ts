import { TipoLineaCredito, LineaCreditoBase } from '../types/lineasDeCredito';

// Interfaz para las reglas de cada tipo de línea
export interface LineaCreditoRules {
  requiredFields: string[];
  defaultValues: Partial<LineaCreditoBase>;
  validations: ((data: Partial<LineaCreditoBase>) => string | null)[];
  isRevolvente: boolean;
  description: string;
}

// Validaciones comunes
const validatePositiveNumber = (value: number | null | undefined, fieldName: string) => {
  if (value !== null && value !== undefined && value <= 0) {
    return `${fieldName} debe ser mayor a 0`;
  }
  return null;
};

const validatePercentage = (value: number | null | undefined, fieldName: string) => {
  if (value !== null && value !== undefined && (value < 0 || value > 100)) {
    return `${fieldName} debe estar entre 0 y 100%`;
  }
  return null;
};

// Reglas específicas para cada tipo de línea de crédito
export const LINEA_CREDITO_RULES: Record<TipoLineaCredito, LineaCreditoRules> = {
  LINEA_CREDITO: {
    requiredFields: ['nombre', 'monto_total_linea', 'fecha_inicio', 'fecha_fin', 'interest_rate'],
    defaultValues: {
      es_revolvente: true,
      moneda: 'USD',
      periodicidad_pago: 'MENSUAL'
    },
    validations: [
      (data) => validatePositiveNumber(data.monto_total_linea, 'Monto total'),
      (data) => validatePositiveNumber(data.interest_rate, 'Tasa de interés')
    ],
    isRevolvente: true,
    description: 'Línea de crédito tradicional con disposición flexible hasta el límite aprobado.'
  },
  
  TERMINO_FIJO: {
    requiredFields: ['nombre', 'monto_total_linea', 'fecha_inicio', 'fecha_fin', 'interest_rate', 'plazo_meses', 'periodicidad_pago'],
    defaultValues: {
      es_revolvente: false,
      moneda: 'USD',
      periodicidad_pago: 'MENSUAL'
    },
    validations: [
      (data) => validatePositiveNumber(data.monto_total_linea, 'Monto total'),
      (data) => validatePositiveNumber(data.interest_rate, 'Tasa de interés'),
      (data) => validatePositiveNumber(data.plazo_meses, 'Plazo en meses'),
      (data) => {
        if (data.plazo_meses && data.plazo_meses > 360) {
          return 'El plazo no puede exceder 360 meses (30 años)';
        }
        return null;
      }
    ],
    isRevolvente: false,
    description: 'Préstamo a plazo fijo con cuotas definidas y calendario de pagos.'
  },
  
  LEASING_OPERATIVO: {
    requiredFields: ['nombre', 'monto_total_linea', 'fecha_inicio', 'fecha_fin', 'interest_rate', 'valor_activo', 'valor_residual', 'plazo_meses'],
    defaultValues: {
      es_revolvente: false,
      moneda: 'USD',
      periodicidad_pago: 'MENSUAL'
    },
    validations: [
      (data) => validatePositiveNumber(data.valor_activo, 'Valor del activo'),
      (data) => validatePositiveNumber(data.valor_residual, 'Valor residual'),
      (data) => {
        if (data.valor_residual && data.valor_activo && data.valor_residual >= data.valor_activo) {
          return 'El valor residual debe ser menor al valor del activo';
        }
        return null;
      },
      (data) => {
        if (data.monto_total_linea && data.valor_activo && data.monto_total_linea > data.valor_activo) {
          return 'El monto financiado no puede exceder el valor del activo';
        }
        return null;
      }
    ],
    isRevolvente: false,
    description: 'Arrendamiento operativo con opción de compra al valor residual al final del plazo.'
  },
  
  LEASING_FINANCIERO: {
    requiredFields: ['nombre', 'monto_total_linea', 'fecha_inicio', 'fecha_fin', 'interest_rate', 'valor_activo', 'plazo_meses'],
    defaultValues: {
      es_revolvente: false,
      moneda: 'USD',
      periodicidad_pago: 'MENSUAL',
      valor_residual: 1 // $1 simbólico para leasing financiero
    },
    validations: [
      (data) => validatePositiveNumber(data.valor_activo, 'Valor del activo'),
      (data) => {
        if (data.monto_total_linea && data.valor_activo && data.monto_total_linea > data.valor_activo) {
          return 'El monto financiado no puede exceder el valor del activo';
        }
        return null;
      }
    ],
    isRevolvente: false,
    description: 'Arrendamiento financiero donde el arrendatario adquiere automáticamente el activo al final.'
  },
  
  FACTORING: {
    requiredFields: ['nombre', 'monto_total_linea', 'fecha_inicio', 'fecha_fin', 'porcentaje_financiamiento'],
    defaultValues: {
      es_revolvente: true,
      moneda: 'USD',
      porcentaje_financiamiento: 80 // 80% típico en factoring
    },
    validations: [
      (data) => validatePositiveNumber(data.monto_total_linea, 'Monto total'),
      (data) => validatePercentage(data.porcentaje_financiamiento, 'Porcentaje de financiamiento'),
      (data) => {
        if (data.porcentaje_financiamiento && data.porcentaje_financiamiento > 90) {
          return 'El porcentaje de financiamiento en factoring usualmente no excede 90%';
        }
        return null;
      }
    ],
    isRevolvente: true,
    description: 'Financiamiento sobre cuentas por cobrar con descuento por adelanto de fondos.'
  },
  
  PRESTAMO_HIPOTECARIO: {
    requiredFields: ['nombre', 'monto_total_linea', 'fecha_inicio', 'fecha_fin', 'interest_rate', 'plazo_meses', 'garantia_tipo', 'garantia_descripcion'],
    defaultValues: {
      es_revolvente: false,
      moneda: 'USD',
      periodicidad_pago: 'MENSUAL',
      garantia_tipo: 'HIPOTECARIA'
    },
    validations: [
      (data) => validatePositiveNumber(data.monto_total_linea, 'Monto total'),
      (data) => validatePositiveNumber(data.interest_rate, 'Tasa de interés'),
      (data) => validatePositiveNumber(data.plazo_meses, 'Plazo en meses'),
      (data) => {
        if (data.plazo_meses && data.plazo_meses > 360) {
          return 'El plazo hipotecario no puede exceder 360 meses (30 años)';
        }
        return null;
      }
    ],
    isRevolvente: false,
    description: 'Préstamo a largo plazo garantizado con bien inmueble.'
  },
  
  PRESTAMO_VEHICULAR: {
    requiredFields: ['nombre', 'monto_total_linea', 'fecha_inicio', 'fecha_fin', 'interest_rate', 'plazo_meses', 'garantia_tipo', 'garantia_descripcion'],
    defaultValues: {
      es_revolvente: false,
      moneda: 'USD',
      periodicidad_pago: 'MENSUAL',
      garantia_tipo: 'VEHICULAR'
    },
    validations: [
      (data) => validatePositiveNumber(data.monto_total_linea, 'Monto total'),
      (data) => validatePositiveNumber(data.interest_rate, 'Tasa de interés'),
      (data) => validatePositiveNumber(data.plazo_meses, 'Plazo en meses'),
      (data) => {
        if (data.plazo_meses && data.plazo_meses > 84) {
          return 'El plazo vehicular usualmente no excede 84 meses (7 años)';
        }
        return null;
      }
    ],
    isRevolvente: false,
    description: 'Préstamo para adquisición de vehículo con garantía del mismo vehículo.'
  },
  
  SOBREGIRO: {
    requiredFields: ['nombre', 'limite_sobregiro', 'fecha_inicio', 'fecha_fin', 'interest_rate'],
    defaultValues: {
      es_revolvente: true,
      moneda: 'USD'
    },
    validations: [
      (data) => validatePositiveNumber(data.limite_sobregiro, 'Límite de sobregiro'),
      (data) => validatePositiveNumber(data.interest_rate, 'Tasa de interés'),
      (data) => {
        if (data.limite_sobregiro && data.limite_sobregiro > 100000) {
          return 'El límite de sobregiro usualmente no excede $100,000';
        }
        return null;
      }
    ],
    isRevolvente: true,
    description: 'Línea automática que permite sobregiros en cuenta corriente hasta un límite.'
  },
  
  CARTA_CREDITO: {
    requiredFields: ['nombre', 'monto_total_linea', 'fecha_inicio', 'fecha_fin', 'beneficiario', 'banco_emisor', 'documento_respaldo'],
    defaultValues: {
      es_revolvente: false,
      moneda: 'USD'
    },
    validations: [
      (data) => validatePositiveNumber(data.monto_total_linea, 'Monto total'),
      (data) => {
        if (!data.beneficiario || data.beneficiario.trim() === '') {
          return 'El beneficiario es requerido para cartas de crédito';
        }
        return null;
      },
      (data) => {
        if (!data.banco_emisor || data.banco_emisor.trim() === '') {
          return 'El banco emisor es requerido para cartas de crédito';
        }
        return null;
      }
    ],
    isRevolvente: false,
    description: 'Garantía bancaria para operaciones de comercio internacional.'
  }
};

// Función para validar una línea de crédito según su tipo
export const validateLineaCredito = (data: Partial<LineaCreditoBase>): string[] => {
  const errors: string[] = [];
  
  if (!data.tipo_linea) {
    errors.push('El tipo de línea es requerido');
    return errors;
  }
  
  const rules = LINEA_CREDITO_RULES[data.tipo_linea as TipoLineaCredito];
  if (!rules) {
    errors.push('Tipo de línea no válido');
    return errors;
  }
  
  // Validar campos requeridos
  rules.requiredFields.forEach(field => {
    const value = data[field as keyof LineaCreditoBase];
    if (value === null || value === undefined || value === '') {
      errors.push(`${field} es requerido para este tipo de línea`);
    }
  });
  
  // Ejecutar validaciones específicas
  rules.validations.forEach(validation => {
    const error = validation(data);
    if (error) {
      errors.push(error);
    }
  });
  
  return errors;
};

// Función para obtener valores por defecto según el tipo
export const getDefaultValuesForTipo = (tipo: TipoLineaCredito): Partial<LineaCreditoBase> => {
  const rules = LINEA_CREDITO_RULES[tipo];
  return rules ? rules.defaultValues : {};
}; 