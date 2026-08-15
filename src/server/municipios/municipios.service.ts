import { Injectable } from '@nestjs/common';
import {
  MUNICIPIOS_REFERENCIA,
  autoDiscoverMunicipality,
  generateApisForMunicipality,
  MunicipioBase,
} from '../../data/municipiosBrasil';
import { AutoDiscoveredMunicipality } from '../../types/saas';

@Injectable()
export class MunicipiosService {
  getAllReferencia(): MunicipioBase[] {
    return MUNICIPIOS_REFERENCIA;
  }

  discoverMunicipality(termoOrIbge: string): AutoDiscoveredMunicipality | null {
    return autoDiscoverMunicipality(termoOrIbge);
  }

  generateDefaultApis(cidade: string, uf: string, codigoIbge: string) {
    return generateApisForMunicipality(cidade, uf, codigoIbge);
  }

  search(termo: string) {
    const termoClean = termo.trim().toLowerCase();
    return MUNICIPIOS_REFERENCIA.filter(
      m =>
        m.cidade.toLowerCase().includes(termoClean) ||
        m.codigoIbge.includes(termoClean) ||
        m.nomePrefeitura.toLowerCase().includes(termoClean) ||
        m.cnpj.includes(termoClean)
    );
  }
}
