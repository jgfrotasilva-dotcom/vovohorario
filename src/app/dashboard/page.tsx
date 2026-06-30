'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Plane, 
  FileText, 
  Clock,
  AlertCircle,
  TrendingUp
} from 'lucide-react';

interface Stats {
  totalServidores: number;
  presentesHoje: number;
  ausentesHoje: number;
  emFerias: number;
  emLicenca: number;
  registrosPendentes: number;
  bancoHorasTotal: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    totalServidores: 0,
    presentesHoje: 0,
    ausentesHoje: 0,
    emFerias: 0,
    emLicenca: 0,
    registrosPendentes: 0,
    bancoHorasTotal: 0,
  });
  const [loading, setLoading] = useState(true);
  const [perfil, setPerfil] = useState('');

  useEffect(() => {
    async function checkPerfil() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.usuario?.perfil === 'SERVIDOR') {
            router.push('/dashboard/meu-ponto');
            return;
          }
          setPerfil(data.usuario?.perfil || '');
        }
      } catch (error) {
        console.error('Erro:', error);
      }
    }
    checkPerfil();
  }, [router]);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/dashboard/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const cards = [
    {
      title: 'Total de Servidores',
      value: stats.totalServidores,
      icon: Users,
      color: 'bg-blue-500',
      description: 'Servidores ativos',
    },
    {
      title: 'Presentes Hoje',
      value: stats.presentesHoje,
      icon: UserCheck,
      color: 'bg-green-500',
      description: 'Frequência do dia',
    },
    {
      title: 'Ausentes Hoje',
      value: stats.ausentesHoje,
      icon: UserX,
      color: 'bg-red-500',
      description: 'Faltas registradas',
    },
    {
      title: 'Em Férias',
      value: stats.emFerias,
      icon: Plane,
      color: 'bg-purple-500',
      description: 'Período de férias',
    },
    {
      title: 'Em Licença',
      value: stats.emLicenca,
      icon: FileText,
      color: 'bg-orange-500',
      description: 'Licenças ativas',
    },
    {
      title: 'Banco de Horas',
      value: stats.bancoHorasTotal > 0 ? `+${stats.bancoHorasTotal}h` : '0h',
      icon: TrendingUp,
      color: 'bg-indigo-500',
      description: 'Saldo total do mês',
    },
    {
      title: 'Registros Pendentes',
      value: stats.registrosPendentes,
      icon: AlertCircle,
      color: 'bg-yellow-500',
      description: 'Aguardando lançamento',
    },
    {
      title: 'Registros Incompletos',
      value: 0,
      icon: Clock,
      color: 'bg-gray-500',
      description: 'Pontos parciais',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Visão geral do sistema de ponto eletrônico</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {card.title}
                </CardTitle>
                <div className={`${card.color} p-2 rounded-lg`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">
                  {loading ? (
                    <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                  ) : (
                    card.value
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">{card.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Frequência Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
              <div className="text-center">
                <Clock className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Gráfico de frequência</p>
                <p className="text-xs mt-1">Disponível após registros de ponto</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ausências por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
              <div className="text-center">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Gráfico de ausências</p>
                <p className="text-xs mt-1">Disponível após lançamentos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Últimos Registros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-medium">Nenhum registro recente</p>
            <p className="text-sm mt-1">Os registros aparecerão aqui quando lançados</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
