"""
PDF Text Extraction Utility
Simple utility to extract text content from PDF files
"""
import logging
from typing import Optional

logger = logging.getLogger(__name__)

class PDFTextExtractor:
    """Simple PDF text extractor using PyMuPDF (fitz)"""
    
    @staticmethod
    def extract_text_content(pdf_path: str, max_pages: int = 10) -> Optional[str]:
        """
        Extract text content from a PDF file
        
        Args:
            pdf_path: Path to the PDF file
            max_pages: Maximum number of pages to process (to limit content)
            
        Returns:
            Extracted text content or None if extraction fails
        """
        try:
            import fitz  # PyMuPDF
            
            doc = fitz.open(pdf_path)
            text_content = []
            
            # Process up to max_pages to avoid huge content
            pages_to_process = min(len(doc), max_pages)
            
            for page_num in range(pages_to_process):
                page = doc[page_num]
                page_text = page.get_text()
                
                if page_text.strip():  # Only add non-empty pages
                    text_content.append(f"Page {page_num + 1}:\n{page_text.strip()}")
            
            doc.close()
            
            if text_content:
                full_text = "\n\n".join(text_content)
                # Limit to reasonable size (first 5000 characters for preview)
                if len(full_text) > 5000:
                    return full_text[:5000] + "\n\n[Content truncated for preview...]"
                return full_text
            else:
                return None
                
        except ImportError:
            logger.error("PyMuPDF (fitz) not available for PDF text extraction")
            return None
        except Exception as e:
            logger.error(f"Failed to extract text from PDF {pdf_path}: {e}")
            return None
    
    @staticmethod
    def extract_basic_info(pdf_path: str) -> dict:
        """
        Extract basic PDF information including page count and text preview
        
        Args:
            pdf_path: Path to the PDF file
            
        Returns:
            Dictionary with basic PDF info
        """
        try:
            import fitz  # PyMuPDF
            
            doc = fitz.open(pdf_path)
            
            info = {
                'pages': len(doc),
                'title': doc.metadata.get('title', ''),
                'author': doc.metadata.get('author', ''),
                'subject': doc.metadata.get('subject', ''),
                'content_preview': None
            }
            
            # Extract text preview from first few pages
            text_preview = PDFTextExtractor.extract_text_content(pdf_path, max_pages=3)
            info['content_preview'] = text_preview
            
            doc.close()
            return info
            
        except ImportError:
            logger.error("PyMuPDF (fitz) not available for PDF info extraction")
            return {'pages': None, 'title': '', 'author': '', 'subject': '', 'content_preview': None}
        except Exception as e:
            logger.error(f"Failed to extract info from PDF {pdf_path}: {e}")
            return {'pages': None, 'title': '', 'author': '', 'subject': '', 'content_preview': None}
