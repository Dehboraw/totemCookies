# Configuração Firebase — Cookies & Cia.

A migração está sendo desenvolvida na branch `migracao-firebase`.

## Projeto Firebase
- Project ID: `cookies-cia-totem`
- Banco: Cloud Firestore (modo de produção)
- Autenticação: E-mail/senha
- Plano: Spark

## Configuração local
1. Abra Firebase Console > Configurações do projeto > Seus aplicativos > Cookies & Cia - Totem.
2. Copie os valores do objeto `firebaseConfig`.
3. Preencha `js/firebase-config.js` (não substitua os nomes das propriedades).
4. Não coloque senhas, tokens privados ou chaves de conta de serviço nesse arquivo.

## Segurança
As regras iniciais estão em `firestore.rules`. Elas devem ser revisadas e publicadas no projeto Firebase antes de disponibilizar o aplicativo. O cadastro de pedidos anônimo no plano Spark não oferece validação confiável de preços no servidor. Não use os dados do pedido como confirmação de pagamento.

## Hospedagem
A configuração inicial do Firebase Hosting está em `firebase.json`. A publicação será feita depois de concluir e testar a integração.
