import Link from "next/link";
import { Button } from "./components/ui/button";


export default function Page() {
  return (
    <div className=" flex flex-col gap-4 text-2xl justify-center items-center min-h-screen">
      <h1>Acesse a dashboard</h1>
      <Link href={"/dashboard"}><Button>Acessa Dashboard</Button></Link>
    </div>
  );
}
