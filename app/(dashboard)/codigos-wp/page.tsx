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
import { Search, Filter, UserRound, LogOut } from "lucide-react";
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

import { ToastAction } from "@/app/components/ui/toast";
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

  const renderTable = (tabela: string, registros: Registro[]) => {
    const filtrados = registros.filter(filtrar);

    if (filtrados.length === 0) return null;

    return (
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>{tabela}</CardTitle>
          <CardDescription>
            {filtrados.length} código(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
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

      <div className="mb-4">
        <Badge variant="outline" className="text-sm">
          <UserRound className="mr-1 h-3 w-3" />
          {currentAccount.name}
        </Badge>
        <Button variant="ghost" size="sm" className="ml-2" onClick={fetchDados}>
          Atualizar dados
        </Button>
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
    </div>
  );
}
