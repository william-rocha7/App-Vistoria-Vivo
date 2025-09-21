// ---------- CONFIGURAÇÕES GLOBAIS ----------
// Carrega as configurações das Propriedades do Script para evitar chamadas repetidas.
const SCRIPT_PROPS = PropertiesService.getScriptProperties();

const PLANILHA_ID = {
  EXTERNA: SCRIPT_PROPS.getProperty('PLANILHA_ID_EXTERNA'),
  ACESSO: SCRIPT_PROPS.getProperty('PLANILHA_ID_ACESSO'),
};

const PASTA_RAIZ_ID = {
  EXTERNA: SCRIPT_PROPS.getProperty('PASTA_RAIZ_ID_EXTERNA'),
  ACESSO: SCRIPT_PROPS.getProperty('PASTA_RAIZ_ID_ACESSO'),
};

const FUSO_HORARIO = SCRIPT_PROPS.getProperty('FUSO_HORARIO');

// Mapeamento de formulários para processamento
const FORM_PROCESSORS = {
  vistoriaExterna: {
    planilhaId: PLANILHA_ID.EXTERNA,
    pastaRaizId: PASTA_RAIZ_ID.EXTERNA,
    validate: (data) => {
      if (!data.latitude || !data.longitude) throw new Error("Localização obrigatória não informada.");
      if (!data.gestor || !data.nomeTecnico) throw new Error("Gestor e Técnico são obrigatórios.");
    },
    process: (data) => {
      const { gestor, nomeTecnico } = data;
      const hoje = Utilities.formatDate(new Date(), FUSO_HORARIO, "yyyy-MM-dd");
      const root = DriveApp.getFolderById(PASTA_RAIZ_ID.EXTERNA);
      const pastaGest = obterOuCriarPasta(root, gestor);
      const pastaTec = obterOuCriarPasta(pastaGest, nomeTecnico);
      const pastaData = obterOuCriarPasta(pastaTec, hoje);
      return pastaData;
    },
    buildRow: (data, urls) => {
      const formatCoord = (coord) => {
        if (!coord || typeof coord !== 'string') return "null";
        return coord.replace('.', ',');
      };

      return [
        Utilities.formatDate(new Date(), FUSO_HORARIO, "yyyy-MM-dd"),
        Utilities.formatDate(new Date(), FUSO_HORARIO, "HH:mm:ss"),
        data.pontaA || "null",
        data.pontaB || "null",
        data.gestor || "null",
        data.nomeTecnico || "null",
        data.tipoDesvio || "null",
        data.subDesvio || "null",
        data.detalheDegradacao || "null",
        data.redeMetalica || "null",
        formatCoord(data.latitude),
        formatCoord(data.longitude),
        data.endereco || "null",
        data.observacaoOutroDesvio || "null",
        urls.join(", ") || "null",
      ];
    },
  },
  vistoriaAcesso: {
    planilhaId: PLANILHA_ID.ACESSO,
    pastaRaizId: PASTA_RAIZ_ID.ACESSO,
    validate: (data) => {
      if (!data.cidade || !data.site) throw new Error("Cidade e Site são obrigatórios.");
    },
    process: (data) => {
      const { cidade, site } = data;
      const root = DriveApp.getFolderById(PASTA_RAIZ_ID.ACESSO);
      const pastaCidade = obterOuCriarPasta(root, cidade);
      const pastaSite = obterOuCriarPasta(pastaCidade, site);
      return pastaSite;
    },
    buildRow: (data, urls) => [
        Utilities.formatDate(new Date(), FUSO_HORARIO, "yyyy-MM-dd"),
        Utilities.formatDate(new Date(), FUSO_HORARIO, "HH:mm:ss"),
        data.cidade, data.site, data.topologia || "", data.qtdCabos || "", data.lt1 || "",
        data.capacidade1 || "", data.lt2 || "", data.capacidade2 || "", data.lt3 || "",
        data.capacidade3 || "", data.modoSaida || "", data.subOpcoesSaida || "", data.caminhoCabos1 || "",
        data.caminhoCabos2 || "", data.caminhoCabos3 || "", urls.join(", "),
      ],
  },
};

/**
 * Função principal que serve a aplicação web.
 */
function doGet(e) {
  const page = e.parameter.page;
  const path = e.parameter.path;

  if (path) {
    let output;
    let mimeType;

    switch (path) {
      case "manifest.json":
        const manifestTemplate = HtmlService.createTemplateFromFile('manifest.json.html');
        manifestTemplate.webAppUrl = getWebAppUrl();
        output = manifestTemplate.evaluate().getContent();
        mimeType = ContentService.MimeType.JSON;
        break;
      case "icon.svg":
        output = HtmlService.createHtmlOutputFromFile('icon.svg.html').getContent();
        mimeType = ContentService.MimeType.SVG;
        break;
      case "serviceworker.js":
        const swTemplate = HtmlService.createTemplateFromFile('serviceworker.js.html');
        swTemplate.webAppUrl = getWebAppUrl();
        output = swTemplate.evaluate().getContent();
        mimeType = ContentService.MimeType.JAVASCRIPT;
        break;
      default:
        return HtmlService.createHtmlOutput("Recurso não encontrado.");
    }
    
    const textOutput = ContentService.createTextOutput(output).setMimeType(mimeType);
    textOutput.setHeader('Access-Control-Allow-Origin', '*');
    textOutput.setHeader('X-Content-Type-Options', 'nosniff');
    return textOutput;
  }

  const pageName = page ? page.replace(".html", "") : "index";
  const template = HtmlService.createTemplateFromFile(pageName);
  template.webAppUrl = getWebAppUrl(); 

  return template.evaluate()
    .setTitle("Vistoria Técnica")
    .setSandboxMode(HtmlService.SandboxMode.IFRAME)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Função principal chamada pelo front-end para salvar os dados da vistoria.
 */
function salvarVistoria(formData) {
  try {
    const processor = FORM_PROCESSORS[formData.formType];
    if (!processor) throw new Error("Tipo de formulário desconhecido: " + formData.formType);
    
    processor.validate(formData);
    const pastaDestino = processor.process(formData);
    const urlsImgs = salvarImagens(pastaDestino, formData);
    const rowData = processor.buildRow(formData, urlsImgs);

    const sheet = SpreadsheetApp.openById(processor.planilhaId).getSheetByName(formData.formType);
    if (!sheet) throw new Error(`A aba "${formData.formType}" não foi encontrada.`);
    
    sheet.appendRow(rowData);
    return { status: "OK", message: "Vistoria salva com sucesso." };
  } catch (error) {
    Logger.log(`ERRO em salvarVistoria: ${error.toString()} Stack: ${error.stack}`);
    throw new Error("Falha ao salvar: " + error.message);
  }
}

// ---------- FUNÇÕES AUXILIARES ----------
function salvarImagens(pastaPai, formData) {
  const arquivos = formData.arquivos;
  if (!arquivos || arquivos.length === 0) return [];
  const urlsImgs = [];

  if (formData.formType === 'vistoriaExterna') {
    const hoje = Utilities.formatDate(new Date(), FUSO_HORARIO, "yyyy-MM-dd");
    const baseName = [
      hoje,
      formData.pontaA || '',
      formData.pontaB || '',
      formData.cluster || '',
      formData.nomeTecnico || ''
    ].join('_').replace(/[^a-zA-Z0-9_.-]/g, '');

    arquivos.forEach((arquivo, index) => {
      const extensao = arquivo.filename.split('.').pop() || 'jpg';
      const novoNome = `${baseName}_${index + 1}.${extensao}`;
      const blob = Utilities.newBlob(Utilities.base64Decode(arquivo.base64), arquivo.mimeType, novoNome);
      const arquivoSalvo = pastaPai.createFile(blob);
      urlsImgs.push(arquivoSalvo.getUrl());
    });
  } else {
    const pastaImgs = obterOuCriarPasta(pastaPai, "evidencias");
    arquivos.forEach((arquivo) => {
      const blob = Utilities.newBlob(Utilities.base64Decode(arquivo.base64), arquivo.mimeType, arquivo.filename);
      const arquivoSalvo = pastaImgs.createFile(blob);
      urlsImgs.push(arquivoSalvo.getUrl());
    });
  }
  return urlsImgs;
}

function obterOuCriarPasta(parent, nome) {
  const it = parent.getFoldersByName(nome);
  return it.hasNext() ? it.next() : parent.createFolder(nome);
}

function getWebAppUrl() {
  return ScriptApp.getService().getUrl();
}