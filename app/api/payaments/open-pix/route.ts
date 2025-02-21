import { randomUUID } from "crypto";

export async function POST(req: any, res: any) {

  const { productID } = req;

  const response = await fetch(
    "https://api.openpix.com.br/api/v1/charge?return_existing=true",
    {
      method: "POST",
      headers: {
        Authorization: `${process.env.OPENPIX_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        correlationID: `${randomUUID()}`,
        value: 100,
        comment: "ADIÇÃO DE SALDOS - NEXT",
        additionalInfo: [
          { key: "UserID", value: '' },
          { key: "Product", value: "Saldo" },
          { key: "Invoice", value: `${new Date().getTime()}` },
          {key:"Origin", value:"bot"}
        ],
        payer: {
          name: ``,
          email: "",
          phone: "",
          correlationID: "",
        },
      }),
    }
  );
}