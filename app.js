document.addEventListener('DOMContentLoaded', () => {
    // --- View All Logic (Home Page) ---
    function setupViewAll(buttonId, contentId) {
        const button = document.getElementById(buttonId);
        const content = document.getElementById(contentId);

        if (button && content) {
            button.addEventListener('click', () => {
                content.classList.remove('hidden');
                button.parentElement.style.display = 'none';
            });
        }
    }

    setupViewAll('viewAllBtn', 'moreProducts');
    setupViewAll('viewAllNecklacesBtn', 'moreNecklaces');
    setupViewAll('viewAllOthersBtn', 'moreOthers');

    const navLinks = document.querySelectorAll('.nav-menu a');
    const sections = document.querySelectorAll('.page-section');

    // Function to show a specific section
    function showSection(targetId) {
        sections.forEach(section => {
            if (section.id === targetId) {
                // Determine display type based on section class or default to block
                if (section.classList.contains('hero-section')) {
                    section.style.display = 'flex'; // Hero uses flex
                } else {
                    section.style.display = 'block';
                }

                // Add a slight delay to trigger entry animation
                setTimeout(() => {
                    const revealers = section.querySelectorAll('.reveal');
                    revealers.forEach(r => r.classList.add('active'));
                    section.classList.add('active');
                }, 100);

            } else {
                section.style.display = 'none';
                // Reset animations when hidden if we want them to re-play
                const revealers = section.querySelectorAll('.reveal');
                revealers.forEach(r => r.classList.remove('active'));
                section.classList.remove('active');
            }
        });
    }

    // --- Intersection Observer for Scroll Animations ---
    const revealOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                // observer.unobserve(entry.target); // Keep observing if we want it to repeat
            }
        });
    }, revealOptions);

    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1); // Remove #

            if (targetId) {
                showSection(targetId);
            }
        });
    });

    // Default to showing Home initially (or adhere to current hash if meaningful)
    showSection('home');


    // --- Authentication Logic ---
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const googleBtn = document.getElementById('googleBtn');


    // Email/Password Signup
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('signupEmail').value;
            const password = document.getElementById('signupPassword').value;

            firebase.auth().createUserWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    console.log("Registered:", userCredential.user);
                    window.location.href = 'index.html';
                })
                .catch((error) => {
                    console.error("Error:", error);
                    alert(error.message);
                });
        });
    }



    // Check Auth State & Update UI
    firebase.auth().onAuthStateChanged((user) => {
        const path = window.location.pathname;
        const isLoginPage = path.includes('login.html');
        const isCheckoutPage = path.includes('checkout.html');

        if (user) {
            console.log("User is signed in:", user.email);
            updateCartCount(user.uid);

            // Show content if on home page
            if (!isLoginPage && !isCheckoutPage) {
                const contentWrapper = document.querySelector('.content-wrapper');
                const navMenu = document.querySelector('.nav-menu');
                const menuToggle = document.getElementById('mobile-menu');
                if (contentWrapper) contentWrapper.style.display = 'block';
                if (navMenu) navMenu.style.visibility = 'visible';
                if (menuToggle) menuToggle.style.display = 'flex';
            }

            // If on login page and logged in, redirect to home
            if (isLoginPage) {
                window.location.href = 'index.html';
            }

            // Update Login link to Logout
            const loginLinks = document.querySelectorAll('.auth-link');
            loginLinks.forEach(link => {
                if (link.textContent.trim() === 'Login' || link.textContent.trim() === 'Sign Up') {
                    link.textContent = 'Logout';
                    link.href = '#';
                    link.addEventListener('click', (e) => {
                        e.preventDefault();
                        firebase.auth().signOut().then(() => window.location.reload());
                    });
                }
            });

        } else {
            console.log("User is signed out");

            // Hide content if on home page
            if (!isLoginPage && !isCheckoutPage) {
                const contentWrapper = document.querySelector('.content-wrapper');
                const navMenu = document.querySelector('.nav-menu');
                const menuToggle = document.getElementById('mobile-menu');
                if (contentWrapper) contentWrapper.style.display = 'none';
                if (navMenu) navMenu.style.visibility = 'hidden';
                if (menuToggle) menuToggle.style.display = 'none';
            }

            // If on protected page (Checkout only now) and not logged in, redirect
            if (isCheckoutPage) {
                window.location.href = 'login.html';
            }
        }
    });

    // --- Add to Cart Logic ---
    const addToCartBtns = document.querySelectorAll('.buy-btn');

    addToCartBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const user = firebase.auth().currentUser;

            if (!user) {
                alert("Please login to add items to cart!");
                window.location.href = 'login.html';
                return;
            }

            // Get Product Details
            const productCard = e.target.closest('.product-card');
            const productName = productCard.querySelector('.product-name').textContent;
            const productPrice = productCard.querySelector('.price').textContent.trim();
            const productImage = productCard.querySelector('img').src;

            const cartItem = {
                name: productName,
                price: productPrice,
                image: productImage,
                quantity: 1
            };

            // Push to Firebase
            const cartRef = firebase.database().ref('carts/' + user.uid);
            cartRef.push(cartItem)
                .then(() => {
                    alert(`${productName} added to cart!`);
                    // Create a flying effect or update UI instantly
                })
                .catch((error) => {
                    console.error("Error adding to cart: ", error);
                });
        });
    });

    function updateCartCount(userId) {
        const cartCountElement = document.getElementById('cartCount');
        const cartRef = firebase.database().ref('carts/' + userId);

        cartRef.on('value', (snapshot) => {
            const data = snapshot.val();
            let count = 0;
            if (data) {
                count = Object.keys(data).length;
            }
            if (cartCountElement) {
                cartCountElement.textContent = `🛒 Cart (${count})`;
            }
        });
    }

    // --- Checkout Logic ---
    if (window.location.pathname.includes('checkout.html')) {
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                loadCartItems(user.uid);
            } else {
                window.location.href = 'login.html';
            }
        });

        const orderForm = document.getElementById('orderForm');
        if (orderForm) {
            orderForm.addEventListener('submit', (e) => {
                e.preventDefault();
                placeOrder();
            });
        }
    }

    function loadCartItems(userId) {
        const cartContainer = document.getElementById('cartItemsContainer');
        const subtotalEl = document.getElementById('subtotalPrice');
        const totalEl = document.getElementById('totalPrice');

        if (!cartContainer || !subtotalEl || !totalEl) return;

        console.log("Loading cart items for:", userId);
        const cartRef = firebase.database().ref('carts/' + userId);

        cartRef.on('value', (snapshot) => {
            console.log("Cart data received:", snapshot.val());
            const data = snapshot.val();
            cartContainer.innerHTML = '';
            let subtotal = 0;

            if (data) {
                Object.keys(data).forEach(key => {
                    const item = data[key];
                    // Parse price and clean (more robustly)
                    let priceVal = 0;
                    if (item.price) {
                        let priceCleaned = String(item.price).toLowerCase().replace(/rs\.?|[,]/g, '').trim();
                        priceVal = parseFloat(priceCleaned) || 0;
                    }

                    // Calculate item total based on quantity
                    const itemQuantity = item.quantity || 1;
                    subtotal += priceVal * itemQuantity;

                    const itemEl = document.createElement('div');
                    itemEl.classList.add('cart-item');
                    itemEl.innerHTML = `
                        <img src="${item.image || ''}" alt="${item.name || 'Product'}" onerror="this.src='Images/placeholder.jpeg'">
                        <div class="cart-item-details">
                            <div class="cart-item-name">${item.name || 'Unknown Product'}</div>
                            <div class="cart-item-price">${item.price || 'N/A'}</div>
                            ${itemQuantity > 1 ? `<div class="cart-item-qty">Qty: ${itemQuantity}</div>` : ''}
                        </div>
                        <div class="cart-actions">
                            <div class="qty-controls">
                                <button class="qty-btn minus" data-key="${key}" data-qty="${itemQuantity}">-</button>
                                <span>${itemQuantity}</span>
                                <button class="qty-btn plus" data-key="${key}" data-qty="${itemQuantity}">+</button>
                            </div>
                            <button class="delete-btn" data-key="${key}">🗑️</button>
                        </div>
                    `;
                    cartContainer.appendChild(itemEl);
                });

                // Attach Event Listeners for Dynamic Elements
                document.querySelectorAll('.qty-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const key = e.currentTarget.dataset.key;
                        const currentQty = parseInt(e.currentTarget.dataset.qty);
                        const isPlus = e.currentTarget.classList.contains('plus');
                        let newQty = isPlus ? currentQty + 1 : currentQty - 1;
                        if (newQty < 1) newQty = 1;
                        firebase.database().ref('carts/' + userId + '/' + key).update({ quantity: newQty });
                    });
                });

                document.querySelectorAll('.delete-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        if (confirm('Are you sure you want to remove this item?')) {
                            const key = e.currentTarget.dataset.key;
                            firebase.database().ref('carts/' + userId + '/' + key).remove();
                        }
                    });
                });

            } else {
                cartContainer.innerHTML = '<p class="empty-msg">Your cart is empty.</p>';
            }

            subtotalEl.textContent = `Rs. ${subtotal.toLocaleString()}`;
            const total = subtotal + 150; // Set to 150 to match screenshot expectations
            totalEl.textContent = `Rs. ${total.toLocaleString()}`;
        }, (error) => {
            console.error("Firebase Read Error:", error);
            cartContainer.innerHTML = '<p class="error-msg">Error loading products. Please try again.</p>';
        });
    }

    function placeOrder() {
        const user = firebase.auth().currentUser;
        if (!user) return;

        const name = document.getElementById('orderName').value;
        const phone = document.getElementById('orderPhone').value;
        const address = document.getElementById('orderAddress').value;
        const city = document.getElementById('orderCity').value;
        const total = document.getElementById('totalPrice').textContent;

        // Fetch Cart Items First
        firebase.database().ref('carts/' + user.uid).once('value')
            .then((snapshot) => {
                const cartData = snapshot.val();

                // If cart is empty, don't place order (though button should be disabled ideally)
                if (!cartData) {
                    alert("Your cart is empty!");
                    return;
                }

                const orderData = {
                    userId: user.uid,
                    userEmail: user.email,
                    shipping: { name, phone, address, city },
                    items: cartData, // Saving the cart items object directly
                    total: total,
                    timestamp: new Date().toISOString(),
                    status: 'Pending'
                };

                // 1. Save Order
                return firebase.database().ref('orders').push(orderData);
            })
            .then(() => {
                // 2. Clear Cart
                return firebase.database().ref('carts/' + user.uid).remove();
            })
            .then(() => {
                alert('Order Placed Successfully! Thank you for shopping with Moon Bling.');
                window.location.href = 'index.html';
            })
            .catch((error) => {
                console.error("Order failed:", error);
                alert("Failed to place order. Please try again.");
            });
    }
});
