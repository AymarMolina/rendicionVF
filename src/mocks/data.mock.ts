import type {
  Transferencia, Gasto, Institucion, Capacitacion, MenuSemanal, Expediente
} from '@/types/rendicion'

export const mockTransferencias: Transferencia[] = [
  { id:'2026-01', codigo:'2026-01', fechaTransf:'10/01/2026', fechaRendir:'13/01/2026', monto:12500.00, sustentado:12500.00, saldo:0.00,   estado:'Enviada',    rubros:{alimentos:5000,transporte:2000,gas:1500,estipendio:2000,limpieza:1000,otros:1000} },
  { id:'2026-02', codigo:'2026-02', fechaTransf:'10/01/2026', fechaRendir:'14/01/2026', monto:10000.00, sustentado:9800.00,  saldo:200.00,  estado:'En proceso', rubros:{alimentos:4000,transporte:1500,gas:1200,estipendio:1800,limpieza:900,otros:600} },
  { id:'2026-03', codigo:'2026-03', fechaTransf:'10/01/2026', fechaRendir:'14/01/2026', monto:11000.00, sustentado:11000.00, saldo:0.00,    estado:'Observada',  rubros:{alimentos:4500,transporte:1800,gas:1300,estipendio:1900,limpieza:900,otros:600} },
  { id:'2026-04', codigo:'2026-04', fechaTransf:'10/01/2026', fechaRendir:'18/01/2026', monto:4280.00,  sustentado:3610.50,  saldo:669.50,  estado:'Pendiente',  rubros:{alimentos:2000,transporte:700,gas:580,estipendio:500,limpieza:300,otros:200} },
  { id:'2026-05', codigo:'2026-05', fechaTransf:'10/01/2026', fechaRendir:'12/01/2026', monto:16000.12, sustentado:16000.12, saldo:0.00,    estado:'Enviada',    rubros:{alimentos:6500,transporte:2500,gas:2000,estipendio:3000,limpieza:1200,otros:800.12} },
]

export const mockGastos: Gasto[] = [
  { id:1, transferenciaId:'2026-04', fecha:'10/01/2026', concepto:'AGUAS SAC',       rubro:'gas',       comprobante:'FACTURA 1.PDF', monto:1200, tieneRuc:true,  estado:'VALIDO' },
  { id:2, transferenciaId:'2026-04', fecha:'10/01/2026', concepto:'AGUAS SAC',       rubro:'gas',       comprobante:'FACTURA 1.PDF', monto:12,   tieneRuc:true,  estado:'VALIDO' },
  { id:3, transferenciaId:'2026-04', fecha:'10/01/2026', concepto:'AGUAS SAC',       rubro:'gas',       comprobante:'FACTURA 1.PDF', monto:45,   tieneRuc:true,  estado:'VALIDO' },
  { id:4, transferenciaId:'2026-04', fecha:'10/01/2026', concepto:'AGUAS SAC',       rubro:'gas',       comprobante:'FACTURA 1.PDF', monto:30,   tieneRuc:true,  estado:'VALIDO' },
  { id:5, transferenciaId:'2026-04', fecha:'10/01/2026', concepto:'MERCADO CENTRAL', rubro:'alimentos', comprobante:'DJ',            monto:12,   tieneRuc:false, estado:'En proceso' },
  { id:6, transferenciaId:'2026-04', fecha:'10/01/2026', concepto:'TRANS. ESCOLAR',  rubro:'transporte',comprobante:'DJ',            monto:12,   tieneRuc:false, estado:'En proceso' },
]

export const mockInstituciones: Institucion[] = [
  { id:'IE20124', nombre:'IE N° 20124 – Los Andes',      alumnos:210, tesorera:'María Torres', progreso:100, estado:'listo' },
  { id:'IE20089', nombre:'IE N° 20089 – San Martín',     alumnos:185, tesorera:'Rosa Quispe',  progreso:45,  estado:'critico' },
  { id:'IE38267', nombre:'IE N° 38267 – San Francisco',  alumnos:320, tesorera:'Carmen Díaz',  progreso:80,  estado:'observado' },
  { id:'IE00347', nombre:'IE N° 347 – Estrella',         alumnos:95,  tesorera:'Luz Mamani',   progreso:100, estado:'listo' },
  { id:'IE10521', nombre:'IE N° 10521 – Valle',          alumnos:150, tesorera:'Ana Flores',   progreso:65,  estado:'en_proceso' },
]

export const mockCapacitaciones: Capacitacion[] = [
  { id:1, tema:'Rendición de cuentas – ciclo junio', fecha:'14/06/2025', iees:'5 IE asignadas', asistentes:20, estado:'Programada' },
  { id:2, tema:'Manejo de comprobantes y formatos',  fecha:'22/06/2025', iees:'3 IE nuevas',    asistentes:12, estado:'Borrador' },
  { id:3, tema:'Inducción nuevas tesoreras',         fecha:'01/06/2025', iees:'2 IE',           asistentes:8,  estado:'Realizada' },
]

export const mockMenus: MenuSemanal[] = [
  { id:1, fechaInicio:'10/01/2026', fechaFin:'14/01/2026', ambito:'Rural',  nivel:'Inicial',   estado:'En curso' },
  { id:2, fechaInicio:'10/01/2026', fechaFin:'14/01/2026', ambito:'Urbana', nivel:'Primaria',  estado:'Finalizado' },
  { id:3, fechaInicio:'10/01/2026', fechaFin:'14/01/2026', ambito:'Rural',  nivel:'Primaria',  estado:'Finalizado' },
]

export const mockExpedientes: Expediente[] = [
  { id:'EXP001', ie:'IIEEs-MARIA AUXILIADORA',          transf:'2026-03/2/2', tesorera:'María Torres', ut:'UT-Piura',    estado:'Aprobado',  docs:['Anexo 1','Anexo 2','Anexo 3'] },
  { id:'EXP002', ie:'IIEEs-38267 SAN FRANCISCO DE ASIS',transf:'2026-03/1/2', tesorera:'Rosa Quispe',  ut:'UT-Piura',    estado:'Pendiente', docs:['Anexo 1','Anexo 2'] },
  { id:'EXP003', ie:'IIEEs-347',                        transf:'2026-02/1/1', tesorera:'Carmen Díaz',  ut:'UT-Ayacucho', estado:'Observado',  docs:['Anexo 1','Anexo 2','Anexo 3'] },
  { id:'EXP004', ie:'IIEEs-LOS ANDES 20124',            transf:'2026-03/1/1', tesorera:'Luz Mamani',   ut:'UT-Tumbes',   estado:'Aprobado',  docs:['Anexo 1','Anexo 2','Anexo 3'] },
  { id:'EXP005', ie:'IIEEs-ESTRELLA 10521',             transf:'2026-02/2/1', tesorera:'Ana Flores',   ut:'UT-Cusco',    estado:'Pendiente', docs:['Anexo 1'] },
]
