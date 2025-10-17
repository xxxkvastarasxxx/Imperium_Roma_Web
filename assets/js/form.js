document.addEventListener("DOMContentLoaded", function () {
    const form = document.querySelector('.contact-form');
    const fileInput = document.getElementById('file');
    const customButton = document.getElementById('customButton');
    const fileList = document.getElementById('fileList');
    let filesArray = [];

    // Guard: run only on pages that actually have the contact form
    if (!form) return;

    // Create or find a small status area for inline messages (above the submit button)
    let formResponse = document.getElementById('form-response');
    if (!formResponse) {
        formResponse = document.createElement('div');
        formResponse.id = 'form-response';
        formResponse.className = 'form-status';
        formResponse.setAttribute('role', 'status');
        const submitBtn = form.querySelector('.btn-submit');
        const submitGroup = submitBtn ? submitBtn.closest('.form-group') : form;
        if (submitGroup && submitBtn) {
            submitGroup.insertBefore(formResponse, submitBtn); // place above button
        } else if (submitGroup) {
            submitGroup.appendChild(formResponse);
        } else {
            form.appendChild(formResponse);
        }
    }

    // Custom file button wiring (optional)
    if (customButton && fileInput) {
        customButton.addEventListener('click', function () {
            fileInput.click();
        });
    }

    // Manage selected files with basic client-side limits
    if (fileInput && fileList) {
        fileInput.addEventListener('change', function () {
            const selectedFiles = Array.from(fileInput.files || []);

            selectedFiles.forEach(file => {
                // Size: 10MB
                if (file.size > 10 * 1024 * 1024) {
                    alert(`File "${file.name}" exceeds the maximum size limit of 10MB.`);
                    return;
                }
                // Types: jpeg/png (adjust if you want to allow PDFs, etc.)
                if (!['image/jpeg', 'image/png'].includes(file.type)) {
                    alert(`File "${file.name}" is not a valid format. Please upload JPEG or PNG images only.`);
                    return;
                }
                // Count: max 5
                if (filesArray.length >= 5) {
                    alert('You can only upload a maximum of 5 files.');
                    return;
                }

                filesArray.push(file);

                const listItem = document.createElement('li');
                listItem.textContent = file.name;

                const removeButton = document.createElement('button');
                removeButton.type = 'button';
                removeButton.textContent = 'Remove';
                removeButton.style.marginLeft = '10px';
                removeButton.addEventListener('click', () => {
                    filesArray = filesArray.filter(f => f !== file);
                    listItem.remove();
                    updateFileInput();
                });

                listItem.appendChild(removeButton);
                fileList.appendChild(listItem);
            });

            updateFileInput();
        });
    }

    function updateFileInput() {
        if (!fileInput) return;
        const dataTransfer = new DataTransfer();
        filesArray.forEach(file => dataTransfer.items.add(file));
        fileInput.files = dataTransfer.files;
    }

    // Lightweight preflight to detect a running PHP backend (useful in local dev)
    // Returns true if send-telegram.php responds with our JSON error for GET (405)
    let phpCheckPromise;
    async function ensurePhpBackend() {
        if (phpCheckPromise) return phpCheckPromise;
        phpCheckPromise = (async () => {
            try {
                const res = await fetch('/send-telegram.php?ping=1', {
                    method: 'GET',
                    headers: { 'Accept': 'application/json' },
                });
                // Consider the backend present if we get a 405 (Method Not Allowed) from the PHP script,
                // regardless of content type (JSON or HTML), to avoid false negatives.
                if (res.status === 405) return true;
                // Fallback: if JSON body states method not allowed
                const ct = res.headers.get('Content-Type') || '';
                if (ct.includes('application/json')) {
                    const body = await res.json();
                    if (/Method Not Allowed/i.test(body?.message || '')) return true;
                }
                return false;
            } catch (_) {
                return false;
            }
        })();
        return phpCheckPromise;
    }

    // Submit: post to PHP endpoint with FormData (keeps file uploads intact)
    form.addEventListener('submit', async function (event) {
        event.preventDefault();

        const name = document.getElementById('name')?.value?.trim() || '';
        const email = document.getElementById('email')?.value?.trim() || '';
        const subject = document.getElementById('subject')?.value?.trim() || '';
        const message = document.getElementById('message')?.value?.trim() || '';

        if (!name || !email || !message) {
            formResponse.textContent = 'Please fill out all required fields.';
            formResponse.classList.remove('ok','err');
            formResponse.classList.add('warn');
            return;
        }

        // In local dev, guide the user if PHP is not running
        const hasPhp = await ensurePhpBackend();
        if (!hasPhp && (location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
            formResponse.innerHTML = 'Local PHP server not detected. Start it from the project root:<br><code>php -S localhost:8080</code> then open <code>http://localhost:8080/contact/</code>';
            formResponse.style.color = '#ffcc00';
            return;
        }

    formResponse.textContent = 'Sending...';
    formResponse.classList.remove('ok','warn','err');

        try {
            const formData = new FormData(form);
            // Ensure filesArray is reflected (in case browser didn’t keep the binding)
            if (filesArray.length && fileInput) {
                // Clear existing and append our managed list
                formData.delete('file[]');
                filesArray.forEach(f => formData.append('file[]', f));
            }

            const response = await fetch('/send-telegram.php', {
                method: 'POST',
                headers: { 'Accept': 'application/json' }, // Ask PHP to respond JSON
                body: formData,
            });

            // Try to parse JSON; if not JSON, fall back to text
            const ct = response.headers.get('Content-Type') || '';
            const isJson = ct.includes('application/json');
            const payload = isJson ? await response.json() : { success: response.ok, message: await response.text() };

            if (response.ok && payload.success !== false) {
                formResponse.textContent = payload.message || 'Message sent successfully!';
                formResponse.classList.remove('warn','err');
                formResponse.classList.add('ok');
                form.reset();
                filesArray = [];
                if (fileList) fileList.innerHTML = '';
            } else {
                const msg = (payload?.message && typeof payload.message === 'string') ? payload.message : 'An error occurred while sending your message.';
                const status = response.status || 'Request failed';
                throw new Error(`${status}: ${msg}`);
            }
        } catch (err) {
            formResponse.textContent = `Error: ${err?.message || err}`;
            formResponse.classList.remove('ok','warn');
            formResponse.classList.add('err');
        }
    });
});