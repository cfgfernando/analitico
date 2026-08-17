async function test() {
  const urls = [
    'https://pncp.gov.br/api/consulta/v1/contratos?dataInicial=20240101&dataFinal=20251231&codigoMunicipioIbge=4101804&pagina=1&tamanhoPagina=10',
    'https://pncp.gov.br/api/consulta/v1/contratos?dataInicial=20240101&dataFinal=20251231&cnpjOrgao=76105535000199&pagina=1&tamanhoPagina=10',
    'https://pncp.gov.br/api/pncp/v1/orgaos/76105535000199/contratos/2024'
  ];

  for (const u of urls) {
    try {
      console.log('Fetching:', u);
      const res = await fetch(u, {
        headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' }
      });
      console.log('Status:', res.status);
      if (res.ok) {
        const data = await res.json();
        console.log('Result sample:', JSON.stringify(data).slice(0, 1000));
        return data;
      } else {
        const text = await res.text();
        console.log('Err text:', text.slice(0, 200));
      }
    } catch (e) {
      console.log('Fetch error:', e.message);
    }
  }
}

test().then(() => process.exit(0));
