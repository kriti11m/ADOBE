# src/relevance_analyzer.py
import os
import torch
from sentence_transformers import SentenceTransformer, util
from typing import List, Dict

class RelevanceAnalyzer:
    """Figures out which sections are most relevant to the user's needs"""
    
    def __init__(self):
        try:
            print("Loading sentence transformer for semantic similarity...")
            self.semantic_model = SentenceTransformer('all-MiniLM-L6-v2')
            print("Sentence transformer loaded successfully!")
        except Exception as e:
            print(f"Failed to load sentence transformer: {e}")
            raise

    def expand_job_context(self, job: str) -> List[str]:
        """Creates different ways of looking at the job description for better matching"""
        # Start with the original job description
        contexts = [job]
        
        # Break down the job into different parts
        job_words = job.split()
        
        # Look for important nouns (usually capitalized)
        nouns = [word for word in job_words if len(word) > 3 and word[0].isupper()]
        if nouns:
            contexts.append(f"focus on {nouns[0].lower()}")
        
        # Look for action words (ending in -ing or -ed)
        action_words = [word for word in job_words if word.endswith('ing') or word.endswith('ed')]
        if action_words:
            contexts.append(f"task involving {action_words[0]}")
        
        # Pure logic: Extract meaningful words (longer than 2 characters)
        job_lower = job.lower()
        job_words = [word for word in job_lower.split() if len(word) > 2]
        if job_words:
            contexts.append(' '.join(job_words))
        
        return contexts

    def calculate_semantic_similarity_multi_context(self, section_text: str, job: str) -> float:
        """Compares section content with job description using multiple perspectives"""
        try:
            # Get different ways of looking at the job
            job_contexts = self.expand_job_context(job)
            
            # Convert everything to embeddings
            job_embeddings = self.semantic_model.encode(job_contexts, convert_to_tensor=True)
            section_embedding = self.semantic_model.encode(section_text[:512], convert_to_tensor=True)
            
            # See how similar the section is to each job context
            similarities = util.cos_sim(section_embedding, job_embeddings)[0]
            
            # Use the best match, but also consider the average
            best_match = torch.max(similarities).item()
            avg_match = torch.mean(similarities).item()
            
            # Combine them (70% best match, 30% average)
            final_score = 0.7 * best_match + 0.3 * avg_match
            
            return max(0.0, final_score)  # Make sure it's not negative
            
        except Exception as e:
            print(f"Error calculating semantic similarity: {e}")
            return 0.0

    def analyze_section_content_patterns(self, section_text: str, section_title: str) -> float:
        """Looks for patterns in the content that suggest it's useful information using pure logic"""
        text_lower = (section_text + " " + section_title).lower()
        
        score = 0.0
        
        # Pure logic: Bonus for structured content (lists, numbered items)
        # Check for bullet points, dashes, or numbered patterns
        structured_indicators = 0
        for char in ['•', '-', '*']:
            if char in section_text:
                structured_indicators += 1
        # Check for numbered patterns
        if any(f"{i}." in section_text for i in range(1, 10)):
            structured_indicators += 1
        if structured_indicators > 0:
            score += 0.15
        
        # Pure logic: Bonus for content with measurement symbols
        # Check for common measurement symbols
        symbol_count = sum(1 for char in section_text if char in ['%', '$', '°', '°C', '°F'])
        if symbol_count > 0:
            score += 0.1
        
        # Pure logic: Bonus for content with lots of numbers (suggests detailed info)
        numbers = sum(1 for char in section_text if char.isdigit())
        if numbers > 5:
            score += 0.1
        
        # Pure logic: Bonus for content with specific formatting (suggests structured data)
        if section_text.count('\n') > 5:  # Multiple lines suggest structured content
            score += 0.1
        
        return min(score, 0.5)  # Cap at 50% bonus

    def semantic_clustering_analysis(self, section_text: str, job: str) -> float:
        """Uses semantic clustering to understand contexts"""
        try:
            # Extract key phrases from the section using pure logic
            words = section_text.lower().split()
            key_phrases = []
            
            for i, word in enumerate(words):
                if len(word) > 3 and word.isalpha():
                    if i < len(words) - 1:
                        # Create 2-word phrases
                        phrase = f"{word} {words[i+1]}" if words[i+1].isalpha() else word
                        key_phrases.append(phrase)
                    else:
                        key_phrases.append(word)
            
            if not key_phrases:
                return 0.0
            
            # Limit to top 20 phrases for performance
            key_phrases = key_phrases[:20]
            
            # Convert phrases to embeddings
            phrase_embeddings = self.semantic_model.encode(key_phrases, convert_to_tensor=True)
            
            # Create job-related concept embeddings using the job itself
            job_words = job.lower().split()
            job_concepts = []
            
            # Create concept phrases from the job description using pure logic
            for i, word in enumerate(job_words):
                if len(word) > 3 and word.isalpha():
                    if i < len(job_words) - 1:
                        concept = f"{word} {job_words[i+1]}" if job_words[i+1].isalpha() else word
                        job_concepts.append(concept)
                    else:
                        job_concepts.append(word)
            
            # Also add the full job description
            job_concepts.append(job.lower())
            
            if not job_concepts:
                return 0.0
            
            # Convert job concepts to embeddings
            concept_embeddings = self.semantic_model.encode(job_concepts, convert_to_tensor=True)
            
            # Compare phrases with job concepts
            similarities = util.cos_sim(phrase_embeddings, concept_embeddings)
            
            # Find the best matches
            max_similarities = torch.max(similarities, dim=1)[0]
            
            # Calculate average of top matches
            top_similarities = torch.topk(max_similarities, min(5, len(max_similarities)))[0]
            avg_similarity = torch.mean(top_similarities).item()
            
            return avg_similarity * 0.3  # Scale down to reasonable bonus
            
        except Exception as e:
            print(f"Error in semantic clustering: {e}")
            return 0.0

    def semantic_reasoning_analysis(self, section_text: str, job: str) -> float:
        """Uses semantic reasoning"""
        try:
            # Convert job and section to embeddings
            job_embedding = self.semantic_model.encode(job, convert_to_tensor=True)
            section_embedding = self.semantic_model.encode(section_text[:512], convert_to_tensor=True)
            
            # Calculate direct similarity
            job_section_similarity = util.cos_sim(job_embedding, section_embedding).item()
            
            # Pure logic: Check for semantic contradictions using the model's understanding
            # Create contradiction patterns based on the job description itself
            contradiction_patterns = [
                f"not suitable for {job.lower()}",
                f"incompatible with {job.lower()}",
                f"does not meet {job.lower()} requirements",
                f"avoid {job.lower()}",
                f"not recommended for {job.lower()}"
            ]
            
            contradiction_embeddings = self.semantic_model.encode(contradiction_patterns, convert_to_tensor=True)
            contradiction_similarities = util.cos_sim(section_embedding, contradiction_embeddings)[0]
            max_contradiction_similarity = torch.max(contradiction_similarities).item()
            
            # Apply penalty if section contradicts the job
            contradiction_penalty = 0.0
            if max_contradiction_similarity > 0.5:  # Section contradicts job
                contradiction_penalty = 0.4
            
            # Final score: similarity minus penalties
            final_score = job_section_similarity - contradiction_penalty
            return max(0.0, final_score * 0.5)
            
        except Exception as e:
            print(f"Error in semantic reasoning: {e}")
            return 0.0

    def calculate_final_relevance_score(self, section: Dict, persona: str, job: str) -> float:
        """Combines all the analysis to give a final relevance score using pure semantic logic"""
        section_text = section.get('content', '')
        section_title = section.get('section_title', '')

        # Get the base semantic similarity (pure model-based relevance)
        base_score = self.calculate_semantic_similarity_multi_context(section_text, job)
        
        # Add semantic similarity for section title as well
        title_score = self.calculate_semantic_similarity_multi_context(section_title, job)
        
        # Combine text and title similarity (text is more important)
        combined_semantic_score = (base_score * 0.8) + (title_score * 0.2)
        
        # Add bonuses for content patterns
        content_bonus = self.analyze_section_content_patterns(section_text, section_title)
        
        # Add semantic clustering bonus
        clustering_bonus = self.semantic_clustering_analysis(section_text, job)
        
        # Add semantic reasoning bonus
        reasoning_bonus = self.semantic_reasoning_analysis(section_text, job)
        
        # Bonus for longer, more comprehensive sections
        length_bonus = min(0.1, len(section_text) / 10000)

        # Penalty for generic section titles
        # Pure logic: Penalty for generic titles (no hardcoded words)
        generic_penalty = 0.0
        words = section_title.split()
        if len(words) == 1 and len(section_title) < 15:
            generic_penalty = 0.5
        elif len(words) <= 2 and all(len(word) <= 2 for word in words):
            generic_penalty = 0.5

        # Pure logic: Bonus for descriptive titles (no hardcoded words)
        descriptive_bonus = 0.0
        if (section_title and 
            len(section_title.split()) >= 2 and 
            len(section_title.split()) <= 5 and 
            section_title[0].isupper() and
            len([word for word in section_title.split() if len(word) > 2]) >= 2):
            descriptive_bonus = 0.3

        # Combine everything with pure semantic logic as the primary factor
        final_score = (combined_semantic_score * 0.7 +  # 70% pure semantic similarity
                      content_bonus * 0.1 +  # 10% content patterns
                      clustering_bonus * 0.05 +  # 5% clustering
                      reasoning_bonus * 0.05 +  # 5% semantic reasoning
                      length_bonus -  # Length bonus
                      generic_penalty +  # Generic penalty
                      descriptive_bonus)  # Descriptive bonus
        
        return min(max(final_score, 0.0), 1.0)
    
    def rank_sections(self, sections: List[Dict], persona: str, job: str) -> List[Dict]:
        print(f"Ranking {len(sections)} sections using semantic understanding...")
        
        # Group sections by PDF for variety
        sections_by_pdf = {}
        for section in sections:
            pdf_name = os.path.basename(section['document'])
            if pdf_name not in sections_by_pdf:
                sections_by_pdf[pdf_name] = []
            sections_by_pdf[pdf_name].append(section)
        
        print(f"   Found sections from {len(sections_by_pdf)} PDFs")
        
        # Collect all sections for ranking
        all_sections = []
        for pdf_name, pdf_sections in sections_by_pdf.items():
            all_sections.extend(pdf_sections)
            print(f"   Taking {len(pdf_sections)} sections from {pdf_name}")
        
        print(f"   Processing all {len(all_sections)} sections for ranking")
        
        # Calculate scores for each section
        for i, section in enumerate(all_sections):
            if i % 10 == 0:
                print(f"   Processed {i}/{len(all_sections)} sections...")
            score = self.calculate_final_relevance_score(section, persona, job)
            section['relevance_score'] = score
        
        # Sort by score (highest first)
        ranked_sections = sorted(all_sections, key=lambda x: x['relevance_score'], reverse=True)
        
        # Add importance ranks
        for i, section in enumerate(ranked_sections, 1):
            section['importance_rank'] = i
        
        print(f"Ranking complete. Top score: {ranked_sections[0]['relevance_score']:.3f}")
        return ranked_sections