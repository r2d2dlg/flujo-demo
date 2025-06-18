import {
  Box,
  Heading,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import DataTable from "../components/DataTable";
import { Column } from "react-table";

interface EstadoCuentaViewData {
  id: number;
  proveedor: string;
  n_de_factura: string;
  fecha_de_factura: string;
  fecha_de_vencimiento: string;
  dias_de_vencimiento: number;
  monto_de_factura: number;
  total: number;
}

interface SaldoFavorData {
  id: number;
  proveedor: string;
  saldo_a_favor: number;
}

const VistaProveedoresPage = () => {
  const [estadoCuentaData, setEstadoCuentaData] = useState<
    EstadoCuentaViewData[]
  >([]);
  const [saldoFavorData, setSaldoFavorData] = useState<SaldoFavorData[]>([]);

  useEffect(() => {
    fetch("/api/estado-cuenta-proveedores/view")
      .then((res) => res.json())
      .then((data) => setEstadoCuentaData(data));

    fetch("/api/saldo-proveedores")
      .then((res) => res.json())
      .then((data) => setSaldoFavorData(data));
  }, []);

  const estadoCuentaColumns: Column<EstadoCuentaViewData>[] = React.useMemo(
    () => [
      { Header: "Proveedor", accessor: "proveedor" },
      { Header: "N° de Factura", accessor: "n_de_factura" },
      { Header: "Fecha de Factura", accessor: "fecha_de_factura" },
      { Header: "Fecha de Vencimiento", accessor: "fecha_de_vencimiento" },
      { Header: "Dias de Vencimiento", accessor: "dias_de_vencimiento" },
      { Header: "Monto de Factura", accessor: "monto_de_factura" },
      { Header: "Total", accessor: "total" },
    ],
    []
  );

  const saldoFavorColumns: Column<SaldoFavorData>[] = React.useMemo(
    () => [
      { Header: "Proveedor", accessor: "proveedor" },
      { Header: "Saldo a Favor", accessor: "saldo_a_favor" },
    ],
    []
  );

  return (
    <Box>
      <Heading>Vista Proveedores</Heading>
      <Tabs>
        <TabList>
          <Tab>Estado de Cuenta</Tab>
          <Tab>Saldo a Favor</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <DataTable
              columns={estadoCuentaColumns}
              data={estadoCuentaData}
              isReadOnly={true}
            />
          </TabPanel>
          <TabPanel>
            <DataTable
              columns={saldoFavorColumns}
              data={saldoFavorData}
              isReadOnly={true}
            />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default VistaProveedoresPage; 