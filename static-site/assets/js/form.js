document.addEventListener("DOMContentLoaded", function () {
    const fileInput = document.getElementById('file');
    const customButton = document.getElementById('customButton');
    const fileList = document.getElementById('fileList');
    const form = document.querySelector('.contact-form');
    const emailInput = document.getElementById('email');
    let filesArray = [];

    customButton.addEventListener('click', function () {
        fileInput.click();
    });

    fileInput.addEventListener('change', function () {
        const selectedFiles = Array.from(fileInput.files);

        selectedFiles.forEach(file => {
            // File size check: 10MB limit
            if (file.size > 10 * 1024 * 1024) {
                alert(`File "${file.name}" exceeds the maximum size limit of 10MB.`);
                return;
            }

            // File type check: Allow only JPEG and PNG formats
            if (!['image/jpeg', 'image/png'].includes(file.type)) {
                alert(`File "${file.name}" is not a valid format. Please upload JPEG or PNG images only.`);
                return;
            }

            // Check the total file count limit
            if (filesArray.length >= 5) {
                alert('You can only upload a maximum of 5 files.');
                return;
            }

            filesArray.push(file);

            const listItem = document.createElement('li');
            listItem.textContent = file.name;

            const removeButton = document.createElement('button');
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

    function updateFileInput() {
        const dataTransfer = new DataTransfer();
        filesArray.forEach(file => {
            dataTransfer.items.add(file);
        });
        fileInput.files = dataTransfer.files;
    }

    // Email validation on form submit
    form.addEventListener('submit', function(event) {
        const emailValue = emailInput.value;
        const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

        if (!emailPattern.test(emailValue)) {
            alert("Please enter a valid email address.");
            event.preventDefault(); // Prevent form submission
        }
    });
});