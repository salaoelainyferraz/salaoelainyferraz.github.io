/**
 * CONFIGURAÇÃO DO SITE
 * ------------------------------------------------------------------
 * API_URL: cole aqui a URL do App da Web do Apps Script (termina em /exec).
 * Enquanto estiver vazia, o site roda em MODO DEMONSTRAÇÃO (dados de exemplo,
 * nada é gravado de verdade).
 *
 * O resto (serviços, preços, horários, profissionais...) vem da planilha.
 * Os valores abaixo só aparecem no modo demonstração ou se a planilha estiver fora do ar.
 */
window.SALAO = {
  API_URL: 'https://script.google.com/macros/s/AKfycbzOps3hOYQi9Qv3mQW0KQ3PFB1K6skpernm4XKzFrNX4_6YL_G6y3M1G_xMLgXJ59DXQA/exec',

  fallback: {
    cfg: {
      nome: 'Salão de Beleza Elainy Ferraz',
      whatsapp: '77999727445',
      endereco: 'Rua Siqueira Campos, 1025 - Candeias, Vitória da Conquista - BA, 45028-010',
      instagram: 'salao_elainy',
      linkAvaliacao: '',
      linkMapa: 'https://www.google.com/maps/place/Sal%C3%A3o+de+Beleza+Elainy+Ferraz/@-14.8612509,-40.8343632,17z/data=!3m1!4b1!4m6!3m5!1s0x7463baacccc0283:0xfa2bc5099214b313!8m2!3d-14.8612554!4d-40.8321303!16s%2Fg%2F1ptwvl287',
      antecedenciaHoras: 2,
      diasAFrente: 30,
      passoMin: 30,
      prazoAlteracaoHoras: 5,
    },
    servicos: [
      { id: 'corte-feminino', categoria: 'Cabelo', nome: 'Corte feminino', descricao: 'Corte com lavagem e finalização', duracao: 60, preco: 60, aPartirDe: false },
      { id: 'escova', categoria: 'Cabelo', nome: 'Escova', descricao: 'Lavagem e escova modelada', duracao: 45, preco: 40, aPartirDe: true },
      { id: 'penteado-para-festas-e-eventos', categoria: 'Cabelo', nome: 'Penteado para festas e eventos', descricao: 'Casamentos, formaturas e festas', duracao: 60, preco: 120, aPartirDe: true },
      { id: 'coloracao', categoria: 'Cabelo', nome: 'Coloração', descricao: 'Cor uniforme da raiz às pontas', duracao: 120, preco: 120, aPartirDe: true },
      { id: 'tonalizacao', categoria: 'Cabelo', nome: 'Tonalização', descricao: 'Realce e correção de tom', duracao: 60, preco: 80, aPartirDe: true },
      { id: 'luzes', categoria: 'Cabelo', nome: 'Luzes', descricao: 'Iluminado personalizado', duracao: 180, preco: 250, aPartirDe: true },
      { id: 'mechas', categoria: 'Cabelo', nome: 'Mechas', descricao: 'Mechas com acabamento natural', duracao: 180, preco: 250, aPartirDe: true },
      { id: 'tratamento-capilar', categoria: 'Cabelo', nome: 'Tratamento capilar', descricao: 'Hidratação e nutrição dos fios', duracao: 60, preco: 70, aPartirDe: true },
      { id: 'reconstrucao-capilar', categoria: 'Cabelo', nome: 'Reconstrução capilar', descricao: 'Recupera fios danificados', duracao: 90, preco: 100, aPartirDe: true },
      { id: 'manicure', categoria: 'Unhas', nome: 'Manicure', descricao: 'Cutilagem e esmaltação', duracao: 45, preco: 25, aPartirDe: false },
      { id: 'pedicure', categoria: 'Unhas', nome: 'Pedicure', descricao: 'Cutilagem e esmaltação', duracao: 45, preco: 30, aPartirDe: false },
      { id: 'manicure-e-pedicure', categoria: 'Unhas', nome: 'Manicure e pedicure', descricao: 'Pé e mão completos', duracao: 90, preco: 50, aPartirDe: false },
    ],
    // Demonstração: a manicure "Ana" é um EXEMPLO para mostrar a escala funcionando.
    profissionais: [
      { id: 'elainy', nome: 'Elainy', categorias: ['Cabelo'], foto: '' },
      { id: 'ana', nome: 'Ana (exemplo)', categorias: ['Unhas'], foto: '' },
    ],
    escalasDemo: {
      // dia da semana -> {profId: [[iniMin, fimMin]]}; Ana só terça e quinta à tarde e sábado de manhã
      ana: { 2: [[780, 1080]], 4: [[780, 1080]], 6: [[480, 840]] },
    },
    horarios: {
      0: null,
      1: null,
      2: { abre: '08:00', fecha: '18:00', pausaIni: '12:00', pausaFim: '13:00' },
      3: { abre: '08:00', fecha: '18:00', pausaIni: '12:00', pausaFim: '13:00' },
      4: { abre: '08:00', fecha: '18:00', pausaIni: '12:00', pausaFim: '13:00' },
      5: { abre: '08:00', fecha: '18:00', pausaIni: '12:00', pausaFim: '13:00' },
      6: { abre: '08:00', fecha: '14:00', pausaIni: '', pausaFim: '' },
    },
  },
};
