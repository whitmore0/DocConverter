const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const puppeteer = require('puppeteer');

class DocumentConverter {
    constructor() {
        this.outputDir = path.join(__dirname, 'outputs');
        this.ensureOutputDir();
    }

    ensureOutputDir() {
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
    }

    async convertMarkdownToHtml(inputPath, outputPath) {
        try {
            const markdownContent = fs.readFileSync(inputPath, 'utf8');
            const htmlContent = marked(markdownContent);

            const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Converted Document</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            line-height: 1.6;
            color: #333;
        }
        h1, h2, h3, h4, h5, h6 {
            color: #2c3e50;
            margin-top: 2rem;
            margin-bottom: 1rem;
        }
        code {
            background: #f4f4f4;
            padding: 0.2rem 0.4rem;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
        }
        pre {
            background: #f4f4f4;
            padding: 1rem;
            border-radius: 5px;
            overflow-x: auto;
        }
        blockquote {
            border-left: 4px solid #3498db;
            padding-left: 1rem;
            margin-left: 0;
            font-style: italic;
            color: #666;
        }
    </style>
</head>
<body>
${htmlContent}
</body>
</html>`;

            fs.writeFileSync(outputPath, fullHtml, 'utf8');
            return {
                success: true,
                outputPath: outputPath,
                message: 'Markdown converted to HTML successfully'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async convertHtmlToMarkdown(inputPath, outputPath) {
        try {
            const htmlContent = fs.readFileSync(inputPath, 'utf8');

            // Basic HTML to Markdown conversion (simplified)
            let markdown = htmlContent
                .replace(/<h1[^>]*>(.*?)<\/h1>/g, '# $1\n')
                .replace(/<h2[^>]*>(.*?)<\/h2>/g, '## $1\n')
                .replace(/<h3[^>]*>(.*?)<\/h3>/g, '### $1\n')
                .replace(/<p[^>]*>(.*?)<\/p>/g, '$1\n\n')
                .replace(/<strong[^>]*>(.*?)<\/strong>/g, '**$1**')
                .replace(/<em[^>]*>(.*?)<\/em>/g, '*$1*')
                .replace(/<code[^>]*>(.*?)<\/code>/g, '`$1`')
                .replace(/<pre[^>]*>(.*?)<\/pre>/gs, '```\n$1\n```\n')
                .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/g, '[$2]($1)')
                .replace(/<[^>]*>/g, '') // Remove remaining HTML tags
                .replace(/\n\n+/g, '\n\n'); // Clean up multiple newlines

            fs.writeFileSync(outputPath, markdown, 'utf8');
            return {
                success: true,
                outputPath: outputPath,
                message: 'HTML converted to Markdown successfully'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async convertHtmlToPdf(inputPath, outputPath) {
        let browser;
        try {
            browser = await puppeteer.launch({
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            const page = await browser.newPage();

            // Read HTML content
            const htmlContent = fs.readFileSync(inputPath, 'utf8');
            await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

            // Generate PDF
            await page.pdf({
                path: outputPath,
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '1cm',
                    right: '1cm',
                    bottom: '1cm',
                    left: '1cm'
                }
            });

            return {
                success: true,
                outputPath: outputPath,
                message: 'HTML converted to PDF successfully'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }

    async convertMarkdownToPdf(inputPath, outputPath) {
        try {
            // First convert markdown to HTML
            const tempHtmlPath = outputPath.replace('.pdf', '.tmp.html');
            const htmlResult = await this.convertMarkdownToHtml(inputPath, tempHtmlPath);

            if (!htmlResult.success) {
                return htmlResult;
            }

            // Then convert HTML to PDF
            const pdfResult = await this.convertHtmlToPdf(tempHtmlPath, outputPath);

            // Clean up temporary HTML file
            if (fs.existsSync(tempHtmlPath)) {
                fs.unlinkSync(tempHtmlPath);
            }

            if (pdfResult.success) {
                pdfResult.message = 'Markdown converted to PDF successfully';
            }

            return pdfResult;
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    getOutputPath(originalPath, targetFormat) {
        const basename = path.basename(originalPath, path.extname(originalPath));
        const timestamp = Date.now();
        const extension = this.getExtensionForFormat(targetFormat);
        return path.join(this.outputDir, `${basename}_${timestamp}.${extension}`);
    }

    getExtensionForFormat(format) {
        const extensions = {
            'html': 'html',
            'md': 'md',
            'markdown': 'md',
            'pdf': 'pdf',
            'docx': 'docx'
        };
        return extensions[format] || 'txt';
    }

    async convert(inputPath, targetFormat) {
        const inputExt = path.extname(inputPath).toLowerCase().substring(1);
        const outputPath = this.getOutputPath(inputPath, targetFormat);

        switch (`${inputExt}_to_${targetFormat}`) {
            case 'md_to_html':
            case 'markdown_to_html':
                return await this.convertMarkdownToHtml(inputPath, outputPath);

            case 'html_to_md':
            case 'html_to_markdown':
                return await this.convertHtmlToMarkdown(inputPath, outputPath);

            case 'html_to_pdf':
                return await this.convertHtmlToPdf(inputPath, outputPath);

            case 'md_to_pdf':
            case 'markdown_to_pdf':
                return await this.convertMarkdownToPdf(inputPath, outputPath);

            default:
                return {
                    success: false,
                    error: `Conversion from ${inputExt} to ${targetFormat} is not supported yet`
                };
        }
    }
}

module.exports = DocumentConverter;