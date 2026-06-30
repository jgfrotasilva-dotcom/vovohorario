import 'dotenv/config';
import { db } from './index';
import { usuarios, unidades, cargos, setores, servidores } from './schema';
import { hashPassword } from '@/lib/auth';

async function seed() {
  console.log('🌱 Iniciando seed do banco de dados...');

  try {
    // Criar usuário administrador
    const senhaHash = await hashPassword('admin123');
    
    const [admin] = await db.insert(usuarios).values({
      nome: 'Administrador',
      cpf: '00000000000',
      email: 'admin@sistema.com',
      senha: senhaHash,
      perfil: 'ADMINISTRADOR',
      ativo: true,
    }).returning();

    console.log('✅ Usuário administrador criado');

    // Criar unidade escolar
    const [unidade] = await db.insert(unidades).values({
      nome: 'Escola Municipal Centro',
      codigo: 'EM001',
      endereco: 'Rua Principal, 123 - Centro',
      telefone: '(11) 98765-4321',
      email: 'escola@municipio.gov.br',
      ativo: true,
    }).returning();

    console.log('✅ Unidade escolar criada');

    // Criar setores
    const [setor1] = await db.insert(setores).values({
      nome: 'Administração',
      unidadeId: unidade.id,
      ativo: true,
    }).returning();

    const [setor2] = await db.insert(setores).values({
      nome: 'Pedagógico',
      unidadeId: unidade.id,
      ativo: true,
    }).returning();

    console.log('✅ Setores criados');

    // Criar cargos
    const [cargo1] = await db.insert(cargos).values({
      nome: 'Professor',
      categoria: 'Docente',
      cargaHorariaPadrao: 40,
      ativo: true,
    }).returning();

    const [cargo2] = await db.insert(cargos).values({
      nome: 'Auxiliar Administrativo',
      categoria: 'Administrativo',
      cargaHorariaPadrao: 40,
      ativo: true,
    }).returning();

    const [cargo3] = await db.insert(cargos).values({
      nome: 'Diretor',
      categoria: 'Gestão',
      cargaHorariaPadrao: 40,
      ativo: true,
    }).returning();

    console.log('✅ Cargos criados');

    // Criar servidores de exemplo
    await db.insert(servidores).values([
      {
        nome: 'Maria Silva Santos',
        matricula: '2024001',
        cpf: '11111111111',
        rg: '123456789',
        cargoId: cargo1.id,
        unidadeId: unidade.id,
        setorId: setor2.id,
        telefone: '(11) 91234-5678',
        email: 'maria.silva@escola.gov.br',
        situacao: 'ATIVO',
        dataAdmissao: '2024-01-15',
      },
      {
        nome: 'João Pedro Oliveira',
        matricula: '2024002',
        cpf: '22222222222',
        rg: '987654321',
        cargoId: cargo2.id,
        unidadeId: unidade.id,
        setorId: setor1.id,
        telefone: '(11) 91234-5679',
        email: 'joao.oliveira@escola.gov.br',
        situacao: 'ATIVO',
        dataAdmissao: '2024-02-01',
      },
      {
        nome: 'Ana Paula Costa',
        matricula: '2024003',
        cpf: '33333333333',
        rg: '456789123',
        cargoId: cargo3.id,
        unidadeId: unidade.id,
        setorId: setor1.id,
        telefone: '(11) 91234-5680',
        email: 'ana.costa@escola.gov.br',
        situacao: 'ATIVO',
        dataAdmissao: '2023-05-10',
      },
    ]);

    console.log('✅ Servidores criados');

    console.log('🎉 Seed concluído com sucesso!');
    console.log('\n📝 Credenciais de acesso:');
    console.log('Email: admin@sistema.com');
    console.log('Senha: admin123');
    
  } catch (error) {
    console.error('❌ Erro ao executar seed:', error);
    throw error;
  }
}

seed()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
