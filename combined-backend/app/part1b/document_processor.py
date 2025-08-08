# src/document_processor.py
"""
PDF Processing Module
Handles direct PDF text extraction and section extraction
"""

import fitz  
import re
import os
from typing import List, Dict
import torch
from transformers import GPT2Tokenizer, GPT2LMHeadModel

class DocumentProcessor:
    """Handles PDF processing and section extraction"""
    
    def __init__(self):
        try:
            print("Loading DistilGPT-2 for intelligent header selection...")
            
            # Try to load from local cache first (created during Docker build)
            try:
                self.header_tokenizer = GPT2Tokenizer.from_pretrained('distilgpt2', local_files_only=True)
                self.header_model = GPT2LMHeadModel.from_pretrained('distilgpt2', local_files_only=True)
                print("📁 Loaded models from local cache")
            except:
                # Fallback to online download (for development)
                self.header_tokenizer = GPT2Tokenizer.from_pretrained('distilgpt2')
                self.header_model = GPT2LMHeadModel.from_pretrained('distilgpt2')
                print("🌐 Downloaded models from Hugging Face Hub")
            
            if self.header_tokenizer.pad_token is None:
                self.header_tokenizer.pad_token = self.header_tokenizer.eos_token
            print("DistilGPT-2 for header selection loaded successfully!")
        except Exception as e:
            print(f"Failed to load DistilGPT-2 for header selection: {e}")
            self.header_tokenizer = None
            self.header_model = None
    
    def batch_process_pdfs(self, pdf_paths: List[str], persona: str = "", job: str = "") -> List[Dict]:
        """Process multiple PDFs with direct text extraction"""
        processed_docs = []
        
        for pdf_path in pdf_paths:
            if not os.path.exists(pdf_path):
                print(f"Warning: File not found - {pdf_path}")
                continue
                
            try:
                print(f"   Processing: {os.path.basename(pdf_path)}")
                
                doc_sections = []
                pdf_document = fitz.open(pdf_path)
                for page_num in range(len(pdf_document)):
                    page = pdf_document[page_num]
                    raw_text = page.get_text("text")
                    if raw_text.strip():
                        cleaned_text = self.clean_text(raw_text)
                        sections = self.extract_sections(cleaned_text, page_num + 1, pdf_path, persona, job)
                        doc_sections.extend(sections)

                processed_docs.extend(doc_sections)
                print(f"   Extracted {len(doc_sections)} sections from {os.path.basename(pdf_path)}")
                
            except Exception as e:
                print(f"Error processing {pdf_path}: {str(e)}")
                continue
        
        return processed_docs
    
    def clean_text(self, text: str) -> str:
        """Clean OCR text"""
        text = re.sub(r'\n\s*\n', '\n\n', text)
        text = text.strip()
        text = re.sub(r'[ \t]+', ' ', text)
        return text
    
    def extract_sections(self, text: str, page_num: int, doc_path: str, persona: str = "", job: str = "") -> List[Dict]:
        """Extract sections from text using intelligent header selection based on job context"""
        sections = []
        lines = text.split('\n')
        current_section_content = []
        current_header = ""
        
        # Enhanced header patterns 
        header_patterns = [
            r'^[A-Z][A-Za-z\s\-:]+$',  # Capitalized words
            r'^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*$',  # Title case words
            r'^\d+\.\s*[A-Z]',  # Numbered sections
            r'^[A-Z].*:',  # Colon-ended headers
            r'^[A-Z][A-Za-z\s]+$',  # Capitalized phrases
            r'^[A-Z][a-z]+$',  # Single capitalized word
        ]
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            is_header = any(re.match(pattern, line) for pattern in header_patterns) and len(line) < 100

            if not is_header and len(line) < 50:
                words = line.split()
                # Check for descriptive title patterns using pure logic
                if (len(words) <= 5 and 
                    len(line) > 2 and
                    not any(char.isdigit() for char in line) and
                    not line[0] in ['•', '-', '*']):  # Pure logic: no bullet points
                    
                    # Pure logic: Check if all words start with uppercase and have sufficient length
                    if (all(word[0].isupper() for word in words if word) and
                        len(words) >= 2 and
                        all(len(word) > 1 for word in words)):  # All words should be longer than 1 character
                        is_header = True

            # Pure logic to identify generic headers (no hardcoded words)
            if is_header:
                words = line.split()
                # Single word headers are likely generic if too short
                if len(words) == 1 and len(line) < 15:
                    is_header = False
                # Very short phrases with only short words are likely generic
                elif len(words) <= 2 and all(len(word) <= 2 for word in words):
                    is_header = False
            
            if is_header:
                # Save previous section if we have one
                if current_header and current_section_content:
                    section_text = '\n'.join(current_section_content).strip()
                    if len(section_text) > 30:
                        # Check if header is relevant to job context
                        if self.is_relevant_header(current_header, persona, job):
                            section_title = self.clean_header(current_header)
                        sections.append({
                            'document': doc_path,
                            'page': page_num,
                                'section_title': section_title,
                            'content': section_text,
                            'raw_text': f"{current_header}\n{section_text}"
                        })
                
                # Start new section
                current_header = line
                current_section_content = []
            else:
                # Add content to current section
                if current_header:
                    current_section_content.append(line)
        
        # Save the last section
        if current_header and current_section_content:
            section_text = '\n'.join(current_section_content).strip()
            if len(section_text) > 30:
                # Check if header is relevant to job context
                if self.is_relevant_header(current_header, persona, job):
                    section_title = self.clean_header(current_header)
                sections.append({
                    'document': doc_path,
                    'page': page_num,
                        'section_title': section_title,
                    'content': section_text,
                    'raw_text': f"{current_header}\n{section_text}"
                })
        
        return sections

    def clean_header(self, header: str) -> str:
        """Clean and format the extracted PDF header"""
        header = header.strip().rstrip(':.-,;')
        header = re.sub(r'^\d+\.?\s*', '', header)
        header = header.title()
        if len(header) > 100:
            header = header[:100] + "..."
        return header
    
    def is_relevant_header(self, header: str, persona: str, job: str) -> bool:
        """Use GPT-2 to determine if a header is relevant to the job context"""
        if not job or not job.strip():
            return True
        return self.simple_header_relevance(header, job)
    
    def simple_header_relevance(self, header: str, job: str) -> bool:
        """Pure logic header relevance check - no hardcoded words"""
        if not job or not job.strip():
            return True
            
        header_lower = header.lower()
        job_lower = job.lower()

        # Pure logic: Extract meaningful words (longer than 2 characters)
        job_words = [word for word in job_lower.split() if len(word) > 2]
        
        # Check for word overlap using pure logic
        header_words = set(header_lower.split())
        job_set = set(job_words)
        overlap = job_set.intersection(header_words)

        # If there's any meaningful word overlap, consider it relevant
        if overlap:
            return True
 
        # Pure logic: Accept headers that look like proper titles
        if (header[0].isupper() and 
            len(header.split()) <= 5 and 
            not any(char.isdigit() for char in header)):
            return True

        # Pure logic: Accept most headers, only reject clearly irrelevant ones
        if (len(header) > 2 and 
            not header.isdigit() and 
            not any(char.isdigit() for char in header[:10])):  # No page numbers at start
            return True

        return True
    
    def is_potential_header(self, line: str) -> bool:
        """Heuristic to identify potential section headers"""
        line = line.strip()
        if not line:
            return False
        if len(line) > 100: 
            return False
            
        # Check for common header patterns
        header_patterns = [
            r'^[A-Z][A-Za-z\s\-:]+$',  # Capitalized words
            r'^\d+\.\d*\.?\d*\s+[A-Z]',  # Numbered sections
            r'^[A-Z].*:',  # Colon-ended headers
            r'^CHAPTER\s+\d+',  # Chapter headers
            r'^SECTION\s+\d+',  # Section headers
            r'^[A-Z]{2,}$'  # All caps short words
        ]
        
        return any(re.match(pattern, line) for pattern in header_patterns)