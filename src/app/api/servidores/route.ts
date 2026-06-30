import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { servidores, usuarios, cargos, unidades, setores, jornadas, auditoria } from '@/db/schema';
import { eq, or, ilike } from 'drizzle-orm';
import { getSession, hashPassword } from '@/lib/auth';

// GET - Listar servidores
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');

    let query = db
      .select({
        servidor: servidores,
        cargo: cargos,
        unidade: unidades,
        setor: setores,
      })
      .from(servidores)
      .leftJoin(cargos, eq(servidores.cargoId, cargos.id))
      .leftJoin(unidades, eq(servidores.unidadeId, unidades.id))
      .leftJoin(setores, eq(servidores.setorId, setores.id))
      .$dynamic();

    if (search) {
      query = query.where(
        or(
          ilike(servidores.nome, `%${search}%`),
          ilike(servidores.matricula, `%${search}%`),
          ilike(servidores.cpf, `%${search}%`)
        )
      );
    }

    const result = await query.limit(200);
    return NextResponse.json({ servidores: result });
  } catch (error) {
    console.error('Erro ao buscar servidores:', error);
    return NextResponse.json({ servidores: [] });
  }
}

// POST - Criar servidor + usuário + jornada
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const data = await request.json();

    if (!data.nome || !data.matricula || !data.cpf || !data.dataAdmissao) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: nome, matrícula, CPF e data de admissão' },
        { status: 400 }
      );
    }

    // Verificar duplicatas
    const [matriculaExistente] = await db
      .select({ id: servidores.id })
      .from(servidores)
      .where(eq(servidores.matricula, data.matricula))
      .limit(1);

    if (matriculaExistente) {
      return NextResponse.json({ error: 'Já existe um servidor com esta matrícula' }, { status: 400 });
    }

    const [cpfExistente] = await db
      .select({ id: servidores.id })
      .from(servidores)
      .where(eq(servidores.cpf, data.cpf))
      .limit(1);

    if (cpfExistente) {
      return NextResponse.json({ error: 'Já existe um servidor com este CPF' }, { status: 400 });
    }

    const insertData: any = {
      nome: data.nome,
      matricula: data.matricula,
      cpf: data.cpf,
      rg: data.rg || null,
      telefone: data.telefone || null,
      email: data.email || null,
      situacao: data.situacao || 'ATIVO',
      dataAdmissao: data.dataAdmissao,
      foto: data.foto || null,
    };

    if (data.cargoId && data.cargoId !== '' && data.cargoId !== 'none') {
      insertData.cargoId = data.cargoId;
    }
    if (data.unidadeId && data.unidadeId !== '' && data.unidadeId !== 'none') {
      insertData.unidadeId = data.unidadeId;
    }
    if (data.setorId && data.setorId !== '' && data.setorId !== 'none' && data.setorId !== '__none__') {
      insertData.setorId = data.setorId;
    }

    const [servidor] = await db.insert(servidores).values(insertData).returning();

    // Criar ou reativar usuário automaticamente
    const emailUsuario = data.email || `${data.matricula}@ponto.gov.br`;
    const senhaPadrao = data.cpf;

    // Buscar se já existe usuário com esse email OU com esse CPF
    const [emailExistente] = await db
      .select({ id: usuarios.id, ativo: usuarios.ativo })
      .from(usuarios)
      .where(eq(usuarios.email, emailUsuario))
      .limit(1);

    const [cpfUsuarioExistente] = await db
      .select({ id: usuarios.id, ativo: usuarios.ativo })
      .from(usuarios)
      .where(eq(usuarios.cpf, data.cpf))
      .limit(1);

    let usuarioCriado = null;
    let usuarioId = null;

    const usuarioJaExiste = emailExistente || cpfUsuarioExistente;

    if (usuarioJaExiste) {
      // Usuário já existe - reativar se estiver inativo e vincular
      usuarioId = (emailExistente || cpfUsuarioExistente)!.id;
      const ativo = (emailExistente || cpfUsuarioExistente)!.ativo;

      if (!ativo) {
        // Reativar usuário inativo
        const novaSenhaHash = await hashPassword(senhaPadrao);
        await db.update(usuarios).set({
          ativo: true,
          senha: novaSenhaHash,
          nome: data.nome,
        }).where(eq(usuarios.id, usuarioId));
      }

      // Vincular ao servidor
      await db.update(servidores).set({ usuarioId }).where(eq(servidores.id, servidor.id));

      usuarioCriado = {
        email: emailExistente ? emailUsuario : `${data.matricula}@ponto.gov.br`,
        senhaPadrao,
        reativado: !ativo,
      };
    } else {
      // Criar novo usuário
      const senhaHash = await hashPassword(senhaPadrao);

      const [usuario] = await db.insert(usuarios).values({
        nome: data.nome,
        cpf: data.cpf,
        email: emailUsuario,
        senha: senhaHash,
        perfil: 'SERVIDOR',
        ativo: true,
      }).returning();

      usuarioId = usuario.id;

      // Vincular ao servidor
      await db.update(servidores).set({ usuarioId }).where(eq(servidores.id, servidor.id));

      usuarioCriado = {
        email: emailUsuario,
        senhaPadrao,
        reativado: false,
      };
    }

    // Criar jornadas de trabalho (uma por dia da semana)
    const carga = calcularCargaHoraria(
      data.horaEntrada || '08:00',
      data.horaSaidaAlmoco || '12:00',
      data.horaRetornoAlmoco || '13:00',
      data.horaSaidaFinal || '17:00'
    );

    // Dias selecionados (padrão: seg a sex)
    const diasSelecionados = data.diasSemana && data.diasSemana.length > 0
      ? data.diasSemana
      : [1, 2, 3, 4, 5];

    for (const dia of diasSelecionados) {
      const jornadaDia = data.jornadas?.[String(dia)] || data.jornadas?.[dia] || {};
      
      const hEntrada = jornadaDia.horaEntrada || data.horaEntrada || '08:00';
      const hSaidaAlmoco = jornadaDia.horaSaidaAlmoco || data.horaSaidaAlmoco || null;
      const hRetornoAlmoco = jornadaDia.horaRetornoAlmoco || data.horaRetornoAlmoco || null;
      const hSaidaFinal = jornadaDia.horaSaidaFinal || data.horaSaidaFinal || '17:00';
      
      // Converter strings vazias para null nos campos opcionais
      const saidaAlmoco = hSaidaAlmoco && hSaidaAlmoco !== '' ? hSaidaAlmoco : null;
      const retornoAlmoco = hRetornoAlmoco && hRetornoAlmoco !== '' ? hRetornoAlmoco : null;

      await db.insert(jornadas).values({
        servidorId: servidor.id,
        diaSemana: dia,
        horaEntrada: hEntrada,
        horaSaidaAlmoco: saidaAlmoco,
        horaRetornoAlmoco: retornoAlmoco,
        horaSaidaFinal: hSaidaFinal,
        cargaHorariaDiaria: calcularCargaHoraria(hEntrada, saidaAlmoco, retornoAlmoco, hSaidaFinal),
        dataInicio: data.dataAdmissao || new Date().toISOString().split('T')[0],
        ativo: true,
        criadoPor: session.userId,
      });
    }

    await db.insert(auditoria).values({
      usuarioId: session.userId,
      acao: 'CRIAR',
      tabela: 'servidores',
      registroId: servidor.id,
      dadosDepois: servidor as any,
    });

    return NextResponse.json({
      servidor,
      usuario: usuarioCriado,
      message: usuarioCriado
        ? `Servidor cadastrado! Login: ${usuarioCriado.email} | Senha: ${usuarioCriado.senhaPadrao} (CPF)`
        : 'Servidor cadastrado!',
    }, { status: 201 });

  } catch (error: any) {
    console.error('Erro ao criar servidor:', error.message, error.stack);
    return NextResponse.json({ error: error.message || 'Erro ao criar servidor', details: error.detail }, { status: 500 });
  }
}

function calcularCargaHoraria(entrada: string, saidaAlmoco: string | null, retornoAlmoco: string | null, saidaFinal: string): string {
  const timeToMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  if (saidaAlmoco && retornoAlmoco) {
    const manha = timeToMinutes(saidaAlmoco) - timeToMinutes(entrada);
    const tarde = timeToMinutes(saidaFinal) - timeToMinutes(retornoAlmoco);
    return ((manha + tarde) / 60).toFixed(2);
  }

  const total = timeToMinutes(saidaFinal) - timeToMinutes(entrada);
  return (total / 60).toFixed(2);
}
