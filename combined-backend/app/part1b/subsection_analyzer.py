# src/subsection_analyzer.py
import os
os.environ['HF_HUB_DISABLE_SYMLINKS_WARNING'] = '1'

import torch
from transformers import GPT2Tokenizer, GPT2LMHeadModel
from typing import List, Dict

class SubSectionAnalyzer:
    """Analyzes and refines subsection content"""
    
    def __init__(self):
        try:
            print("Loading DistilGPT-2 tokenizer for subsection analysis...")
            
            # Try to load from local cache first (created during Docker build)
            try:
                self.tokenizer = GPT2Tokenizer.from_pretrained('distilgpt2', local_files_only=True)
                self.model = GPT2LMHeadModel.from_pretrained('distilgpt2', local_files_only=True)
                print("📁 Loaded models from local cache")
            except:
                # Fallback to online download (for development)
                self.tokenizer = GPT2Tokenizer.from_pretrained('distilgpt2')
                self.model = GPT2LMHeadModel.from_pretrained('distilgpt2')
                print("🌐 Downloaded models from Hugging Face Hub")
            
            # Add padding token
            if self.tokenizer.pad_token is None:
                self.tokenizer.pad_token = self.tokenizer.eos_token
                
            print("✅ DistilGPT-2 for subsection analysis loaded successfully!")
            
        except Exception as e:
            print(f"❌ Failed to load DistilGPT-2 for subsection analysis: {e}")
            raise  # Re-raise the exception
    
    # In src/subsection_analyzer.py, update the analyze_subsections method:

    def analyze_subsections(self, section: Dict, persona: str, job: str, extracted_sections: List[Dict]) -> List[Dict]:
        """Analyze subsections and return only the top 5 most important (by importance_rank of parent section), with more descriptive refined_text and no parent_section."""
        import os
        content = section.get('content', '')
        print(f"   Analyzing section: {section.get('section_title', 'Unknown')} (content length: {len(content)})")
        if len(content.strip()) < 30:
            print("   ⚠️  Content too short, skipping subsection analysis")
            return []
        paragraphs = [p.strip() for p in content.split('\n\n') if p.strip()]
        if not paragraphs:
            paragraphs = [p.strip() for p in content.split('\n') if p.strip()]
        print(f"   Found {len(paragraphs)} paragraphs")
        subsections = []
        for i, paragraph in enumerate(paragraphs[:15]):
            if len(paragraph) < 20:
                continue
            refined_text = self.refine_content(paragraph, persona, job)
            if refined_text and len(refined_text.strip()) > 15:
                # Find importance_rank for this section
                importance_rank = None
                for sec in extracted_sections:
                    if (
                        os.path.basename(sec['document']) == os.path.basename(section['document']) and
                        sec.get('section_title') == section.get('section_title') and
                        sec.get('page_number') == section.get('page')
                    ):
                        importance_rank = sec.get('importance_rank')
                        break
                subsections.append({
                    'document': os.path.basename(section['document']),
                    'refined_text': refined_text,
                    'page_number': section['page'],
                    'importance_rank': importance_rank,
                    'original_paragraph_index': i
                })
        # Sort by importance_rank (ascending, 1 is most important), then by paragraph order
        subsections = [s for s in subsections if s['importance_rank'] is not None]
        subsections = sorted(subsections, key=lambda x: (x['importance_rank'], x['original_paragraph_index']))[:5]
        
        # Format output according to challenge specification
        formatted_subsections = []
        for s in subsections:
            formatted_subsections.append({
                'document': s['document'],
                'refined_text': s['refined_text'],
                'page_number': s['page_number']
            })
        
        print(f"   Generated {len(formatted_subsections)} top subsections by importance")
        return formatted_subsections
    
    def refine_content(self, text: str, persona: str, job: str) -> str:
        """Refine content focus using language model, with a prompt for a more descriptive summary."""
        try:
            if len(text) < 30:
                return text
            prompt = f"""
            Persona: {persona}
            Task: {job}
            Content: {text[:400]}
            
            Write a detailed, descriptive summary of the above content, highlighting key points, context, and practical details relevant to the task. Make the summary informative and actionable for the persona.
            """
            print(f"   Refining content (length: {len(text)})")
            inputs = self.tokenizer.encode(prompt, return_tensors='pt', max_length=512, truncation=True)
            with torch.no_grad():
                outputs = self.model.generate(
                    inputs,
                    max_length=min(len(inputs[0]) + 200, 512),
                    num_return_sequences=1,
                    temperature=0.7,
                    do_sample=True,
                    pad_token_id=self.tokenizer.eos_token_id,
                    eos_token_id=self.tokenizer.eos_token_id
                )
            generated = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
            if len(generated) > len(prompt):
                refined = generated[len(prompt):].strip()
                return refined if refined else text
            else:
                return text
        except Exception as e:
            print(f"   ⚠️  Content refinement error: {e}")
            return text  # Return original text as fallback