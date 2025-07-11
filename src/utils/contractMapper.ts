export const mapContractTypeToSinistre = (contractType: string): "auto" | "habitation" | "sante" | "autre" => {
  const mapping: Record<string, "auto" | "habitation" | "sante" | "autre"> = {
    'auto': 'auto',
    'habitation': 'habitation',
    'sante': 'sante',
    'prevoyance': 'autre',
    'vie': 'autre',
    'responsabilite': 'autre',
    'autre': 'autre'
  };
  return mapping[contractType] || 'autre';
};