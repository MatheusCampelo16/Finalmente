document.addEventListener('DOMContentLoaded', function() {
    // Elementos do DOM
    const cartIcon = document.querySelector('.cart-icon');
    const cartOverlay = document.querySelector('.cart-overlay');
    const closeCart = document.querySelector('.close-cart');
    const cartContent = document.querySelector('.cart-content');
    const totalPrice = document.querySelector('.total-price');
    const cartCount = document.querySelector('.cart-count');
    const addToCartBtns = document.querySelectorAll('.add-to-cart');
    const checkoutBtn = document.querySelector('.checkout-btn');
    const registerModal = document.getElementById('register-modal');
    const registerForm = document.getElementById('register-form');
    const closeModalBtn = document.querySelector('.close-modal');
    const purchasesContainer = document.getElementById('purchases-container');
    const comprasLink = document.getElementById('compras-link');
    const contactForm = document.getElementById('contact-form');
    
    // Banco de dados no localStorage
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    let users = JSON.parse(localStorage.getItem('users')) || [];
    let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    let purchases = JSON.parse(localStorage.getItem('purchases')) || [];
    
    // Produtos
    const products = [
        { id: '1', name: 'Água Mineral 500ml', price: 2.50, image: 'assets/produtos/agua-mineral.jpg' },
        { id: '2', name: 'Água com Gás 1L', price: 4.90, image: 'assets/produtos/agua-gas.jpg' },
        { id: '3', name: 'Água Alcalina 500ml', price: 5.90, image: 'assets/produtos/agua-alcalina.jpg' }
    ];
    
    // Atualizar interface do usuário
    function updateUserUI() {
        if (currentUser) {
            if (comprasLink) comprasLink.style.display = 'block';
            if (purchasesContainer) renderPurchases();
        } else {
            if (comprasLink) comprasLink.style.display = 'none';
            if (purchasesContainer) {
                purchasesContainer.innerHTML = `
                    <div class="empty-purchases">
                        <i class="fas fa-box-open"></i>
                        <p>Faça login para ver suas compras</p>
                        <button class="btn" onclick="location.href='index.html#produtos'">Compre agora</button>
                    </div>
                `;
            }
        }
    }
    
    // Mostrar notificação
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(notification);
        notification.style.display = 'flex';
        
        setTimeout(() => {
            notification.style.display = 'none';
            notification.remove();
        }, 3000);
    }
    
    // Funções do carrinho
    function updateCart() {
        localStorage.setItem('cart', JSON.stringify(cart));
        
        const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
        if (cartCount) cartCount.textContent = totalItems;
        
        const total = cart.reduce((sum, item) => {
            const product = products.find(p => p.id === item.id);
            return sum + (product.price * item.quantity);
        }, 0);
        if (totalPrice) totalPrice.textContent = `R$ ${total.toFixed(2)}`;
        
        renderCartItems();
    }
    
    function renderCartItems() {
        if (!cartContent) return;
        
        if (cart.length === 0) {
            cartContent.innerHTML = '<p class="empty-cart">Seu carrinho está vazio</p>';
            return;
        }
        
        cartContent.innerHTML = '';
        
        cart.forEach(item => {
            const product = products.find(p => p.id === item.id);
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <img src="${product.image}" alt="${product.name}">
                <div class="cart-item-info">
                    <h4>${product.name}</h4>
                    <p>R$ ${product.price.toFixed(2)}</p>
                    <div class="quantity-controls">
                        <button class="decrease" data-id="${item.id}">-</button>
                        <span>${item.quantity}</span>
                        <button class="increase" data-id="${item.id}">+</button>
                    </div>
                </div>
                <button class="cart-item-remove" data-id="${item.id}">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            cartContent.appendChild(cartItem);
        });
        
        // Adicionar eventos
        document.querySelectorAll('.decrease').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                changeQuantity(id, -1);
            });
        });
        
        document.querySelectorAll('.increase').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                changeQuantity(id, 1);
            });
        });
        
        document.querySelectorAll('.cart-item-remove').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                removeItem(id);
            });
        });
    }
    
    function changeQuantity(id, change) {
        const item = cart.find(item => item.id === id);
        
        if (item) {
            item.quantity += change;
            
            if (item.quantity <= 0) {
                cart = cart.filter(item => item.id !== id);
            }
            
            updateCart();
        }
    }
    
    function removeItem(id) {
        cart = cart.filter(item => item.id !== id);
        updateCart();
    }
    
    // Adicionar ao carrinho
    if (addToCartBtns) {
        addToCartBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                const existingItem = cart.find(item => item.id === id);
                
                if (existingItem) {
                    existingItem.quantity += 1;
                } else {
                    cart.push({ id, quantity: 1 });
                }
                
                this.textContent = 'Adicionado!';
                setTimeout(() => {
                    this.textContent = 'Adicionar';
                }, 1000);
                
                updateCart();
            });
        });
    }
    
    // Finalizar compra
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function() {
            if (cart.length === 0) {
                alert('Seu carrinho está vazio!');
                return;
            }
            
            if (!currentUser) {
                registerModal.style.display = 'flex';
            } else {
                finalizePurchase();
            }
        });
    }
    
    // Cadastro de usuário
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const name = document.getElementById('register-name').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            
            // Verificar se email já existe
            if (users.some(user => user.email === email)) {
                alert('Este e-mail já está cadastrado. Por favor, faça login.');
                return;
            }
            
            // Criar novo usuário
            const newUser = {
                id: Date.now().toString(),
                name,
                email,
                password,
                createdAt: new Date().toISOString()
            };
            
            users.push(newUser);
            currentUser = newUser;
            
            localStorage.setItem('users', JSON.stringify(users));
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            // Fechar modal
            registerModal.style.display = 'none';
            
            // Finalizar compra
            finalizePurchase();
            
            // Atualizar UI
            updateUserUI();
        });
    }
    
    // Fechar modal
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', function() {
            registerModal.style.display = 'none';
        });
    }
    
    // Finalizar compra
    function finalizePurchase() {
        const purchase = {
            id: 'P' + Date.now().toString().slice(-6),
            userId: currentUser.id,
            date: new Date().toISOString(),
            items: cart.map(item => {
                const product = products.find(p => p.id === item.id);
                return {
                    id: item.id,
                    name: product.name,
                    price: product.price,
                    quantity: item.quantity,
                    image: product.image
                };
            }),
            total: cart.reduce((sum, item) => {
                const product = products.find(p => p.id === item.id);
                return sum + (product.price * item.quantity);
            }, 0)
        };
        
        purchases.push(purchase);
        localStorage.setItem('purchases', JSON.stringify(purchases));
        
        // Limpar carrinho
        cart = [];
        updateCart();
        
        // Mostrar notificação
        showNotification('Compra efetuada com sucesso!');
        
        // Fechar carrinho
        cartOverlay.style.display = 'none';
    }
    
    // Renderizar compras
    function renderPurchases() {
        if (!purchasesContainer) return;
        
        const userPurchases = purchases.filter(p => p.userId === currentUser.id);
        
        if (userPurchases.length === 0) {
            purchasesContainer.innerHTML = `
                <div class="empty-purchases">
                    <i class="fas fa-box-open"></i>
                    <p>Nenhuma compra encontrada</p>
                    <a href="index.html#produtos" class="btn">Compre agora</a>
                </div>
            `;
            return;
        }
        
        purchasesContainer.innerHTML = '';
        
        userPurchases.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(purchase => {
            const purchaseElement = document.createElement('div');
            purchaseElement.className = 'purchase-card';
            
            purchaseElement.innerHTML = `
                <div class="purchase-image">
                    <img src="${purchase.items[0].image}" alt="${purchase.items[0].name}">
                </div>
                <div class="purchase-info">
                    <div class="purchase-header">
                        <span class="purchase-id">Pedido #${purchase.id}</span>
                        <span class="purchase-date">${new Date(purchase.date).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div class="purchase-items">
                        ${purchase.items.map(item => `
                            <div class="purchase-item">
                                <span>${item.quantity}x ${item.name}</span>
                                <span>R$ ${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="purchase-total">
                        Total: R$ ${purchase.total.toFixed(2)}
                    </div>
                    <button class="cancel-order" data-id="${purchase.id}">Cancelar Pedido</button>
                </div>
            `;
            
            purchasesContainer.appendChild(purchaseElement);
        });

        // Adicionar eventos para cancelamento
        document.querySelectorAll('.cancel-order').forEach(btn => {
            btn.addEventListener('click', function() {
                const purchaseId = this.getAttribute('data-id');
                cancelPurchase(purchaseId);
            });
        });
    }
    
    // Cancelar pedido
    function cancelPurchase(purchaseId) {
        if (confirm('Tem certeza que deseja cancelar este pedido?')) {
            purchases = purchases.filter(p => p.id !== purchaseId);
            localStorage.setItem('purchases', JSON.stringify(purchases));
            renderPurchases();
            showNotification('Pedido cancelado com sucesso!');
        }
    }
    
    // Fechar modal ao clicar fora
    if (registerModal) {
        registerModal.addEventListener('click', function(e) {
            if (e.target === registerModal) {
                registerModal.style.display = 'none';
            }
        });
    }
    
    // Menu mobile
    const menuMobile = document.querySelector('.menu-mobile');
    const navMenu = document.querySelector('nav ul');
    
    if (menuMobile && navMenu) {
        menuMobile.addEventListener('click', function() {
            navMenu.classList.toggle('active');
        });
    }
    
    // Abrir/fechar carrinho
    if (cartIcon) {
        cartIcon.addEventListener('click', function() {
            cartOverlay.style.display = 'flex';
        });
    }
    
    if (closeCart) {
        closeCart.addEventListener('click', function() {
            cartOverlay.style.display = 'none';
        });
    }
    
    if (cartOverlay) {
        cartOverlay.addEventListener('click', function(e) {
            if (e.target === cartOverlay) {
                cartOverlay.style.display = 'none';
            }
        });
    }
    
    // Validação do formulário de contato
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Resetar erros
            document.querySelectorAll('.error-message').forEach(el => {
                el.style.display = 'none';
            });
            document.querySelectorAll('.form-group input, .form-group textarea').forEach(el => {
                el.classList.remove('error');
            });
            
            // Validação
            let isValid = true;
            const name = document.getElementById('name');
            const email = document.getElementById('email');
            const message = document.getElementById('message');
            
            if (!name.value.trim()) {
                document.getElementById('name-error').textContent = 'Por favor, insira seu nome';
                document.getElementById('name-error').style.display = 'block';
                name.classList.add('error');
                isValid = false;
            }
            
            if (!email.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
                document.getElementById('email-error').textContent = 'Por favor, insira um e-mail válido';
                document.getElementById('email-error').style.display = 'block';
                email.classList.add('error');
                isValid = false;
            }
            
            if (!message.value.trim()) {
                document.getElementById('message-error').textContent = 'Por favor, insira sua mensagem';
                document.getElementById('message-error').style.display = 'block';
                message.classList.add('error');
                isValid = false;
            }
            
            if (isValid) {
                // Simular envio
                setTimeout(() => {
                    showNotification('Mensagem enviada com sucesso!');
                    this.reset();
                }, 1000);
            }
        });
    }
    
    // Inicializar
    updateCart();
    updateUserUI();
});