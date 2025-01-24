
'use client';
import { DataTableCodigos } from '@/components/tabela-codigos';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { CodigosProps } from '../../utils/codigos';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function Codigos() {
  const supabase = createClient();
    const { id } = useParams(); // Captura o `id` da venda na URL
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CodigosProps[]>([]);
  const [productName, setProductName] = useState<string | null>(null);

  // Função para buscar o nome do produto
   // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchProductName = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('nome')
        .eq('id', id)
        .single(); // Retorna apenas um único resultado

      if (error) {
        throw error; // Se houver um erro, ele é lançado
      }

      return data ? data.nome : null; // Retorna o nome ou null se não encontrar
    } catch (error) {
      console.error('Erro ao buscar produto:', error);
      return null;
    }
  };
  // Carregar dados inicialmente
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const { data: codigos, error } = await supabase
          .from('codigos')
          .select('*').eq('id_produto',id);

        if (error) {
          throw error;
        }

        setData(codigos || []);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id,supabase]); // O array vazio garante que a consulta ocorra uma única vez ao montar o componente

  // Assinatura em tempo real para atualizar dados conforme alterações no banco
  useEffect(() => {
    const subscription = supabase
      .channel(`realtime:public:codigos:${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'codigos',
          filter: `id_produto=eq.${id}`, 
        },
        (payload) => {
          setData((prevData) => {
            switch (payload.eventType) {
              case 'INSERT':
                return [...prevData, payload.new as CodigosProps];
              case 'UPDATE':
                return prevData.map((item) =>
                  item.id_codigo === payload.new.id_codigo ? (payload.new as CodigosProps) : item
                );
              case 'DELETE':
                return prevData.filter((item) => item.id_codigo !== payload.old.id_codigo);
              default:
                return prevData;
            }
          });
        }
      );

    subscription.subscribe();

    // Cleanup: desassinar quando o componente for desmontado
    return () => {
      subscription.unsubscribe();
    };
  }, [id,supabase]);

  // Carrega o nome do produto
  useEffect(() => {
    if (id) {
      const loadProductName = async () => {
        const name = await fetchProductName(id as string);
        setProductName(name);
      };
      loadProductName();
    }
  }, [id,fetchProductName]);
  // KPIs
  const totalCodigos = data.length;
  const codigosResgatados = data.filter((codigo) => codigo.status === 'resgatado').length;

  // Dados a serem exibidos na tabela
  const currentPageData = data;

  if (loading) {
    return <p>Carregando...</p>;
  }

  return (
    <div className="container mx-auto p-6 space-y-2">
        <Button onClick={() => window.location.href = `/produtos/${id}`} className='rounded-full bg-blue-500 hover:bg-blue-400'><ArrowLeft></ArrowLeft> </Button>
     <h1 className="text-3xl font-bold mb-6">Acompanhe seus Códigos : {productName ||"none"}</h1>

      {/* Exibindo KPIs */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="p-4 border rounded">
          <h2 className="text-xl font-semibold">Total de Códigos</h2>
          <p className="text-2xl font-bold">{totalCodigos}</p>
        </div>
        <div className="p-4 border rounded">
          <h2 className="text-xl font-semibold">Total de Códigos Resgatados</h2>
          <p className="text-2xl font-bold">{codigosResgatados}</p>
        </div>
        <div className="p-4 border rounded">
          <h2 className="text-xl font-semibold">Total de Códigos</h2>
          <p className="text-2xl font-bold">{data.length}</p>
        </div>
      </div>

      {/* DataTable de Códigos */}
      <DataTableCodigos data={currentPageData} />
    </div>
  );
}
