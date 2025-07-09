"use client";

import { useEffect, useState } from "react";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Progress } from "@/app/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/app/components/ui/alert";
import { FileSpreadsheet, FileText, Download, Calendar, TrendingUp, TrendingDown, Target, AlertTriangle, DollarSign, Users, ShoppingCart, BarChart3, PieChartIcon, Activity, Zap, Brain, Lightbulb, Calculator } from 'lucide-react';
import { toast } from "sonner";
import { format, parseISO, subMonths, addMonths, startOfMonth, endOfMonth, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    ComposedChart,
    Area,
    AreaChart,
    RadialBarChart,
    RadialBar,
} from "recharts";
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    PDFDownloadLink,
} from "@react-pdf/renderer";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/app/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/app/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/app/components/ui/form";
import { Input } from "@/app/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import * as XLSX from "xlsx";

export interface VendasProps {
    origin: string;
    uuid: string;
    id_produto?: string;
    nome_cliente?: string;
    id_cliente: string;
    created_at: string;
    valor: number;
    status: string;
    tipo_pagamento?: string;
    tipo_produto: string;
    detalhes_produto: {
        id: string;
        nome: string;
        valor: number;
        tipo: string;
    };
}

type StatusVenda = "concluida" | "pendente" | "expirado";

interface ResumoMensal {
    totalVendas: number;
    quantidadeProdutos: number;
    produtosVendidos: {
        id: string;
        nome: string;
        quantidade: number;
        valorTotal: number;
        custo?: number;
        lucro?: number;
    }[];
    vendasPorDia: {
        data: string;
        quantidade: number;
        valor: number;
        custo?: number;
        lucro?: number;
        status: {
            concluida: number;
            pendente: number;
            expirado: number;
        };
    }[];
    vendasPorCategoria: {
        categoria: string;
        quantidade: number;
        valor: number;
        custo?: number;
        lucro?: number;
    }[];
    vendasPorStatus: {
        [key in StatusVenda]: {
            quantidade: number;
            valor: number;
            custo?: number;
            lucro?: number;
        };
    };
    metricas: {
        crescimentoMensal: number;
        taxaConversao: number;
        ticketMedio: number;
        margemLucro?: number;
        lucroTotal?: number;
        custoTotal?: number;
    };
    comparativoMesAnterior: {
        vendas: number;
        crescimento: number;
        novosClientes: number;
        clientesRecorrentes: number;
        lucro?: number;
        crescimentoLucro?: number;
    };
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82ca9d", "#ffc658"];

// Estilos aprimorados para o PDF
const styles = StyleSheet.create({
    page: {
        padding: 30,
        backgroundColor: "#ffffff",
        fontFamily: 'Helvetica',
    },
    header: {
        fontSize: 28,
        marginBottom: 20,
        textAlign: "center",
        color: "#1a1a1a",
        fontWeight: 'bold',
    },
    subheader: {
        fontSize: 18,
        marginBottom: 15,
        color: "#2c2c2c",
        borderBottom: "2px solid #e0e0e0",
        paddingBottom: 8,
        fontWeight: 'bold',
    },
    text: {
        fontSize: 12,
        marginBottom: 6,
        color: "#4a4a4a",
        lineHeight: 1.4,
    },
    highlight: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#1a1a1a",
        marginBottom: 8,
        backgroundColor: "#f0f9ff",
        padding: 8,
        borderRadius: 4,
    },
    metricCard: {
        padding: 15,
        marginBottom: 15,
        borderStyle: "solid",
        borderWidth: 1,
        borderRadius: 8,
        backgroundColor: "#f8fafc",
        borderColor: "#e2e8f0",
    },
    metricTitle: {
        fontSize: 14,
        fontWeight: "bold",
        marginBottom: 8,
        color: "#1e293b",
    },
    metricValue: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#0f172a",
        marginBottom: 4,
    },
    metricDescription: {
        fontSize: 10,
        color: "#64748b",
    },
    recommendationCard: {
        padding: 12,
        marginBottom: 10,
        borderStyle: "solid",
        borderWidth: 1,
        borderRadius: 6,
        backgroundColor: "#fefce8",
        borderColor: "#facc15",
    },
    recommendationTitle: {
        fontSize: 12,
        fontWeight: "bold",
        marginBottom: 6,
        color: "#713f12",
    },
    recommendationText: {
        fontSize: 10,
        color: "#a16207",
        lineHeight: 1.3,
    },
    table: {
        display: "flex",
        width: "auto",
        borderStyle: "solid",
        borderWidth: 1,
        borderRightWidth: 0,
        borderBottomWidth: 0,
        marginBottom: 20,
        borderRadius: 4,
    },
    tableRow: {
        margin: "auto",
        flexDirection: "row",
    },
    tableCol: {
        width: "25%",
        borderStyle: "solid",
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0,
    },
    tableCell: {
        margin: "auto",
        padding: 8,
        fontSize: 10,
        textAlign: "center",
    },
    tableHeader: {
        backgroundColor: "#f1f5f9",
        fontWeight: "bold",
    },
    footer: {
        position: "absolute",
        bottom: 30,
        left: 30,
        right: 30,
        fontSize: 10,
        color: "#666",
        textAlign: "center",
        borderTop: "2px solid #e0e0e0",
        paddingTop: 15,
    },
    executiveSummary: {
        backgroundColor: "#eff6ff",
        padding: 20,
        marginBottom: 20,
        borderRadius: 8,
        borderStyle: "solid",
        borderWidth: 2,
        borderColor: "#3b82f6",
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 10,
        color: "#1e40af",
    },
    summaryText: {
        fontSize: 11,
        color: "#1e3a8a",
        lineHeight: 1.5,
        marginBottom: 8,
    },
});

// Componente PDF aprimorado
const RelatorioEstrategicoPDF = ({ resumo, mesSelecionado }: { resumo: ResumoMensal; mesSelecionado: string }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <Text style={styles.header}>Relatório de Fechamento Mensal</Text>
            <Text style={styles.text}>
                Período: {format(parseISO(mesSelecionado + "-01"), "MMMM yyyy", { locale: ptBR })} |
                Gerado em: {format(new Date(), "dd/MM/yyyy 'às' HH:mm")}
            </Text>

            {/* Resumo Executivo */}
            <View style={styles.executiveSummary}>
                <Text style={styles.summaryTitle}>📊 Resumo Executivo</Text>
                <Text style={styles.summaryText}>
                    • Faturamento Total: R$ {resumo.totalVendas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </Text>
                <Text style={styles.summaryText}>
                    • Crescimento vs. Mês Anterior: {resumo.comparativoMesAnterior.crescimento > 0 ? '+' : ''}{resumo.comparativoMesAnterior.crescimento.toFixed(1)}%
                </Text>
                <Text style={styles.summaryText}>
                    • Taxa de Conversão: {resumo.metricas.taxaConversao.toFixed(1)}%
                </Text>
                <Text style={styles.summaryText}>
                    • Ticket Médio: R$ {resumo.metricas.ticketMedio.toFixed(2)}
                </Text>
                <Text style={styles.summaryText}>
                    • Novos Clientes: {resumo.comparativoMesAnterior.novosClientes}
                </Text>
                <Text style={styles.summaryText}>
                    • Clientes Recorrentes: {resumo.comparativoMesAnterior.clientesRecorrentes}
                </Text>
            </View>

            {/* Métricas Principais */}
            <Text style={styles.subheader}>📈 Métricas Principais</Text>

            <View style={styles.metricCard}>
                <Text style={styles.metricTitle}>Crescimento Mensal</Text>
                <Text style={styles.metricValue}>{resumo.metricas.crescimentoMensal > 0 ? '+' : ''}{resumo.metricas.crescimentoMensal.toFixed(1)}%</Text>
                <Text style={styles.metricDescription}>Comparado ao mês anterior</Text>
            </View>

            <View style={styles.metricCard}>
                <Text style={styles.metricTitle}>Taxa de Conversão</Text>
                <Text style={styles.metricValue}>{resumo.metricas.taxaConversao.toFixed(1)}%</Text>
                <Text style={styles.metricDescription}>Vendas concluídas / Total de vendas</Text>
            </View>

            <View style={styles.metricCard}>
                <Text style={styles.metricTitle}>Ticket Médio</Text>
                <Text style={styles.metricValue}>R$ {resumo.metricas.ticketMedio.toFixed(2)}</Text>
                <Text style={styles.metricDescription}>Valor médio por venda concluída</Text>
            </View>

            {/* Análise de Performance */}
            <Text style={styles.subheader}>🎯 Análise de Performance</Text>

            <View style={styles.table}>
                <View style={styles.tableRow}>
                    <View style={[styles.tableCol, styles.tableHeader]}>
                        <Text style={styles.tableCell}>Status</Text>
                    </View>
                    <View style={[styles.tableCol, styles.tableHeader]}>
                        <Text style={styles.tableCell}>Quantidade</Text>
                    </View>
                    <View style={[styles.tableCol, styles.tableHeader]}>
                        <Text style={styles.tableCell}>Valor Total</Text>
                    </View>
                    <View style={[styles.tableCol, styles.tableHeader]}>
                        <Text style={styles.tableCell}>% do Total</Text>
                    </View>
                </View>
                {Object.entries(resumo.vendasPorStatus).map(([status, dados]) => (
                    <View key={status} style={styles.tableRow}>
                        <View style={styles.tableCol}>
                            <Text style={styles.tableCell}>{status.charAt(0).toUpperCase() + status.slice(1)}</Text>
                        </View>
                        <View style={styles.tableCol}>
                            <Text style={styles.tableCell}>{dados.quantidade}</Text>
                        </View>
                        <View style={styles.tableCol}>
                            <Text style={styles.tableCell}>R$ {dados.valor.toFixed(2)}</Text>
                        </View>
                        <View style={styles.tableCol}>
                            <Text style={styles.tableCell}>{((dados.valor / resumo.totalVendas) * 100).toFixed(1)}%</Text>
                        </View>
                    </View>
                ))}
            </View>

            <Text style={styles.footer}>
                Relatório de Fechamento Mensal | {format(new Date(), "dd/MM/yyyy 'às' HH:mm")}
            </Text>
        </Page>
    </Document>
);

const schema = z.object({
    custo: z.preprocess(
        (val) => (typeof val === "string" ? parseFloat(val) : val),
        z.number().min(0, "O custo não pode ser negativo!")
    ),
});

const DialogCustoProduto = ({ produto, onConfirm }: { produto: { id: string; nome: string; valorTotal: number }; onConfirm: (custo: number) => void }) => {
    const [open, setOpen] = useState(false);
    const form = useForm<z.infer<typeof schema>>({
        resolver: zodResolver(schema),
        defaultValues: {
            custo: 0,
        },
    });

    const onSubmit = (values: z.infer<typeof schema>) => {
        onConfirm(values.custo);
        setOpen(false);
        form.reset();
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                    <Calculator className="h-4 w-4 mr-2" />
                    Definir Custo
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Definir Custo do Produto</DialogTitle>
                    <DialogDescription>
                        Informe o custo de aquisição para o produto {produto.nome}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="custo"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Custo (R$)</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            {...field}
                                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit">Salvar</Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export const EnhancedFechamentoMensal = () => {
    const [loading, setLoading] = useState(false);
    const [resumoMensal, setResumoMensal] = useState<ResumoMensal | null>(null);
    const [mesSelecionado, setMesSelecionado] = useState(() => {
        const hoje = new Date();
        return format(hoje, "yyyy-MM");
    });
    const [activeTab, setActiveTab] = useState("overview");
    const supabase = createClientSupabaseClient();
    const [custosProdutos, setCustosProdutos] = useState<Record<string, number>>({});
    const [openPixTax, setOpenPixTax] = useState<number>(0.0);

    // Função para calcular métricas estratégicas
    const calcularMetricasEstrategicas = (vendas: any[], vendasMesAnterior: any[]) => {
        const totalVendas = vendas.reduce((acc, venda) => acc + (venda.valor || 0), 0);
        const totalVendasMesAnterior = vendasMesAnterior.reduce((acc, venda) => acc + (venda.valor || 0), 0);

        const crescimentoMensal = totalVendasMesAnterior > 0
            ? ((totalVendas - totalVendasMesAnterior) / totalVendasMesAnterior) * 100
            : 0;

        const vendasConcluidas = vendas.filter(v => v.status === 'concluida');
        const taxaConversao = vendas.length > 0 ? (vendasConcluidas.length / vendas.length) * 100 : 0;

        const ticketMedio = vendasConcluidas.length > 0
            ? vendasConcluidas.reduce((acc, v) => acc + (v.valor || 0), 0) / vendasConcluidas.length
            : 0;

        return {
            crescimentoMensal,
            taxaConversao,
            ticketMedio
        };
    };

    const handleDefinirCusto = async (produtoId: string, custo: number) => {
        try {
            const { error } = await supabase
                .from("custos_produtos")
                .upsert({
                    id_produto: produtoId,
                    custo: custo,
                    updated_at: new Date().toISOString(),
                });

            if (error) throw error;

            setCustosProdutos(prev => ({
                ...prev,
                [produtoId]: custo
            }));

            toast.success("Custo definido com sucesso!");
            carregarFechamentoMensal();
        } catch (error) {
            console.error("Erro ao definir custo:", error);
            toast.error("Erro ao definir custo do produto");
        }
    };

    const carregarFechamentoMensal = async () => {
        setLoading(true);
        try {
            const [ano, mes] = mesSelecionado.split("-").map(Number);
            const primeiroDiaMes = new Date(ano, mes - 1, 1);
            const ultimoDiaMes = new Date(ano, mes, 0);

            // Buscar vendas do mês atual
            const { data: vendas, error } = await supabase
                .from("vendas")
                .select("*")
                .gte("created_at", primeiroDiaMes.toISOString())
                .lte("created_at", ultimoDiaMes.toISOString());

            if (error) throw error;

            // Buscar vendas do mês anterior para comparação
            const mesAnterior = subMonths(primeiroDiaMes, 1);
            const { data: vendasMesAnterior } = await supabase
                .from("vendas")
                .select("*")
                .gte("created_at", startOfMonth(mesAnterior).toISOString())
                .lte("created_at", endOfMonth(mesAnterior).toISOString());

            // Buscar custos dos produtos
            const { data: custos, error: custosError } = await supabase
                .from("custos_produtos")
                .select("*");

            if (custosError) throw custosError;

            const custosMap = (custos || []).reduce((acc, item) => ({
                ...acc,
                [item.id_produto]: item.custo
            }), {} as Record<string, number>);

            setCustosProdutos(custosMap);

            const produtosVendidos = new Map();
            const vendasPorDia = new Map();
            const vendasPorCategoria = new Map();
            const vendasPorStatus: ResumoMensal["vendasPorStatus"] = {
                concluida: { quantidade: 0, valor: 0 },
                pendente: { quantidade: 0, valor: 0 },
                expirado: { quantidade: 0, valor: 0 },
            };

            vendas?.forEach((venda) => {
                if (!venda || !venda.detalhes_produto) return;

                const custoProduto = custosMap[venda.detalhes_produto.id] || 0;
                const lucroVenda = (venda.valor || 0) - custoProduto;

                // Contagem de produtos
                if (!produtosVendidos.has(venda.detalhes_produto.id)) {
                    produtosVendidos.set(venda.detalhes_produto.id, {
                        id: venda.detalhes_produto.id,
                        nome: venda.detalhes_produto.nome,
                        quantidade: 0,
                        valorTotal: 0,
                        custo: custoProduto,
                        lucro: lucroVenda,
                    });
                }
                const produto = produtosVendidos.get(venda.detalhes_produto.id);
                if (produto) {
                    produto.quantidade += 1;
                    produto.valorTotal += venda.valor || 0;
                    produto.custo = (produto.custo || 0) + custoProduto;
                    produto.lucro = (produto.lucro || 0) + lucroVenda;
                }

                // Vendas por dia
                const data = format(new Date(venda.created_at), "dd/MM/yyyy");
                if (!vendasPorDia.has(data)) {
                    vendasPorDia.set(data, {
                        quantidade: 0,
                        valor: 0,
                        custo: 0,
                        lucro: 0,
                        status: {
                            concluida: 0,
                            pendente: 0,
                            expirado: 0,
                        },
                    });
                }
                const dia = vendasPorDia.get(data);
                if (dia) {
                    dia.quantidade += 1;
                    dia.valor += venda.valor || 0;
                    dia.custo = (dia.custo || 0) + custoProduto;
                    dia.lucro = (dia.lucro || 0) + lucroVenda;
                    dia.status[venda.status as StatusVenda] += 1;
                }

                // Vendas por categoria
                const categoria = venda.tipo_produto || "Sem categoria";
                if (!vendasPorCategoria.has(categoria)) {
                    vendasPorCategoria.set(categoria, { quantidade: 0, valor: 0, custo: 0, lucro: 0 });
                }
                const cat = vendasPorCategoria.get(categoria);
                if (cat) {
                    cat.quantidade += 1;
                    cat.valor += venda.valor || 0;
                    cat.custo = (cat.custo || 0) + custoProduto;
                    cat.lucro = (cat.lucro || 0) + lucroVenda;
                }

                // Vendas por status
                if (vendasPorStatus[venda.status as StatusVenda]) {
                    vendasPorStatus[venda.status as StatusVenda].quantidade += 1;
                    vendasPorStatus[venda.status as StatusVenda].valor += venda.valor || 0;
                    vendasPorStatus[venda.status as StatusVenda].custo = (vendasPorStatus[venda.status as StatusVenda].custo || 0) + custoProduto;
                    vendasPorStatus[venda.status as StatusVenda].lucro = (vendasPorStatus[venda.status as StatusVenda].lucro || 0) + lucroVenda;
                }
            });

            // Calcular métricas reais
            const metricas = calcularMetricasEstrategicas(vendas || [], vendasMesAnterior || []);

            // Calcular comparativo com mês anterior
            const totalVendasAtual = vendas?.reduce((acc, venda) => acc + (venda.valor || 0), 0) || 0;
            const totalVendasAnterior = vendasMesAnterior?.reduce((acc, venda) => acc + (venda.valor || 0), 0) || 0;
            const crescimento = totalVendasAnterior > 0
                ? ((totalVendasAtual - totalVendasAnterior) / totalVendasAnterior) * 100
                : 0;

            const clientesUnicos = new Set(vendas?.map(v => v.id_cliente) || []);
            const clientesUnicosAnterior = new Set(vendasMesAnterior?.map(v => v.id_cliente) || []);
            const novosClientes = [...clientesUnicos].filter(id => !clientesUnicosAnterior.has(id)).length;
            const clientesRecorrentes = [...clientesUnicos].filter(id => clientesUnicosAnterior.has(id)).length;

            // Calcular custos e lucros
            let custoTotal = 0;
            let lucroTotal = 0;

            vendas?.forEach((venda) => {
                if (!venda || !venda.detalhes_produto) return;

                const custoProduto = custosMap[venda.detalhes_produto.id] || 0;
                const lucroVenda = (venda.valor || 0) - custoProduto;

                custoTotal += custoProduto;
                lucroTotal += lucroVenda;

                // Atualizar produtos vendidos
                const produto = produtosVendidos.get(venda.detalhes_produto.id);
                if (produto) {
                    produto.custo = (produto.custo || 0) + custoProduto;
                    produto.lucro = (produto.lucro || 0) + lucroVenda;
                }

                // Atualizar vendas por dia
                const data = format(new Date(venda.created_at), "dd/MM/yyyy");
                const dia = vendasPorDia.get(data);
                if (dia) {
                    dia.custo = (dia.custo || 0) + custoProduto;
                    dia.lucro = (dia.lucro || 0) + lucroVenda;
                }

                // Atualizar vendas por categoria
                const categoria = venda.tipo_produto || "Sem categoria";
                const cat = vendasPorCategoria.get(categoria);
                if (cat) {
                    cat.custo = (cat.custo || 0) + custoProduto;
                    cat.lucro = (cat.lucro || 0) + lucroVenda;
                }

                // Atualizar vendas por status
                const status = (venda.status || "pendente") as StatusVenda;
                if (vendasPorStatus[status]) {
                    vendasPorStatus[status].custo = (vendasPorStatus[status].custo || 0) + custoProduto;
                    vendasPorStatus[status].lucro = (vendasPorStatus[status].lucro || 0) + lucroVenda;
                }
            });

            const resumo: ResumoMensal = {
                totalVendas: totalVendasAtual,
                quantidadeProdutos: vendas?.length || 0,
                produtosVendidos: Array.from(produtosVendidos.values()),
                vendasPorDia: Array.from(vendasPorDia.entries()).map(([data, info]) => ({
                    data,
                    ...info,
                })),
                vendasPorCategoria: Array.from(vendasPorCategoria.entries()).map(
                    ([categoria, info]) => ({
                        categoria,
                        ...info,
                    })
                ),
                vendasPorStatus,
                metricas: {
                    ...metricas,
                    custoTotal,
                    lucroTotal,
                    margemLucro: totalVendasAtual > 0 ? (lucroTotal / totalVendasAtual) * 100 : 0
                },
                comparativoMesAnterior: {
                    vendas: totalVendasAnterior,
                    crescimento,
                    novosClientes,
                    clientesRecorrentes,
                    lucro: lucroTotal,
                    crescimentoLucro: vendasMesAnterior?.reduce((acc, venda) => {
                        const custoProduto = custosMap[venda.detalhes_produto?.id] || 0;
                        return acc + ((venda.valor || 0) - custoProduto);
                    }, 0) || 0
                }
            };

            setResumoMensal(resumo);
            toast.success("Análise carregada com sucesso!");
        } catch (error) {
            console.error("Erro ao carregar análise:", error);
            toast.error("Erro ao carregar análise");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        carregarFechamentoMensal();
    }, [mesSelecionado]);

    const exportarCSVEstrategico = () => {
        if (!resumoMensal) return;

        const mesAtual = format(parseISO(mesSelecionado + "-01"), "MMMM yyyy", {
            locale: ptBR,
        });

        const headers = [
            "Métrica",
            "Valor",
            "Unidade",
            "Variação Mês Anterior"
        ];

        const metricas = [
            ["Total de Vendas", resumoMensal.totalVendas.toFixed(2), "R$", `${resumoMensal.comparativoMesAnterior.crescimento.toFixed(1)}%`],
            ["Taxa de Conversão", resumoMensal.metricas.taxaConversao.toFixed(1), "%", "-"],
            ["Ticket Médio", resumoMensal.metricas.ticketMedio.toFixed(2), "R$", "-"],
            ["Novos Clientes", resumoMensal.comparativoMesAnterior.novosClientes.toString(), "clientes", "-"],
            ["Clientes Recorrentes", resumoMensal.comparativoMesAnterior.clientesRecorrentes.toString(), "clientes", "-"],
        ];

        const csvContent = [
            headers.join(","),
            ...metricas.map(row => row.join(",")),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute(
            "download",
            `analise-${format(parseISO(mesSelecionado + "-01"), "MMMM-yyyy", {
                locale: ptBR,
            })}.csv`
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportarFechamentoExcel = () => {
        if (!resumoMensal) return;
        // Montar dados conforme a planilha enviada
        const produtos = resumoMensal.produtosVendidos;
        const rows = produtos.map((produto) => {
            // Exemplo de cálculo, ajuste conforme necessário
            const imposto = produto.valorTotal * 0.053;
            const lucro = produto.valorTotal - (produto.custo || 0) - imposto;
            const custoMaisImposto = (produto.custo || 0) + imposto;
            const empresaA = lucro * 0.6;
            const empresaB = lucro * 0.4;
            return {
                "Produtos": produto.nome,
                "Q. Codigos": produto.quantidade,
                "Custo": produto.custo || 0,
                "Venda": produto.valorTotal,
                "Imposto 5,3%": imposto,
                "Lucro": lucro,
                "Custo + Imposto": custoMaisImposto,
                "Empresa A - 60%": empresaA,
                "Empresa B - 40%": empresaB,
            };
        });
        // Adicionar totais e taxa OpenPix
        const totalCusto = rows.reduce((acc, r) => acc + r["Custo"], 0);
        const totalVenda = rows.reduce((acc, r) => acc + r["Venda"], 0);
        const totalImposto = rows.reduce((acc, r) => acc + r["Imposto 5,3%"], 0);
        const totalLucro = rows.reduce((acc, r) => acc + r["Lucro"], 0);
        const totalCustoImposto = rows.reduce((acc, r) => acc + r["Custo + Imposto"], 0);
        const totalEmpresaA = rows.reduce((acc, r) => acc + r["Empresa A - 60%"], 0);
        const totalEmpresaB = rows.reduce((acc, r) => acc + r["Empresa B - 40%"], 0);
        rows.push({
            "Produtos": "Total",
            "Q. Codigos": produtos.reduce((acc, p) => acc + p.quantidade, 0),
            "Custo": totalCusto,
            "Venda": totalVenda,
            "Imposto 5,3%": totalImposto,
            "Lucro": totalLucro,
            "Custo + Imposto": totalCustoImposto,
            "Empresa A - 60%": totalEmpresaA,
            "Empresa B - 40%": totalEmpresaB,
        });
        // Taxa OpenPix
        const taxaOpenPix = totalVenda * (openPixTax / 100);
        rows.push({
            "Produtos": "TAXA OPENPIX",
            "Q. Codigos": 0,
            "Custo": 0,
            "Venda": taxaOpenPix,
            "Imposto 5,3%": 0,
            "Lucro": 0,
            "Custo + Imposto": 0,
            "Empresa A - 60%": 0,
            "Empresa B - 40%": 0,
        });
        // Exportar para Excel
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Fechamento");
        XLSX.writeFile(wb, `fechamento-mensal-${mesSelecionado}.xlsx`);
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-4 border rounded-lg shadow-lg">
                    <p className="font-bold">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} style={{ color: entry.color }}>
                            {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString('pt-BR', {
                                style: entry.name.includes('R$') ? 'currency' : 'decimal',
                                currency: 'BRL',
                                minimumFractionDigits: 2
                            }) : entry.value}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground">Carregando análise estratégica...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                    <h2 className="text-3xl font-bold flex items-center gap-2">
                        <BarChart3 className="h-8 w-8 text-primary" />
                        Análise Estratégica de Fechamento
                    </h2>
                    <p className="text-muted-foreground">
                        Insights detalhados, previsões e recomendações estratégicas
                    </p>
                </div>
                <div className="flex flex-col md:flex-row gap-2">
                    <Select
                        value={mesSelecionado}
                        onValueChange={setMesSelecionado}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Selecione o mês" />
                        </SelectTrigger>
                        <SelectContent>
                            {Array.from({ length: 12 }, (_, i) => {
                                const date = new Date();
                                date.setMonth(date.getMonth() - i);
                                return (
                                    <SelectItem
                                        key={format(date, "yyyy-MM")}
                                        value={format(date, "yyyy-MM")}
                                    >
                                        {format(date, "MMMM yyyy", { locale: ptBR })}
                                    </SelectItem>
                                );
                            })}
                        </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                        <Button onClick={exportarCSVEstrategico} disabled={!resumoMensal} variant="outline">
                            <FileSpreadsheet className="mr-2 h-4 w-4" />
                            Exportar Análise
                        </Button>
                        {resumoMensal && (
                            <PDFDownloadLink
                                document={<RelatorioEstrategicoPDF resumo={resumoMensal} mesSelecionado={mesSelecionado} />}
                                fileName={`analise-estrategica-${format(
                                    parseISO(mesSelecionado + "-01"),
                                    "MMMM-yyyy",
                                    { locale: ptBR }
                                )}.pdf`}
                            >
                                {({ loading }) => (
                                    <Button variant="outline" disabled={loading}>
                                        <FileText className="mr-2 h-4 w-4" />
                                        {loading ? "Gerando PDF..." : "Relatório PDF"}
                                    </Button>
                                )}
                            </PDFDownloadLink>
                        )}
                    </div>
                </div>
            </div>

            {resumoMensal && (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="overview" className="flex items-center gap-2">
                            <Activity className="h-4 w-4" />
                            Visão Geral
                        </TabsTrigger>
                        <TabsTrigger value="metrics" className="flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            Métricas
                        </TabsTrigger>
                        <TabsTrigger value="detailed" className="flex items-center gap-2">
                            <PieChartIcon className="h-4 w-4" />
                            Detalhado
                        </TabsTrigger>
                        <TabsTrigger value="export" className="flex items-center gap-2">
                            <FileSpreadsheet className="h-4 w-4" />
                            Exportar
                        </TabsTrigger>
                    </TabsList>

                    {/* Tab: Visão Geral */}
                    <TabsContent value="overview">
                        <div className="space-y-8">
                            <Card className="border-l-4 border-l-primary shadow-sm">
                                <CardHeader className="pb-4">
                                    <CardTitle className="flex items-center gap-2">
                                        <Brain className="h-5 w-5" />
                                        Resumo Executivo
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        <div className="text-center p-6 bg-gradient-to-r from-green-50 to-green-100 rounded-lg shadow-sm">
                                            <p className="text-2xl font-bold text-green-700">
                                                R$ {resumoMensal.totalVendas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </p>
                                            <p className="text-sm text-green-600 mt-2">Faturamento Total</p>
                                        </div>
                                        <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg shadow-sm">
                                            <p className="text-2xl font-bold text-blue-700 flex items-center justify-center gap-2">
                                                {resumoMensal.comparativoMesAnterior.crescimento > 0 ? (
                                                    <TrendingUp className="h-5 w-5" />
                                                ) : (
                                                    <TrendingDown className="h-5 w-5" />
                                                )}
                                                {resumoMensal.comparativoMesAnterior.crescimento > 0 ? '+' : ''}
                                                {resumoMensal.comparativoMesAnterior.crescimento.toFixed(1)}%
                                            </p>
                                            <p className="text-sm text-blue-600 mt-2">Crescimento Mensal</p>
                                        </div>
                                        <div className="text-center p-6 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg shadow-sm">
                                            <p className="text-2xl font-bold text-purple-700">
                                                {resumoMensal.metricas.taxaConversao.toFixed(1)}%
                                            </p>
                                            <p className="text-sm text-purple-600 mt-2">Taxa de Conversão</p>
                                        </div>
                                        <div className="text-center p-6 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg shadow-sm">
                                            <p className="text-2xl font-bold text-orange-700">
                                                R$ {resumoMensal.metricas.ticketMedio.toFixed(2)}
                                            </p>
                                            <p className="text-sm text-orange-600 mt-2">Ticket Médio</p>
                                        </div>
                                    </div>

                                    <Alert className="mt-6">
                                        <Zap className="h-4 w-4" />
                                        <AlertTitle>Análise do Período</AlertTitle>
                                        <AlertDescription className="mt-2">
                                            {resumoMensal.comparativoMesAnterior.crescimento > 0
                                                ? `Crescimento de ${resumoMensal.comparativoMesAnterior.crescimento.toFixed(1)}% em relação ao mês anterior.`
                                                : `Declínio de ${Math.abs(resumoMensal.comparativoMesAnterior.crescimento).toFixed(1)}% em relação ao mês anterior.`
                                            }
                                        </AlertDescription>
                                    </Alert>
                                </CardContent>
                            </Card>

                            {/* Gráfico de Tendência */}
                            <Card className="shadow-sm">
                                <CardHeader className="pb-4">
                                    <CardTitle>Evolução das Vendas no Mês</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[400px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <ComposedChart data={resumoMensal.vendasPorDia.sort((a, b) => {
                                                const [diaA, mesA, anoA] = a.data.split("/").map(Number);
                                                const [diaB, mesB, anoB] = b.data.split("/").map(Number);
                                                return new Date(anoA, mesA - 1, diaA).getTime() - new Date(anoB, mesB - 1, diaB).getTime();
                                            })}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="data" />
                                                <YAxis yAxisId="left" />
                                                <YAxis yAxisId="right" orientation="right" />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Legend />
                                                <Area yAxisId="left" type="monotone" dataKey="valor" fill="#8884d8" fillOpacity={0.3} />
                                                <Bar yAxisId="right" dataKey="quantidade" fill="#82ca9d" />
                                                <Line yAxisId="left" type="monotone" dataKey="valor" stroke="#8884d8" strokeWidth={3} />
                                            </ComposedChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Tab: Métricas */}
                    <TabsContent value="metrics">
                        <div className="space-y-8">
                            {/* Métricas Principais */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <Card className="border-l-4 border-l-green-500 shadow-sm">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="flex items-center justify-between text-sm">
                                            <span>Crescimento Mensal</span>
                                            <TrendingUp className="h-5 w-5 text-green-500" />
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <div className="space-y-3">
                                            <p className="text-3xl font-bold text-green-600">
                                                {resumoMensal.metricas.crescimentoMensal > 0 ? '+' : ''}{resumoMensal.metricas.crescimentoMensal.toFixed(1)}%
                                            </p>
                                            <Progress
                                                value={Math.min(Math.abs(resumoMensal.metricas.crescimentoMensal), 100)}
                                                className="h-2"
                                            />
                                            <div className="text-sm text-muted-foreground space-y-1.5">
                                                <p>Mês Anterior: R$ {resumoMensal.comparativoMesAnterior.vendas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                                <p>Mês Atual: R$ {resumoMensal.totalVendas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-l-4 border-l-blue-500 shadow-sm">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="flex items-center justify-between text-sm">
                                            <span>Taxa de Conversão</span>
                                            <Target className="h-5 w-5 text-blue-500" />
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <div className="space-y-3">
                                            <p className="text-3xl font-bold text-blue-600">
                                                {resumoMensal.metricas.taxaConversao.toFixed(1)}%
                                            </p>
                                            <Progress
                                                value={resumoMensal.metricas.taxaConversao}
                                                className="h-2"
                                            />
                                            <div className="text-sm text-muted-foreground space-y-1.5">
                                                <p>Concluídas: {resumoMensal.vendasPorStatus.concluida.quantidade}</p>
                                                <p>Total: {resumoMensal.quantidadeProdutos}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-l-4 border-l-purple-500 shadow-sm">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="flex items-center justify-between text-sm">
                                            <span>Ticket Médio</span>
                                            <DollarSign className="h-5 w-5 text-purple-500" />
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <div className="space-y-3">
                                            <p className="text-3xl font-bold text-purple-600">
                                                R$ {resumoMensal.metricas.ticketMedio.toFixed(2)}
                                            </p>
                                            <div className="text-sm text-muted-foreground space-y-1.5">
                                                <p>Total Vendas: R$ {resumoMensal.totalVendas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                                <p>Vendas Concluídas: {resumoMensal.vendasPorStatus.concluida.quantidade}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-l-4 border-l-orange-500 shadow-sm">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="flex items-center justify-between text-sm">
                                            <span>Eficiência de Vendas</span>
                                            <Activity className="h-5 w-5 text-orange-500" />
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <div className="space-y-3">
                                            <p className="text-3xl font-bold text-orange-600">
                                                {((resumoMensal.vendasPorStatus.concluida.valor / resumoMensal.totalVendas) * 100).toFixed(1)}%
                                            </p>
                                            <Progress
                                                value={(resumoMensal.vendasPorStatus.concluida.valor / resumoMensal.totalVendas) * 100}
                                                className="h-2"
                                            />
                                            <div className="text-sm text-muted-foreground space-y-1.5">
                                                <p>Concluídas: R$ {resumoMensal.vendasPorStatus.concluida.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                                <p>Pendentes: R$ {resumoMensal.vendasPorStatus.pendente.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Análise de Clientes */}
                            <Card className="shadow-sm">
                                <CardHeader className="pb-4">
                                    <CardTitle className="flex items-center gap-2">
                                        <Users className="h-5 w-5" />
                                        Análise de Clientes
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-5">
                                            <div className="flex justify-between items-center">
                                                <div className="space-y-1">
                                                    <p className="text-sm font-medium">Novos Clientes</p>
                                                    <p className="text-2xl font-bold text-green-600">{resumoMensal.comparativoMesAnterior.novosClientes}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-sm font-medium">Clientes Recorrentes</p>
                                                    <p className="text-2xl font-bold text-blue-600">{resumoMensal.comparativoMesAnterior.clientesRecorrentes}</p>
                                                </div>
                                            </div>
                                            <Progress
                                                value={(resumoMensal.comparativoMesAnterior.novosClientes / (resumoMensal.comparativoMesAnterior.novosClientes + resumoMensal.comparativoMesAnterior.clientesRecorrentes)) * 100}
                                                className="h-2"
                                            />
                                            <p className="text-sm text-muted-foreground">
                                                Taxa de Retenção: {((resumoMensal.comparativoMesAnterior.clientesRecorrentes / (resumoMensal.comparativoMesAnterior.novosClientes + resumoMensal.comparativoMesAnterior.clientesRecorrentes)) * 100).toFixed(1)}%
                                            </p>
                                        </div>
                                        <div className="h-[250px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={[
                                                            { name: 'Novos', value: resumoMensal.comparativoMesAnterior.novosClientes },
                                                            { name: 'Recorrentes', value: resumoMensal.comparativoMesAnterior.clientesRecorrentes }
                                                        ]}
                                                        dataKey="value"
                                                        nameKey="name"
                                                        cx="50%"
                                                        cy="50%"
                                                        outerRadius={100}
                                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                                    >
                                                        <Cell fill="#22c55e" />
                                                        <Cell fill="#3b82f6" />
                                                    </Pie>
                                                    <Tooltip />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Análise de Status */}
                            <Card className="shadow-sm">
                                <CardHeader className="pb-4">
                                    <CardTitle className="flex items-center gap-2">
                                        <BarChart3 className="h-5 w-5" />
                                        Análise de Status das Vendas
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-6">
                                            {Object.entries(resumoMensal.vendasPorStatus).map(([status, dados]) => (
                                                <div key={status} className="space-y-3">
                                                    <div className="flex justify-between items-center">
                                                        <p className="text-sm font-medium capitalize">{status}</p>
                                                        <p className="text-sm font-medium">
                                                            {dados.quantidade} vendas
                                                        </p>
                                                    </div>
                                                    <Progress
                                                        value={(dados.valor / resumoMensal.totalVendas) * 100}
                                                        className={`h-2 ${status === 'concluida' ? 'bg-green-500' :
                                                            status === 'pendente' ? 'bg-yellow-500' :
                                                                'bg-red-500'
                                                            }`}
                                                    />
                                                    <div className="flex justify-between text-sm text-muted-foreground">
                                                        <p>R$ {dados.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                                        <p>{((dados.valor / resumoMensal.totalVendas) * 100).toFixed(1)}% do total</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="h-[350px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart
                                                    data={Object.entries(resumoMensal.vendasPorStatus).map(([status, dados]) => ({
                                                        status: status.charAt(0).toUpperCase() + status.slice(1),
                                                        quantidade: dados.quantidade,
                                                        valor: dados.valor
                                                    }))}
                                                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                                >
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="status" />
                                                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                                                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                                                    <Tooltip content={<CustomTooltip />} />
                                                    <Legend />
                                                    <Bar yAxisId="left" dataKey="quantidade" fill="#8884d8" name="Quantidade" />
                                                    <Bar yAxisId="right" dataKey="valor" fill="#82ca9d" name="Valor (R$)" />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Análise de Categorias */}
                            <Card className="shadow-sm">
                                <CardHeader className="pb-4">
                                    <CardTitle className="flex items-center gap-2">
                                        <PieChartIcon className="h-5 w-5" />
                                        Análise por Categoria
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="h-[350px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={resumoMensal.vendasPorCategoria}
                                                        dataKey="valor"
                                                        nameKey="categoria"
                                                        cx="50%"
                                                        cy="50%"
                                                        outerRadius={120}
                                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                                    >
                                                        {resumoMensal.vendasPorCategoria.map((entry, index) => (
                                                            <Cell
                                                                key={`cell-${index}`}
                                                                fill={COLORS[index % COLORS.length]}
                                                            />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip content={<CustomTooltip />} />
                                                    <Legend />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="space-y-6">
                                            {resumoMensal.vendasPorCategoria
                                                .sort((a, b) => b.valor - a.valor)
                                                .map((categoria, index) => (
                                                    <div key={categoria.categoria} className="space-y-3">
                                                        <div className="flex justify-between items-center">
                                                            <p className="text-sm font-medium">{categoria.categoria}</p>
                                                            <p className="text-sm font-medium">
                                                                {categoria.quantidade} vendas
                                                            </p>
                                                        </div>
                                                        <Progress
                                                            value={(categoria.valor / resumoMensal.totalVendas) * 100}
                                                            className="h-2"
                                                            style={{ backgroundColor: COLORS[index % COLORS.length] + '20' }}
                                                        />
                                                        <div className="flex justify-between text-sm text-muted-foreground">
                                                            <p>R$ {categoria.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                                            <p>{((categoria.valor / resumoMensal.totalVendas) * 100).toFixed(1)}% do total</p>
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Tab: Análise Detalhada */}
                    <TabsContent value="detailed">
                        <div className="space-y-8">
                            {/* Cards de Status */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <Card className="shadow-sm">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm font-medium">
                                            Total de Vendas
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <p className="text-2xl font-bold">
                                            R$ {resumoMensal.totalVendas.toFixed(2)}
                                        </p>
                                        <p className="text-sm text-muted-foreground mt-2">
                                            {resumoMensal.quantidadeProdutos} vendas realizadas
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card className="shadow-sm">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm font-medium">
                                            Vendas Concluídas
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <p className="text-2xl font-bold text-green-600">
                                            R$ {resumoMensal.vendasPorStatus.concluida.valor.toFixed(2)}
                                        </p>
                                        <p className="text-sm text-muted-foreground mt-2">
                                            {resumoMensal.vendasPorStatus.concluida.quantidade} vendas
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card className="shadow-sm">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm font-medium">
                                            Vendas Pendentes
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <p className="text-2xl font-bold text-yellow-600">
                                            R$ {resumoMensal.vendasPorStatus.pendente.valor.toFixed(2)}
                                        </p>
                                        <p className="text-sm text-muted-foreground mt-2">
                                            {resumoMensal.vendasPorStatus.pendente.quantidade} vendas
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card className="shadow-sm">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm font-medium">
                                            Vendas Expiradas
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <p className="text-2xl font-bold text-red-600">
                                            R$ {resumoMensal.vendasPorStatus.expirado.valor.toFixed(2)}
                                        </p>
                                        <p className="text-sm text-muted-foreground mt-2">
                                            {resumoMensal.vendasPorStatus.expirado.quantidade} vendas
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card className="shadow-sm">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm font-medium">
                                            Lucro Total
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <p className="text-2xl font-bold text-green-600">
                                            R$ {resumoMensal.metricas.lucroTotal?.toFixed(2) || "0.00"}
                                        </p>
                                        <p className="text-sm text-muted-foreground mt-2">
                                            Margem: {resumoMensal.metricas.margemLucro?.toFixed(1)}%
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Gráficos Detalhados */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Gráfico de Status das Vendas */}
                                <Card className="shadow-sm">
                                    <CardHeader className="pb-4">
                                        <CardTitle>Distribuição por Status</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-[350px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={Object.entries(resumoMensal.vendasPorStatus).map(
                                                            ([status, dados]) => ({
                                                                name: status.charAt(0).toUpperCase() + status.slice(1),
                                                                value: dados.valor,
                                                                quantidade: dados.quantidade,
                                                            })
                                                        )}
                                                        dataKey="value"
                                                        nameKey="name"
                                                        cx="50%"
                                                        cy="50%"
                                                        outerRadius={120}
                                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                                    >
                                                        {Object.entries(resumoMensal.vendasPorStatus).map(
                                                            (entry, index) => (
                                                                <Cell
                                                                    key={`cell-${index}`}
                                                                    fill={
                                                                        index === 0
                                                                            ? "#22c55e"
                                                                            : index === 1
                                                                                ? "#eab308"
                                                                                : "#ef4444"
                                                                    }
                                                                />
                                                            )
                                                        )}
                                                    </Pie>
                                                    <Tooltip content={<CustomTooltip />} />
                                                    <Legend />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Gráfico de Vendas por Categoria */}
                                <Card className="shadow-sm">
                                    <CardHeader className="pb-4">
                                        <CardTitle>Vendas por Categoria</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-[350px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={resumoMensal.vendasPorCategoria}
                                                        dataKey="valor"
                                                        nameKey="categoria"
                                                        cx="50%"
                                                        cy="50%"
                                                        outerRadius={120}
                                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                                    >
                                                        {resumoMensal.vendasPorCategoria.map((entry, index) => (
                                                            <Cell
                                                                key={`cell-${index}`}
                                                                fill={COLORS[index % COLORS.length]}
                                                            />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip content={<CustomTooltip />} />
                                                    <Legend />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Tabela Detalhada */}
                            <Card className="shadow-sm">
                                <CardHeader className="pb-4">
                                    <CardTitle>Análise Diária Detalhada</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b">
                                                    <th className="text-left p-3">Data</th>
                                                    <th className="text-left p-3">Total</th>
                                                    <th className="text-left p-3">Custo</th>
                                                    <th className="text-left p-3">Lucro</th>
                                                    <th className="text-left p-3">Margem</th>
                                                    <th className="text-left p-3">Concluídas</th>
                                                    <th className="text-left p-3">Pendentes</th>
                                                    <th className="text-left p-3">Expiradas</th>
                                                    <th className="text-left p-3">Performance</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {resumoMensal.vendasPorDia
                                                    .sort((a, b) => {
                                                        const [diaA, mesA, anoA] = a.data.split("/").map(Number);
                                                        const [diaB, mesB, anoB] = b.data.split("/").map(Number);
                                                        return new Date(anoA, mesA - 1, diaA).getTime() - new Date(anoB, mesB - 1, diaB).getTime();
                                                    })
                                                    .map((dia) => {
                                                        const margemDia = dia.valor > 0 ? ((dia.lucro || 0) / dia.valor) * 100 : 0;
                                                        const taxaConversaoDia = dia.quantidade > 0 ? (dia.status.concluida / dia.quantidade) * 100 : 0;
                                                        return (
                                                            <tr key={dia.data} className="border-b hover:bg-muted/50">
                                                                <td className="p-3 font-medium">{dia.data}</td>
                                                                <td className="p-3">R$ {dia.valor.toFixed(2)}</td>
                                                                <td className="p-3">R$ {(dia.custo || 0).toFixed(2)}</td>
                                                                <td className="p-3 text-green-600">R$ {(dia.lucro || 0).toFixed(2)}</td>
                                                                <td className="p-3">{margemDia.toFixed(1)}%</td>
                                                                <td className="p-3 text-green-600">
                                                                    {dia.status.concluida} ({((dia.status.concluida / dia.quantidade) * 100).toFixed(0)}%)
                                                                </td>
                                                                <td className="p-3 text-yellow-600">
                                                                    {dia.status.pendente} ({((dia.status.pendente / dia.quantidade) * 100).toFixed(0)}%)
                                                                </td>
                                                                <td className="p-3 text-red-600">
                                                                    {dia.status.expirado} ({((dia.status.expirado / dia.quantidade) * 100).toFixed(0)}%)
                                                                </td>
                                                                <td className="p-3">
                                                                    <Badge variant={
                                                                        taxaConversaoDia >= 80 ? "default" :
                                                                            taxaConversaoDia >= 60 ? "secondary" :
                                                                                "destructive"
                                                                    }>
                                                                        {taxaConversaoDia >= 80 ? "Excelente" :
                                                                            taxaConversaoDia >= 60 ? "Bom" :
                                                                                "Atenção"}
                                                                    </Badge>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Lista de Produtos com Custos */}
                            <Card className="shadow-sm">
                                <CardHeader className="pb-4">
                                    <CardTitle>Produtos Vendidos</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b">
                                                    <th className="text-left p-3">Produto</th>
                                                    <th className="text-left p-3">Quantidade</th>
                                                    <th className="text-left p-3">Valor Total</th>
                                                    <th className="text-left p-3">Custo Unitário</th>
                                                    <th className="text-left p-3">Custo Total</th>
                                                    <th className="text-left p-3">Lucro</th>
                                                    <th className="text-left p-3">Margem</th>
                                                    <th className="text-left p-3">Ações</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {resumoMensal.produtosVendidos.map((produto) => {
                                                    const custoUnitario = custosProdutos[produto.id] || 0;
                                                    const custoTotal = custoUnitario * produto.quantidade;
                                                    const lucro = produto.valorTotal - custoTotal;
                                                    const margem = produto.valorTotal > 0 ? (lucro / produto.valorTotal) * 100 : 0;

                                                    return (
                                                        <tr key={produto.id} className="border-b hover:bg-muted/50">
                                                            <td className="p-3 font-medium">{produto.nome}</td>
                                                            <td className="p-3">{produto.quantidade}</td>
                                                            <td className="p-3">R$ {produto.valorTotal.toFixed(2)}</td>
                                                            <td className="p-3">R$ {custoUnitario.toFixed(2)}</td>
                                                            <td className="p-3">R$ {custoTotal.toFixed(2)}</td>
                                                            <td className="p-3 text-green-600">R$ {lucro.toFixed(2)}</td>
                                                            <td className="p-3">{margem.toFixed(1)}%</td>
                                                            <td className="p-3">
                                                                <DialogCustoProduto
                                                                    produto={{
                                                                        id: produto.id,
                                                                        nome: produto.nome,
                                                                        valorTotal: produto.valorTotal
                                                                    }}
                                                                    onConfirm={(custo) => handleDefinirCusto(produto.id, custo)}
                                                                />
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Tab: Exportar */}
                    <TabsContent value="export">
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Exportação CSV */}
                                <Card className="shadow-sm">
                                    <CardHeader className="pb-4">
                                        <CardTitle className="flex items-center gap-2">
                                            <FileSpreadsheet className="h-5 w-5" />
                                            Exportar Dados em CSV
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <p className="text-sm text-muted-foreground">
                                            Exporte os dados completos do fechamento mensal em formato CSV para análise em planilhas.
                                        </p>
                                        <div className="space-y-3">
                                            <Button
                                                onClick={exportarCSVEstrategico}
                                                className="w-full"
                                                variant="outline"
                                            >
                                                <FileSpreadsheet className="mr-2 h-4 w-4" />
                                                Exportar Análise Completa
                                            </Button>
                                            <Button
                                                onClick={() => {
                                                    if (!resumoMensal) return;
                                                    const headers = ["Data", "Quantidade", "Valor", "Concluídas", "Pendentes", "Expiradas", "Ticket Médio"];
                                                    const data = resumoMensal.vendasPorDia.map(dia => [
                                                        dia.data,
                                                        dia.quantidade,
                                                        dia.valor.toFixed(2),
                                                        dia.status.concluida,
                                                        dia.status.pendente,
                                                        dia.status.expirado,
                                                        (dia.valor / dia.quantidade).toFixed(2)
                                                    ]);
                                                    const csvContent = [
                                                        headers.join(","),
                                                        ...data.map(row => row.join(","))
                                                    ].join("\n");
                                                    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                                                    const url = URL.createObjectURL(blob);
                                                    const link = document.createElement("a");
                                                    link.setAttribute("href", url);
                                                    link.setAttribute("download", `vendas-diarias-${format(parseISO(mesSelecionado + "-01"), "MMMM-yyyy", { locale: ptBR })}.csv`);
                                                    document.body.appendChild(link);
                                                    link.click();
                                                    document.body.removeChild(link);
                                                }}
                                                className="w-full"
                                                variant="outline"
                                            >
                                                <Calendar className="mr-2 h-4 w-4" />
                                                Exportar Vendas Diárias
                                            </Button>
                                            <Button
                                                onClick={() => {
                                                    if (!resumoMensal) return;
                                                    const headers = ["Categoria", "Quantidade", "Valor Total", "% do Total"];
                                                    const data = resumoMensal.vendasPorCategoria.map(cat => [
                                                        cat.categoria,
                                                        cat.quantidade,
                                                        cat.valor.toFixed(2),
                                                        ((cat.valor / resumoMensal.totalVendas) * 100).toFixed(1)
                                                    ]);
                                                    const csvContent = [
                                                        headers.join(","),
                                                        ...data.map(row => row.join(","))
                                                    ].join("\n");
                                                    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                                                    const url = URL.createObjectURL(blob);
                                                    const link = document.createElement("a");
                                                    link.setAttribute("href", url);
                                                    link.setAttribute("download", `vendas-categorias-${format(parseISO(mesSelecionado + "-01"), "MMMM-yyyy", { locale: ptBR })}.csv`);
                                                    document.body.appendChild(link);
                                                    link.click();
                                                    document.body.removeChild(link);
                                                }}
                                                className="w-full"
                                                variant="outline"
                                            >
                                                <PieChartIcon className="mr-2 h-4 w-4" />
                                                Exportar Vendas por Categoria
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Exportação PDF */}
                                <Card className="shadow-sm">
                                    <CardHeader className="pb-4">
                                        <CardTitle className="flex items-center gap-2">
                                            <FileText className="h-5 w-5" />
                                            Exportar Relatório em PDF
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <p className="text-sm text-muted-foreground">
                                            Gere um relatório detalhado em PDF com todas as métricas e análises do período.
                                        </p>
                                        {resumoMensal && (
                                            <PDFDownloadLink
                                                document={<RelatorioEstrategicoPDF resumo={resumoMensal} mesSelecionado={mesSelecionado} />}
                                                fileName={`relatorio-fechamento-${format(parseISO(mesSelecionado + "-01"), "MMMM-yyyy", { locale: ptBR })}.pdf`}
                                                className="w-full"
                                            >
                                                {({ loading }) => (
                                                    <Button
                                                        className="w-full"
                                                        variant="outline"
                                                        disabled={loading}
                                                    >
                                                        <FileText className="mr-2 h-4 w-4" />
                                                        {loading ? "Gerando PDF..." : "Gerar Relatório PDF"}
                                                    </Button>
                                                )}
                                            </PDFDownloadLink>
                                        )}
                                        <div className="pt-4 border-t">
                                            <h4 className="text-sm font-medium mb-3">Informações Incluídas no PDF:</h4>
                                            <ul className="text-sm text-muted-foreground space-y-2">
                                                <li>• Resumo executivo do período</li>
                                                <li>• Métricas principais de vendas</li>
                                                <li>• Análise de performance por status</li>
                                                <li>• Comparativo com mês anterior</li>
                                                <li>• Dados de clientes novos e recorrentes</li>
                                            </ul>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                            <div className="flex gap-2 items-end">
                                <div>
                                    <label className="block text-xs font-medium mb-1">Taxa OpenPix (%)</label>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={openPixTax}
                                        onChange={e => setOpenPixTax(Number(e.target.value))}
                                        className="w-24"
                                    />
                                </div>
                                <Button onClick={exportarFechamentoExcel} disabled={!resumoMensal} variant="outline">
                                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                                    Exportar Fechamento Excel
                                </Button>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
};
