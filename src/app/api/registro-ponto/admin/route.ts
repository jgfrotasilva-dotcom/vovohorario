import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { servidores, registrosPonto, cargos, unidades, jornadas } from '@/db/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

// GET - Listar todos os servidores com registros para uma data específica
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    if (!['ADMINISTRADOR', 'RH'].includes(session.perfil)) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const data = searchParams.get('data');

    if (!data) {
      return NextResponse.json({ error: 'Data obrigatória' }, { status: 400 });
    }

    // Buscar todos os servidores ativos
    const todosServidores = await db
      .select({
        servidor: servidores,
        cargo: cargos,
        unidade: unidades,
      })
      .from(servidores)
      .leftJoin(cargos, eq(servidores.cargoId, cargos.id))
      .leftJoin(unidades, eq(servidores.unidadeId, unidades.id))
      .where(eq(servidores.situacao, 'ATIVO'));

    // Buscar registros para a data
    const registros = await db
      .select()
      .from(registrosPonto)
      .where(eq(registrosPonto.data, data));

    // Buscar jornadas para o dia da semana da data
    const diaSemana = new Date(data + 'T12:00:00').getDay();
    const jornadasDia = await db
      .select()
      .from(jornadas)
      .where(and(eq(jornadas.diaSemana, diaSemana), eq(jornadas.ativo, true)));

    // Montar resultado
    const resultado = todosServidores.map(({ servidor, cargo, unidade }) => {
      const registro = registros.find(r => r.servidorId === servidor.id);
      const jornada = jornadasDia.find(j => j.servidorId === servidor.id);

      return {
        servidor,
        cargo,
        unidade,
        registro: registro || null,
        jornada: jornada || null,
        temRegistro: !!registro,
      };
    });

    return NextResponse.json({ data, servidores: resultado });
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ data: '', servidores: [] });
  }
}
