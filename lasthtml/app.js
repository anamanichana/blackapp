// Loading screen simulation
let loadingMessages = [
    'INITIALIZING GHOST PROTOCOL...',
    'ESTABLISHING ENCRYPTED TUNNEL...',
    'BYPASSING SECURITY FIREWALLS...',
    'AUTHENTICATING CREDENTIALS...',
    'CONNECTING TO SECURE NETWORK...',
    'LOADING INTERFACE MODULES...',
    'FINALIZING CONNECTION...'
];

let currentMessageIndex = 0;
let loadingProgress = 0;
let currentChatType = 'public';
let currentTargetGang = '';
let username = '';
let playerGang = '';
let playerIsManager = false;
let playerIsHighAuthority = false;

function setChatType(type) {
    currentChatType = type;
    currentTargetGang = '';

    document.querySelectorAll('.chat-type-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.chat-type-btn[data-type="${type}"]`).classList.add('active');

    if (type === 'private') {
        document.getElementById('gang-selector').style.display = 'block';
    } else {
        document.getElementById('gang-selector').style.display = 'none';
    }

    loadChatHistory();
}

function loadChatHistory() {
    const targetGang = currentChatType === 'private' ? document.getElementById('targetGang').value : '';
    currentTargetGang = targetGang;

    fetch(`https://${GetParentResourceName()}/GetChatHistory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatType: currentChatType, targetGang: currentTargetGang, username: username })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const chatMessages = document.getElementById('chatMessages');
            chatMessages.innerHTML = '';
            data.messages.forEach(msg => {
                const date = new Date(msg.created_at);
                const formattedDate = date.toLocaleString();

                chatMessages.innerHTML += `
                    <div class="chat-message fade-in">
                        <div class="username"><i class="fas fa-user-secret"></i> ${msg.sender_name}</div>
                        <div class="timestamp">${formattedDate}</div>
                        <div class="content">${msg.message}</div>
                    </div>
                `;
            });

            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    });
}

function loadAllowedGangs() {
    fetch(`https://${GetParentResourceName()}/GetAllowedGangs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}'
    })
    .then(response => response.json())
    .then(gangs => {
        const gangSelector = document.getElementById('targetGang');
        gangSelector.innerHTML = '<option value="">-- SELECT TARGET --</option>';
        gangs.forEach(gang => {
            gangSelector.innerHTML += `<option value="${gang}">${gang}</option>`;
        });
    });
}

function sendChatMessage() {
    const message = document.getElementById('chatMessageInput').value;
    if (!message.trim()) return;

    if (typeof username === 'undefined' || !username) {
        console.error('Username is not set. Please log in again.');
        return;
    }

    const targetGang = currentChatType === 'private' ? document.getElementById('targetGang').value : '';
    currentTargetGang = targetGang;

    fetch(`https://${GetParentResourceName()}/SendChatMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message: message,
            chatType: currentChatType,
            targetGang: targetGang,
            username: username
        })
    });

    document.getElementById('chatMessageInput').value = '';
}

window.addEventListener('message', function(event) {
    if (event.data.action === 'newChatMessage') {
        if (!username) return;

        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;

        let displayChat = currentChatType;
        let isGangOnly = !playerIsManager && !playerIsHighAuthority && playerGang !== 'blackmarket';

        if (isGangOnly && event.data.chatType === 'private') {
            displayChat = 'gang';
        } else if (event.data.chatType !== currentChatType) {
            return;
        }

        const date = new Date(event.data.message.timestamp || event.data.message.created_at);
        const formattedDate = date.toLocaleString();

        chatMessages.innerHTML += `
            <div class="chat-message fade-in">
                <div class="username"><i class="fas fa-user-secret"></i> ${event.data.message.sender || event.data.message.sender_name}</div>
                <div class="timestamp">${formattedDate}</div>
                <div class="content">${event.data.message.message}</div>
            </div>
        `;

        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
});

function simulateLoading() {
    const loadingScreen = document.getElementById('loading-screen');
    const loadingText = document.getElementById('loading-text');
    const progressBar = document.getElementById('loading-progress');
    
    // Show loading screen
    loadingScreen.style.display = 'flex';
    
    const interval = setInterval(() => {
        // Update progress
        loadingProgress += Math.random() * 12 + 8;
        
        // Update progress bar
        progressBar.style.width = Math.min(loadingProgress, 100) + '%';
        
        // Update loading message
        if (loadingProgress > (currentMessageIndex + 1) * (100 / loadingMessages.length)) {
            currentMessageIndex = Math.min(currentMessageIndex + 1, loadingMessages.length - 1);
            loadingText.textContent = loadingMessages[currentMessageIndex];
        }
        
        if (loadingProgress >= 100) {
            loadingProgress = 100;
            progressBar.style.width = '100%';
            loadingText.textContent = 'ACCESS GRANTED - WELCOME TO THE NETWORK';
            
            setTimeout(() => {
                loadingScreen.classList.add('hidden');
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 500);
            }, 800);
            
            clearInterval(interval);
        }
    }, 300);
}

window.addEventListener('message', function(event) {
    if (event.data.action === 'showLogin') {
        document.body.classList.add('visible');
        document.getElementById('login-window').style.display = 'flex';
        document.getElementById('app-window').style.display = 'none';
        document.getElementById('login-window').classList.add('fade-in');
    } else if (event.data.action === 'showApp') {
        // Start loading sequence
        simulateLoading();
        
        // Set user data
        username = event.data.username;
        playerGang = event.data.playerGang;
        playerIsManager = event.data.isManager;
        playerIsHighAuthority = event.data.isHighAuthority;

        // Show app after loading completes
        setTimeout(() => {
            document.getElementById('login-window').style.display = 'none';
            document.getElementById('app-window').style.display = 'flex';
            document.getElementById('app-window').classList.add('fade-in');
            showApp(event.data.isManager, event.data.isHighAuthority);
        }, 3000); // Adjust timing based on loading duration
        
    } else if (event.data.action === 'loginFailed') {
        document.getElementById('login_error').innerHTML = '<i class="fas fa-exclamation-triangle"></i> ACCESS DENIED - INVALID CREDENTIALS';
    } else if (event.data.action === 'hideApp') {
        document.body.classList.remove('visible');
    }
});

function submitLogin() {
    let password = document.getElementById('login_password').value;
    fetch(`https://${GetParentResourceName()}/LoginBlackmarket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            password: password
        })
    });
}

function showApp(isManager, isHighAuthority) {
    document.body.classList.add('visible');

    let sidebarHTML = `
        <button onclick="showTab('orders')" class="slide-in active">
            <i class="fas fa-shopping-cart"></i> Asset Orders
        </button>
    `;

    if (isManager) {
        sidebarHTML += `
            <button onclick="showTab('manager')" class="slide-in">
                <i class="fas fa-cogs"></i> Operations
            </button>
        `;
    }

    if (isHighAuthority) {
        sidebarHTML += `
            <button onclick="showTab('approved')" class="slide-in">
                <i class="fas fa-check-circle"></i> Security
            </button>
        `;
    }

    sidebarHTML += `
        <button onclick="showTab('chat')" class="slide-in">
            <i class="fas fa-comments"></i> Communications
        </button>
    `;

    document.querySelector('.sidebar').innerHTML = sidebarHTML;
    showTab('orders');
}

function showTab(tab) {
    // Update active sidebar button
    document.querySelectorAll('.sidebar button').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.sidebar button[onclick="showTab('${tab}')"]`).classList.add('active');
    
    const mainContent = document.getElementById('main-content');
    
    if (tab === 'orders') {
        mainContent.innerHTML = `
            <div class="fade-in">
                <h2><i class="fas fa-file-contract"></i> ASSET FORM</h2>
                
                <div class="form-container">
                    <div class="info-card">
                        <div class="flex justify-between items-center mb-3">
                            <h3><i class="fas fa-shield-alt"></i> SECURE CONNECTION</h3>
                            <span class="status-badge status-accepted"><i class="fas fa-lock"></i> ENCRYPTED</span>
                        </div>
                        <p>ALL TRANSMISSIONS ARE ENCRYPTED WITH MILITARY-GRADE PROTOCOLS. ENSURE REQUEST SPECIFICATIONS ARE ACCURATE BEFORE TRANSMISSION.</p>
                    </div>
                    
                    <div class="mb-4">
                        <label for="asset_name"><i class="fas fa-tag"></i> Asset Name</label>
                        <input type='text' id='asset_name' placeholder='IGNITION 7G8'>
                    </div>
                    
                    <div class="mb-4">
                        <label for="order_details"><i class="fas fa-clipboard-list"></i> Order Details</label>
                        <textarea id='order_details' rows='6' placeholder='TO MY GANG LET ME HOLD THE RIFLE BACK , 200 300 MAGS, 100 PROTECTION AND 100 PISTOL MAGS. APPRECIATE THAT BIG DOG ESPECIALLY I USE PISTOL MAGS THE MOST BECAUSE I SPEND ALOT OF TIME DOING JOBS THAT REQUIRE PISTOL MAGS THANK YOU VERY MUCH APPRECIATE IT'></textarea>
                        <div class="char-counter">
                            <span id="char-count">0</span>/500 CHARACTERS
                        </div>
                    </div>
                    
                    <button onclick='submitOrder()' class="w-full">
                        <i class="fas fa-paper-plane"></i> Submit Order
                    </button>
                </div>
            </div>
        `;
        
        const textarea = document.getElementById('order_details');
        const charCount = document.getElementById('char-count');
        textarea.addEventListener('input', function() {
            charCount.textContent = this.value.length;
            if (this.value.length > 450) {
                charCount.style.color = 'var(--warning-color)';
            } else {
                charCount.style.color = 'var(--muted-text)';
            }
        });
        
    } else if (tab === 'manager') {
        mainContent.innerHTML = `
            <div class="fade-in">
                <h2><i class="fas fa-tasks"></i> ORDER MANAGEMENT CONSOLE</h2>
                <div class="loading-state">
                    <div class="spinner"></div>
                    <p>SCANNING FOR PENDING OPERATIONS...</p>
                </div>
            </div>
        `;
        
        fetch(`https://${GetParentResourceName()}/RequestOrders`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: '{}'
        }).then(response => response.json()).then(orders => {
            const pendingOrders = orders.filter(order => order.status === 'Pending');
            
            let content = `
                <div class="fade-in">
                    <h2><i class="fas fa-tasks"></i> ORDER MANAGEMENT CONSOLE</h2>
                    <div class="form-container">
                        <div class="info-card">
                            <div class="flex justify-between items-center">
                                <div>
                                    <h3><i class="fas fa-hourglass-half"></i> PENDING OPERATIONS</h3>
                                    <p>REVIEW AND AUTHORIZE INCOMING ASSET REQUESTS</p>
                                </div>
                                <div class="text-2xl font-bold text-center">
                                    ${pendingOrders.length}
                                </div>
                            </div>
                        </div>
            `;
            
            if (pendingOrders.length === 0) {
                content += `
                    <div class="empty-state">
                        <i class="fas fa-inbox"></i>
                        <h3>NO PENDING OPERATIONS</h3>
                        <p>ALL REQUESTS HAVE BEEN PROCESSED. NEW OPERATIONS WILL APPEAR HERE FOR AUTHORIZATION.</p>
                    </div>
                `;
            } else {
                content += `
                    <table>
                        <thead>
                            <tr>
                                <th><i class="fas fa-user"></i> OPERATIVE</th>
                                <th><i class="fas fa-users"></i> FACTION</th>
                                <th><i class="fas fa-box"></i> ASSET</th>
                                <th><i class="fas fa-info-circle"></i> DETAILS</th>
                                <th><i class="fas fa-flag"></i> STATUS</th>
                                <th><i class="fas fa-cog"></i> ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                `;
                
                pendingOrders.forEach(order => {
                    content += `
                        <tr>
                            <td class="font-medium">${order.player_name}</td>
                            <td>${order.gang_name}</td>
                            <td class="font-mono">${order.asset_name}</td>
                            <td>${order.order_details}</td>
                            <td><span class="status-badge status-pending"><i class="fas fa-clock"></i> ${order.status}</span></td>
                            <td>
                                <div class="flex gap-2">
                                    <button onclick="updateOrder(${order.id}, 'Accepted')" class="btn-success text-sm">
                                        <i class="fas fa-check"></i> APPROVE
                                    </button>
                                    <button onclick="updateOrder(${order.id}, 'Rejected')" class="btn-danger text-sm">
                                        <i class="fas fa-times"></i> DENY
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `;
                });
                
                content += `
                        </tbody>
                    </table>
                `;
            }
            
            content += `</div></div>`;
            mainContent.innerHTML = content;
        }).catch(error => {
            mainContent.innerHTML = `
                <div class="fade-in">
                    <h2><i class="fas fa-tasks"></i> ORDER MANAGEMENT CONSOLE</h2>
                    <div class="form-container">
                        <div class="empty-state">
                            <i class="fas fa-exclamation-triangle"></i>
                            <h3>CONNECTION ERROR</h3>
                            <p>UNABLE TO ESTABLISH SECURE CONNECTION. CHECK NETWORK STATUS AND RETRY.</p>
                            <button onclick="showTab('manager')" class="mt-3">
                                <i class="fas fa-redo"></i> RETRY CONNECTION
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        
    } else if (tab === 'approved') {
        mainContent.innerHTML = `
            <div class="fade-in">
                <h2><i class="fas fa-check-circle"></i> APPROVED OPERATIONS</h2>
                <div class="loading-state">
                    <div class="spinner"></div>
                    <p>LOADING COMPLETED OPERATIONS...</p>
                </div>
            </div>
        `;
        
        fetch(`https://${GetParentResourceName()}/GetApprovedOrders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: '{}'
        }).then(response => response.json()).then(orders => {
            let content = `
                <div class="fade-in">
                    <h2><i class="fas fa-check-circle"></i> APPROVED OPERATIONS</h2>
                    <div class="form-container">
                        <div class="info-card">
                            <div class="flex justify-between items-center">
                                <div>
                                    <h3><i class="fas fa-clipboard-check"></i> COMPLETED REQUESTS</h3>
                                    <p>SUCCESSFULLY AUTHORIZED ASSET OPERATIONS</p>
                                </div>
                                <div class="text-2xl font-bold text-center">
                                    ${orders.length}
                                </div>
                            </div>
                        </div>
            `;
            
            if (orders.length === 0) {
                content += `
                    <div class="empty-state">
                        <i class="fas fa-clipboard"></i>
                        <h3>NO APPROVED OPERATIONS</h3>
                        <p>AUTHORIZED OPERATIONS WILL BE DISPLAYED HERE FOR REVIEW AND MANAGEMENT.</p>
                    </div>
                `;
            } else {
                content += `
                    <table>
                        <thead>
                            <tr>
                                <th><i class="fas fa-user"></i> OPERATIVE</th>
                                <th><i class="fas fa-users"></i> FACTION</th>
                                <th><i class="fas fa-box"></i> ASSET</th>
                                <th><i class="fas fa-info-circle"></i> DETAILS</th>
                                <th><i class="fas fa-flag"></i> STATUS</th>
                                <th><i class="fas fa-cog"></i> ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                `;
                
                orders.forEach(order => {
                    content += `
                        <tr>
                            <td class="font-medium">${order.player_name}</td>
                            <td>${order.gang_name}</td>
                            <td class="font-mono">${order.asset_name}</td>
                            <td>${order.order_details}</td>
                            <td><span class="status-badge status-accepted"><i class="fas fa-check"></i> ${order.status}</span></td>
                            <td>
                                <button onclick="deleteOrder(${order.id})" class="btn-danger text-sm">
                                    <i class="fas fa-trash"></i> PURGE
                                </button>
                            </td>
                        </tr>
                    `;
                });
                
                content += `
                        </tbody>
                    </table>
                `;
            }
            
            content += `</div></div>`;
            mainContent.innerHTML = content;
        }).catch(error => {
            mainContent.innerHTML = `
                <div class="fade-in">
                    <h2><i class="fas fa-check-circle"></i> APPROVED OPERATIONS</h2>
                    <div class="form-container">
                        <div class="empty-state">
                            <i class="fas fa-exclamation-triangle"></i>
                            <h3>CONNECTION ERROR</h3>
                            <p>UNABLE TO RETRIEVE APPROVED OPERATIONS. CHECK NETWORK STATUS AND RETRY.</p>
                            <button onclick="showTab('approved')" class="mt-3">
                                <i class="fas fa-redo"></i> RETRY CONNECTION
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
    } else if (tab === 'chat') {
        let isGangOnly = !playerIsManager && !playerIsHighAuthority && playerGang !== 'blackmarket';

        mainContent.innerHTML = `
            <div class="fade-in chat-container">
                <h2><i class="fas fa-satellite-dish"></i> SECURE COMMUNICATIONS</h2>
                
                <div class="chat-type-selector">
                    ${isGangOnly ? `
                        <button class="chat-type-btn active" data-type="gang" onclick="setChatType('gang')">
                            <i class="fas fa-users"></i> FACTION CHANNEL
                        </button>
                    ` : `
                        <button class="chat-type-btn ${currentChatType === 'public' ? 'active' : ''}" data-type="public" onclick="setChatType('public')">
                            <i class="fas fa-globe"></i> UNDERGROUND NETWORK
                        </button>
                        <button class="chat-type-btn ${currentChatType === 'gang' ? 'active' : ''}" data-type="gang" onclick="setChatType('gang')">
                            <i class="fas fa-users"></i> FACTION CHANNEL
                        </button>
                        <button class="chat-type-btn ${currentChatType === 'private' ? 'active' : ''}" data-type="private" onclick="setChatType('private')">
                            <i class="fas fa-lock"></i> ENCRYPTED DIRECT
                        </button>
                    `}
                </div>
                
                <div id="gang-selector" style="display: ${currentChatType === 'private' ? 'block' : 'none'};">
                    <label for="targetGang"><i class="fas fa-crosshairs"></i> SELECT TARGET FACTION</label>
                    <select id="targetGang" onchange="loadChatHistory()">
                        <option value="">-- SCANNING NETWORKS --</option>
                    </select>
                </div>
                
                <div class="chat-messages" id="chatMessages">
                    <div class="loading-state">
                        <div class="spinner"></div>
                        <p>DECRYPTING MESSAGES...</p>
                    </div>
                </div>
                
                <div class="chat-input">
                    <input type="text" id="chatMessageInput" placeholder="TYPE ENCRYPTED MESSAGE..." onkeypress="if(event.key==='Enter') sendChatMessage()">
                    <button onclick="sendChatMessage()">
                        <i class="fas fa-paper-plane"></i> TRANSMIT
                    </button>
                </div>
            </div>
        `;

        loadAllowedGangs();
        loadChatHistory();
    }
}

function submitOrder() {
    let assetName = document.getElementById('asset_name').value;
    let orderDetails = document.getElementById('order_details').value;

    if (!assetName.trim() || !orderDetails.trim()) {
        return;
    }

    fetch(`https://${GetParentResourceName()}/SubmitOrder`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            assetName: assetName,
            orderDetails: orderDetails
        })
    }).then(res => {
        document.getElementById('main-content').innerHTML = `
            <div class="success-message fade-in">
                <i class="fas fa-check-circle"></i>
                <h2>REQUEST TRANSMITTED SUCCESSFULLY</h2>
                <p>YOUR ASSET REQUEST HAS BEEN ENCRYPTED AND TRANSMITTED TO OUR OPERATIONS CENTER. THE REQUEST IS NOW PENDING AUTHORIZATION.</p>
                <div class="info-card mt-4 mb-4">
                    <h3><i class="fas fa-info-circle"></i> OPERATION DETAILS</h3>
                    <p><strong>ASSET:</strong> ${assetName}</p>
                    <p><strong>OPERATION ID:</strong> #${Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
                </div>
                <p class="mb-4">YOU WILL RECEIVE NOTIFICATION ONCE YOUR REQUEST HAS BEEN PROCESSED BY AUTHORIZED PERSONNEL.</p>
                <div class="flex gap-3 justify-center">
                    <button onclick="closeApp()" class="btn-secondary">
                        <i class="fas fa-power-off"></i> CLOSE TERMINAL
                    </button>
                    <button onclick="showTab('orders')">
                        <i class="fas fa-plus"></i> SUBMIT NEW REQUEST
                    </button>
                </div>
            </div>
        `;
    }).catch(error => {
        document.getElementById('main-content').innerHTML = `
            <div class="form-container">
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>TRANSMISSION FAILED</h3>
                    <p>UNABLE TO TRANSMIT YOUR REQUEST. CHECK NETWORK CONNECTION AND RETRY.</p>
                    <button onclick="showTab('orders')" class="mt-3">
                        <i class="fas fa-redo"></i> RETRY TRANSMISSION
                    </button>
                </div>
            </div>
        `;
    });
}

function updateOrder(id, status) {
    fetch(`https://${GetParentResourceName()}/UpdateOrderStatus`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ id: id, status: status })
    }).then(res => {
        showTab('manager');
    }).catch(error => {
        console.error('Failed to update order status:', error);
    });
}

function closeApp() {
    fetch(`https://${GetParentResourceName()}/closeApp`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: '{}'
    });
    document.body.classList.remove('visible');
    document.getElementById('app-window').classList.add('fade-out');
    document.getElementById('login-window').style.display = 'none';
    document.getElementById('app-window').style.display = 'none';
}

function deleteOrder(orderId) {
    fetch(`https://${GetParentResourceName()}/DeleteOrder`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ id: orderId })
    }).then(response => response.json()).then(result => {
        if (result.success) {
            showTab('approved');
        } else {
            console.error('Failed to delete order');
        }
    }).catch(error => {
        console.error('DeleteOrder error:', error);
    });
}