
import { db, storage } from './firebase-config.js';
import {
    collection, addDoc, serverTimestamp, getDocs, doc, deleteDoc, onSnapshot, getDoc, updateDoc
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import {
    ref, uploadBytesResumable, getDownloadURL, deleteObject
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";

document.addEventListener('DOMContentLoaded', () => {
    // --- Main Elements --- //
    const addProductForm = document.getElementById('add-product-form');
    const productListBody = document.getElementById('product-list-body');
    const feedbackMessage = document.getElementById('feedback-message');
    
    // --- Edit Modal Elements --- //
    const editModal = document.getElementById('edit-product-modal');
    const editForm = document.getElementById('edit-product-form');
    const closeBtn = editModal.querySelector('.close-btn');
    const editFeedback = document.getElementById('edit-feedback-message');
    const currentImageDisplay = document.getElementById('current-product-image');

    // --- Show/Hide Feedback Utility --- //
    const showFeedback = (message, type, element = feedbackMessage) => {
        element.textContent = message;
        element.className = `feedback ${type}`;
        element.style.display = 'block';
        if (type !== 'info') {
            setTimeout(() => { element.style.display = 'none'; }, 5000);
        }
    };

    // --- Real-time listener for products --- //
    const productsCollection = collection(db, "products");
    onSnapshot(productsCollection, (snapshot) => {
        displayProducts(snapshot.docs);
    }, (error) => {
        console.error("Error fetching real-time products: ", error);
        showFeedback("حدث خطأ في تحديث قائمة المنتجات.", 'error');
    });

    // --- Display Products in Table --- //
    function displayProducts(docs) {
        productListBody.innerHTML = '';
        if (docs.length === 0) {
            productListBody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 20px;">لا توجد منتجات حاليًا.</td></tr>';
            return;
        }
        docs.forEach(doc => {
            const product = doc.data();
            const row = document.createElement('tr');
            row.setAttribute('data-id', doc.id);
            row.innerHTML = `
                <td><img src="${product.imageUrl || 'placeholder.jpg'}" alt="${product.name}"></td>
                <td>${product.name}</td>
                <td>${product.category}</td>
                <td>${product.price} ج.م</td>
                <td>${product.stock}</td>
                <td><button class="action-btn edit-btn" data-id="${doc.id}"><i class="fas fa-pen-to-square"></i></button></td>
                <td><button class="action-btn delete-btn" data-id="${doc.id}" data-image-url="${product.imageUrl}"><i class="fas fa-trash-alt"></i></button></td>
            `;
            productListBody.appendChild(row);
        });
    }

    // --- Image Upload Function --- //
    const uploadImage = (file) => {
        if (!file) return Promise.resolve(null);
        const fileName = `${Date.now()}-${file.name}`;
        const storageRef = ref(storage, `product-images/${fileName}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        return new Promise((resolve, reject) => {
            uploadTask.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    showFeedback(`جاري رفع الصورة: ${Math.round(progress)}%`, 'info');
                },
                (error) => {
                     console.error("Upload failed:", error);
                     showFeedback(`فشل رفع الصورة: ${error.code}`, 'error');
                     reject(new Error(`فشل رفع الصورة: ${error.code}`));
                },
                () => {
                    getDownloadURL(uploadTask.snapshot.ref).then(resolve).catch(reject);
                }
            );
        });
    };

    // --- Add New Product --- //
    if (addProductForm) {
        addProductForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = addProductForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإضافة...';

            try {
                const imageFile = document.getElementById('imageFile').files[0];
                if (!imageFile) throw new Error("الرجاء اختيار صورة للمنتج.");

                const imageUrl = await uploadImage(imageFile);

                const productData = {
                    name: document.getElementById('name').value,
                    category: document.getElementById('category').value,
                    description: document.getElementById('description').value,
                    price: parseFloat(document.getElementById('price').value),
                    discountPrice: parseFloat(document.getElementById('discountPrice').value) || 0,
                    stock: parseInt(document.getElementById('stock').value),
                    publishYear: document.getElementById('publishYear').value || null,
                    imageUrl: imageUrl,
                    createdAt: serverTimestamp()
                };
                
                await addDoc(productsCollection, productData);
                showFeedback('تمت إضافة المنتج بنجاح!', 'success');
                addProductForm.reset();

            } catch (error) {
                console.error("Error adding product: ", error);
                showFeedback(error.message, 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-plus"></i> إضافة المنتج';
            }
        });
    }

    // --- Event Delegation for Edit and Delete --- //
    productListBody.addEventListener('click', async (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        const productId = target.dataset.id;
        if (target.classList.contains('delete-btn')) {
            handleDelete(productId, target.dataset.imageUrl);
        }
        if (target.classList.contains('edit-btn')) {
            openEditModal(productId);
        }
    });

    // --- Delete Product Logic --- //
    async function handleDelete(productId, imageUrl) {
        if (!confirm('هل أنت متأكد أنك تريد حذف هذا المنتج؟')) return;

        try {
            // Delete image from Storage first
            if (imageUrl) {
                try {
                    const imageRef = ref(storage, imageUrl);
                    await deleteObject(imageRef);
                } catch (storageError) {
                     console.warn("Could not delete image, it might not exist or rules prevent it:", storageError.code);
                }
            }
            // Then delete document from Firestore
            await deleteDoc(doc(db, 'products', productId));
            showFeedback('تم حذف المنتج بنجاح!', 'success');
        } catch (error) {
            console.error('Error deleting product:', error);
            showFeedback(`حدث خطأ أثناء الحذف: ${error.message}`, 'error');
        }
    }

    // --- Edit Product Logic --- //
    async function openEditModal(productId) {
        try {
            const docRef = doc(db, 'products', productId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const product = docSnap.data();
                editForm.querySelector('#edit-product-id').value = productId;
                editForm.querySelector('#edit-name').value = product.name;
                editForm.querySelector('#edit-category').value = product.category;
                editForm.querySelector('#edit-price').value = product.price;
                editForm.querySelector('#edit-discountPrice').value = product.discountPrice || '';
                editForm.querySelector('#edit-stock').value = product.stock;
                editForm.querySelector('#edit-publishYear').value = product.publishYear || '';
                editForm.querySelector('#edit-description').value = product.description;
                currentImageDisplay.src = product.imageUrl;
                currentImageDisplay.alt = `Current image for ${product.name}`;
                
                editModal.style.display = 'flex';
            } else {
                throw new Error("لم يتم العثور على المنتج.");
            }
        } catch (error) {
            console.error("Error fetching product for edit: ", error);
            showFeedback(error.message, 'error');
        }
    }

    // --- Close Modal Logic --- //
    closeBtn.onclick = () => { editModal.style.display = 'none'; };
    window.onclick = (event) => {
        if (event.target == editModal) {
            editModal.style.display = 'none';
        }
    };

    // --- Handle Edit Form Submission --- //
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = editForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';

        const productId = document.getElementById('edit-product-id').value;
        const docRef = doc(db, 'products', productId);

        try {
            let imageUrl = currentImageDisplay.src; // Keep old image by default
            const imageFile = document.getElementById('edit-imageFile').files[0];
            
            // If a new image is selected, upload it
            if (imageFile) {
                imageUrl = await uploadImage(imageFile, showFeedback('جاري رفع الصورة الجديدة...', 'info', editFeedback));
            }

            const updatedData = {
                name: document.getElementById('edit-name').value,
                category: document.getElementById('edit-category').value,
                description: document.getElementById('edit-description').value,
                price: parseFloat(document.getElementById('edit-price').value),
                discountPrice: parseFloat(document.getElementById('edit-discountPrice').value) || 0,
                stock: parseInt(document.getElementById('edit-stock').value),
                publishYear: document.getElementById('edit-publishYear').value || null,
                imageUrl: imageUrl
                // Not updating createdAt
            };

            await updateDoc(docRef, updatedData);
            showFeedback('تم تحديث المنتج بنجاح!', 'success', editFeedback);
            setTimeout(() => {
                editModal.style.display = 'none';
                editForm.reset();
            }, 2000);

        } catch (error) {
            console.error("Error updating product: ", error);
            showFeedback(error.message, 'error', editFeedback);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-save"></i> حفظ التعديلات';
        }
    });
});
