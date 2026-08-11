import axios from "axios";

export type CepAddress = {
  erro?: boolean;
  cep?: string;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
};

const cepClient = axios.create({
  baseURL: "https://viacep.com.br/ws",
  timeout: 10_000,
});

export async function lookupAddressByCep(cep: string) {
  const digits = cep.replace(/\D/g, "");
  const { data } = await cepClient.get<CepAddress>(`/${digits}/json/`);
  return data;
}
