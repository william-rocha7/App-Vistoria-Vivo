# App de Vistoria da Vivo (v2.0.0)

Projeto do PWA (Progressive Web App) de Vistoria da Vivo, desenvolvido para otimizar e padronizar o trabalho dos técnicos em campo.

## Funcionalidades

- Formulário para Vistoria de Acesso
- Formulário para Vistoria de Rede Externa
- Navegação em múltiplos passos
- Validação de campos em tempo real
- Suporte offline através de Service Worker

## Tecnologias Utilizadas

- HTML5
- CSS3
- JavaScript (Puro)
- Google Apps Script

---

## 📈 Avaliação e Status do Projeto (v2.0.0)

Esta seção documenta a qualidade técnica atual do aplicativo e os próximos passos estratégicos. A avaliação foi realizada utilizando o Google Lighthouse em 20/09/2025.

### 📊 Pontuação Lighthouse (Mobile)

| Categoria | Pontuação |
| :--- | :---: |
| 🚀 **Performance** | 88/100 |
| ♿ **Acessibilidade** | 95/100 |
| ✨ **Boas Práticas** | 71/100 |
| 🔎 **SEO** | 54/100 |
| 📱 **Progressive Web App**| (não avaliado) |

### ✅ Pontos Fortes

* **Excelente Acessibilidade (Nota 95):** O aplicativo oferece uma ótima base para ser utilizado por todos, incluindo pessoas com deficiências.
* **Boa Performance (Nota 88):** O app já é rápido, garantindo uma boa experiência de carregamento para os técnicos em campo.
* **Segurança:** O uso de HTTPS está corretamente implementado, protegendo a comunicação.

### 🎯 Oportunidades de Melhoria e Próximos Passos

Com base no relatório, os próximos focos de desenvolvimento serão:

1.  **Otimização para Dispositivos Móveis (Crítico):**
    * **Ação:** Adicionar a tag `<meta name="viewport">` ao HTML.
    * **Impacto:** Isso é fundamental para que o aplicativo se adapte corretamente a telas de celulares e melhora a experiência do usuário.

2.  **Melhorar Tempo de Resposta do Servidor (Performance):**
    * **Ação:** Otimizar o backend no Google Apps Script para reduzir o tempo de resposta inicial, que está em 1.6 segundos.
    * **Impacto:** Diminuir esse tempo acelera drasticamente o primeiro carregamento do app.

3.  **Melhorar SEO (Visibilidade):**
    * **Ação:** Permitir a indexação no `robots.txt` (caso o app deva ser público) e adicionar uma meta descrição.
    * **Impacto:** Facilita que o aplicativo seja encontrado por mecanismos de busca.

4.  **Ajustes de Acessibilidade:**
    * **Ação:** Adicionar o atributo `lang="pt-BR"` na tag `<html>` para indicar o idioma principal da página.
    * **Impacto:** Ajuda leitores de tela a pronunciar o conteúdo corretamente.

---