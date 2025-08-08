# src/pipeline.py
import time
import os
from datetime import datetime
from typing import List, Dict

# Reduce warnings
os.environ['HF_HUB_DISABLE_SYMLINKS_WARNING'] = '1'

from .document_processor import DocumentProcessor

class DocumentAnalysisPipeline:
    """Main pipeline that coordinates the whole analysis process"""
    
    def __init__(self):
        # Set up the document processor
        self.doc_processor = DocumentProcessor()
        
        # Keep models in memory to avoid reloading
        self.shared_model = None
        self.shared_tokenizer = None
        
        # Try to load the relevance analyzer
        try:
            from .relevance_analyzer import RelevanceAnalyzer
            print("Loading relevance analyzer...")
            self.relevance_analyzer = RelevanceAnalyzer()
            print("Relevance analyzer ready")
        except Exception as e:
            print(f"Couldn't load relevance analyzer: {e}")
            self.relevance_analyzer = None
        
        # Try to load the subsection analyzer
        try:
            from .subsection_analyzer import SubSectionAnalyzer
            print("Loading subsection analyzer...")
            self.subsection_analyzer = SubSectionAnalyzer()
            print("Subsection analyzer ready")
        except Exception as e:
            print(f"Couldn't load subsection analyzer: {e}")
            self.subsection_analyzer = None
    
    def process_documents(self, pdf_paths: List[str], persona: str = "Researcher", job: str = "Analyze document content") -> Dict:
        """Main function that processes a bunch of PDFs and returns analysis results"""
        start_time = time.time()
        
        print("DEBUG: Starting process_documents...")
        print("Processing PDF documents...")
        # Extract sections from all the PDFs
        print("DEBUG: About to call batch_process_pdfs...")
        all_sections = self.doc_processor.batch_process_pdfs(pdf_paths, persona, job)
        print("DEBUG: batch_process_pdfs completed")
        print(f"   Found {len(all_sections)} sections total")
        
        # Handle the case where we didn't find any sections
        if len(all_sections) == 0:
            print("No sections found! This could be because:")
            print("   - PDFs don't have clear headers")
            print("   - Headers don't match the job description")
            print("   - PDFs are mostly images")
            
            # Return empty result with basic info
            processing_time = time.time() - start_time
            empty_result = {
                "metadata": {
                    "input_documents": [os.path.basename(str(path)) for path in pdf_paths],
                    "persona": persona,
                    "job_to_be_done": job,
                    "processing_timestamp": datetime.now().isoformat(),
                    "processing_time_seconds": round(processing_time, 2),
                    "warning": "No sections found - check if job description matches document content"
                },
                "extracted_sections": [],
                "subsection_analysis": []
            }
            return empty_result
        
        print(f"   Processing all {len(all_sections)} sections")
        
        # If the analyzers didn't load properly, return basic results
        if self.relevance_analyzer is None or self.subsection_analyzer is None:
            print("Warning: Some analyzers failed to load, returning basic results")
            processing_time = time.time() - start_time
            
            basic_result = {
                "metadata": {
                    "input_documents": [os.path.basename(str(path)) for path in pdf_paths],
                    "persona": persona,
                    "job_to_be_done": job,
                    "processing_timestamp": datetime.now().isoformat(),
                    "processing_time_seconds": round(processing_time, 2)
                },
                "extracted_sections": [
                    {
                        "document": os.path.basename(section['document']),
                        "page_number": section['page'],
                        "section_title": section['section_title'],
                        "importance_rank": i + 1
                    }
                    for i, section in enumerate(all_sections[:5])  # Just take first 5
                ],
                "subsection_analysis": []  # Empty since analyzers failed
            }
            return basic_result
        
        # Rank sections by relevance (limit processing time)
        print("DEBUG: About to start ranking sections...")
        print("🎯 Ranking sections by relevance...")
        try:
            ranked_sections = self.relevance_analyzer.rank_sections(all_sections, persona, job)
            print("DEBUG: Ranking completed successfully")
        except Exception as e:
            print(f"❌ Ranking failed: {e}")
            # Use sections as-is if ranking fails
            ranked_sections = all_sections
            for i, section in enumerate(ranked_sections, 1):
                section['importance_rank'] = i
                section['relevance_score'] = 0.5  # Default score

        # Select the TOP 5 most relevant sections (no forced PDF variety)
        print("🎯 Selecting TOP 5 most relevant sections by semantic relevance (no forced variety)...")
        
        # Deduplicate sections with identical or very similar titles
        print("🔍 Removing duplicate sections with similar titles...")
        deduplicated_sections = []
        seen_titles = set()
        
        for section in ranked_sections:
            title = section.get('section_title', '').strip().lower()
            
            # Check if this title is too similar to already selected titles
            is_duplicate = False
            for seen_title in seen_titles:
                # Check for exact match or very similar titles
                if (title == seen_title or 
                    title in seen_title or 
                    seen_title in title or
                    self._calculate_title_similarity(title, seen_title) > 0.8):
                    is_duplicate = True
                    print(f"   ⚠️  Skipping duplicate: '{section.get('section_title', '')}' (similar to existing)")
                    break
            
            if not is_duplicate:
                deduplicated_sections.append(section)
                seen_titles.add(title)
                print(f"   ✅ Added: '{section.get('section_title', '')}'")
            
            # Stop when we have enough unique sections
            if len(deduplicated_sections) >= 5:
                break
        
        selected_sections = deduplicated_sections[:5]
        print(f"   📋 Final selection: {len(selected_sections)} sections from {len(set(os.path.basename(s['document']) for s in selected_sections))} unique PDFs")

        # Build the final extracted_sections list
        extracted_sections = [
            {
                "document": os.path.basename(section['document']),
                "page_number": section['page'],
                "section_title": section['section_title'],
                "importance_rank": i + 1
            }
            for i, section in enumerate(selected_sections)
        ]

        # Analyze subsections for top 5 sections only
        print("🔍 Analyzing subsections...")
        top_sections = selected_sections
        print(f"   Analyzing subsections for {len(top_sections)} top sections...")
        subsection_analysis = []

        for i, section in enumerate(top_sections):
            print(f"   Processing section {i+1}/{len(top_sections)}: {section.get('section_title', 'Unknown')}")
            subsections = self.subsection_analyzer.analyze_subsections(section, persona, job, extracted_sections)
            subsection_analysis.extend(subsections)
            print(f"   Added {len(subsections)} subsections")

        print(f"✅ Subsection analysis complete. Generated {len(subsection_analysis)} subsections")

        # Sort all subsections by the importance_rank of their parent section, then by order, and take top 5
        def get_importance(subsec):
            for sec in extracted_sections:
                if sec['document'] == subsec['document'] and sec['page_number'] == subsec['page_number']:
                    return sec['importance_rank']
            return 9999
        subsection_analysis = sorted(subsection_analysis, key=lambda x: get_importance(x))[:5]

        # Format output according to challenge specification
        processing_time = time.time() - start_time
        
        return {
            "metadata": {
                "input_documents": [os.path.basename(str(path)) for path in pdf_paths],
                "persona": persona,
                "job_to_be_done": job,
                "processing_timestamp": datetime.now().isoformat(),
                "processing_time_seconds": round(processing_time, 2)
            },
            "extracted_sections": extracted_sections,
            "subsection_analysis": [
                {
                    "document": subsec['document'],
                    "refined_text": subsec['refined_text'],
                    "page_number": subsec['page_number']
                }
                for subsec in subsection_analysis
            ]
        }

    def _calculate_title_similarity(self, title1: str, title2: str) -> float:
        """Calculate similarity between two titles using simple string matching"""
        if not title1 or not title2:
            return 0.0
        
        # Convert to lowercase and split into words
        words1 = set(title1.lower().split())
        words2 = set(title2.lower().split())
        
        if not words1 or not words2:
            return 0.0
        
        # Calculate Jaccard similarity
        intersection = len(words1.intersection(words2))
        union = len(words1.union(words2))
        
        if union == 0:
            return 0.0
        
        return intersection / union