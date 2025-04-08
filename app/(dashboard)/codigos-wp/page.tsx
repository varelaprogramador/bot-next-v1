"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";
import { Badge } from "@/app/components/ui/badge";
import { Skeleton } from "@/app/components/ui/skeleton";
import { Input } from "@/app/components/ui/input";
import {
  Search,
  Filter,
  UserRound,
  LogOut,
  Download,
  Check,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import { Label } from "@/app/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Checkbox } from "@/app/components/ui/checkbox";
import { toast } from "sonner";

interface Registro {
  id: number;
  order: string;
  Produto: string;
  Chave: string;
  Validade: string;
  Data: string;
}

interface CodigosPorTabela {
  [nomeTabela: string]: Registro[];
}

interface Account {
  name: string;
  token: string;
  tabelas: Array<{ nome: string; id: number }>;
}

interface ProdutoDb {
  id: string;
  nome: string;
  valor: string;
  codigo: null;
  created_at: string;
  categoria: string;
  descricao: string;
  url_image: string;
  position: string;
  reviews: string;
}

interface CodigosProps {
  id_codigo: string;
  id_produto: string;
  codigo: string;
  status: string;
}

// Define accounts
const accounts: Account[] = [
  {
    name: "CMC",
    token: "9KaY7NPiKpnWgofDCj1mSOJI2Z7S1KoR",
    tabelas: [
      { nome: "Tve Mensal", id: 358800 },
      { nome: "Tve Anual", id: 362385 },
      { nome: "Blue Mensal", id: 360543 },
      { nome: "Blue Anual", id: 360549 },
      { nome: "Red Play Mensal", id: 360544 },
      { nome: "Red Play Anual", id: 360551 },
      { nome: "Eppi Cinema Mensal", id: 360546 },
      { nome: "Eppi Cinema Anual", id: 360552 },
      { nome: "UniTV Mensal", id: 360547 },
      { nome: "UniTV Anual", id: 360553 },
      { nome: "Duna Mensal", id: 360545 },
      { nome: "Duna Anual", id: 360554 },
    ],
  },
  {
    name: "KENFOXX",
    token: "JFXii3uCtj191dnk0NDYd7Ohx2uO6rPx",
    tabelas: [
      { nome: "Tve Mensal", id: 388336 },
      { nome: "Tve Anual", id: 388340 },
      { nome: "Blue Mensal", id: 388341 },
      { nome: "Blue Anual", id: 388342 },
      { nome: "Red Play Mensal", id: 388343 },
      { nome: "Red Play Anual", id: 388344 },
      { nome: "Eppi Cinema Mensal", id: 388355 },
      { nome: "Eppi Cinema Anual", id: 388356 },
      { nome: "UniTV Mensal", id: 388359 },
      { nome: "UniTV Anual", id: 388361 },
      { nome: "Duna Mensal", id: 388362 },
      { nome: "Duna Anual", id: 388365 },
      { nome: "You Cine Mensal", id: 409819 },
      { nome: "You Cine Anual", id: 409822 },
      { nome: "Tele Latino Mensal", id: 409827 },
      { nome: "Tele Latino Anual", id: 409829 },
      { nome: "BTV Mensal", id: 409831 },
      { nome: "BTV Anual", id: 409833 },
      { nome: "SuperTV Mensal", id: 473126 },
      { nome: "SuperTV Anual", id: 473127 },
    ],
  },
];

export default function CodigosWp() {
  const [codigos, setCodigos] = useState<CodigosPorTabela>({});
  const [loading, setLoading] = useState(true);
  const [filtroChave, setFiltroChave] = useState<"todos" | "com" | "sem">(
    "todos"
  );
  const [filtroValidade, setFiltroValidade] = useState<
    "todos" | "Mensal" | "Anual"
  >("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentAccount, setCurrentAccount] = useState<Account>(accounts[0]);
  const [customToken, setCustomToken] = useState("");
  const [activeTab, setActiveTab] = useState("");
  const [produtos, setProdutos] = useState<ProdutoDb[]>([]);
  const [isMigrateDialogOpen, setIsMigrateDialogOpen] = useState(false);
  const [selectedCodigos, setSelectedCodigos] = useState<
    Record<string, boolean>
  >({});
  const [selectedProduto, setSelectedProduto] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ativo");
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResults, setMigrationResults] = useState<{
    success: number;
    failed: number;
    total: number;
  }>({ success: 0, failed: 0, total: 0 });
  const [showMigrationResults, setShowMigrationResults] = useState(false);

  // Group tables by product for the current account
  const produtoGroups = currentAccount.tabelas.reduce((acc, tabela) => {
    const productName = tabela.nome.split(" ")[0];
    if (!acc[productName]) {
      acc[productName] = [];
    }
    acc[productName].push(tabela);
    return acc;
  }, {} as Record<string, typeof currentAccount.tabelas>);

  // Set initial active tab when account changes
  useEffect(() => {
    if (Object.keys(produtoGroups).length > 0) {
      setActiveTab(Object.keys(produtoGroups)[0]);
    }
  }, [currentAccount]);

  useEffect(() => {
    fetchDados();
    fetchProdutos();
  }, [currentAccount]);

  const fetchDados = async () => {
    setLoading(true);
    setCodigos({});

    const todosCodigos: CodigosPorTabela = {};

    for (const tabela of currentAccount.tabelas) {
      try {
        const res = await fetch(
          `https://api.baserow.io/api/database/rows/table/${tabela.id}/?user_field_names=true`,
          {
            headers: {
              Authorization: `Token ${currentAccount.token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }

        const data = await res.json();
        todosCodigos[tabela.nome] = data.results.sort(
          (a: Registro, b: Registro) =>
            Number.parseFloat(a.order) - Number.parseFloat(b.order)
        );
      } catch (err) {
        console.error("Erro ao buscar:", tabela.nome, err);
      }
    }

    setCodigos(todosCodigos);
    setLoading(false);
  };

  const fetchProdutos = async () => {
    try {
      // Normalmente você faria uma chamada API para seu banco de dados
      // Mas para este exemplo, vamos usar os dados do CSV fornecido
      const response = await fetch("/api/produtos");
      const data = await response.json();
      setProdutos(data);
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
      // Fallback para dados de exemplo do CSV
      const mockProdutos: ProdutoDb[] = [
        {
          id: "fea013be-8b55-474b-81e2-1c567286a353",
          nome: "EPPI CINEMA",
          valor: "99.9",
          codigo: null,
          created_at: "2025-01-26 11:28:41.228479+00",
          categoria: "Anual",
          descricao:
            "EPPI é um media player pessoal que organiza e atualiza automaticamente as informações cinematográficas dos seus filmes e programas de TV",
          url_image:
            "https://ctenwsbxdxlzvbdhfidw.supabase.co/storage/v1/object/public/galeria//eppicinema.png",
          position: "2",
          reviews: "{}",
        },
        {
          id: "7c9e6679-7425-40de-944b-e07fc1f90ae7",
          nome: "BLUE",
          valor: "79.9",
          codigo: null,
          created_at: "2025-01-26 11:28:41.228479+00",
          categoria: "Anual",
          descricao:
            "Blue é um serviço de streaming que oferece uma ampla variedade de séries, filmes e documentários premiados",
          url_image:
            "https://ctenwsbxdxlzvbdhfidw.supabase.co/storage/v1/object/public/galeria//blue.png",
          position: "3",
          reviews: "{}",
        },
        {
          id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          nome: "TVE",
          valor: "59.9",
          codigo: null,
          created_at: "2025-01-26 11:28:41.228479+00",
          categoria: "Mensal",
          descricao:
            "TVE oferece acesso a canais de TV ao vivo e conteúdo sob demanda",
          url_image:
            "https://ctenwsbxdxlzvbdhfidw.supabase.co/storage/v1/object/public/galeria//tve.png",
          position: "1",
          reviews: "{}",
        },
        {
          id: "8a1c5cdc-ba57-445a-994e-b9d77f28f64a",
          nome: "RED PLAY",
          valor: "89.9",
          codigo: null,
          created_at: "2025-01-26 11:28:41.228479+00",
          categoria: "Anual",
          descricao:
            "Red Play é um serviço de streaming com foco em esportes e entretenimento",
          url_image:
            "https://ctenwsbxdxlzvbdhfidw.supabase.co/storage/v1/object/public/galeria//redplay.png",
          position: "4",
          reviews: "{}",
        },
        {
          id: "d290f1ee-6c54-4b01-90e6-d701748f0851",
          nome: "DUNA",
          valor: "69.9",
          codigo: null,
          created_at: "2025-01-26 11:28:41.228479+00",
          categoria: "Mensal",
          descricao: "Duna oferece acesso a filmes e séries exclusivas",
          url_image:
            "https://ctenwsbxdxlzvbdhfidw.supabase.co/storage/v1/object/public/galeria//duna.png",
          position: "5",
          reviews: "{}",
        },
      ];
      setProdutos(mockProdutos);
    }
  };

  const handleAccountChange = (accountName: string) => {
    const account = accounts.find((acc) => acc.name === accountName);
    if (account) {
      setCurrentAccount(account);
    }
  };

  const handleCustomTokenSubmit = () => {
    if (customToken.trim()) {
      const newAccount: Account = {
        name: "Conta Personalizada",
        token: customToken,
        tabelas: currentAccount.tabelas, // Keep the same tables but with new token
      };

      setCurrentAccount(newAccount);
      setCustomToken("");
    }
  };

  const filtrar = (item: Registro) => {
    const chaveOk =
      filtroChave === "todos"
        ? true
        : filtroChave === "com"
        ? item.Chave !== ""
        : item.Chave === "";

    const validadeOk =
      filtroValidade === "todos" ? true : item.Validade === filtroValidade;

    const searchOk =
      searchTerm === "" ||
      item.Produto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.Chave?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toString().includes(searchTerm);

    return chaveOk && validadeOk && searchOk;
  };

  const getStatusBadge = (chave: string) => {
    if (chave) {
      return <Badge className="bg-green-500">Ativo</Badge>;
    }
    return (
      <Badge variant="outline" className="text-muted-foreground">
        Pendente
      </Badge>
    );
  };

  const renderSkeletonTable = () => (
    <Card>
      <CardHeader>
        <Skeleton className="h-8 w-48" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {Array(5)
            .fill(0)
            .map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
        </div>
      </CardContent>
    </Card>
  );

  const toggleSelectCodigo = (id: string) => {
    setSelectedCodigos((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const selectAllCodigos = (registros: Registro[], select: boolean) => {
    const newSelected = { ...selectedCodigos };
    registros.forEach((item) => {
      newSelected[item.id.toString()] = select;
    });
    setSelectedCodigos(newSelected);
  };

  const countSelectedCodigos = () => {
    return Object.values(selectedCodigos).filter(Boolean).length;
  };

  const openMigrateDialog = () => {
    if (countSelectedCodigos() === 0) {
      toast.error("Selecione pelo menos um código para migrar");
      return;
    }
    setIsMigrateDialogOpen(true);
  };

  // Substitua a função handleMigrate por esta versão atualizada que inclui a chave no CSV
  const handleMigrate = async () => {
    if (!selectedProduto) {
      toast.error("Selecione um produto para migrar os códigos");
      return;
    }

    setIsMigrating(true);
    setMigrationResults({ success: 0, failed: 0, total: 0 });

    // Coletar todos os códigos selecionados
    const codigosParaMigrar: Array<{
      id: number;
      chave: string;
      tabela: string;
      produto: string;
      validade: string;
    }> = [];

    Object.entries(codigos).forEach(([tabela, registros]) => {
      registros.forEach((registro) => {
        if (selectedCodigos[registro.id.toString()]) {
          codigosParaMigrar.push({
            id: registro.id,
            chave: registro.Chave,
            tabela,
            produto: registro.Produto,
            validade: registro.Validade,
          });
        }
      });
    });

    try {
      // Encontrar o nome do produto selecionado
      const produtoSelecionado =
        produtos.find((p) => p.id === selectedProduto)?.nome || "Produto";

      // Criar o conteúdo do CSV
      let csvContent = "produto,status,validade,chave\n";

      codigosParaMigrar.forEach((codigo) => {
        // Adicionar cada linha ao CSV, incluindo a chave
        csvContent += `${produtoSelecionado},${selectedStatus},${
          codigo.validade
        },${codigo.chave || ""}\n`;
      });

      // Criar um blob com o conteúdo do CSV
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      // Criar um link para download e clicar nele
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `codigos_migrados_${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();

      // Limpar
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setMigrationResults({
        success: codigosParaMigrar.length,
        failed: 0,
        total: codigosParaMigrar.length,
      });
    } catch (error) {
      console.error("Erro ao gerar CSV:", error);
      setMigrationResults({
        success: 0,
        failed: codigosParaMigrar.length,
        total: codigosParaMigrar.length,
      });
    }

    setIsMigrating(false);
    setShowMigrationResults(true);
  };

  const finalizeMigration = () => {
    setIsMigrateDialogOpen(false);
    setShowMigrationResults(false);
    setSelectedCodigos({});

    if (migrationResults.success > 0) {
      toast.success(
        `${migrationResults.success} código(s) migrado(s) com sucesso`
      );
    }
    if (migrationResults.failed > 0) {
      toast.error(`${migrationResults.failed} código(s) falharam na migração`);
    }
  };

  const renderTable = (tabela: string, registros: Registro[]) => {
    const filtrados = registros.filter(filtrar);

    if (filtrados.length === 0) return null;

    const allSelected = filtrados.every(
      (item) => selectedCodigos[item.id.toString()]
    );
    const someSelected =
      filtrados.some((item) => selectedCodigos[item.id.toString()]) &&
      !allSelected;

    return (
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>{tabela}</CardTitle>
              <CardDescription>
                {filtrados.length} código(s) encontrado(s)
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id={`select-all-${tabela}`}
                checked={allSelected}
                onCheckedChange={(checked) =>
                  selectAllCodigos(filtrados, !!checked)
                }
                ref={(el) => {
                  if (el) {
                    (el as HTMLInputElement).indeterminate = someSelected;
                  }
                }}
              />
              <Label htmlFor={`select-all-${tabela}`}>Selecionar todos</Label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Selecionar</TableHead>
                <TableHead className="w-[80px]">ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Chave</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead className="text-right">Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Checkbox
                      checked={!!selectedCodigos[item.id.toString()]}
                      onCheckedChange={() =>
                        toggleSelectCodigo(item.id.toString())
                      }
                    />
                  </TableCell>
                  <TableCell className="font-medium">{item.id}</TableCell>
                  <TableCell>{getStatusBadge(item.Chave)}</TableCell>
                  <TableCell className="font-mono">
                    {item.Chave || "-"}
                  </TableCell>
                  <TableCell>{item.Produto}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        item.Validade === "Mensal" ? "outline" : "secondary"
                      }
                    >
                      {item.Validade}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{item.Data}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Acompanhe seus Códigos</h1>
          <p className="text-muted-foreground mt-1">
            Visualize e gerencie todos os seus códigos de acesso
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por ID, produto ou chave..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
                <span className="sr-only">Filtros</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Filtros</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground pt-2">
                  Status da Chave
                </DropdownMenuLabel>
                <DropdownMenuItem
                  className={filtroChave === "todos" ? "bg-accent" : ""}
                  onClick={() => setFiltroChave("todos")}
                >
                  Todos
                </DropdownMenuItem>
                <DropdownMenuItem
                  className={filtroChave === "com" ? "bg-accent" : ""}
                  onClick={() => setFiltroChave("com")}
                >
                  Somente com chave
                </DropdownMenuItem>
                <DropdownMenuItem
                  className={filtroChave === "sem" ? "bg-accent" : ""}
                  onClick={() => setFiltroChave("sem")}
                >
                  Somente sem chave
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground pt-2">
                  Validade
                </DropdownMenuLabel>
                <DropdownMenuItem
                  className={filtroValidade === "todos" ? "bg-accent" : ""}
                  onClick={() => setFiltroValidade("todos")}
                >
                  Todos
                </DropdownMenuItem>
                <DropdownMenuItem
                  className={filtroValidade === "Mensal" ? "bg-accent" : ""}
                  onClick={() => setFiltroValidade("Mensal")}
                >
                  Mensal
                </DropdownMenuItem>
                <DropdownMenuItem
                  className={filtroValidade === "Anual" ? "bg-accent" : ""}
                  onClick={() => setFiltroValidade("Anual")}
                >
                  Anual
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <UserRound className="h-4 w-4" />
                <span className="sr-only">Conta</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Contas</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                {accounts.map((account) => (
                  <DropdownMenuItem
                    key={account.name}
                    className={
                      currentAccount.name === account.name ? "bg-accent" : ""
                    }
                    onClick={() => handleAccountChange(account.name)}
                  >
                    <UserRound className="mr-2 h-4 w-4" />
                    <span>{account.name}</span>
                    {currentAccount.name === account.name && (
                      <Badge className="ml-auto" variant="outline">
                        Ativo
                      </Badge>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <Dialog>
                <DialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Token Personalizado</span>
                  </DropdownMenuItem>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Token Personalizado</DialogTitle>
                    <DialogDescription>
                      Insira um token personalizado para acessar outra conta.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="token" className="text-right">
                        Token
                      </Label>
                      <Input
                        id="token"
                        value={customToken}
                        onChange={(e) => setCustomToken(e.target.value)}
                        className="col-span-3"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" onClick={handleCustomTokenSubmit}>
                      Aplicar Token
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="mb-4 flex justify-between items-center">
        <div>
          <Badge variant="outline" className="text-sm">
            <UserRound className="mr-1 h-3 w-3" />
            {currentAccount.name}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            className="ml-2"
            onClick={fetchDados}
          >
            Atualizar dados
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {countSelectedCodigos() > 0 && (
            <Badge variant="secondary" className="mr-2">
              {countSelectedCodigos()} código(s) selecionado(s)
            </Badge>
          )}
          <Button
            variant="default"
            size="sm"
            className="flex items-center gap-1"
            onClick={openMigrateDialog}
            disabled={countSelectedCodigos() === 0}
          >
            <Download className="h-4 w-4" />
            Exportar para CSV
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          {Array(3)
            .fill(0)
            .map((_, i) => (
              <div key={i}>{renderSkeletonTable()}</div>
            ))}
        </div>
      ) : Object.keys(produtoGroups).length > 0 ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6 flex flex-wrap h-auto">
            {Object.keys(produtoGroups).map((produto) => (
              <TabsTrigger key={produto} value={produto} className="flex-grow">
                {produto}
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(produtoGroups).map(([produto, tabelas]) => (
            <TabsContent key={produto} value={produto} className="space-y-6">
              {tabelas.map(
                (tabela) =>
                  codigos[tabela.nome] &&
                  renderTable(tabela.nome, codigos[tabela.nome])
              )}

              {tabelas.every(
                (tabela) =>
                  !codigos[tabela.nome] ||
                  (codigos[tabela.nome] &&
                    codigos[tabela.nome].filter(filtrar).length === 0)
              ) && (
                <Card className="p-8 text-center">
                  <CardContent>
                    <p className="text-muted-foreground">
                      Nenhum código encontrado com os filtros atuais.
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => {
                        setFiltroChave("todos");
                        setFiltroValidade("todos");
                        setSearchTerm("");
                      }}
                    >
                      Limpar filtros
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <Card className="p-8 text-center">
          <CardContent>
            <p className="text-muted-foreground">
              Nenhum dado disponível para esta conta.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Dialog de Migração */}
      <Dialog open={isMigrateDialogOpen} onOpenChange={setIsMigrateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          {!showMigrationResults ? (
            <>
              <DialogHeader>
                <DialogTitle>Exportar Códigos para CSV</DialogTitle>
                <DialogDescription>
                  Selecione o produto e o status para exportar os códigos
                  selecionados.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="produto" className="text-right">
                    Produto
                  </Label>
                  <Select
                    value={selectedProduto}
                    onValueChange={setSelectedProduto}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecione um produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {produtos.map((produto) => (
                        <SelectItem key={produto.id} value={produto.id}>
                          {produto.nome} ({produto.categoria})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="status" className="text-right">
                    Status
                  </Label>
                  <Select
                    value={selectedStatus}
                    onValueChange={setSelectedStatus}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecione um status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="expirado">Expirado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-4 mt-2">
                  <p className="text-sm text-muted-foreground">
                    Você está prestes a migrar {countSelectedCodigos()}{" "}
                    código(s) para seu banco de dados.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsMigrateDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleMigrate}
                  disabled={isMigrating || !selectedProduto}
                >
                  {isMigrating ? "Exportando..." : "Exportar para CSV"}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Resultado da Exportação</DialogTitle>
                <DialogDescription>
                  Resumo da exportação de códigos para CSV.
                </DialogDescription>
              </DialogHeader>
              <div className="py-6">
                <div className="flex flex-col items-center justify-center space-y-4">
                  {migrationResults.success > 0 && (
                    <div className="flex items-center gap-2 text-green-500">
                      <Check className="h-6 w-6" />
                      <span className="text-lg font-medium">
                        {migrationResults.success} código(s) exportado(s) com
                        sucesso
                      </span>
                    </div>
                  )}
                  {migrationResults.failed > 0 && (
                    <div className="flex items-center gap-2 text-red-500">
                      <X className="h-6 w-6" />
                      <span className="text-lg font-medium">
                        {migrationResults.failed} código(s) falharam na
                        exportação
                      </span>
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground mt-2">
                    Total: {migrationResults.total} código(s)
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={finalizeMigration}>Concluir</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
