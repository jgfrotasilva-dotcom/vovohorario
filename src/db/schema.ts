import { pgTable, text, integer, timestamp, boolean, varchar, date, time, numeric, jsonb, uuid, pgEnum } from 'drizzle-orm/pg-core';

// Enums
export const perfilEnum = pgEnum('perfil', ['ADMINISTRADOR', 'RH', 'GESTOR', 'SECRETARIO', 'SERVIDOR']);
export const situacaoServidorEnum = pgEnum('situacao_servidor', ['ATIVO', 'INATIVO', 'AFASTADO', 'FERIAS', 'LICENCA']);
export const tipoRegistroEnum = pgEnum('tipo_registro', ['ENTRADA', 'SAIDA_ALMOCO', 'RETORNO_ALMOCO', 'SAIDA_FINAL']);
export const statusRegistroEnum = pgEnum('status_registro', ['PRESENTE', 'FALTA', 'FALTA_JUSTIFICADA', 'FERIAS', 'LICENCA', 'AFASTAMENTO', 'PENDENTE']);
export const tipoAusenciaEnum = pgEnum('tipo_ausencia', ['FALTA', 'FALTA_JUSTIFICADA', 'ABONO', 'FERIAS', 'LICENCA_SAUDE', 'LICENCA_PREMIO', 'LICENCA_GESTANTE', 'LICENCA_PATERNIDADE', 'LICENCA_NOJO', 'LICENCA_GALA', 'AFASTAMENTO', 'CURSO', 'HOME_OFFICE', 'COMPENSACAO', 'BANCO_HORAS', 'DISPENSA', 'RECESSO', 'PONTO_FACULTATIVO', 'OUTRO']);

// Usuários do Sistema
export const usuarios = pgTable('usuarios', {
  id: uuid('id').defaultRandom().primaryKey(),
  nome: varchar('nome', { length: 255 }).notNull(),
  cpf: varchar('cpf', { length: 11 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  senha: text('senha').notNull(),
  perfil: perfilEnum('perfil').notNull().default('SERVIDOR'),
  ativo: boolean('ativo').notNull().default(true),
  criadoEm: timestamp('criado_em').notNull().defaultNow(),
  atualizadoEm: timestamp('atualizado_em').notNull().defaultNow(),
});

// Permissões
export const permissoes = pgTable('permissoes', {
  id: uuid('id').defaultRandom().primaryKey(),
  perfil: perfilEnum('perfil').notNull(),
  recurso: varchar('recurso', { length: 100 }).notNull(),
  acao: varchar('acao', { length: 50 }).notNull(), // criar, ler, atualizar, excluir
  criadoEm: timestamp('criado_em').notNull().defaultNow(),
});

// Unidades Escolares
export const unidades = pgTable('unidades', {
  id: uuid('id').defaultRandom().primaryKey(),
  nome: varchar('nome', { length: 255 }).notNull(),
  codigo: varchar('codigo', { length: 50 }).unique(),
  endereco: text('endereco'),
  telefone: varchar('telefone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  brasao: text('brasao'), // URL do brasão
  ativo: boolean('ativo').notNull().default(true),
  criadoEm: timestamp('criado_em').notNull().defaultNow(),
  atualizadoEm: timestamp('atualizado_em').notNull().defaultNow(),
});

// Setores
export const setores = pgTable('setores', {
  id: uuid('id').defaultRandom().primaryKey(),
  nome: varchar('nome', { length: 255 }).notNull(),
  unidadeId: uuid('unidade_id').references(() => unidades.id),
  ativo: boolean('ativo').notNull().default(true),
  criadoEm: timestamp('criado_em').notNull().defaultNow(),
  atualizadoEm: timestamp('atualizado_em').notNull().defaultNow(),
});

// Cargos
export const cargos = pgTable('cargos', {
  id: uuid('id').defaultRandom().primaryKey(),
  nome: varchar('nome', { length: 255 }).notNull(),
  categoria: varchar('categoria', { length: 100 }),
  cargaHorariaPadrao: integer('carga_horaria_padrao').default(40), // horas semanais
  ativo: boolean('ativo').notNull().default(true),
  criadoEm: timestamp('criado_em').notNull().defaultNow(),
  atualizadoEm: timestamp('atualizado_em').notNull().defaultNow(),
});

// Servidores
export const servidores = pgTable('servidores', {
  id: uuid('id').defaultRandom().primaryKey(),
  nome: varchar('nome', { length: 255 }).notNull(),
  matricula: varchar('matricula', { length: 50 }).notNull().unique(),
  cpf: varchar('cpf', { length: 11 }).notNull().unique(),
  rg: varchar('rg', { length: 20 }),
  cargoId: uuid('cargo_id').references(() => cargos.id),
  unidadeId: uuid('unidade_id').references(() => unidades.id),
  setorId: uuid('setor_id').references(() => setores.id),
  telefone: varchar('telefone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  situacao: situacaoServidorEnum('situacao').notNull().default('ATIVO'),
  dataAdmissao: date('data_admissao').notNull(),
  usuarioId: uuid('usuario_id').references(() => usuarios.id),
  foto: text('foto'),
  criadoEm: timestamp('criado_em').notNull().defaultNow(),
  atualizadoEm: timestamp('atualizado_em').notNull().defaultNow(),
});

// Jornadas de Trabalho (uma entrada por dia da semana)
export const jornadas = pgTable('jornadas', {
  id: uuid('id').defaultRandom().primaryKey(),
  servidorId: uuid('servidor_id').references(() => servidores.id).notNull(),
  diaSemana: integer('dia_semana').notNull(), // 0=dom, 1=seg, 2=ter, 3=qua, 4=qui, 5=sex, 6=sab
  horaEntrada: time('hora_entrada').notNull(),
  horaSaidaAlmoco: time('hora_saida_almoco'),
  horaRetornoAlmoco: time('hora_retorno_almoco'),
  horaSaidaFinal: time('hora_saida_final').notNull(),
  cargaHorariaDiaria: numeric('carga_horaria_diaria', { precision: 5, scale: 2 }).notNull(),
  dataInicio: date('data_inicio').notNull(),
  dataFim: date('data_fim'),
  observacoes: text('observacoes'),
  ativo: boolean('ativo').notNull().default(true),
  criadoEm: timestamp('criado_em').notNull().defaultNow(),
  criadoPor: uuid('criado_por').references(() => usuarios.id),
});

// Registros de Ponto
export const registrosPonto = pgTable('registros_ponto', {
  id: uuid('id').defaultRandom().primaryKey(),
  servidorId: uuid('servidor_id').references(() => servidores.id).notNull(),
  data: date('data').notNull(),
  horaEntrada: time('hora_entrada'),
  horaSaidaAlmoco: time('hora_saida_almoco'),
  horaRetornoAlmoco: time('hora_retorno_almoco'),
  horaSaidaFinal: time('hora_saida_final'),
  cargaDiaria: numeric('carga_diaria', { precision: 5, scale: 2 }), // em horas
  saldo: numeric('saldo', { precision: 5, scale: 2 }), // diferença entre carga realizada e esperada
  status: statusRegistroEnum('status').notNull().default('PENDENTE'),
  observacoes: text('observacoes'),
  registradoEm: timestamp('registrado_em').notNull().defaultNow(),
  registradoPor: uuid('registrado_por').references(() => usuarios.id),
  atualizadoEm: timestamp('atualizado_em').notNull().defaultNow(),
  atualizadoPor: uuid('atualizado_por').references(() => usuarios.id),
});

// Ausências e Licenças
export const ausencias = pgTable('ausencias', {
  id: uuid('id').defaultRandom().primaryKey(),
  servidorId: uuid('servidor_id').references(() => servidores.id).notNull(),
  tipo: tipoAusenciaEnum('tipo').notNull(),
  dataInicio: date('data_inicio').notNull(),
  dataFim: date('data_fim').notNull(),
  motivo: text('motivo'),
  documento: text('documento'), // URL do documento anexado
  aprovado: boolean('aprovado'),
  aprovadoPor: uuid('aprovado_por').references(() => usuarios.id),
  aprovadoEm: timestamp('aprovado_em'),
  criadoEm: timestamp('criado_em').notNull().defaultNow(),
  criadoPor: uuid('criado_por').references(() => usuarios.id).notNull(),
});

// Banco de Horas
export const bancoHoras = pgTable('banco_horas', {
  id: uuid('id').defaultRandom().primaryKey(),
  servidorId: uuid('servidor_id').references(() => servidores.id).notNull(),
  mes: integer('mes').notNull(), // 1-12
  ano: integer('ano').notNull(),
  horasPositivas: numeric('horas_positivas', { precision: 7, scale: 2 }).default('0'),
  horasNegativas: numeric('horas_negativas', { precision: 7, scale: 2 }).default('0'),
  saldo: numeric('saldo', { precision: 7, scale: 2 }).notNull().default('0'),
  compensacoes: numeric('compensacoes', { precision: 7, scale: 2 }).default('0'),
  horasExtras: numeric('horas_extras', { precision: 7, scale: 2 }).default('0'),
  fechado: boolean('fechado').notNull().default(false),
  fechadoEm: timestamp('fechado_em'),
  fechadoPor: uuid('fechado_por').references(() => usuarios.id),
  criadoEm: timestamp('criado_em').notNull().defaultNow(),
  atualizadoEm: timestamp('atualizado_em').notNull().defaultNow(),
});

// Justificativas
export const justificativas = pgTable('justificativas', {
  id: uuid('id').defaultRandom().primaryKey(),
  registroId: uuid('registro_id').references(() => registrosPonto.id),
  servidorId: uuid('servidor_id').references(() => servidores.id).notNull(),
  data: date('data').notNull(),
  tipo: varchar('tipo', { length: 100 }).notNull(),
  descricao: text('descricao'),
  anexos: jsonb('anexos').default([]), // array de URLs
  analisado: boolean('analisado').default(false),
  aprovado: boolean('aprovado'),
  analisadoPor: uuid('analisado_por').references(() => usuarios.id),
  analisadoEm: timestamp('analisado_em'),
  criadoEm: timestamp('criado_em').notNull().defaultNow(),
  criadoPor: uuid('criado_por').references(() => usuarios.id).notNull(),
});

// Folhas de Ponto
export const folhasPonto = pgTable('folhas_ponto', {
  id: uuid('id').defaultRandom().primaryKey(),
  numeroDocumento: varchar('numero_documento', { length: 50 }).unique(),
  servidorId: uuid('servidor_id').references(() => servidores.id).notNull(),
  mes: integer('mes').notNull(),
  ano: integer('ano').notNull(),
  dados: jsonb('dados').notNull(), // JSON completo da folha
  qrCode: text('qr_code'),
  assinaturaServidor: text('assinatura_servidor'),
  assinaturaGestor: text('assinatura_gestor'),
  geradoEm: timestamp('gerado_em').notNull().defaultNow(),
  geradoPor: uuid('gerado_por').references(() => usuarios.id).notNull(),
});

// Feriados e Pontos Facultativos
export const feriados = pgTable('feriados', {
  id: uuid('id').defaultRandom().primaryKey(),
  nome: varchar('nome', { length: 255 }).notNull(),
  data: date('data').notNull(),
  tipo: varchar('tipo', { length: 50 }).notNull(), // FERIADO, PONTO_FACULTATIVO, RECESSO
  nacional: boolean('nacional').default(false),
  estadual: boolean('estadual').default(false),
  municipal: boolean('municipal').default(false),
  criadoEm: timestamp('criado_em').notNull().defaultNow(),
});

// Notificações
export const notificacoes = pgTable('notificacoes', {
  id: uuid('id').defaultRandom().primaryKey(),
  usuarioId: uuid('usuario_id').references(() => usuarios.id).notNull(),
  titulo: varchar('titulo', { length: 255 }).notNull(),
  mensagem: text('mensagem').notNull(),
  tipo: varchar('tipo', { length: 50 }).notNull(), // INFO, ALERTA, ERRO, SUCESSO
  lida: boolean('lida').notNull().default(false),
  link: text('link'),
  criadoEm: timestamp('criado_em').notNull().defaultNow(),
});

// Auditoria
export const auditoria = pgTable('auditoria', {
  id: uuid('id').defaultRandom().primaryKey(),
  usuarioId: uuid('usuario_id').references(() => usuarios.id),
  acao: varchar('acao', { length: 100 }).notNull(),
  tabela: varchar('tabela', { length: 100 }).notNull(),
  registroId: uuid('registro_id'),
  dadosAntes: jsonb('dados_antes'),
  dadosDepois: jsonb('dados_depois'),
  ip: varchar('ip', { length: 50 }),
  dispositivo: text('dispositivo'),
  criadoEm: timestamp('criado_em').notNull().defaultNow(),
});

// Configurações
export const configuracoes = pgTable('configuracoes', {
  id: uuid('id').defaultRandom().primaryKey(),
  chave: varchar('chave', { length: 100 }).notNull().unique(),
  valor: jsonb('valor').notNull(),
  descricao: text('descricao'),
  atualizadoEm: timestamp('atualizado_em').notNull().defaultNow(),
  atualizadoPor: uuid('atualizado_por').references(() => usuarios.id),
});
