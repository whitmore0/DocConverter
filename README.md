# DocConverter

A simple web-based document format converter that allows users to convert files between different formats.

## Features

- **Web Interface**: Clean and intuitive file upload interface
- **Drag & Drop**: Easy file selection with drag and drop support
- **Multiple Formats**: Support for PDF, Word, HTML, and Markdown conversions
- **File Upload**: Secure file handling with size limits
- **Real-time Feedback**: Progress indicators and conversion status

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd DocConverter
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

## Usage

1. Open the web interface
2. Select files using the file picker or drag & drop them into the upload area
3. Choose your desired output format from the dropdown
4. Click "Convert Files" to start the conversion process
5. Download the converted files when ready

## Project Structure

```
DocConverter/
├── index.html          # Main web interface
├── style.css           # Styling and layout
├── script.js           # Client-side JavaScript
├── server.js           # Express server
├── package.json        # Project dependencies
├── uploads/            # Temporary file storage
└── README.md           # This file
```

## Development

- `npm start` - Start production server
- `npm run dev` - Start development server with auto-reload

## License

MIT License - feel free to use this project for your own purposes.