import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { registrosPonto, servidores, usuarios, jornadas, auditoria } from '@/db/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

// GET - Buscar registros de ponto
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const servidorIdParam = searchParams.get('servidorId');
    const mes = searchParams.get('mes');
    const ano = searchParams.get('ano');

    let idServidor = servidorIdParam;

    console.log('GET registro-ponto - userId:', session.userId, 'perfil:', session.perfil);

    if (session.perfil === 'SERVIDOR') {
      const [serv] = await db
        .select({ id: servidores.id })
        .from(servidores)
        .where(eq(servidores.usuarioId, session.userId))
        .limit(1);

      console.log('Servidor encontrado via usuarioId:', serv ? serv.id : 'NENHUM');
      
      if (!serv) return NextResponse.json({ registros: [], jornada: null });
      idServidor = serv.id;
    }

    if (!idServidor) return NextResponse.json({ registros: [], jornada: null });

    // Buscar jornada do servidor para o dia da semana atual
    const diaSemanaAtual = new Date().getDay();
    console.log('Buscando jornada para servidor:', idServidor, 'dia:', diaSemanaAtual);
    
    let [jornada] = await db
      .select()
      .from(jornadas)
      .where(and(
        eq(jornadas.servidorId, idServidor),
        eq(jornadas.diaSemana, diaSemanaAtual),
        eq(jornadas.ativo, true)
      ))
      .limit(1);

    console.log('Jornada para dia especifico:', jornada ? 'ENCONTRADA' : 'NAO ENCONTRADA');

    // Fallback: se não tem jornada para hoje, pega qualquer uma
    if (!jornada) {
      console.log('Buscando qualquer jornada ativa...');
      [jornada] = await db
        .select()
        .from(jornadas)
        .where(and(
          eq(jornadas.servidorId, idServidor),
          eq(jornadas.ativo, true)
        ))
        .limit(1);
      console.log('Fallback:', jornada ? 'ENCONTRADA' : 'NAO ENCONTRADA');
    }

    console.log('Jornada final:', jornada ? `${jornada.horaEntrada}-${jornada.horaSaidaFinal}` : 'NENHUMA');

    // Buscar registros
    const conditions = [eq(registrosPonto.servidorId, idServidor)];

    if (mes && ano) {
      const mesNum = parseInt(mes);
      const anoNum = parseInt(ano);
      const dataInicio = `${anoNum}-${String(mesNum).padStart(2, '0')}-01`;
      const ultimoDia = new Date(anoNum, mesNum, 0).getDate();
      const dataFim = `${anoNum}-${String(mesNum).padStart(2, '0')}-${ultimoDia}`;
      conditions.push(gte(registrosPonto.data, dataInicio));
      conditions.push(lte(registrosPonto.data, dataFim));
    }

    const registros = await db
      .select()
      .from(registrosPonto)
      .where(and(...conditions))
      .orderBy(sql`${registrosPonto.data} DESC`);

    // Buscar foto e nome do servidor
    const [servInfo] = await db
      .select({ foto: servidores.foto, nome: servidores.nome })
      .from(servidores)
      .where(eq(servidores.id, idServidor))
      .limit(1);

    return NextResponse.json({ 
      registros, 
      jornada: jornada || null,
      foto: servInfo?.foto || null,
      nomeServidor: servInfo?.nome || '',
    });
  } catch (error: any) {
    console.error('Erro ao buscar registros:', error);
    return NextResponse.json({ registros: [], jornada: null, error: error.message });
  }
}

// POST - Registrar ponto
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const data = await request.json();

    // Verificar se o usuário está ativo
    const [usuario] = await db
      .select()
      .from(usuarios)
      .where(eq(usuarios.id, session.userId))
      .limit(1);

    if (!usuario || !usuario.ativo) {
      return NextResponse.json({ error: 'Usuário inativo. Acesso negado.' }, { status: 403 });
    }

    // Buscar servidor vinculado ao usuário
    const [servidor] = await db
      .select()
      .from(servidores)
      .where(eq(servidores.usuarioId, session.userId))
      .limit(1);

    if (!servidor) {
      return NextResponse.json({ error: 'Servidor não encontrado. Cadastre um servidor primeiro.' }, { status: 404 });
    }

    console.log('Servidor encontrado:', servidor.id, 'Dia semana:', new Date().getDay());

    // Buscar jornada do servidor para o dia da semana atual
    const diaSemanaAtual = new Date().getDay();
    
    console.log('Buscando jornada para servidor:', servidor.id, 'dia:', diaSemanaAtual);
    
    // Primeiro tenta buscar jornada para o dia específico
    let [jornada] = await db
      .select()
      .from(jornadas)
      .where(and(
        eq(jornadas.servidorId, servidor.id),
        eq(jornadas.diaSemana, diaSemanaAtual),
        eq(jornadas.ativo, true)
      ))
      .limit(1);

    console.log('Jornada encontrada para dia:', jornada ? 'SIM' : 'NAO');

    // Se não encontrou para hoje, busca qualquer jornada ativa como fallback
    if (!jornada) {
      console.log('Buscando qualquer jornada ativa...');
      [jornada] = await db
        .select()
        .from(jornadas)
        .where(and(
          eq(jornadas.servidorId, servidor.id),
          eq(jornadas.ativo, true)
        ))
        .limit(1);
      console.log('Fallback jornada:', jornada ? 'SIM' : 'NAO');
    }

    if (!jornada) {
      // Listar todas as jornadas do servidor para debug
      const todasJornadas = await db.select().from(jornadas).where(eq(jornadas.servidorId, servidor.id));
      console.log('Todas as jornadas do servidor:', JSON.stringify(todasJornadas));
      
      return NextResponse.json({ 
        error: 'Jornada de trabalho não configurada para este servidor. Contacte o administrador.',
        servidorId: servidor.id,
        diaSemana: diaSemanaAtual,
        totalJornadas: todasJornadas.length
      }, { status: 400 });
    }

    const hoje = data.data || new Date().toISOString().split('T')[0];
    const agora = new Date();
    const horaAtual = `${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`;

    // Buscar registro existente de hoje
    const [existente] = await db
      .select()
      .from(registrosPonto)
      .where(
        and(
          eq(registrosPonto.servidorId, servidor.id),
          eq(registrosPonto.data, hoje)
        )
      )
      .limit(1);

    // Validações baseadas na jornada
    if (data.horaEntrada && !existente?.horaEntrada) {
      const validacao = validarHorario('ENTRADA', horaAtual, jornada);
      if (!validacao.permitido) {
        return NextResponse.json({ error: validacao.mensagem }, { status: 400 });
      }
    }

    if (data.horaSaidaAlmoco && !existente?.horaSaidaAlmoco) {
      const validacao = validarHorario('SAIDA_ALMOCO', horaAtual, jornada);
      if (!validacao.permitido) {
        return NextResponse.json({ error: validacao.mensagem }, { status: 400 });
      }
    }

    if (data.horaRetornoAlmoco && !existente?.horaRetornoAlmoco) {
      const validacao = validarHorario('RETORNO_ALMOCO', horaAtual, jornada);
      if (!validacao.permitido) {
        return NextResponse.json({ error: validacao.mensagem }, { status: 400 });
      }
    }

    if (data.horaSaidaFinal && !existente?.horaSaidaFinal) {
      const validacao = validarHorario('SAIDA_FINAL', horaAtual, jornada);
      if (!validacao.permitido) {
        return NextResponse.json({ error: validacao.mensagem }, { status: 400 });
      }
    }

    if (existente) {
      // Atualizar registro existente
      const updateData: any = { atualizadoEm: new Date() };

      if (data.horaEntrada && !existente.horaEntrada) updateData.horaEntrada = data.horaEntrada.substring(0, 5);
      if (data.horaSaidaAlmoco && !existente.horaSaidaAlmoco) updateData.horaSaidaAlmoco = data.horaSaidaAlmoco.substring(0, 5);
      if (data.horaRetornoAlmoco && !existente.horaRetornoAlmoco) updateData.horaRetornoAlmoco = data.horaRetornoAlmoco.substring(0, 5);
      if (data.horaSaidaFinal && !existente.horaSaidaFinal) updateData.horaSaidaFinal = data.horaSaidaFinal.substring(0, 5);

      // Calcular carga
      const entrada = updateData.horaEntrada || existente.horaEntrada;
      const saidaAlmoco = updateData.horaSaidaAlmoco || existente.horaSaidaAlmoco;
      const retornoAlmoco = updateData.horaRetornoAlmoco || existente.horaRetornoAlmoco;
      const saidaFinal = updateData.horaSaidaFinal || existente.horaSaidaFinal;

      if (entrada && saidaFinal) {
        if (saidaAlmoco && retornoAlmoco) {
          const manha = timeToMinutes(saidaAlmoco) - timeToMinutes(entrada);
          const tarde = timeToMinutes(saidaFinal) - timeToMinutes(retornoAlmoco);
          updateData.cargaDiaria = ((manha + tarde) / 60).toFixed(2);
        } else {
          updateData.cargaDiaria = ((timeToMinutes(saidaFinal) - timeToMinutes(entrada)) / 60).toFixed(2);
        }
        updateData.status = 'PRESENTE';
      }

      const [atualizado] = await db.update(registrosPonto).set(updateData).where(eq(registrosPonto.id, existente.id)).returning();
      return NextResponse.json({ registro: atualizado });
    }

    // Criar novo registro
    const insertData: any = {
      servidorId: servidor.id,
      data: hoje,
      status: 'PENDENTE',
    };

    if (data.horaEntrada) insertData.horaEntrada = data.horaEntrada.substring(0, 5);

    const [registro] = await db.insert(registrosPonto).values(insertData).returning();
    return NextResponse.json({ registro }, { status: 201 });

  } catch (error: any) {
    console.error('Erro ao registrar ponto:', error);
    return NextResponse.json({ error: error.message || 'Erro ao registrar ponto' }, { status: 500 });
  }
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function validarHorario(tipo: string, horaAtual: string, jornada: any): { permitido: boolean; mensagem: string } {
  const minutosAtual = timeToMinutes(horaAtual);
  const tolerancia = 15; // 15 minutos de tolerância

  switch (tipo) {
    case 'ENTRADA': {
      const horaEntrada = timeToMinutes(jornada.horaEntrada);
      if (minutosAtual > horaEntrada + tolerancia) {
        const atraso = minutosAtual - horaEntrada;
        return {
          permitido: true, // Permite registrar mas avisa
          mensagem: `⚠️ Você está ${atraso} minuto(s) atrasado. Horário de entrada: ${jornada.horaEntrada}. Registro será marcado como atraso.`
        };
      }
      return { permitido: true, mensagem: '' };
    }
    case 'SAIDA_ALMOCO': {
      if (!jornada.horaSaidaAlmoco) return { permitido: true, mensagem: '' };
      const horaSaida = timeToMinutes(jornada.horaSaidaAlmoco);
      if (minutosAtual < horaSaida - tolerancia) {
        return {
          permitido: false,
          mensagem: `❌ Ainda não é hora do almoço. Horário previsto: ${jornada.horaSaidaAlmoco}`
        };
      }
      return { permitido: true, mensagem: '' };
    }
    case 'RETORNO_ALMOCO': {
      if (!jornada.horaRetornoAlmoco) return { permitido: true, mensagem: '' };
      const horaRetorno = timeToMinutes(jornada.horaRetornoAlmoco);
      if (minutosAtual < horaRetorno - tolerancia) {
        return {
          permitido: false,
          mensagem: `❌ Ainda não é hora de retornar. Horário previsto: ${jornada.horaRetornoAlmoco}`
        };
      }
      return { permitido: true, mensagem: '' };
    }
    case 'SAIDA_FINAL': {
      const horaSaidaFinal = timeToMinutes(jornada.horaSaidaFinal);
      if (minutosAtual < horaSaidaFinal - tolerancia) {
        const falta = horaSaidaFinal - minutosAtual;
        return {
          permitido: true,
          mensagem: `⚠️ Você está saindo ${falta} minuto(s) antes do horário (${jornada.horaSaidaFinal}). Registro será marcado como saída antecipada.`
        };
      }
      return { permitido: true, mensagem: '' };
    }
    default:
      return { permitido: true, mensagem: '' };
  }
}
