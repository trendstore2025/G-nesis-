const typingForm = document.querySelector(".typing-form");
const chatContainer = document.querySelector(".chat-list");
const sugestoess = document.querySelectorAll(".sugestoes");
const toggleThemeButton = document.querySelector("#theme-toggle-button");
const deleteChatButton = document.querySelector("#delete-chat-button");

// Variáveis de estado
let userMessage = null;
let isResponseGenerating = false;
let hasShownInstagram = false; // Controla a exibição do Instagram apenas na primeira resposta

// Configurações da API
const API_KEY = "AIzaSyA3ZM0wyKUnUoJYjyuf0BrG5fgo0qY8To0";
const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEY}`;

// Parte para lembrar do modo escuro e conversas anteriores
const loadDataFromLocalstorage = () => {
  const savedChats = localStorage.getItem("saved-chats");
  const isLightMode = (localStorage.getItem("themeColor") === "light_mode");

  document.body.classList.toggle("light_mode", isLightMode);
  toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";

  chatContainer.innerHTML = savedChats || '';
  document.body.classList.toggle("hide-header", savedChats);

  chatContainer.scrollTo(0, chatContainer.scrollHeight);
};

// Cria um novo elemento de mensagem e retorna-o
const createMessageElement = (content, ...classes) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
};

// Substitui texto e insere HTML, incluindo link clicável
const showTypingEffect = (text, textElement, incomingMessageDiv) => {
  const modifiedText = text
    .replace(/Gemini/gi, "Gênesis")
    .replace(/(@hiago_osmario_ofc)/gi, '<a href="https://www.instagram.com/hiago_osmario_ofc" target="_blank">$1</a>'); // Tornando o Instagram clicável

  textElement.innerHTML = modifiedText;
  incomingMessageDiv.querySelector(".icon").classList.remove("hide");
  incomingMessageDiv.classList.remove("loading");
  localStorage.setItem("saved-chats", chatContainer.innerHTML);

  chatContainer.scrollTo(0, chatContainer.scrollHeight);
  isResponseGenerating = false;
};

// Respostas sobre Hiago
const getHiagoResponse = () => {
  const hiagoResponses = [
    "Hiago não me deixa falar muito sobre ele, ele é bem fechado sobre sua vida pessoal.",
    "Hiago prefere manter sua privacidade, mas posso dizer que ele é bem esforçado e sempre busca evoluir.",
    "Desculpe, Hiago me pediu para não compartilhar muitos detalhes sobre sua vida pessoal, mas ele é uma pessoa muito dedicada.",
    "Se você quer conhecer mais sobre Hiago, ele tem um Instagram muito legal! Você pode encontrá-lo lá: @hiago_osmario_ofc."
  ];
  return hiagoResponses[Math.floor(Math.random() * hiagoResponses.length)];
};

// Respostas personalizadas para o criador
const getCustomResponse = (userMessage) => {
  // Resposta para qualquer variação de pergunta sobre quem fez o chatbot
  if (/hiago.*fez.*(você|bot|assistente|chatbot|programou|desenvolveu)/i.test(userMessage)) {
    return "Sim, fui feito pelo Hiago Osmário.";
  }

  // Resposta para quem criou o chat
  if (/quem.*(criou|fez|desenvolveu|programou|é o responsável)/i.test(userMessage)) {
    return "Eu fui criado diretamente pelo Hiago Osmário. Para mais informações, você pode segui-lo no Instagram: @hiago_osmario_ofc.";
  }

  // Perguntas sobre Hiago
  if (/(quem.*é.*hiago|quem.*fez)/i.test(userMessage)) {
    return getHiagoResponse();
  }

  return null;
};

// Obtém resposta da API com base na mensagem do usuário
const generateAPIResponse = async (incomingMessageDiv) => {
  const textElement = incomingMessageDiv.querySelector(".text");

  const customResponse = getCustomResponse(userMessage);
  if (customResponse) {
    showTypingEffect(customResponse, textElement, incomingMessageDiv);
    return;
  }

  // Mostrar o Instagram de Hiago na primeira resposta
  if (!hasShownInstagram) {
    hasShownInstagram = true;
    const instagramResponse = "Quer saber mais sobre Hiago? Você pode encontrá-lo no Instagram: @hiago_osmario_ofc.";
    showTypingEffect(instagramResponse, textElement, incomingMessageDiv);
    return;
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        contents: [{ 
          role: "user", 
          parts: [{ text: userMessage }] 
        }] 
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error.message);

    const apiResponse = data?.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g, '$1');
    showTypingEffect(apiResponse, textElement, incomingMessageDiv);
  } catch (error) {
    isResponseGenerating = false;
    textElement.innerText = error.message;
    textElement.parentElement.closest(".message").classList.add("error");
  } finally {
    incomingMessageDiv.classList.remove("loading");
  }
};

// Mostra uma animação de carregamento enquanto aguarda a resposta da API
const showLoadingAnimation = () => {
  const html = `<div class="message-content">
                  <img class="avatar" src="img/genesis.png" alt="Avatar do Gênesis">
                  <p class="text"></p>
                  <div class="loading-indicator">
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                  </div>
                </div>
                <span onClick="copyMessage(this)" class="icon material-symbols-rounded">content_copy</span>`;

  const incomingMessageDiv = createMessageElement(html, "incoming", "loading");
  chatContainer.appendChild(incomingMessageDiv);

  chatContainer.scrollTo(0, chatContainer.scrollHeight);
  generateAPIResponse(incomingMessageDiv);
};

// Copia o texto da mensagem para a área de transferência
const copyMessage = (copyButton) => {
  const messageText = copyButton.parentElement.querySelector(".text").innerText;

  navigator.clipboard.writeText(messageText);
  copyButton.innerText = "done";
  setTimeout(() => copyButton.innerText = "content_copy", 1000);
};

// Lida com o envio de mensagens de bate-papo de saída
const handleOutgoingChat = () => {
  userMessage = typingForm.querySelector(".typing-input").value.trim() || userMessage;
  if (!userMessage || isResponseGenerating) return;

  isResponseGenerating = true;

  const html = `<div class="message-content">
                  <img class="avatar" src="img/usuario.png" alt="Avatar do usuário">
                  <p class="text"></p>
                </div>`;

  const outgoingMessageDiv = createMessageElement(html, "outgoing");
  outgoingMessageDiv.querySelector(".text").innerText = userMessage;
  chatContainer.appendChild(outgoingMessageDiv);
  
  typingForm.reset();
  document.body.classList.add("hide-header");
  chatContainer.scrollTo(0, chatContainer.scrollHeight);
  setTimeout(showLoadingAnimation, 500);
};

// Alternar entre temas claros e escuros
toggleThemeButton.addEventListener("click", () => {
  const isLightMode = document.body.classList.toggle("light_mode");
  localStorage.setItem("themeColor", isLightMode ? "light_mode" : "dark_mode");
  toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";
});

// Exclui todos os chats do armazenamento local quando o botão for clicado
deleteChatButton.addEventListener("click", () => {
  if (confirm("Tem certeza de que deseja excluir todos os chats?")) {
    localStorage.removeItem("saved-chats");
    loadDataFromLocalstorage();
  }
});

// Define userMessage e gerencia o bate-papo de saída quando uma sugestão for clicada
sugestoess.forEach(sugestoes => {
  sugestoes.addEventListener("click", () => {
    userMessage = sugestoes.querySelector(".text").innerText;
    handleOutgoingChat();
  });
});

// Impede o envio de formulário padrão e gerencia o bate-papo de saída
typingForm.addEventListener("submit", (e) => {
  e.preventDefault(); 
  handleOutgoingChat();
});

loadDataFromLocalstorage();