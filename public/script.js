let products = [];
let isLoggedIn = false;

$(document).ready(function() {
    loadProducts();
    $('#appHeader').hide();
    $('#tokoSection').hide();
    $('#daftarSection').hide();
    $('#receipt').hide();
});

// Pratinjau gambar
$('#newProductImage').change(function() {
    const file = this.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            $('#imagePreview').attr('src', e.target.result).removeClass('hidden');
        };
        reader.readAsDataURL(file);
    }
});

function login() {
    const username = $('#username').val();
    const password = $('#password').val();
    const message = $('#message');
    const loginSection = $('#loginSection');
    const tokoSection = $('#tokoSection');
    const daftarSection = $('#daftarSection');
    const header = $('#appHeader');

    const validUsername = "admin";
    const validPassword = "admin";

    if (username === validUsername && password === validPassword) {
        message.text('Login berhasil!').css('color', '#28a745');
        isLoggedIn = true;
        loginSection.hide();
        tokoSection.show();
        daftarSection.show();
        header.show();
    } else {
        message.text('Username atau password salah!').css('color', '#dc3545');
    }

    setTimeout(() => {
        $('#username').val('');
        $('#password').val('');
        message.text('');
    }, 2000);
}

function addProduct() {
    if (!isLoggedIn) {
        alert("Silakan login terlebih dahulu!");
        return;
    }
    const name = $('#newProductName').val();
    const price = parseInt($('#newProductPrice').val());
    const stock = parseInt($('#newProductStock').val());
    const imageFile = $('#newProductImage')[0].files[0];

    if (name && price && !isNaN(price) && stock >= 0 && !isNaN(stock)) {
        const formData = new FormData();
        formData.append('name', name);
        formData.append('price', price);
        formData.append('stock', stock);
        formData.append('image', imageFile);

        $.ajax({
            url: '/api/add-product',
            type: 'POST',
            data: formData,
            contentType: false,
            processData: false,
            success: function(response) {
                alert("Produk berhasil ditambahkan!");
                $('#newProductName').val('');
                $('#newProductPrice').val('');
                $('#newProductStock').val('');
                $('#newProductImage').val('');
                $('#imagePreview').addClass('hidden');
                loadProducts();
            },
            error: function(err) {
                alert("Gagal menambahkan produk: " + err.responseText);
            }
        });
    } else {
        alert('Masukkan nama, harga, dan stok yang valid!');
    }
}

function loadProducts() {
    $.get("/api/products", function(data) {
        products = data;
        renderProducts();
    }).fail(function(err) {
        console.error("Error loading products:", err);
    });
}

function renderProducts() {
    const productList = $('#productList');
    productList.empty();
    if (products.length === 0) {
        $('#noProducts').show();
        return;
    }
    $('#noProducts').hide();
    products.sort((a, b) => a.price - b.price);
    products.forEach(product => {
        const div = $('<div>').addClass('bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition');
        div.html(`
            <img src="${product.image}" alt="${product.name}" class="product-img mx-auto mb-2 rounded-md" style="max-width: 100px;">
            <h2 class="text-lg font-semibold">${product.name}</h2>
            <p class="text-gray-600">Harga: Rp ${product.price.toLocaleString('id-ID')}</p>
            <p class="text-gray-600">Stok: ${product.stock}</p>
            <input type="number" min="0" max="${product.stock}" value="${product.quantity || 0}" class="quantity w-full p-2 border rounded mt-2" onchange="updateQuantity(${product.id}, this.value)" placeholder="Jumlah">
        `);
        productList.append(div);
    });
}

function calculateTotal() {
    if (!isLoggedIn) {
        alert("Silakan login terlebih dahulu!");
        return;
    }
    let total = 0;
    let receiptDetails = '';
    let valid = true;
    products.forEach(product => {
        if (product.quantity > product.stock) {
            valid = false;
            alert(`Jumlah ${product.name} melebihi stok! Stok tersedia: ${product.stock}`);
            return;
        }
        if (product.quantity > 0) {
            const subtotal = product.price * product.quantity;
            receiptDetails += `<div class="receipt-item"><span>${product.name} (${product.quantity}x, Stok: ${product.stock})</span><span>Rp ${subtotal.toLocaleString('id-ID')}</span></div>`;
            total += subtotal;
        }
    });

    if (!valid) return;

    const discount = total >= 100000 ? total * 0.1 : 0;
    const finalTotal = total - discount;

    const today = new Date().toLocaleString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    $('#receiptDate').text(today);
    $('#receiptDetails').html(receiptDetails);
    $('#total').text(`Rp ${total.toLocaleString('id-ID')}`);
    $('#discount').text(`Rp ${Math.round(discount).toLocaleString('id-ID')}`);
    $('#finalTotal').text(`Rp ${Math.round(finalTotal).toLocaleString('id-ID')}`);
    $('#receipt').show();

    window.print();
}

function updateQuantity(id, value) {
    const product = products.find(p => p.id === id);
    if (product) {
        product.quantity = parseInt(value) || 0;
    }
}

function refreshPage() {
    if (!isLoggedIn) {
        alert("Silakan login terlebih dahulu!");
        return;
    }
    products.forEach(p => p.quantity = 0);
    $('.quantity').val('0');
    $('#receipt').hide();
    $('#receiptDetails').empty();
    $('#total').empty();
    $('#discount').empty();
    $('#finalTotal').empty();
    renderProducts();
}