import { db, auth } from "./firebase.js";
import {
  collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot,
  query, orderBy, limit, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import {
  signInWithEmailAndPassword, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

const $ = (selector) => document.querySelector(selector);
const brl = (value) => "R$ " + Number(value || 0).toFixed(2).replace(".", ",");
const loginPanel = $("#login-panel");
const adminContent = $("#admin-content");
const loginMessage = $("#login-message");
const productMessage = $("#product-message");
let stopProducts = null;
let stopOrders = null;
let productsCache = [];

function showMessage(element, message, isError = false) {
  element.textContent = message;
  element.style.color = isError ? "#b4472f" : "#2f6f6a";
}

$("#login-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  showMessage(loginMessage, "Verificando acesso...");
  try {
    await signInWithEmailAndPassword(auth, $("#login-email").value.trim(), $("#login-password").value);
  } catch (error) {
    showMessage(loginMessage, "Não foi possível entrar. Confira e-mail e senha.", true);
    console.error(error);
  }
});

$("#logout-button").addEventListener("click", () => signOut(auth));
$("#btn-refresh").addEventListener("click", () => {
  // A lista é mantida em tempo real pelo listener do Firestore.
  showMessage(productMessage, "Dados sincronizados com o Firestore.");
});

onAuthStateChanged(auth, async (user) => {
  stopProducts?.();
  stopOrders?.();
  stopProducts = null;
  stopOrders = null;

  if (!user) {
    loginPanel.hidden = false;
    adminContent.hidden = true;
    $("#login-password").value = "";
    return;
  }

  try {
    const { getDoc, doc } = await import("https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js");
    const adminSnapshot = await getDoc(doc(db, "administradores", user.uid));
    if (!adminSnapshot.exists() || adminSnapshot.data().ativo !== true) {
      await signOut(auth);
      showMessage(loginMessage, "Esta conta não possui permissão de administrador.", true);
      return;
    }

    loginPanel.hidden = true;
    adminContent.hidden = false;
    $("#admin-identity").textContent = "Conectado: " + (user.email || "administrador");
    startProductsListener();
    startOrdersListener();
  } catch (error) {
    console.error(error);
    await signOut(auth);
    showMessage(loginMessage, "Não foi possível validar as permissões. Confira as regras do Firestore.", true);
  }
});

function startProductsListener() {
  const productsQuery = query(collection(db, "produtos"), orderBy("nome"));
  stopProducts = onSnapshot(productsQuery, (snapshot) => {
    productsCache = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
    renderProducts();
  }, (error) => {
    console.error(error);
    $("#products-list").innerHTML = '<p class="admin-empty">Não foi possível carregar os produtos. Verifique as regras do Firestore.</p>';
  });
}

function renderProducts() {
  const container = $("#products-list");
  if (!productsCache.length) {
    container.innerHTML = '<p class="admin-empty">Nenhum produto cadastrado. Use o formulário acima para adicionar o primeiro.</p>';
    return;
  }

  container.innerHTML = productsCache.map((product) => {
    const image = safeImageUrl(product.imagem);
    const imageHtml = image
      ? '<img src="' + escapeAttribute(image) + '" alt="" loading="lazy">'
      : '<div aria-hidden="true" style="width:64px;height:64px;border-radius:8px;background:#ead6b5;display:grid;place-items:center">🍪</div>';
    return '<article class="product-row">' + imageHtml
      + '<div><strong>' + escapeHtml(product.nome || "Sem nome") + '</strong>'
      + '<small>' + brl(product.preco) + ' · ' + escapeHtml(product.categoria || "Sem categoria")
      + ' · ' + (product.ativo === false ? "Inativo" : "Ativo") + '</small></div>'
      + '<div class="product-actions"><button type="button" data-edit="' + product.id + '">Editar</button>'
      + '<button type="button" data-toggle="' + product.id + '">' + (product.ativo === false ? "Ativar" : "Desativar") + '</button>'
      + '<button type="button" data-delete="' + product.id + '">Excluir</button></div></article>';
  }).join("");
}

$("#products-list").addEventListener("click", async (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  const product = productsCache.find((item) => item.id === button.dataset.edit
    || item.id === button.dataset.toggle || item.id === button.dataset.delete);
  if (!product) return;

  try {
    if (button.dataset.edit) {
      $("#product-id").value = product.id;
      $("#product-name").value = product.nome || "";
      $("#product-price").value = Number(product.preco || 0).toFixed(2);
      $("#product-category").value = product.categoria || "classicos";
      $("#product-badge").value = product.selo || "";
      $("#product-description").value = product.descricao || "";
      $("#product-image").value = product.imagem || "";
      $("#product-active").value = product.ativo === false ? "false" : "true";
      $("#product-form-title").textContent = "Editar produto";
      $("#product-submit").textContent = "Salvar alterações";
      $("#product-cancel").hidden = false;
      $("#product-form").scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    if (button.dataset.toggle) {
      await updateDoc(doc(db, "produtos", product.id), { ativo: product.ativo === false });
      showMessage(productMessage, "Disponibilidade atualizada.");
      return;
    }

    if (button.dataset.delete && window.confirm("Excluir este produto? Os itens já registrados nos pedidos antigos serão preservados.")) {
      await deleteDoc(doc(db, "produtos", product.id));
      showMessage(productMessage, "Produto excluído.");
    }
  } catch (error) {
    console.error(error);
    showMessage(productMessage, "Não foi possível atualizar o produto.", true);
  }
});

$("#product-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = $("#product-name").value.trim();
  const description = $("#product-description").value.trim();
  const price = Number($("#product-price").value);
  const image = $("#product-image").value.trim();
  const category = $("#product-category").value;

  if (!name || !description || !Number.isFinite(price) || price <= 0) {
    showMessage(productMessage, "Preencha nome, descrição e um preço válido.", true);
    return;
  }
  if (image && !safeImageUrl(image)) {
    showMessage(productMessage, "A imagem precisa ser um endereço HTTPS válido.", true);
    return;
  }

  const payload = {
    nome: name,
    descricao: description,
    preco: Math.round(price * 100) / 100,
    categoria: category,
    selo: $("#product-badge").value.trim(),
    imagem: image,
    ativo: $("#product-active").value === "true",
    atualizado_em: serverTimestamp()
  };

  try {
    const id = $("#product-id").value;
    if (id) {
      await updateDoc(doc(db, "produtos", id), payload);
      showMessage(productMessage, "Produto atualizado com sucesso.");
    } else {
      payload.criado_em = serverTimestamp();
      await addDoc(collection(db, "produtos"), payload);
      showMessage(productMessage, "Produto cadastrado com sucesso.");
    }
    resetProductForm();
  } catch (error) {
    console.error(error);
    showMessage(productMessage, "Não foi possível salvar. Confira sua conexão e as regras do Firestore.", true);
  }
});

$("#product-cancel").addEventListener("click", resetProductForm);

function resetProductForm() {
  $("#product-form").reset();
  $("#product-id").value = "";
  $("#product-active").value = "true";
  $("#product-form-title").textContent = "Cadastrar produto";
  $("#product-submit").textContent = "Salvar produto";
  $("#product-cancel").hidden = true;
}

function startOrdersListener() {
  const ordersQuery = query(collection(db, "pedidos"), orderBy("criado_em", "desc"), limit(50));
  stopOrders = onSnapshot(ordersQuery, (snapshot) => {
    const orders = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
    renderOrders(orders);
  }, (error) => {
    console.error(error);
    $("#orders").innerHTML = '<p class="admin-empty">Não foi possível carregar os pedidos. Verifique as regras do Firestore.</p>';
  });
}

function renderOrders(orders) {
  $("#stat-count").textContent = String(orders.length);
  $("#stat-revenue").textContent = brl(orders.reduce((sum, order) => sum + Number(order.total || 0), 0));
  $("#stat-last").textContent = orders[0] ? formatDate(orders[0].criado_em) : "—";
  $("#orders").innerHTML = orders.length ? orders.map((order) => {
    const items = (order.itens || []).map((item) => escapeHtml((item.qtd || 1) + "× " + (item.nome || "Produto"))).join(", ");
    return '<article class="order-card"><header><strong>PEDIDO #' + escapeHtml(order.codigo || order.id.slice(0, 6)) + '</strong>'
      + '<select class="status-select" data-order-status="' + order.id + '">'
      + ["recebido", "em_preparo", "pronto", "entregue", "cancelado"].map((status) =>
        '<option value="' + status + '"' + (order.status === status ? " selected" : "") + '>' + status.replace("_", " ") + '</option>').join("")
      + '</select></header><div class="order-grid"><div><small>Cliente</small>' + escapeHtml(order.nome || "Não informado")
      + '</div><div><small>Consumo</small>' + escapeHtml(order.modo || "—") + '</div><div><small>Pagamento</small>'
      + escapeHtml(order.pagamento || "—") + '</div><div><small>Data</small>' + formatDate(order.criado_em)
      + '</div></div><footer><span class="order-items">' + items + '</span><strong>' + brl(order.total) + '</strong></footer></article>';
  }).join("") : '<p class="admin-empty">Nenhum pedido registrado ainda.</p>';
}

$("#orders").addEventListener("change", async (event) => {
  const select = event.target.closest("[data-order-status]");
  if (!select) return;
  try {
    await updateDoc(doc(db, "pedidos", select.dataset.orderStatus), { status: select.value });
  } catch (error) {
    console.error(error);
    showMessage(productMessage, "Não foi possível atualizar o status do pedido.", true);
  }
});

function formatDate(value) {
  if (!value) return "—";
  const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("pt-BR") + " " + date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function safeImageUrl(value) {
  if (!value) return "";
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : "";
  } catch (_) {
    return "";
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}
function escapeAttribute(value) { return escapeHtml(value); }
