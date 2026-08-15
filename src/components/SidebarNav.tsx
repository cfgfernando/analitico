import React, { useState, useEffect } from 'react';
import {
  Landmark,
  LayoutDashboard,
  TrendingUp,
  Receipt,
  Scale,
  HandCoins,
  GraduationCap,
  Sparkles,
  Database,
  MapPin,
  Trophy,
  Award,
  BellRing,
  Building,
  Users,
  ChevronLeft,
  ChevronRight,
  Search,
  Pin,
  PinOff,
  Layers,
  HelpCircle,
  Zap,
} from 'lucide-react';

export interface NavItem {
  id: string;
  number?: string;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: 'emerald' | 'amber' | 'blue' | 'rose' | 'slate';
  desc: string;
  shortcut?: string;
  roles?: ('EMPRESA_MASTER' | 'PREFEITURA_CLIENTE')[];
}

export interface NavGroup {
  id: string;
  title: string;
  items: NavItem[];
}

interface SidebarNavProps {
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
  isPinned: boolean;
  onTogglePinned: () => void;
  authRole: 'EMPRESA_MASTER' | 'PREFEITURA_CLIENTE';
  novasEmendas7Dias?: number;
  cidade?: string;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  activeTab,
  setActiveTab,
  isOpen,
  onToggleOpen,
  isPinned,
  onTogglePinned,
  authRole,
  novasEmendas7Dias = 0,
  cidade = 'Araucária',
}) => {
  const [searchFilter, setSearchFilter] = useState('');
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  const navGroups: NavGroup[] = [
    {
      id: 'gabinete',
      title: 'GABINETE & DECISÃO ESTRATÉGICA',
      items: [
        {
          id: 'painel_prefeito',
          number: 'PREF',
          label: 'Painel do Prefeito',
          shortLabel: 'Gabinete',
          icon: Landmark,
          badge: 'Executivo',
          badgeColor: 'emerald',
          desc: 'Visão executiva, margem da folha em R$ e decisões da semana',
          shortcut: 'P',
        },
        {
          id: 'benchmark',
          number: '07',
          label: 'Benchmark Regional',
          shortLabel: 'Benchmark',
          icon: Trophy,
          badge: 'Comparativo',
          badgeColor: 'amber',
          desc: 'Comparativo regional pareado, RCL per capita e eficiência fiscal',
          shortcut: 'B',
        },
        {
          id: 'selo',
          number: '08',
          label: 'Selo de Conformidade',
          shortLabel: 'Selo Fiscal',
          icon: Award,
          badge: 'Oficial',
          badgeColor: 'emerald',
          desc: 'Certificado de gestão fiscal transparente e widget oficial',
          shortcut: 'S',
        },
        {
          id: 'alertas_prazos',
          number: '09',
          label: 'Alertas & Prazos Críticos',
          shortLabel: 'Radar Riscos',
          icon: BellRing,
          badge: '2 Críticos',
          badgeColor: 'rose',
          desc: 'Vencimento de certidões do CAUC, prazos SICONFI e limites LRF',
          shortcut: 'A',
        },
      ],
    },
    {
      id: 'gestao_fiscal',
      title: 'GESTÃO FISCAL & ORÇAMENTÁRIA',
      items: [
        {
          id: 'modulo1',
          number: '01',
          label: 'Dashboard Geral & KPIs',
          shortLabel: 'Dashboard',
          icon: LayoutDashboard,
          desc: 'Visão geral, KPIs consolidados e semáforos da LRF',
          shortcut: '1',
        },
        {
          id: 'modulo2',
          number: '02',
          label: 'Receitas & Reforma Tributária',
          shortLabel: 'Receitas & IBS',
          icon: TrendingUp,
          badge: 'EC 132/23',
          badgeColor: 'blue',
          desc: 'Arrecadação LOA, ICMS/ISS e Simulador da Reforma Tributária',
          shortcut: '2',
        },
        {
          id: 'modulo3',
          number: '03',
          label: 'Despesas e Funções',
          shortLabel: 'Despesas',
          icon: Receipt,
          desc: 'Execução por função de governo e natureza de despesa',
          shortcut: '3',
        },
        {
          id: 'modulo4',
          number: '04',
          label: 'Limites LRF & Folha',
          shortLabel: 'Limites LRF',
          icon: Scale,
          badge: 'Alerta 50,15%',
          badgeColor: 'amber',
          desc: 'Folha de pessoal, pisos constitucionais e endividamento',
          shortcut: '4',
        },
        {
          id: 'modulo5',
          number: '05',
          label: 'Captação & Convênios',
          shortLabel: 'Captação',
          icon: HandCoins,
          badge: novasEmendas7Dias > 0 ? `+${novasEmendas7Dias} novas` : undefined,
          badgeColor: 'emerald',
          desc: 'Radar Transferegov, emendas parlamentares e contrapartida',
          shortcut: '5',
        },
        {
          id: 'modulo6',
          number: '06',
          label: 'FUNDEB & Educação',
          shortLabel: 'FUNDEB',
          icon: GraduationCap,
          desc: 'Magistério, complementação VAAT/VAAR e matrizes SIOPE',
          shortcut: '6',
        },
      ],
    },
    {
      id: 'inteligencia',
      title: 'INTELIGÊNCIA & DADOS ABERTOS',
      items: [
        {
          id: 'diagnostico',
          number: 'IA',
          label: 'Diagnóstico IA Especialista',
          shortLabel: 'IA Auditor',
          icon: Sparkles,
          badge: 'GenAI',
          badgeColor: 'emerald',
          desc: 'Parecer técnico automatizado e consultoria estratégica',
          shortcut: 'I',
        },
        {
          id: 'obras',
          number: 'GEO',
          label: 'Mapa Georreferenciado de Obras',
          shortLabel: 'Obras',
          icon: MapPin,
          desc: 'Visualização geográfica de investimentos e infraestrutura',
          shortcut: 'O',
        },
        {
          id: 'siconfi',
          number: 'API',
          label: 'Console API SICONFI Live',
          shortLabel: 'Siconfi Live',
          icon: Database,
          badge: authRole === 'PREFEITURA_CLIENTE' ? 'Consulta' : 'Configuração',
          badgeColor: 'slate',
          desc: 'Console de dados abertos e payloads JSON do Tesouro Nacional',
          shortcut: 'C',
        },
      ],
    },
    {
      id: 'administracao',
      title: 'ADMINISTRAÇÃO & ACESSO',
      items: [
        ...(authRole === 'EMPRESA_MASTER'
          ? [
              {
                id: 'saas_admin',
                number: 'ADM',
                label: 'Painel Master SaaS (Empresa)',
                shortLabel: 'Gestão SaaS',
                icon: Building,
                badge: 'Master',
                badgeColor: 'emerald' as const,
                desc: 'Métricas de faturamento SaaS, ARR, MRR e contratos',
                shortcut: 'M',
              },
            ]
          : []),
        {
          id: 'tenant_users',
          number: 'USR',
          label: `Usuários de ${cidade}`,
          shortLabel: 'Usuários',
          icon: Users,
          badge: 'RBAC',
          badgeColor: 'blue' as const,
          desc: 'Gestão de acessos municipais e controle de papéis',
          shortcut: 'U',
        },
      ],
    },
  ];

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignora se o usuário estiver digitando em um input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === '[' || (e.ctrlKey && e.key.toLowerCase() === 'b')) {
        e.preventDefault();
        onToggleOpen();
        return;
      }

      // Atalhos rápidos
      const key = e.key.toUpperCase();
      for (const group of navGroups) {
        const matched = group.items.find(item => item.shortcut === key);
        if (matched) {
          e.preventDefault();
          setActiveTab(matched.id);
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navGroups, onToggleOpen, setActiveTab]);

  const badgeStyle = (color?: string) => {
    switch (color) {
      case 'rose':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'amber':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'blue':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'emerald':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      default:
        return 'bg-slate-700/50 text-slate-300 border-slate-600';
    }
  };

  return (
    <>
      {/* Overlay Backdrop for Mobile */}
      {isOpen && !isPinned && (
        <div
          onClick={onToggleOpen}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300"
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="sidebar-navigation"
        className={`fixed top-0 left-0 h-full z-50 bg-slate-950 border-r border-slate-800/80 text-white transition-all duration-300 ease-in-out flex flex-col shadow-2xl ${
          isOpen ? 'w-72' : 'w-16'
        }`}
        onMouseEnter={() => {
          if (!isPinned && !isOpen) onToggleOpen();
        }}
        onMouseLeave={() => {
          if (!isPinned && isOpen) onToggleOpen();
        }}
      >
        {/* Sidebar Header */}
        <div className="h-14 border-b border-slate-800/80 flex items-center justify-between px-3 shrink-0 bg-slate-900/60">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-sm bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center font-bold text-slate-950 text-xs shrink-0 shadow-xs">
              🏛️
            </div>
            {isOpen && (
              <div className="flex flex-col min-w-0 transition-opacity duration-200">
                <span className="text-xs font-bold font-mono tracking-tight text-white uppercase truncate">
                  SAAS FISCAL
                </span>
                <span className="text-[10px] text-emerald-400 font-mono font-semibold truncate">
                  {cidade}
                </span>
              </div>
            )}
          </div>

          {isOpen && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={onTogglePinned}
                className={`p-1.5 rounded-sm transition cursor-pointer ${
                  isPinned
                    ? 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title={isPinned ? 'Desafixar menu (fechar automático)' : 'Fixar menu aberto'}
              >
                {isPinned ? <Pin className="w-3.5 h-3.5" /> : <PinOff className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={onToggleOpen}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-sm transition cursor-pointer"
                title="Recolher menu lateral"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Search in Sidebar (Only when open) */}
        {isOpen && (
          <div className="p-2.5 border-b border-slate-800/60 bg-slate-950/40 shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                placeholder="Buscar módulo (atalhos 1..9)..."
                className="w-full pl-8 pr-2.5 py-1 text-xs bg-slate-900 border border-slate-800 rounded-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>
        )}

        {/* Nav Items List */}
        <div className="flex-1 overflow-y-auto py-2.5 px-1.5 space-y-4 custom-scrollbar">
          {navGroups.map(group => {
            const filteredItems = group.items.filter(
              item =>
                searchFilter === '' ||
                item.label.toLowerCase().includes(searchFilter.toLowerCase()) ||
                item.desc.toLowerCase().includes(searchFilter.toLowerCase())
            );

            if (filteredItems.length === 0) return null;

            return (
              <div key={group.id} className="space-y-1">
                {isOpen && (
                  <div className="px-2 py-1 text-[9px] font-mono font-bold tracking-widest text-slate-400 uppercase">
                    {group.title}
                  </div>
                )}

                <div className="space-y-0.5">
                  {filteredItems.map(item => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                      <div
                        key={item.id}
                        className="relative"
                        onMouseEnter={() => setHoveredTab(item.id)}
                        onMouseLeave={() => setHoveredTab(null)}
                      >
                        <button
                          onClick={() => {
                            setActiveTab(item.id);
                            if (!isPinned && window.innerWidth < 1024) {
                              onToggleOpen();
                            }
                          }}
                          className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-sm text-xs font-mono transition-all duration-150 cursor-pointer text-left group ${
                            isActive
                              ? 'bg-emerald-500/15 text-emerald-300 font-bold border-l-4 border-l-emerald-500 shadow-xs'
                              : 'text-slate-300 hover:bg-slate-900 hover:text-white border-l-4 border-l-transparent'
                          }`}
                        >
                          <div
                            className={`p-1.5 rounded-sm shrink-0 transition-colors ${
                              isActive
                                ? 'bg-emerald-500 text-slate-950 font-bold'
                                : 'bg-slate-900 text-slate-400 group-hover:text-slate-200 group-hover:bg-slate-800'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>

                          {isOpen && (
                            <div className="flex-1 min-w-0 flex items-center justify-between gap-1.5 overflow-hidden">
                              <span className="truncate">{item.label}</span>

                              <div className="flex items-center gap-1 shrink-0">
                                {item.badge && (
                                  <span
                                    className={`px-1.5 py-0.2 text-[9px] font-mono font-bold uppercase rounded-xs border ${badgeStyle(
                                      item.badgeColor
                                    )}`}
                                  >
                                    {item.badge}
                                  </span>
                                )}
                                {item.shortcut && (
                                  <kbd className="hidden lg:inline-block px-1 py-0.2 bg-slate-800 border border-slate-700 rounded-xs text-[8px] text-slate-400 font-mono">
                                    {item.shortcut}
                                  </kbd>
                                )}
                              </div>
                            </div>
                          )}
                        </button>

                        {/* Floating Tooltip when Collapsed */}
                        {!isOpen && hoveredTab === item.id && (
                          <div className="fixed left-16 ml-2 z-50 bg-slate-900 border border-slate-700 text-white rounded-sm py-1.5 px-3 shadow-xl pointer-events-none min-w-[200px] animate-in fade-in zoom-in-95 duration-150">
                            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1 mb-1">
                              <span className="font-bold text-xs font-mono text-emerald-300">{item.label}</span>
                              {item.shortcut && (
                                <kbd className="px-1 bg-slate-800 border border-slate-700 rounded-xs text-[9px] text-slate-300 font-mono">
                                  {item.shortcut}
                                </kbd>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 leading-tight">{item.desc}</p>
                            {item.badge && (
                              <span
                                className={`inline-block mt-1.5 px-1.5 py-0.2 text-[8px] font-mono font-bold uppercase rounded-xs border ${badgeStyle(
                                  item.badgeColor
                                )}`}
                              >
                                {item.badge}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Sidebar Footer */}
        <div className="p-2 border-t border-slate-800/80 bg-slate-950/60 shrink-0 text-center">
          {!isOpen ? (
            <button
              onClick={onToggleOpen}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-sm w-full flex justify-center transition cursor-pointer"
              title="Expandir menu lateral ([)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 px-1">
              <span>Atalhos: [ ou 1..9</span>
              <span className="text-emerald-500 font-bold">V4.0.0</span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default SidebarNav;
