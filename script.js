document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('fileInput');
    const uploadBox = document.querySelector('.upload-box');
    const outputFormat = document.getElementById('outputFormat');
    const convertBtn = document.getElementById('convertBtn');
    const results = document.getElementById('results');

    let selectedFiles = [];

    // Handle file input change
    fileInput.addEventListener('change', function(e) {
        handleFiles(e.target.files);
    });

    // Handle drag and drop
    uploadBox.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadBox.style.borderColor = '#667eea';
        uploadBox.style.backgroundColor = '#f8f9ff';
    });

    uploadBox.addEventListener('dragleave', function(e) {
        e.preventDefault();
        uploadBox.style.borderColor = '#ddd';
        uploadBox.style.backgroundColor = '';
    });

    uploadBox.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadBox.style.borderColor = '#ddd';
        uploadBox.style.backgroundColor = '';
        handleFiles(e.dataTransfer.files);
    });

    // Handle format selection
    outputFormat.addEventListener('change', function() {
        updateConvertButton();
    });

    // Handle convert button click
    convertBtn.addEventListener('click', function() {
        if (selectedFiles.length > 0 && outputFormat.value) {
            convertFiles();
        }
    });

    function handleFiles(files) {
        selectedFiles = Array.from(files);
        displaySelectedFiles();
        updateConvertButton();
    }

    function displaySelectedFiles() {
        const fileList = document.createElement('div');
        fileList.className = 'selected-files';
        fileList.innerHTML = '<h3>Selected Files:</h3>';

        selectedFiles.forEach(file => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <h4>${file.name}</h4>
                <p>Size: ${formatFileSize(file.size)} | Type: ${file.type || 'Unknown'}</p>
            `;
            fileList.appendChild(fileItem);
        });

        // Replace existing file list if it exists
        const existingList = document.querySelector('.selected-files');
        if (existingList) {
            existingList.replaceWith(fileList);
        } else {
            results.appendChild(fileList);
        }
    }

    function updateConvertButton() {
        convertBtn.disabled = selectedFiles.length === 0 || !outputFormat.value;
    }

    async function convertFiles() {
        results.innerHTML = '<div class="converting"><h3>Uploading and converting files...</h3></div>';

        try {
            // First upload the files
            const formData = new FormData();
            selectedFiles.forEach(file => {
                formData.append('files', file);
            });

            const uploadResponse = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            if (!uploadResponse.ok) {
                throw new Error('Failed to upload files');
            }

            const uploadResult = await uploadResponse.json();

            // Then convert each file
            const conversionResults = document.createElement('div');
            conversionResults.className = 'conversion-results';
            conversionResults.innerHTML = '<h3>Conversion Results:</h3>';

            for (const fileInfo of uploadResult.files) {
                const resultItem = document.createElement('div');
                resultItem.className = 'file-item';

                try {
                    const convertResponse = await fetch('/convert', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            filename: fileInfo.filename,
                            targetFormat: outputFormat.value
                        })
                    });

                    const convertResult = await convertResponse.json();

                    if (convertResult.success) {
                        resultItem.innerHTML = `
                            <h4>${fileInfo.originalName}</h4>
                            <p>✅ ${convertResult.message}</p>
                            <button class="download-btn" onclick="downloadFile('${convertResult.outputFile}')">Download</button>
                        `;
                    } else {
                        resultItem.innerHTML = `
                            <h4>${fileInfo.originalName}</h4>
                            <p>❌ Error: ${convertResult.error}</p>
                        `;
                    }
                } catch (error) {
                    resultItem.innerHTML = `
                        <h4>${fileInfo.originalName}</h4>
                        <p>❌ Conversion failed</p>
                    `;
                }

                conversionResults.appendChild(resultItem);
            }

            results.innerHTML = '';
            results.appendChild(conversionResults);

        } catch (error) {
            results.innerHTML = `
                <div class="error">
                    <h3>Error</h3>
                    <p>Failed to process files: ${error.message}</p>
                </div>
            `;
        }
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function getOutputFileName(originalName, format) {
        const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
        const extensions = {
            'pdf': '.pdf',
            'docx': '.docx',
            'html': '.html',
            'md': '.md'
        };
        return nameWithoutExt + (extensions[format] || '.txt');
    }

    // Global function for download button
    window.downloadFile = function(filename) {
        window.open(`/download/${filename}`, '_blank');
    };
});