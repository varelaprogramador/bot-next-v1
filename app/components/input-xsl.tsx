import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import { Input } from "./ui/input";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import { Button } from "./ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Edit, Eraser, MoveRight, Sheet, Trash } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { CodigosProps } from "../utils/codigos";
import { v4 } from "uuid";
import { useToast } from "@/hooks/use-toast";
interface DataRow {
  [key: string]: string | number; // Define um tipo genérico para as linhas de dados
}

interface ProdutoCodigo {
  id?: string;
  produto: string;
  codigo: string;
  status: string;
  categoria: string;
}



const FileUpload: React.FC = () => {
  const [produtosECodigos, setProdutosECodigos] = useState<ProdutoCodigo[]>([]); // Estado para armazenar o par produto/codigo
  const [produtosEncontrados, setProdutosEncontrados] = useState<ProdutoCodigo[]>([]); // Estado para armazenar os produtos encontrados no DB
  const [isArchive,setArchive]=useState<React.ChangeEvent<HTMLInputElement>>();
  const supabase = createClient();
  const handleFileChange = () => {
    const file =isArchive?.target.files?.[0]||undefined; // Obtém o primeiro arquivo

    if (!file||file==undefined){
      setProdutosECodigos([]);
      setProdutosEncontrados([]);
      return;
    } 

    const fileExtension = file.name.split(".").pop();

    if (fileExtension === "xlsx" || fileExtension === "xls") {
      // Processar arquivo Excel
      const reader = new FileReader();
      reader.onload = (e) => {
        const binaryStr = e.target?.result;
        if (typeof binaryStr === "string") {
          const workbook = XLSX.read(binaryStr, { type: "binary" });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json<DataRow>(worksheet);

          // Verificando os dados extraídos do arquivo Excel
          console.log("Dados extraídos do Excel:", jsonData);

          // Criar um array de objetos {produto, codigo}
          const produtosECodigos = jsonData
            .map((row) => ({
              produto: row["produto"] as string,
              codigo: row["codigo"] as string,
              status: row["status"] as string,
              categoria: row["categoria"] as string,
            }))
            .filter((item) => item.produto && item.codigo && item.status && item.categoria);  // Filtra itens com valores válidos

          console.log("Produtos e Códigos extraídos:", produtosECodigos);
          setProdutosECodigos(produtosECodigos);

          // Chama a função para verificar os produtos no DB
          SearchProdutos(produtosECodigos);
        }
      };
      reader.readAsBinaryString(file);
    } else if (fileExtension === "csv") {
      // Processar arquivo CSV
      Papa.parse<DataRow>(file, {
        header: true,
        complete: (results) => {
          // Verificando os dados extraídos do arquivo CSV
          console.log("Dados extraídos do CSV:", results.data);

          // Criar um array de objetos {produto, codigo}
          const produtosECodigos = results.data
            .map((row) => ({
              produto: row["produto"] as string,
              codigo: row["codigo"] as string,
              status: row["status"] as string,
              categoria: row["categoria"] as string,
            }))
            .filter((item) => item.produto && item.codigo && item.status && item.categoria); // Filtra itens com valores válidos

          console.log("Produtos e Códigos extraídos:", produtosECodigos);
          setProdutosECodigos(produtosECodigos);

          // Chama a função para verificar os produtos no DB
          SearchProdutos(produtosECodigos);
        },
      });
    } else {
      alert("Por favor, faça upload de um arquivo Excel (.xlsx, .xls) ou CSV (.csv).");
    }
  };
  useEffect(()=>{
    handleFileChange();
  },[isArchive])

  async function SearchProdutos(produtos: ProdutoCodigo[]) {
    try {
      // Busca os produtos na tabela 'produtos'
      const { data, error } = await supabase.from("produtos").select("*");
      console.log(data);
  
      if (error) {
        throw error;
      }
  
      // Filtra e atualiza somente os produtos encontrados no DB
      const produtosAtualizados = produtos.map((produto) => {
        const produtoEncontrado = data.find(
          (item: any) =>
            item.nome.replaceAll(" ", "").toLowerCase() ===
              produto.produto.replaceAll(" ", "").toLowerCase() &&
            item.categoria.replaceAll(" ", "").toLowerCase() ===
              produto.categoria.replaceAll(" ", "").toLowerCase()
        );
  
        if (produtoEncontrado) {
          return {
            ...produto,
            id: produtoEncontrado.id
          };
        }
        return undefined;
      });
  
      // Filtra os produtos que foram encontrados
      const produtosFiltrados = produtosAtualizados.filter((item) => item !== undefined);
  
      // Atualiza o estado com os produtos encontrados
      setProdutosEncontrados(produtosFiltrados as ProdutoCodigo[]);
  
      console.log("Produtos e Códigos após verificação 1*:", produtosFiltrados);
  
      // Verifica se algum código de produto já existe na tabela 'codigos'
      const { data: data2, error: error2 } = await supabase.from("codigos").select("*");
      console.log(data2);
  
      if (error2) {
        throw error2;
      }
  
      // Filtra os produtos para verificar se o código já existe
      const produtosAtualizados2 = produtosFiltrados.filter((produto) => {
        const codigoEncontrado = data2.find(
          (item: any) =>
            item.codigo === produto.codigo // Assume que "codigo" é o campo que relaciona com os produtos
        );
        console.log("TESTE", codigoEncontrado);
  
      window.alert(`Veja os códigos já existentes:${JSON.stringify(codigoEncontrado,null,2)}`)
        return !codigoEncontrado;
      });
  
      // Atualiza o estado com os produtos encontrados sem código
      setProdutosEncontrados(produtosAtualizados2 as ProdutoCodigo[]);
  
      console.log("Produtos e Códigos após verificação 2*:", produtosAtualizados2);
  
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  }
  
  
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const isDesktop = !useIsMobile();
  const [edit, setEdit] = useState(false);


  function handlerInput(e: any, index: number, field: string) {
    const updatedValue = field === "status" ? e : e.target.value; // For Select, we directly use `e`
  
    setProdutosEncontrados((prevProdutos) => {
      const updatedProdutos = [...prevProdutos];
      updatedProdutos[index] = {
        ...updatedProdutos[index],
        [field]: updatedValue,
      };
      return updatedProdutos;
    });
  };
  const handleConfirmCreate = async (index: number) => {
    const dataFormatted: CodigosProps = {
      id_codigo: v4(),
      id_produto: produtosEncontrados[index].id!,
      codigo: produtosEncontrados[index].codigo,
      status: produtosEncontrados[index].status
    }
    const { error } = await supabase.from("codigos").insert(dataFormatted);
    if (error) {
      console.error("Erro ao criar codigo:", error);
      console.log(dataFormatted);
    
    } else {
      console.log("codigo criado com sucesso");
      setProdutosEncontrados((prevProdutos) => {
        return prevProdutos.filter((_, i) => i !== index); // Remove o produto pelo índice
    });
    }

   
  };
  const handleMassCreate = async () => {
    // Prepare the data for bulk insert
    const dataFormatted = produtosEncontrados.map(produto => ({
      id_codigo: v4(),
      id_produto: produto.id,
      codigo: produto.codigo,
      status: produto.status,
    }));
  
    // Insert the data in bulk into the "codigos" table using Supabase
    const { error } = await supabase.from("codigos").insert(dataFormatted);
  
    if (error) {
      console.error("Erro ao criar códigos em massa:", error);
      window.alert("ERRO AO CRIAR CÓDIGOS EM MASSA!!");
    } else {
      console.log("Códigos criados com sucesso em massa!");
  
      // Remove successfully uploaded produtos from produtosEncontrados
      setProdutosEncontrados((prevProdutos) => {
        // Assuming we want to clear out the successfully uploaded products
        return [];
      });
  
      window.alert("CÓDIGOS CRIADOS COM SUCESSO EM MASSA!!");
    }
  };
  const handleDelete=(index:number)=>{
    setProdutosEncontrados((prevProdutos) => {
      return prevProdutos.filter((_, i) => i !== index); // Remove o produto pelo índice
  });
  };
  const [isMass,setMass]=useState(true);

  useEffect(()=>{
   if(produtosEncontrados.length>0){setMass(false)}else{
    setMass(true)
   };
  },[produtosEncontrados]);

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
        }}
      >
        <DialogTrigger asChild>
          <Button>Importar Planilha <Sheet></Sheet></Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Criar Novo Produto</DialogTitle>
            <DialogDescription>
              Preencha as informações do novo produto abaixo.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-2 items-center mt-4">
            
          <Input 
  type="file" 
  id="input-id" 
  value={isArchive ? isArchive.target.value : ""} // Aqui, você pode controlar o valor do input a partir do estado
  onChange={setArchive} 
/>

<Button 
  onClick={() => { 
    setArchive(undefined);  // Limpa o estado relacionado ao arquivo
    setProdutosECodigos([]); // Limpa os produtos e códigos
    setProdutosEncontrados([]); // Limpa os produtos encontrados
    // Não é necessário manipular diretamente o valor do input aqui. O estado React já cuidará disso
  }}
>
  <Eraser />
</Button>
 </div>
          <Console produtosECodigos={produtosECodigos} produtosEncontrados={produtosEncontrados} />
          <div className="flex flex-col space-y-4 max-h-[200px] overflow-y-auto">
            {produtosEncontrados.map((produto, index) => (
              <div key={index} className="flex flex-col border p-4 rounded-md space-y-2">
                <h2>Nome do produto: {produto.produto}</h2>
                <p>Categoria: {produto.categoria}</p>
                <p>Código:</p>
                <Input
                  placeholder="Código do Produto"
                  value={produto.codigo}
                  disabled={!edit}
                  onChange={(e) => handlerInput(e, index, 'codigo')}
                />
                <p>Status:</p>
                <Select
                  onValueChange={(e) => handlerInput(e, index, 'status')}
                  value={produto.status}
                  disabled={!edit}
                >
                  <SelectTrigger >
                    <SelectValue placeholder="Selecione um status" />
                  </SelectTrigger>
                  <SelectContent>

                    <SelectItem value="Ativo" >
                      Ativo
                    </SelectItem>
                    <SelectItem value="Inativo" >
                      Inativo
                    </SelectItem>
                    <SelectItem value="Resgatado" >
                      Resgatado
                    </SelectItem>

                  </SelectContent>
                </Select>
                <div className="flex gap-2 w-full">
                  <Button onClick={() => handleConfirmCreate(index)} variant={"sucess"} className="w-1/3 hover:w-full transition-all duration-500">
                    <MoveRight />
                  </Button>
                  <Button onClick={() => setEdit(!edit)} className="w-1/3 hover:w-full transition-all duration-500">
                    <Edit />
                  </Button>
                  <Button onClick={()=> handleDelete(index)} variant={"destructive"} className="w-full hover:w-full transition-all duration-500">
                    <Trash />
                  </Button>
                </div>
              </div>
            ))}
   

          </div>
       <Button disabled={isMass} onClick={()=>handleMassCreate()} variant="sucess" className="w-full hover:w-full transition-all duration-500">
  Enviar em Massa
</Button>
        </DialogContent>
      </Dialog>
    </>
  )
};
interface ConsoleProps {
  produtosECodigos: any[]; // Substitua 'any' pelo tipo correto se necessário
  produtosEncontrados: any[]; // Substitua 'any' pelo tipo correto se necessário

}

const Console: React.FC<ConsoleProps> = ({ produtosECodigos, produtosEncontrados }) => {
  const [openConsole, setOpenConsole] = useState(false);
  return (
    <Dialog open={openConsole}
      onOpenChange={(isOpen) => {
        setOpenConsole(isOpen);
      }}>
      <DialogTrigger asChild>
        <Button>Ver Console</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Console de Produtos</DialogTitle>
          <DialogDescription>
            Visualize os produtos de entrada e saída.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col">
          <div className="w-full bg-gray-700 text-white p-2 rounded-t-md">
            <h2>Entrada:</h2>
          </div>
          <div className="w-full max-h-[200px] overflow-y-auto bg-yellow-200 rounded-lg rounded-t-none border border-gray-600">
            <pre>{JSON.stringify(produtosECodigos, null, 2)}</pre>
          </div>
        </div>
        <div className="flex flex-col">
          <div className="w-full bg-gray-700 text-white p-2 rounded-t-md">
            <h2>Saída:</h2>
          </div>
          <div className="w-full max-h-[200px] overflow-y-auto bg-green-200 rounded-md">
            <pre>{JSON.stringify(produtosEncontrados, null, 2)}</pre>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};



export default FileUpload;
